import { useEffect, useState } from 'react'
import { getGames, getGenres, getPlatforms, createGame, updateGame, deleteGame } from '../api'
import { gameInitial, GENRE_AVATAR_COLORS } from '../utils'

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
        <div className="modal-title">{game ? '编辑游戏' : '添加游戏'}</div>
        <div className="field">
          <label>游戏名称</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="输入游戏名称" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>平台</label>
            <select value={form.platform_id} onChange={e => set('platform_id', e.target.value)}>
              <option value="">请选择</option>
              {platforms.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </div>
          <div className="field">
            <label>类型</label>
            <select value={form.genre_id} onChange={e => set('genre_id', e.target.value)}>
              <option value="">请选择</option>
              {genres.map(g => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>备注（可选）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="版本、购买来源等" />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {game ? '保存修改' : '确认添加'}
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
  const [modal, setModal] = useState(null) // null | 'add' | game object

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
          <div className="page-title">游戏库</div>
          <div className="page-subtitle">共 {games.length} 款游戏</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ 添加游戏</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="chip-group">
          <button className={`chip ${!filterPlatform ? 'active' : ''}`} onClick={() => setFilterPlatform('')}>全部平台</button>
          {platforms.map(p => (
            <button key={p.id} className={`chip ${filterPlatform === p.code ? 'active' : ''}`}
              onClick={() => setFilterPlatform(filterPlatform === p.code ? '' : p.code)}>
              {p.code}
            </button>
          ))}
        </div>
        <div style={{ width: '0.5px', height: 20, background: '#e8e6df' }} />
        <div className="chip-group">
          <button className={`chip ${!filterGenre ? 'active' : ''}`} onClick={() => setFilterGenre('')}>全部类型</button>
          {genres.map(g => (
            <button key={g.id} className={`chip ${filterGenre === g.code ? 'active' : ''}`}
              onClick={() => setFilterGenre(filterGenre === g.code ? '' : g.code)}>
              {g.code}
            </button>
          ))}
        </div>
      </div>

      {games.length === 0
        ? <div className="empty-state">暂无游戏，点击右上角添加</div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
            {games.map(game => {
              const colors = GENRE_AVATAR_COLORS[game.genre_code] || GENRE_AVATAR_COLORS.OTHER
              return (
                <div key={game.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="game-avatar" style={{ background: colors.bg, color: colors.color }}>
                      {gameInitial(game.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{game.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => setModal(game)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(game.id)}>删除</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span className="badge badge-platform">{game.platform_code}</span>
                    <span className={`badge badge-${game.genre_code}`}>{game.genre_code}</span>
                  </div>
                  {game.note && (
                    <div style={{ fontSize: 12, color: '#b4b2a9', borderTop: '0.5px solid #f1efe8', paddingTop: 8 }}>
                      {game.note}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#888780', borderTop: '0.5px solid #f1efe8', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    累计时长
                    <span style={{ color: '#534ab7', fontWeight: 500 }}>
                      {game.total_hours ? `${game.total_hours}h` : '暂无记录'}
                    </span>
                  </div>
                </div>
              )
            })}

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, border: '0.5px dashed #d3d1c7', cursor: 'pointer', color: '#b4b2a9' }}
              onClick={() => setModal('add')}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
              <div style={{ fontSize: 13 }}>添加游戏</div>
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
