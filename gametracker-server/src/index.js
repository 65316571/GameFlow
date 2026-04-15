import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import gamesRouter from './routes/games.js'
import sessionsRouter from './routes/sessions.js'
import statsRouter from './routes/stats.js'
import calendarRouter from './routes/calendar.js'
import wikiRouter from './routes/wiki.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/games', gamesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/wiki', wikiRouter)

// Overview endpoint (使用 stats router 中的逻辑)
app.get('/api/overview', async (req, res) => {
  const { query } = await import('./db/index.js')
  try {
    // 总游戏数
    const gameCountResult = await query('SELECT COUNT(*) FROM games')
    const totalGames = parseInt(gameCountResult.rows[0].count)

    // 总时长
    const totalDurationResult = await query('SELECT COALESCE(SUM(duration), 0) as total FROM play_sessions')
    const totalDuration = parseInt(totalDurationResult.rows[0].total)

    // 本周时长
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    
    const weeklyDurationResult = await query(
      'SELECT COALESCE(SUM(duration), 0) as total FROM play_sessions WHERE start_time >= $1',
      [weekStart]
    )
    const weeklyDuration = parseInt(weeklyDurationResult.rows[0].total)

    // 本月时长
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthlyDurationResult = await query(
      'SELECT COALESCE(SUM(duration), 0) as total FROM play_sessions WHERE start_time >= $1',
      [monthStart]
    )
    const monthlyDuration = parseInt(monthlyDurationResult.rows[0].total)

    // 最近5条记录
    const recentResult = await query(
      `SELECT ps.*, g.name as game_name, gen.code as genre_code, plat.code as platform_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
       ORDER BY ps.start_time DESC
       LIMIT 5`
    )

    // 今日是否游玩
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const todayResult = await query(
      'SELECT EXISTS(SELECT 1 FROM play_sessions WHERE start_time >= $1 AND start_time <= $2) as has_played',
      [todayStart, todayEnd]
    )
    const playedToday = todayResult.rows[0].has_played

    // 本周每日时长柱状图数据
    const weeklyChartResult = await query(
      `SELECT 
        DATE(start_time) as day,
        SUM(duration) as total
       FROM play_sessions
       WHERE start_time >= $1
       GROUP BY DATE(start_time)
       ORDER BY day`,
      [weekStart]
    )

    // 填充本周所有日期
    const weeklyChart = []
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const dayData = weeklyChartResult.rows.find(r => {
        const rDate = new Date(r.day)
        return rDate.toISOString().split('T')[0] === dateStr
      })
      
      weeklyChart.push({
        day: days[d.getDay()],
        date: dateStr,
        total: dayData ? parseInt(dayData.total) : 0
      })
    }

    // 格式化最近记录
    const recentSessions = recentResult.rows.map(s => ({
      id: s.id,
      game_name: s.game_name,
      genre_code: s.genre_code,
      platform_code: s.platform_code,
      played_at: new Date(s.start_time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      duration_seconds: s.duration
    }))

    res.json({
      total_games: totalGames,
      total_platforms: 5,
      total_seconds: totalDuration,
      total_sessions: await query('SELECT COUNT(*) FROM play_sessions').then(r => parseInt(r.rows[0].count)),
      week_seconds: weeklyDuration,
      month_seconds: monthlyDuration,
      month_days_played: await query('SELECT COUNT(DISTINCT DATE(start_time)) FROM play_sessions WHERE start_time >= $1', [monthStart]).then(r => parseInt(r.rows[0].count)),
      played_today: playedToday,
      recent_sessions: recentSessions,
      weekly_chart: weeklyChart.map(d => ({ label: d.day, total_minutes: Math.round(d.total / 60) }))
    })
  } catch (err) {
    console.error('Get overview error:', err)
    res.status(500).json({ error: 'Failed to get overview' })
  }
})

// 单独的路由别名
app.get('/api/genres', async (req, res) => {
  const { query } = await import('./db/index.js')
  try {
    const result = await query('SELECT * FROM genres WHERE is_active = TRUE ORDER BY sort_order')
    res.json(result.rows)
  } catch (err) {
    console.error('Get genres error:', err)
    res.status(500).json({ error: 'Failed to get genres' })
  }
})

app.get('/api/platforms', async (req, res) => {
  const { query } = await import('./db/index.js')
  try {
    const result = await query('SELECT * FROM platforms WHERE is_active = TRUE ORDER BY sort_order')
    res.json(result.rows)
  } catch (err) {
    console.error('Get platforms error:', err)
    res.status(500).json({ error: 'Failed to get platforms' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          GameTracker Server is running!                ║
╠════════════════════════════════════════════════════════╣
║  Port:    ${PORT.toString().padEnd(45)}║
║  API:     http://localhost:${PORT}/api${' '.repeat(25)}║
║  Health:  http://localhost:${PORT}/health${' '.repeat(22)}║
╚════════════════════════════════════════════════════════╝
  `)
})
