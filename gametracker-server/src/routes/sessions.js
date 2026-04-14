import { Router } from 'express'
import { query, getClient } from '../db/index.js'

const router = Router()

const PAUSE_AUTO_END_MS = 15 * 60 * 1000

function toMs(v) {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.getTime()
}

async function getActiveFullById(client, id) {
  const r = await client.query(
    `SELECT ac.*, g.name as game_name, gen.code as genre_code,
      plat.code as platform_code
     FROM active_session ac
     JOIN games g ON ac.game_id = g.id
     LEFT JOIN genres gen ON g.genre_id = gen.id
     LEFT JOIN platforms plat ON g.platform_id = plat.id
     WHERE ac.id = $1
     LIMIT 1`,
    [id]
  )
  return r.rows[0] || null
}

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
      `INSERT INTO active_session (game_id, session_start_time, start_time, accumulated_seconds, paused, paused_at) 
       VALUES ($1, $2, $3, 0, FALSE, NULL) 
       RETURNING *`,
      [game_id, startTime, startTime]
    )

    const full = await getActiveFullById(client, result.rows[0].id)
    await client.query('COMMIT')
    res.status(201).json(full)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Start session error:', err)
    res.status(500).json({ error: 'Failed to start session' })
  } finally {
    client.release()
  }
})

// POST /api/sessions/:id/stop - 停止计时（保存记录）
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
    const now = new Date()
    const sessionStartTime = new Date(activeSession.session_start_time || activeSession.start_time)
    const resumeStartTime = new Date(activeSession.start_time)
    const accumulatedSeconds = parseInt(activeSession.accumulated_seconds || 0)
    const isPaused = !!activeSession.paused
    const pausedAt = activeSession.paused_at ? new Date(activeSession.paused_at) : null
    const endTime = isPaused && pausedAt ? pausedAt : now

    const runningSeconds = isPaused ? 0 : Math.floor((endTime - resumeStartTime) / 1000)
    const duration = Math.max(0, accumulatedSeconds + runningSeconds)

    // 创建游玩记录
    const sessionResult = await client.query(
      `INSERT INTO play_sessions (game_id, start_time, end_time, duration, source) 
       VALUES ($1, $2, $3, $4, 'timer') 
       RETURNING *`,
      [activeSession.game_id, sessionStartTime, endTime, duration]
    )

    // 删除活跃会话
    await client.query('DELETE FROM active_session WHERE id = $1', [id])

    await client.query('COMMIT')

    // 返回包含游戏信息的记录
    const fullResult = await query(
      `SELECT ps.*, ps.duration as duration_seconds,
        g.name as game_name, gen.code as genre_code,
        plat.code as platform_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
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

// POST /api/sessions/:id/cancel - 结束计时（不保存记录）
router.post('/:id/cancel', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const activeResult = await client.query('SELECT * FROM active_session WHERE id = $1', [id])
    if (activeResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'No active session found' })
    }

    await client.query('DELETE FROM active_session WHERE id = $1', [id])
    await client.query('COMMIT')
    res.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Cancel session error:', err)
    res.status(500).json({ error: 'Failed to cancel session' })
  } finally {
    client.release()
  }
})

// POST /api/sessions/:id/pause - 暂停计时
router.post('/:id/pause', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const activeResult = await client.query('SELECT * FROM active_session WHERE id = $1', [id])
    if (activeResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'No active session found' })
    }

    const activeSession = activeResult.rows[0]
    if (activeSession.paused) {
      const full = await getActiveFullById(client, id)
      await client.query('COMMIT')
      return res.json(full)
    }

    const now = new Date()
    const resumeStartTime = new Date(activeSession.start_time)
    const accumulatedSeconds = parseInt(activeSession.accumulated_seconds || 0)
    const deltaSeconds = Math.max(0, Math.floor((now - resumeStartTime) / 1000))
    const nextAccum = accumulatedSeconds + deltaSeconds

    const updated = await client.query(
      `UPDATE active_session
       SET accumulated_seconds = $1,
           paused = TRUE,
           paused_at = $2
       WHERE id = $3
       RETURNING *`,
      [nextAccum, now, id]
    )

    const full = await getActiveFullById(client, updated.rows[0].id)
    await client.query('COMMIT')
    res.json(full)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Pause session error:', err)
    res.status(500).json({ error: 'Failed to pause session' })
  } finally {
    client.release()
  }
})

// POST /api/sessions/:id/resume - 继续计时
router.post('/:id/resume', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const { id } = req.params
    const activeResult = await client.query('SELECT * FROM active_session WHERE id = $1', [id])
    if (activeResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'No active session found' })
    }

    const activeSession = activeResult.rows[0]
    if (!activeSession.paused) {
      const full = await getActiveFullById(client, id)
      await client.query('COMMIT')
      return res.json(full)
    }

    const now = new Date()
    const updated = await client.query(
      `UPDATE active_session
       SET start_time = $1,
           paused = FALSE,
           paused_at = NULL
       WHERE id = $2
       RETURNING *`,
      [now, id]
    )

    const full = await getActiveFullById(client, updated.rows[0].id)
    await client.query('COMMIT')
    res.json(full)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Resume session error:', err)
    res.status(500).json({ error: 'Failed to resume session' })
  } finally {
    client.release()
  }
})

// GET /api/sessions/active - 获取当前活跃会话
router.get('/active', async (req, res) => {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const activeResult = await client.query(
      `SELECT ac.*, g.name as game_name, gen.code as genre_code,
        plat.code as platform_code
       FROM active_session ac
       JOIN games g ON ac.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
       LIMIT 1`
    )

    const active = activeResult.rows[0] || null
    if (!active) {
      await client.query('COMMIT')
      return res.json(null)
    }

    if (active.paused && active.paused_at) {
      const pausedAtMs = toMs(active.paused_at)
      if (pausedAtMs && Date.now() - pausedAtMs >= PAUSE_AUTO_END_MS) {
        const sessionStartTime = new Date(active.session_start_time || active.start_time)
        const endTime = new Date(active.paused_at)
        const duration = Math.max(0, parseInt(active.accumulated_seconds || 0))

        await client.query(
          `INSERT INTO play_sessions (game_id, start_time, end_time, duration, source) 
           VALUES ($1, $2, $3, $4, 'timer')`,
          [active.game_id, sessionStartTime, endTime, duration]
        )
        await client.query('DELETE FROM active_session WHERE id = $1', [active.id])

        await client.query('COMMIT')
        return res.json(null)
      }
    }

    await client.query('COMMIT')
    res.json(active)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Get active session error:', err)
    res.status(500).json({ error: 'Failed to get active session' })
  } finally {
    client.release()
  }
})

// POST /api/sessions/manual - 手动补录
router.post('/manual', async (req, res) => {
  try {
    const { game_id, start_time, end_time, duration, duration_seconds, source, date } = req.body

    if (!game_id) {
      return res.status(400).json({ error: 'game_id is required' })
    }

    let finalStartTime, finalEndTime, finalDuration

    const parseLocalNoon = (ymd) => {
      if (!ymd) return null
      const [y, m, d] = String(ymd).split('-').map(v => parseInt(v))
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d, 12, 0, 0, 0)
    }

    const payloadDuration = duration_seconds ?? duration

    if (source === 'duration' && payloadDuration) {
      // 直接填时长的补录方式
      finalDuration = parseInt(payloadDuration)
      const base = parseLocalNoon(date) || new Date()
      finalStartTime = base
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
      `SELECT ps.*, ps.duration as duration_seconds,
        g.name as game_name, gen.code as genre_code,
        plat.code as platform_code
       FROM play_sessions ps
       JOIN games g ON ps.game_id = g.id
       LEFT JOIN genres gen ON g.genre_id = gen.id
       LEFT JOIN platforms plat ON g.platform_id = plat.id
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
      `SELECT ps.*, ps.duration as duration_seconds,
        g.name as game_name, gen.code as genre_code,
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
