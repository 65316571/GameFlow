import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

// GET /api/games - 获取游戏列表（支持筛选）
router.get('/', async (req, res) => {
  try {
    const { genre_id, platform_id } = req.query
    let sql = `
      SELECT g.*, 
        gen.code as genre_code, gen.name as genre_name,
        plat.code as platform_code, plat.name as platform_name
      FROM games g
      LEFT JOIN genres gen ON g.genre_id = gen.id
      LEFT JOIN platforms plat ON g.platform_id = plat.id
      WHERE 1=1
    `
    const params = []
    let paramIndex = 1

    if (genre_id) {
      sql += ` AND g.genre_id = $${paramIndex++}`
      params.push(genre_id)
    }
    if (platform_id) {
      sql += ` AND g.platform_id = $${paramIndex++}`
      params.push(platform_id)
    }

    sql += ` ORDER BY g.created_at DESC`

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (err) {
    console.error('Get games error:', err)
    res.status(500).json({ error: 'Failed to get games' })
  }
})

// POST /api/games - 创建游戏
router.post('/', async (req, res) => {
  try {
    const { name, genre_id, platform_id, note } = req.body
    
    if (!name || !genre_id || !platform_id) {
      return res.status(400).json({ error: 'name, genre_id and platform_id are required' })
    }

    const result = await query(
      `INSERT INTO games (name, genre_id, platform_id, note) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, genre_id, platform_id, note || null]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create game error:', err)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

// PUT /api/games/:id - 更新游戏
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, genre_id, platform_id, note } = req.body

    const result = await query(
      `UPDATE games 
       SET name = $1, genre_id = $2, platform_id = $3, note = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, genre_id, platform_id, note || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update game error:', err)
    res.status(500).json({ error: 'Failed to update game' })
  }
})

// DELETE /api/games/:id - 删除游戏
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await query('DELETE FROM games WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' })
    }

    res.json({ message: 'Game deleted successfully' })
  } catch (err) {
    console.error('Delete game error:', err)
    res.status(500).json({ error: 'Failed to delete game' })
  }
})

// GET /api/genres - 获取所有类型
router.get('/genres/list', async (req, res) => {
  try {
    const result = await query('SELECT * FROM genres WHERE is_active = TRUE ORDER BY sort_order')
    res.json(result.rows)
  } catch (err) {
    console.error('Get genres error:', err)
    res.status(500).json({ error: 'Failed to get genres' })
  }
})

// GET /api/platforms - 获取所有平台
router.get('/platforms/list', async (req, res) => {
  try {
    const result = await query('SELECT * FROM platforms WHERE is_active = TRUE ORDER BY sort_order')
    res.json(result.rows)
  } catch (err) {
    console.error('Get platforms error:', err)
    res.status(500).json({ error: 'Failed to get platforms' })
  }
})

export default router
