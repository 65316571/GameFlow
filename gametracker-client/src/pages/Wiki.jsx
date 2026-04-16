import { useEffect, useMemo, useState } from 'react'
import {
  createWikiGenre,
  deleteWikiGenre,
  getWikiGenres,
  updateWikiGenre,
  uploadWikiImage,
} from '../api'
import { createGame, deleteGame, getGames, getPlatforms, updateGame } from '../api'

const THEME_PRESETS = [
  { key: 'RPG', label: '紫色', bg: 'var(--status-rpg-bg)', color: 'var(--status-rpg-text)' },
  { key: 'ARPG', label: '洋红', bg: 'var(--status-arpg-bg)', color: 'var(--status-arpg-text)' },
  { key: 'MMORPG', label: '靛蓝', bg: 'var(--status-mmorpg-bg)', color: 'var(--status-mmorpg-text)' },
  { key: 'FPS', label: '橙红', bg: 'var(--status-fps-bg)', color: 'var(--status-fps-text)' },
  { key: 'TPS', label: '深橙', bg: 'var(--status-tps-bg)', color: 'var(--status-tps-text)' },
  { key: 'ACT', label: '红色', bg: 'var(--status-act-bg)', color: 'var(--status-act-text)' },
  { key: 'MOBA', label: '绿色', bg: 'var(--status-moba-bg)', color: 'var(--status-moba-text)' },
  { key: 'RTS', label: '草绿', bg: 'var(--status-rts-bg)', color: 'var(--status-rts-text)' },
  { key: 'SLG', label: '青绿', bg: 'var(--status-slg-bg)', color: 'var(--status-slg-text)' },
  { key: 'SIM', label: '蓝色', bg: 'var(--status-sim-bg)', color: 'var(--status-sim-text)' },
  { key: 'RAC', label: '天蓝', bg: 'var(--status-rac-bg)', color: 'var(--status-rac-text)' },
  { key: 'SPG', label: '橄榄', bg: 'var(--status-spg-bg)', color: 'var(--status-spg-text)' },
  { key: 'FTG', label: '紫罗兰', bg: 'var(--status-ftg-bg)', color: 'var(--status-ftg-text)' },
  { key: 'ADV', label: '金色', bg: 'var(--status-adv-bg)', color: 'var(--status-adv-text)' },
  { key: 'PUZ', label: '粉红', bg: 'var(--status-puz-bg)', color: 'var(--status-puz-text)' },
  { key: 'Roguelike', label: '琥珀', bg: 'var(--status-rogue-bg)', color: 'var(--status-rogue-text)' },
  { key: 'Horror', label: '灰蓝', bg: 'var(--status-horror-bg)', color: 'var(--status-horror-text)' },
  { key: 'Sandbox', label: '橘黄', bg: 'var(--status-sandbox-bg)', color: 'var(--status-sandbox-text)' },
  { key: 'Rhythm', label: ' cyan', bg: 'var(--status-rhythm-bg)', color: 'var(--status-rhythm-text)' },
  { key: 'OTHER', label: '中性', bg: 'var(--status-other-bg)', color: 'var(--status-other-text)' },
]

function getTheme(themeKey) {
  return THEME_PRESETS.find(t => t.key === themeKey) || THEME_PRESETS[THEME_PRESETS.length - 1]
}

function GenreModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    code: initial?.code || '',
    name: initial?.name || '',
    full: initial?.full || '',
    icon: initial?.icon || '',
    theme: initial?.theme || 'OTHER',
    wikiUrl: initial?.wikiUrl || '',
    wikiLabel: initial?.wikiLabel || '',
    desc: initial?.desc || '',
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const code = form.code.trim()
    const name = form.name.trim()
    if (!code || !name) return
    onSave({
      code,
      name,
      full: form.full.trim(),
      icon: form.icon.trim() || '🎮',
      theme: form.theme,
      wikiUrl: form.wikiUrl.trim(),
      wikiLabel: form.wikiLabel.trim() || '查看链接',
      desc: form.desc.trim(),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{mode === 'add' ? '➕' : '✏️'}</span>
          {mode === 'add' ? '新增类型' : '编辑类型'}
        </div>

        <div className="field-row">
          <div className="field">
            <label><span>🏷️</span> 类型代码</label>
            <input value={form.code} onChange={e => set('code', e.target.value)} placeholder="例如：RPG" disabled={mode === 'edit'} />
          </div>
          <div className="field">
            <label><span>🪪</span> 类型名称</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：角色扮演" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label><span>🌈</span> 配色</label>
            <select value={form.theme} onChange={e => set('theme', e.target.value)}>
              {THEME_PRESETS.map(t => (
                <option key={t.key} value={t.key}>{t.key} · {t.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label><span>🔤</span> 英文全称</label>
            <input value={form.full} onChange={e => set('full', e.target.value)} placeholder="例如：Role-Playing Game" />
          </div>
        </div>

        <div className="field">
          <label><span>✨</span> 图标</label>
          <input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="例如：⚔️" />
        </div>

        <div className="field">
          <label><span>📝</span> 类型介绍</label>
          <textarea value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="写一点这个类型的特点..." />
        </div>

        <div className="field-row">
          <div className="field">
            <label><span>🔗</span> 链接</label>
            <input value={form.wikiUrl} onChange={e => set('wikiUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div className="field">
            <label><span>🏷️</span> 链接名称</label>
            <input value={form.wikiLabel} onChange={e => set('wikiLabel', e.target.value)} placeholder="例如：维基百科 · RPG" />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <span>✅</span> 保存
          </button>
        </div>
      </div>
    </div>
  )
}

function GameModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    name: initial?.name || '',
    publisher: initial?.publisher || '',
    official_url: initial?.official_url || '',
    cover_url: initial?.cover_url || '',
    wiki_intro: initial?.wiki_intro || '',
    genre_id: initial?.genre_id || '',
    platform_id: initial?.platform_id || '',
  }))
  const [uploading, setUploading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadWikiImage(file)
      set('cover_url', res.data?.url || '')
    } catch {
      alert('图片上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    const name = form.name.trim()
    if (!name || !form.genre_id || !form.platform_id) return
    onSave({
      id: form.id,
      name,
      publisher: form.publisher.trim(),
      official_url: form.official_url.trim(),
      cover_url: form.cover_url.trim(),
      wiki_intro: form.wiki_intro.trim(),
      genre_id: form.genre_id,
      platform_id: form.platform_id,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{mode === 'add' ? '➕' : '✏️'}</span>
          {mode === 'add' ? '新增游戏' : '编辑游戏'}
        </div>

        <div className="field">
          <label><span>🎮</span> 游戏名称</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：艾尔登法环" />
        </div>

        <div className="field-row">
          <div className="field">
            <label><span>🏷️</span> 类型</label>
            <select value={form.genre_id} onChange={e => set('genre_id', e.target.value)}>
              <option value="">请选择</option>
              {(initial?.genres || []).map(g => (
                <option key={g.id} value={g.id}>
                  {g.code} · {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label><span>🖥️</span> 平台</label>
            <select value={form.platform_id} onChange={e => set('platform_id', e.target.value)}>
              <option value="">请选择</option>
              {(initial?.platforms || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label><span>🏢</span> 游戏厂商</label>
          <input value={form.publisher} onChange={e => set('publisher', e.target.value)} placeholder="例如：FromSoftware" />
        </div>

        <div className="field">
          <label><span>🔗</span> 游戏官网</label>
          <input value={form.official_url} onChange={e => set('official_url', e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label><span>🖼️</span> 封面/图标</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              value={form.cover_url}
              onChange={e => set('cover_url', e.target.value)}
              placeholder="上传后自动填充，或手填外链"
              style={{ flex: 1 }}
            />
            <label className="btn" style={{ padding: '10px 14px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? '上传中...' : '上传'}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="field">
          <label><span>📖</span> 游戏介绍（客观）</label>
          <textarea value={form.wiki_intro} onChange={e => set('wiki_intro', e.target.value)} placeholder="客观介绍（不包含个人评价）" />
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
            <span>✅</span> 保存
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Wiki() {
  const [expanded, setExpanded] = useState(() => new Set(['RPG']))
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [games, setGames] = useState([])

  const reload = () => {
    setLoading(true)
    return Promise.all([getWikiGenres(), getPlatforms(), getGames()])
      .then(([gr, pr, ga]) => {
        const genreList = Array.isArray(gr.data) ? gr.data : []
        const platformList = Array.isArray(pr.data) ? pr.data : []
        const gameList = Array.isArray(ga.data) ? ga.data : []
        setGenres(genreList)
        setPlatforms(platformList)
        setGames(gameList)
      })
      .catch(() => {
        setGenres([])
        setPlatforms([])
        setGames([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([getWikiGenres(), getPlatforms(), getGames()])
      .then(([gr, pr, ga]) => {
        if (cancelled) return
        const genreList = Array.isArray(gr.data) ? gr.data : []
        const platformList = Array.isArray(pr.data) ? pr.data : []
        const gameList = Array.isArray(ga.data) ? ga.data : []
        setGenres(genreList)
        setPlatforms(platformList)
        setGames(gameList)
      })
      .catch(() => {
        if (cancelled) return
        setGenres([])
        setPlatforms([])
        setGames([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const genresByCode = useMemo(() => new Map(genres.map(g => [g.code, g])), [genres])

  const toggle = (code) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const openAddGenre = () => setModal({ type: 'genre', mode: 'add' })
  const openEditGenre = (code) => setModal({ type: 'genre', mode: 'edit', code })
  const openAddGame = (code) => setModal({ type: 'game', mode: 'add', code })
  const openEditGame = (code, gameId) => setModal({ type: 'game', mode: 'edit', code, gameId })

  const removeGenre = async (code) => {
    if (!confirm('确定要删除这个类型及其所有游戏百科信息吗？')) return
    try {
      await deleteWikiGenre(code)
      await reload()
      setExpanded(prev => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })
    } catch {
      alert('删除失败，请重试')
    }
  }

  const removeGame = async (id) => {
    if (!confirm('确定要删除这款游戏吗？')) return
    try {
      await deleteGame(id)
      await reload()
    } catch {
      alert('删除失败，请重试')
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div className="page-title">
            <span style={{ fontSize: 32, marginRight: 10 }}>📚</span>
            游戏百科
          </div>
          <div className="page-subtitle">百科内容已迁移到后端数据库，支持统一维护（类型 + 代表游戏）</div>
        </div>
        <button className="btn btn-primary" onClick={openAddGenre} style={{ padding: '12px 22px', fontSize: 14 }}>
          <span style={{ marginRight: 6 }}>➕</span> 新增类型
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
          正在加载百科...
        </div>
      ) : (
        <div className="wiki-genre-grid">
          {genres.map(g => {
            const open = expanded.has(g.code)
            const theme = getTheme(g.theme)
            const genreGames = games.filter(x => x.genre_id === g.id)
            return (
              <div key={g.code} className="card"
                style={{
                  cursor: 'pointer',
                  border: `2px solid ${open ? 'var(--primary-border)' : 'var(--border-color)'}`,
                  transition: 'all 0.2s ease',
                  transform: open ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: open ? 'var(--shadow-md)' : 'none',
                }}
                onClick={() => toggle(g.code)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 14, flexShrink: 0,
                    background: theme.bg, color: theme.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28,
                  }}>
                    {g.icon || '🎮'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                      <span className="badge badge-platform" style={{ padding: '4px 10px' }}>{g.code}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.full}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {open && (
                      <>
                        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openEditGenre(g.code) }}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); removeGenre(g.code) }}>🗑️</button>
                      </>
                    )}
                    <div style={{ fontSize: 16, color: 'var(--text-muted)' }}>{open ? '🔼' : '🔽'}</div>
                  </div>
                </div>

                <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{g.desc}</div>

                {open && (
                  <div onClick={e => e.stopPropagation()}>
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 18 }}>🎮</span> 代表游戏
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>({genreGames.length})</span>
                        </div>
                        <button className="btn btn-primary" onClick={() => openAddGame(g.code)} style={{ padding: '8px 14px', fontSize: 13 }}>
                          <span style={{ marginRight: 6 }}>➕</span> 新增游戏
                        </button>
                      </div>

                      {genreGames.length === 0 ? (
                        <div className="empty-state" style={{ padding: '26px 0' }}>
                          <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                          还没有游戏条目，点击右侧新增
                        </div>
                      ) : (
                        <div className="wiki-games-scroll">
                          <div className="wiki-game-grid">
                            {genreGames.map(game => (
                              <div key={game.id} className="wiki-game-card">
                                {game.cover_url ? (
                                  <img className="wiki-game-img" src={game.cover_url} alt={game.name} loading="lazy" />
                                ) : (
                                  <div className="wiki-game-img wiki-game-placeholder" style={{ background: theme.bg, color: theme.color }}>
                                    🎮
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                                    <div style={{ minWidth: 0 }}>
                                      <div className="wiki-game-title">{game.name}</div>
                                      <div className="wiki-game-meta">{game.publisher ? `厂商：${game.publisher}` : '厂商：未填写'}</div>
                                    </div>
                                    <div className="wiki-game-actions">
                                      <button className="btn btn-sm btn-ghost" onClick={() => openEditGame(g.code, game.id)}>✏️</button>
                                      <button className="btn btn-sm btn-danger" onClick={() => removeGame(game.id)}>🗑️</button>
                                    </div>
                                  </div>
                                  <div className="wiki-game-intro">{game.wiki_intro || '暂无介绍'}</div>
                                  {game.official_url && (
                                    <a href={game.official_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, marginTop: 8, display: 'inline-block', color: 'var(--primary-color)' }}>
                                      🔗 官网
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {g.wikiUrl && (
                        <a href={g.wikiUrl} target="_blank" rel="noreferrer"
                          className="btn btn-primary"
                          style={{
                            marginTop: 16,
                            padding: '10px 16px',
                            borderRadius: 10,
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>🔗</span> {g.wikiLabel || '查看链接'}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal?.type === 'genre' && (
        <GenreModal
          mode={modal.mode}
          initial={modal.mode === 'edit' ? genresByCode.get(modal.code) : null}
          onClose={() => setModal(null)}
          onSave={async (genre) => {
            try {
              if (modal.mode === 'add') {
                await createWikiGenre(genre)
                setExpanded(prev => new Set(prev).add(genre.code))
              } else {
                await updateWikiGenre(modal.code, genre)
              }
              await reload()
              setModal(null)
            } catch {
              alert('保存失败，请检查类型代码是否重复，或稍后重试')
            }
          }}
        />
      )}

      {modal?.type === 'game' && (
        <GameModal
          mode={modal.mode}
          initial={(() => {
            if (modal.mode === 'edit') {
              const found = games.find(x => x.id === modal.gameId) || null
              if (!found) return null
              return { ...found, genres, platforms }
            }
            const genre = genresByCode.get(modal.code)
            return { id: undefined, name: '', publisher: '', official_url: '', cover_url: '', wiki_intro: '', genre_id: genre?.id || '', platform_id: '', genres, platforms }
          })()}
          onClose={() => setModal(null)}
          onSave={async (game) => {
            try {
              if (modal.mode === 'add') {
                await createGame(game)
              } else {
                await updateGame(game.id, game)
              }
              await reload()
              setModal(null)
            } catch {
              alert('保存失败，请重试')
            }
          }}
        />
      )}
    </div>
  )
}
