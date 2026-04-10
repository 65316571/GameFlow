import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

// GET /api/overview - 总览数据
router.get('/overview', async (req, res) => {
  try {
    // 总游戏数
    const gameCountResult = await query('SELECT COUNT(*) FROM games')
    const totalGames = parseInt(gameCountResult.rows[0].count)

    // 总时长
    const totalDurationResult = await query('SELECT COALESCE(SUM(duration), 0) as total FROM play_sessions')
    const totalDuration = parseInt(totalDurationResult.rows[0].total)

    // 本周时长（从本周一开始）
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
      `SELECT ps.*, g.name as game_name, gen.code as genre_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
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

    // 填充本周所有日期（没有数据的补0）
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

    res.json({
      totalGames,
      totalDuration,
      weeklyDuration,
      monthlyDuration,
      playedToday,
      recentSessions: recentResult.rows,
      weeklyChart
    })
  } catch (err) {
    console.error('Get overview error:', err)
    res.status(500).json({ error: 'Failed to get overview' })
  }
})

// GET /api/stats/playtime - 时长统计（按周期）
router.get('/playtime', async (req, res) => {
  try {
    const { period } = req.query // 'week', 'month', 'year'
    
    let sql = ''
    let params = []

    switch (period) {
      case 'week':
        sql = `
          SELECT 
            DATE(start_time) as label,
            SUM(duration) as value
          FROM play_sessions
          WHERE start_time >= DATE_TRUNC('week', NOW())
          GROUP BY DATE(start_time)
          ORDER BY label
        `
        break
      case 'month':
        sql = `
          SELECT 
            EXTRACT(DAY FROM start_time)::int as label,
            SUM(duration) as value
          FROM play_sessions
          WHERE start_time >= DATE_TRUNC('month', NOW())
          GROUP BY EXTRACT(DAY FROM start_time)
          ORDER BY label
        `
        break
      case 'year':
        sql = `
          SELECT 
            EXTRACT(MONTH FROM start_time)::int as label,
            SUM(duration) as value
          FROM play_sessions
          WHERE start_time >= DATE_TRUNC('year', NOW())
          GROUP BY EXTRACT(MONTH FROM start_time)
          ORDER BY label
        `
        break
      default:
        sql = `
          SELECT 
            DATE(start_time) as label,
            SUM(duration) as value
          FROM play_sessions
          GROUP BY DATE(start_time)
          ORDER BY label DESC
          LIMIT 30
        `
    }

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Get playtime stats error:', err)
    res.status(500).json({ error: 'Failed to get playtime stats' })
  }
})

export default router
