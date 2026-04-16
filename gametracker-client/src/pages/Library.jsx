import { useEffect, useState } from 'react'
import { useSettings } from '../contexts/useSettings'
import { getGames, getGenres, getPlatforms, createGame, updateGame, deleteGame } from '../api'
import { gameInitial, GENRE_AVATAR_COLORS, PLATFORM_ICONS } from '../utils'

const GENRE_ICONS = {
  'RPG': '⚔️',
  'ARPG': '⚔️',
  'MMORPG': '👥',
  'FPS': '🔫',
  'TPS': '🎯',
  'ACT': '👊',
  'MOBA': '⚡',
  'RTS': '♟️',
  'SLG': '🏛️',
  'SIM': '🏗️',
  'RAC': '🏎️',
  'SPG': '⚽',
  'FTG': '🥊',
  'ADV': '🗺️',
  'PUZ': '🧩',
  'Roguelike': '🎲',
  'Horror': '💀',
  'Sandbox': '⛏️',
  'Rhythm': '🎵',
  'OTHER': '📌',
}

const PLATFORM_EMOJIS = {
  'NS': '🎮',
  'PS4': '🕹️',
  'Xbox': '❎',
  'Steam': '♨️',
  'APP': '📱',
  '网站': '🌐',
}

function GameModal({ game, genres, platforms, onClose, onSave }) {
  const [form, setForm] = useState({
    name: game?.name || '',
    genre_id: game?.genre_id || '',
    platform_id: game?.platform_id || '',
    note: game?.note || '',
    cover_url: game?.cover_url || '',
    official_url: game?.official_url || '',
    publisher: game?.publisher || '',
    wiki_intro: game?.wiki_intro || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.genre_id || !form.platform_id) return
    await onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{game ? '✏️' : '➕'}</span>
          {game ? '编辑游戏' : '添加游戏'}
        </div>
        <div className="field">
          <label><span>🎮</span> 游戏名称</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="输入游戏名称" />
        </div>
        <div className="field-row">
          <div className="field">
            <label><span>🖥️</span> 平台</label>
            <select value={form.platform_id} onChange={e => set('platform_id', e.target.value)}>
              <option value="">请选择</option>
              {platforms.map(p => (
                <option key={p.id} value={p.id}>
                  {PLATFORM_EMOJIS[p.code] || '🎮'} {p.code}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label><span>🏷️</span> 类型</label>
            <select value={form.genre_id} onChange={e => set('genre_id', e.target.value)}>
              <option value="">请选择</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>
                  {GENRE_ICONS[g.code] || '🎯'} {g.code} · {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label><span>📝</span> 备注（可选）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="版本、购买来源等" />
        </div>

        <div className="field">
          <label><span>🏢</span> 游戏厂商（百科）</label>
          <input value={form.publisher} onChange={e => set('publisher', e.target.value)} placeholder="例如：FromSoftware" />
        </div>

        <div className="field">
          <label><span>🔗</span> 游戏官网（百科）</label>
          <input value={form.official_url} onChange={e => set('official_url', e.target.value)} placeholder="https://..." />
        </div>

        <div className="field">
          <label><span>🖼️</span> 游戏封面/图标 URL（百科）</label>
          <input value={form.cover_url} onChange={e => set('cover_url', e.target.value)} placeholder="https://... 或 http://localhost:3003/uploads/..." />
        </div>

        <div className="field">
          <label><span>📖</span> 游戏介绍（百科）</label>
          <textarea value={form.wiki_intro} onChange={e => set('wiki_intro', e.target.value)} placeholder="客观介绍（不包含个人评价）" />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <span>✅</span> {game ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Library() {
  const { settings, disableImmersiveMode } = useSettings()
  const [games, setGames] = useState([])
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    getGenres().then(r => setGenres(r.data))
    getPlatforms().then(r => setPlatforms(r.data))
  }, [])

  useEffect(() => {
    const params = {}
    if (filterPlatform) params.platform_code = filterPlatform
    if (filterGenre) params.genre_code = filterGenre
    getGames(params).then(res => setGames(res.data))
  }, [filterPlatform, filterGenre])

  const handleSave = async (form) => {
    if (modal && modal.id) {
      await updateGame(modal.id, form)
    } else {
      await createGame(form)
    }
    const params = {}
    if (filterPlatform) params.platform_code = filterPlatform
    if (filterGenre) params.genre_code = filterGenre
    const res = await getGames(params)
    setGames(res.data)
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除这款游戏及其所有游玩记录吗？')) return
    await deleteGame(id)
    const params = {}
    if (filterPlatform) params.platform_code = filterPlatform
    if (filterGenre) params.genre_code = filterGenre
    const res = await getGames(params)
    setGames(res.data)
  }

  // 获取沉浸游戏信息
  const immersiveGame = settings.immersiveMode 
    ? games.find(g => g.id === settings.immersiveGameId)
    : null

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">
            <span style={{ fontSize: 32, marginRight: 10 }}>🎮</span>
            游戏库
          </div>
          <div className="page-subtitle">共 {games.length} 款游戏 🎯</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')} style={{ padding: '12px 24px', fontSize: 15 }}>
          <span style={{ marginRight: 6 }}>➕</span> 添加游戏
        </button>
      </div>

      {/* 沉浸模式提示 */}
      {settings.immersiveMode && immersiveGame && (
        <div className="alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🧘</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                沉浸模式已开启
              </div>
              <div style={{ fontSize: 14, marginTop: 2 }}>
                当前限定游戏：<strong>{immersiveGame.name}</strong>
              </div>
            </div>
          </div>
          <button 
            className="btn"
            onClick={disableImmersiveMode}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            退出沉浸模式
          </button>
        </div>
      )}

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="chip-group">
          <button className={`chip ${!filterPlatform ? 'active' : ''}`} onClick={() => setFilterPlatform('')}>
            🎮 全部平台
          </button>
          {platforms.map(p => (
            <button key={p.id} className={`chip ${filterPlatform === p.code ? 'active' : ''}`}
              onClick={() => setFilterPlatform(filterPlatform === p.code ? '' : p.code)}>
              {PLATFORM_ICONS[p.code] ? (
                <span 
                  className="platform-icon" 
                  data-platform={p.code}
                  style={{ 
                    maskImage: `url(${PLATFORM_ICONS[p.code]})`,
                    WebkitMaskImage: `url(${PLATFORM_ICONS[p.code]})`
                  }}
                />
              ) : '🎮'}
              {p.code}
            </button>
          ))}
        </div>
        <div style={{ width: '0.5px', height: 24, background: 'var(--border-color)' }} />
        <div className="chip-group">
          <button className={`chip ${!filterGenre ? 'active' : ''}`} onClick={() => setFilterGenre('')}>
            🏷️ 全部类型
          </button>
          {genres.map(g => (
            <button key={g.id} className={`chip ${filterGenre === g.code ? 'active' : ''}`}
              onClick={() => setFilterGenre(filterGenre === g.code ? '' : g.code)}>
              {GENRE_ICONS[g.code] || '🎯'} {g.code}
            </button>
          ))}
        </div>
      </div>

      {/* 游戏列表 */}
      {games.length === 0
        ? (
          <div className="empty-state">
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            暂无游戏，点击右上角添加
          </div>
        )
        : (
          <div className="library-grid-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {games.map(game => {
              const colors = GENRE_AVATAR_COLORS[game.genre_code] || GENRE_AVATAR_COLORS.OTHER
              const isImmersiveGame = settings.immersiveMode && settings.immersiveGameId === game.id
              const isOtherGameBlocked = settings.immersiveMode && !isImmersiveGame
              
              return (
                <div key={game.id} className={`card ${isImmersiveGame ? 'immersive' : ''} ${isOtherGameBlocked ? 'blocked' : ''}`} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12,
                  position: 'relative',
                }}>
                  {/* 沉浸模式标签 */}
                  {isImmersiveGame && (
                    <div style={{
                      position: 'absolute',
                      top: -1,
                      right: 12,
                      background: 'var(--status-moba-text)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '0 0 8px 8px'
                    }}>
                      🧘 沉浸中
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.name}
                        style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '0.5px solid var(--border-color)' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="game-avatar" style={{ background: colors.bg, color: colors.color, width: 56, height: 56, fontSize: 18 }}>
                        {gameInitial(game.name)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{game.name}</div>
                      {game.publisher && (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          {game.publisher}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => setModal(game)}
                        disabled={isOtherGameBlocked}
                        title={isOtherGameBlocked ? '沉浸模式下无法编辑其他游戏' : ''}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(game.id)}
                        disabled={isOtherGameBlocked}
                        title={isOtherGameBlocked ? '沉浸模式下无法删除其他游戏' : ''}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-platform" style={{ fontSize: 13, padding: '4px 10px' }}>
                      {PLATFORM_ICONS[game.platform_code] ? (
                        <span 
                          className="platform-icon" 
                          data-platform={game.platform_code}
                          style={{ 
                            maskImage: `url(${PLATFORM_ICONS[game.platform_code]})`,
                            WebkitMaskImage: `url(${PLATFORM_ICONS[game.platform_code]})`
                          }}
                        />
                      ) : '🎮'}
                      {game.platform_code}
                    </span>
                    <span className={`badge badge-${game.genre_code}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                      {GENRE_ICONS[game.genre_code] || '🎯'} {game.genre_code}
                    </span>
                  </div>
                  {game.note && (
                    <div className="card-divider card-note">
                      📝 {game.note}
                    </div>
                  )}
                  <div className="card-divider card-stats">
                    <span>⏱️ 累计时长</span>
                    <span className="card-stats-value">
                      {game.total_hours ? `${game.total_hours}h` : '暂无记录'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* 添加卡片 */}
            <div 
              className="card card-add"
              onClick={() => setModal('add')}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>➕</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>添加新游戏</div>
            </div>
          </div>
        )
      }

      {modal && (
        <GameModal
          game={modal === 'add' ? null : modal}
          genres={genres}
          platforms={platforms}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
