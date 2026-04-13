import { useEffect, useState } from 'react'
import { getGames, getGenres, getPlatforms, createGame, updateGame, deleteGame } from '../api'
import { gameInitial, GENRE_AVATAR_COLORS } from '../utils'

const PLATFORM_ICONS = {
  'NS': '🎮',
  'PS4': '🕹️',
  'PC': '💻',
  'APP': '📱',
  '网站': '🌐',
}

const GENRE_ICONS = {
  'RPG': '⚔️',
  'FPS': '🔫',
  'MOBA': '⚡',
  'SIM': '🏗️',
  'ADV': '🗺️',
  'OTHER': '🎯',
}

function GameModal({ game, genres, platforms, onClose, onSave }) {
  const [form, setForm] = useState({
    name: game?.name || '',
    genre_id: game?.genre_id || '',
    platform_id: game?.platform_id || '',
    note: game?.note || '',
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
                  {PLATFORM_ICONS[p.code] || '🎮'} {p.code}
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
  const [games, setGames] = useState([])
  const [genres, setGenres] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const [modal, setModal] = useState(null)

  const load = async () => {
    const params = {}
    if (filterPlatform) params.platform_code = filterPlatform
    if (filterGenre) params.genre_code = filterGenre
    const res = await getGames(params)
    setGames(res.data)
  }

  useEffect(() => {
    getGenres().then(r => setGenres(r.data))
    getPlatforms().then(r => setPlatforms(r.data))
  }, [])

  useEffect(() => { load() }, [filterPlatform, filterGenre])

  const handleSave = async (form) => {
    if (modal && modal.id) {
      await updateGame(modal.id, form)
    } else {
      await createGame(form)
    }
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除这款游戏及其所有游玩记录吗？')) return
    await deleteGame(id)
    load()
  }

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

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="chip-group">
          <button className={`chip ${!filterPlatform ? 'active' : ''}`} onClick={() => setFilterPlatform('')}>
            🎮 全部平台
          </button>
          {platforms.map(p => (
            <button key={p.id} className={`chip ${filterPlatform === p.code ? 'active' : ''}`}
              onClick={() => setFilterPlatform(filterPlatform === p.code ? '' : p.code)}>
              {PLATFORM_ICONS[p.code] || '🎮'} {p.code}
            </button>
          ))}
        </div>
        <div style={{ width: '0.5px', height: 24, background: '#e8e6df' }} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {games.map(game => {
              const colors = GENRE_AVATAR_COLORS[game.genre_code] || GENRE_AVATAR_COLORS.OTHER
              return (
                <div key={game.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div className="game-avatar" style={{ background: colors.bg, color: colors.color, width: 56, height: 56, fontSize: 18 }}>
                      {gameInitial(game.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{game.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setModal(game)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(game.id)}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-platform" style={{ fontSize: 13, padding: '4px 10px' }}>
                      {PLATFORM_ICONS[game.platform_code] || '🎮'} {game.platform_code}
                    </span>
                    <span className={`badge badge-${game.genre_code}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                      {GENRE_ICONS[game.genre_code] || '🎯'} {game.genre_code}
                    </span>
                  </div>
                  {game.note && (
                    <div style={{ fontSize: 14, color: '#888780', borderTop: '0.5px solid #f1efe8', paddingTop: 12 }}>
                      📝 {game.note}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: 14, color: '#666', 
                    borderTop: '0.5px solid #f1efe8', 
                    paddingTop: 12, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>⏱️ 累计时长</span>
                    <span style={{ color: '#534ab7', fontWeight: 700, fontSize: 16 }}>
                      {game.total_hours ? `${game.total_hours}h` : '暂无记录'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* 添加卡片 */}
            <div className="card" style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              justifyContent: 'center', minHeight: 160, 
              border: '0.5px dashed #d3d1c7', cursor: 'pointer', color: '#b4b2a9',
              transition: 'all 0.2s ease'
            }}
              onClick={() => setModal('add')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#afa9ec'
                e.currentTarget.style.color = '#534ab7'
                e.currentTarget.style.background = '#fafaf8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d3d1c7'
                e.currentTarget.style.color = '#b4b2a9'
                e.currentTarget.style.background = '#fff'
              }}
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
