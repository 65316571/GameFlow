import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { query } from '../db/index.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads', 'wiki')
fs.mkdirSync(uploadsRoot, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10) || '.png'
    const safeExt = ext.toLowerCase()
    const name = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}${safeExt}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) return cb(new Error('仅支持图片文件'))
    cb(null, true)
  },
})

function mapGenreRow(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    full: r.full_name || '',
    icon: r.icon || '🎮',
    theme: r.theme_key || 'OTHER',
    desc: r.description || '',
    wikiUrl: r.wiki_url || '',
    wikiLabel: r.wiki_label || '查看链接',
    sortOrder: r.sort_order || 0,
    games: [],
  }
}

function mapWikiGameRow(r) {
  return {
    id: r.id,
    genreId: r.genre_id,
    name: r.name,
    publisher: r.publisher || '',
    intro: r.intro || '',
    imageUrl: r.image_url || '',
    sortOrder: r.sort_order || 0,
  }
}

router.get('/genres', async (req, res) => {
  try {
    const genresRes = await query(
      `SELECT id, code, name, full_name, icon, theme_key, description, wiki_url, wiki_label, sort_order
       FROM genres
       WHERE is_active = TRUE
       ORDER BY sort_order, code`
    )
    res.json(genresRes.rows.map(mapGenreRow))
  } catch (err) {
    console.error('Get wiki genres error:', err)
    res.status(500).json({ error: 'Failed to get wiki genres' })
  }
})

router.post('/genres', async (req, res) => {
  const { code, name, full, icon, theme, desc, wikiUrl, wikiLabel, sortOrder } = req.body || {}
  const nextCode = typeof code === 'string' ? code.trim() : ''
  const nextName = typeof name === 'string' ? name.trim() : ''
  if (!nextCode || !nextName) return res.status(400).json({ error: 'code/name required' })

  try {
    const so = Number.isFinite(sortOrder) ? sortOrder : null
    const soRes = so === null
      ? await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM genres')
      : null
    const finalSort = so === null ? parseInt(soRes.rows[0].next) : sortOrder

    const r = await query(
      `INSERT INTO genres (code, name, full_name, icon, theme_key, description, wiki_url, wiki_label, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
       RETURNING id, code, name, full_name, icon, theme_key, description, wiki_url, wiki_label, sort_order`,
      [
        nextCode,
        nextName,
        typeof full === 'string' ? full.trim() : '',
        typeof icon === 'string' ? icon.trim() : '🎮',
        typeof theme === 'string' ? theme.trim() : 'OTHER',
        typeof desc === 'string' ? desc.trim() : '',
        typeof wikiUrl === 'string' ? wikiUrl.trim() : '',
        typeof wikiLabel === 'string' ? wikiLabel.trim() : '',
        finalSort,
      ]
    )

    res.json(mapGenreRow(r.rows[0]))
  } catch (err) {
    console.error('Create wiki genre error:', err)
    res.status(500).json({ error: 'Failed to create wiki genre' })
  }
})

router.put('/genres/:code', async (req, res) => {
  const code = (req.params.code || '').trim()
  const { name, full, icon, theme, desc, wikiUrl, wikiLabel, sortOrder } = req.body || {}
  if (!code) return res.status(400).json({ error: 'code required' })

  try {
    const r = await query(
      `UPDATE genres
       SET name = COALESCE($2, name),
           full_name = COALESCE($3, full_name),
           icon = COALESCE($4, icon),
           theme_key = COALESCE($5, theme_key),
           description = COALESCE($6, description),
           wiki_url = COALESCE($7, wiki_url),
           wiki_label = COALESCE($8, wiki_label),
           sort_order = COALESCE($9, sort_order)
       WHERE code = $1
       RETURNING id, code, name, full_name, icon, theme_key, description, wiki_url, wiki_label, sort_order`,
      [
        code,
        typeof name === 'string' ? name.trim() : null,
        typeof full === 'string' ? full.trim() : null,
        typeof icon === 'string' ? icon.trim() : null,
        typeof theme === 'string' ? theme.trim() : null,
        typeof desc === 'string' ? desc.trim() : null,
        typeof wikiUrl === 'string' ? wikiUrl.trim() : null,
        typeof wikiLabel === 'string' ? wikiLabel.trim() : null,
        Number.isFinite(sortOrder) ? sortOrder : null,
      ]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Genre not found' })
    res.json(mapGenreRow(r.rows[0]))
  } catch (err) {
    console.error('Update wiki genre error:', err)
    res.status(500).json({ error: 'Failed to update wiki genre' })
  }
})

router.delete('/genres/:code', async (req, res) => {
  const code = (req.params.code || '').trim()
  if (!code) return res.status(400).json({ error: 'code required' })

  try {
    await query(`UPDATE genres SET is_active = FALSE WHERE code = $1`, [code])
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete wiki genre error:', err)
    res.status(500).json({ error: 'Failed to delete wiki genre' })
  }
})

 

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const urlPath = `/uploads/wiki/${req.file.filename}`
    const origin = `${req.protocol}://${req.get('host')}`
    res.json({ url: `${origin}${urlPath}` })
  } catch (err) {
    console.error('Upload wiki image error:', err)
    res.status(500).json({ error: 'Failed to upload' })
  }
})

export default router
