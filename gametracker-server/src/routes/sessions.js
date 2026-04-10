import { Router } from 'express'
import { query, getClient } from '../db/index.js'

const router = Router()

// POST /api/sessions/start - 开始计时
router.post('/start', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { game_id } = req.body
    
    if (!game_id) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'game_id is required' })
    }

    // 检查是否已有活跃会话
    const activeResult = await client.query('SELECT * FROM active_session LIMIT 1')
    if (activeResult.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ 
        error: 'Another session is already active',
        active_session: activeResult.rows[0]
      })
    }

    // 创建新的活跃会话
    const startTime = new Date()
    const result = await client.query(
      `INSERT INTO active_session (game_id, start_time) 
       VALUES ($1, $2) 
       RETURNING *`,
      [game_id, startTime]
    )

    await client.query('COMMIT')
    res.status(201).json(result.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Start session error:', err)
    res.status(500).json({ error: 'Failed to start session' })
  } finally {
    client.release()
  }
})

// POST /api/sessions/:id/stop - 停止计时
router.post('/:id/stop', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { id } = req.params

    // 获取活跃会话
    const activeResult = await client.query('SELECT * FROM active_session WHERE id = $1', [id])
    if (activeResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'No active session found' })
    }

    const activeSession = activeResult.rows[0]
    const endTime = new Date()
    const startTime = new Date(activeSession.start_time)
    const duration = Math.floor((endTime - startTime) / 1000) // 秒

    // 创建游玩记录
    const sessionResult = await client.query(
      `INSERT INTO play_sessions (game_id, start_time, end_time, duration, source) 
       VALUES ($1, $2, $3, $4, 'timer') 
       RETURNING *`,
      [activeSession.game_id, startTime, endTime, duration]
    )

    // 删除活跃会话
    await client.query('DELETE FROM active_session WHERE id = $1', [id])

    await client.query('COMMIT')

    // 返回包含游戏信息的记录
    const fullResult = await query(
      `SELECT ps.*, g.name as game_name, gen.code as genre_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       WHERE ps.id = $1`,
      [sessionResult.rows[0].id]
    )

    res.json(fullResult.rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Stop session error:', err)
    res.status(500).json({ error: 'Failed to stop session' })
  } finally {
    client.release()
  }
})

// GET /api/sessions/active - 获取当前活跃会话
router.get('/active', async (req, res) => {
  try {
    const result = await query(
      `SELECT ac.*, g.name as game_name, gen.code as genre_code,
        plat.code as platform_code
       FROM active_session ac
       JOIN games g ON ac.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
       LIMIT 1`
    )

    res.json(result.rows[0] || null)
  } catch (err) {
    console.error('Get active session error:', err)
    res.status(500).json({ error: 'Failed to get active session' })
  }
})

// POST /api/sessions/manual - 手动补录
router.post('/manual', async (req, res) => {
  try {
    const { game_id, start_time, end_time, duration, source } = req.body

    if (!game_id) {
      return res.status(400).json({ error: 'game_id is required' })
    }

    let finalStartTime, finalEndTime, finalDuration

    if (source === 'duration' && duration) {
      // 直接填时长的补录方式
      finalDuration = parseInt(duration)
      finalStartTime = new Date()
      finalEndTime = new Date(finalStartTime.getTime() + finalDuration * 1000)
    } else if (start_time && end_time) {
      // 填开始结束时间的补录方式
      finalStartTime = new Date(start_time)
      finalEndTime = new Date(end_time)
      finalDuration = Math.floor((finalEndTime - finalStartTime) / 1000)
    } else {
      return res.status(400).json({ error: 'Invalid parameters: provide (start_time + end_time) or (duration with source=duration)' })
    }

    // 检查时间冲突（可选：简单的重叠检查）
    const conflictCheck = await query(
      `SELECT * FROM play_sessions 
       WHERE game_id = $1 
       AND (
         (start_time <= $2 AND end_time >= $2) OR
         (start_time <= $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [game_id, finalStartTime, finalEndTime]
    )

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Time conflict with existing session' })
    }

    const result = await query(
      `INSERT INTO play_sessions (game_id, start_time, end_time, duration, source) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [game_id, finalStartTime, finalEndTime, finalDuration, source || 'manual']
    )

    // 返回包含游戏信息的记录
    const fullResult = await query(
      `SELECT ps.*, g.name as game_name, gen.code as genre_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       WHERE ps.id = $1`,
      [result.rows[0].id]
    )

    res.status(201).json(fullResult.rows[0])
  } catch (err) {
    console.error('Add manual session error:', err)
    res.status(500).json({ error: 'Failed to add manual session' })
  }
})

// GET /api/sessions/recent - 获取最近记录
router.get('/recent', async (req, res) => {
  try {
    const result = await query(
      `SELECT ps.*, g.name as game_name, gen.code as genre_code,
        plat.code as platform_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
       ORDER BY ps.start_time DESC
       LIMIT 10`
    )

    res.json(result.rows)
  } catch (err) {
    console.error('Get recent sessions error:', err)
    res.status(500).json({ error: 'Failed to get recent sessions' })
  }
})

export default router
