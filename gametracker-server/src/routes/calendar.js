import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

// GET /api/calendar - 获取月历数据
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query
    
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' })
    }

    const y = parseInt(year)
    const m = parseInt(month)
    
    // 计算该月的开始和结束日期
    const startDate = new Date(y, m - 1, 1)
    const endDate = new Date(y, m, 0, 23, 59, 59, 999)

    // 获取该月每天的游玩总时长
    const result = await query(
      `SELECT 
        DATE(start_time)::text as date,
        COALESCE(ROUND(SUM(duration) / 60.0), 0)::int as total_minutes,
        COUNT(*)::int as session_count
       FROM play_sessions
       WHERE start_time >= $1 AND start_time <= $2
       GROUP BY DATE(start_time)
       ORDER BY date`,
      [startDate, endDate]
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Get calendar error:', err)
    res.status(500).json({ error: 'Failed to get calendar data' })
  }
})

// GET /api/calendar/day - 获取某天的详情
router.get('/day', async (req, res) => {
  try {
    const { date } = req.query
    
    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' })
    }

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // 获取当天的所有游玩记录
    const result = await query(
      `SELECT ps.*, ps.duration as duration_seconds,
        g.name as game_name, gen.code as genre_code,
        plat.code as platform_code, plat.name as platform_name
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
       WHERE ps.start_time >= $1 AND ps.start_time <= $2
       ORDER BY ps.start_time DESC`,
      [startOfDay, endOfDay]
    )

    // 计算当天总时长
    const totalDuration = result.rows.reduce((sum, row) => sum + (row.duration || 0), 0)

    res.json({
      date,
      totalDuration,
      sessions: result.rows
    })
  } catch (err) {
    console.error('Get calendar day error:', err)
    res.status(500).json({ error: 'Failed to get calendar day data' })
  }
})

export default router
