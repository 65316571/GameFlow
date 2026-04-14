import { useMemo, useState } from 'react'

const STORAGE_KEY = 'gametracker-wiki-v1'

const THEME_PRESETS = [
  { key: 'RPG', label: '紫色', bg: 'var(--status-rpg-bg)', color: 'var(--status-rpg-text)' },
  { key: 'FPS', label: '橙红', bg: 'var(--status-fps-bg)', color: 'var(--status-fps-text)' },
  { key: 'MOBA', label: '绿色', bg: 'var(--status-moba-bg)', color: 'var(--status-moba-text)' },
  { key: 'SIM', label: '蓝色', bg: 'var(--status-sim-bg)', color: 'var(--status-sim-text)' },
  { key: 'ADV', label: '金色', bg: 'var(--status-adv-bg)', color: 'var(--status-adv-text)' },
  { key: 'OTHER', label: '中性', bg: 'var(--status-other-bg)', color: 'var(--status-other-text)' },
]

const DEFAULT_GENRES = [
  {
    code: 'RPG',
    name: '角色扮演',
    full: 'Role-Playing Game',
    theme: 'RPG',
    icon: '⚔️',
    desc: '玩家扮演一个或多个角色，在虚构世界中完成故事任务，通过战斗和成长提升角色能力。强调叙事、世界观构建与角色养成，通常拥有庞大的剧情和丰富的支线任务。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/角色扮演游戏',
    wikiLabel: '维基百科 · 角色扮演游戏',
    games: [
      { id: 'rpg-ff', name: '最终幻想系列', publisher: '', intro: '', imageUrl: '' },
      { id: 'rpg-ys', name: '原神', publisher: '', intro: '', imageUrl: '' },
      { id: 'rpg-er', name: '艾尔登法环', publisher: '', intro: '', imageUrl: '' },
      { id: 'rpg-p5', name: '女神异闻录5', publisher: '', intro: '', imageUrl: '' },
      { id: 'rpg-dq', name: '勇者斗恶龙', publisher: '', intro: '', imageUrl: '' },
      { id: 'rpg-tales', name: '破晓传说', publisher: '', intro: '', imageUrl: '' },
    ],
  },
  {
    code: 'FPS',
    name: '第一人称射击',
    full: 'First-Person Shooter',
    theme: 'FPS',
    icon: '🔫',
    desc: '以第一人称视角操控角色进行射击对抗，玩家直接看到角色的武器和手部。强调反应速度、瞄准精度和团队配合，竞技性强，是电竞赛场的主流品类之一。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/第一人称射击游戏',
    wikiLabel: '维基百科 · 第一人称射击游戏',
    games: [
      { id: 'fps-val', name: 'Valorant', publisher: '', intro: '', imageUrl: '' },
      { id: 'fps-cs2', name: 'CS2', publisher: '', intro: '', imageUrl: '' },
      { id: 'fps-cod', name: '使命召唤', publisher: '', intro: '', imageUrl: '' },
      { id: 'fps-halo', name: '光环', publisher: '', intro: '', imageUrl: '' },
      { id: 'fps-r6', name: '彩虹六号：围攻', publisher: '', intro: '', imageUrl: '' },
      { id: 'fps-bf', name: '战地系列', publisher: '', intro: '', imageUrl: '' },
    ],
  },
  {
    code: 'MOBA',
    name: '多人在线战术',
    full: 'Multiplayer Online Battle Arena',
    theme: 'MOBA',
    icon: '⚡',
    desc: '两队玩家各自操控英雄角色，目标是摧毁对方基地。强调团队协作、英雄搭配与实时策略决策，每局游戏通常持续 30~60 分钟，拥有极高的竞技深度。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/多人在线战术竞技游戏',
    wikiLabel: '维基百科 · MOBA',
    games: [
      { id: 'moba-lol', name: '英雄联盟', publisher: '', intro: '', imageUrl: '' },
      { id: 'moba-hok', name: '王者荣耀', publisher: '', intro: '', imageUrl: '' },
      { id: 'moba-dota2', name: 'Dota 2', publisher: '', intro: '', imageUrl: '' },
      { id: 'moba-hots', name: '风暴英雄', publisher: '', intro: '', imageUrl: '' },
      { id: 'moba-smite', name: 'Smite', publisher: '', intro: '', imageUrl: '' },
    ],
  },
  {
    code: 'SIM',
    name: '模拟经营',
    full: 'Simulation Game',
    theme: 'SIM',
    icon: '🏗️',
    desc: '模拟现实或虚构场景中的经营、建设、管理活动，节奏较慢，强调规划与资源调配，通常无明确胜负压力。涵盖城市建设、农场经营、交通模拟等多个子类型项。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/模拟游戏',
    wikiLabel: '维基百科 · 模拟游戏',
    games: [
      { id: 'sim-cs', name: '城市：天际线', publisher: '', intro: '', imageUrl: '' },
      { id: 'sim-sv', name: '星露谷物语', publisher: '', intro: '', imageUrl: '' },
      { id: 'sim-ts', name: '模拟人生', publisher: '', intro: '', imageUrl: '' },
      { id: 'sim-rc', name: '过山车之星', publisher: '', intro: '', imageUrl: '' },
      { id: 'sim-ac', name: '动物森友会', publisher: '', intro: '', imageUrl: '' },
      { id: 'sim-dsp', name: '戴森球计划', publisher: '', intro: '', imageUrl: '' },
    ],
  },
  {
    code: 'ADV',
    name: '冒险解谜',
    full: 'Adventure Game',
    theme: 'ADV',
    icon: '🗺️',
    desc: '玩家在广阔世界中探索、收集线索、解开谜题，并推进剧情发展。注重世界探索的自由度与叙事沉浸感，部分作品融合了动作元素形成动作冒险子类型。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/冒险游戏',
    wikiLabel: '维基百科 · 冒险游戏',
    games: [
      { id: 'adv-zelda', name: '塞尔达传说：王国之泪', publisher: '', intro: '', imageUrl: '' },
      { id: 'adv-rdr2', name: '荒野大镖客2', publisher: '', intro: '', imageUrl: '' },
      { id: 'adv-detroit', name: '底特律：变人', publisher: '', intro: '', imageUrl: '' },
      { id: 'adv-disco', name: '极乐迪斯科', publisher: '', intro: '', imageUrl: '' },
      { id: 'adv-ori', name: '奥日系列', publisher: '', intro: '', imageUrl: '' },
    ],
  },
  {
    code: 'OTHER',
    name: '其他类型',
    full: 'Other / Miscellaneous',
    theme: 'OTHER',
    icon: '🎯',
    desc: '不属于以上类型的游戏，涵盖音乐节奏、体育竞技、格斗、益智、卡牌、恐怖生存等多元品类。每个子类型都有自己独特的玩法逻辑和受众群体。',
    wikiUrl: 'https://zh.wikipedia.org/wiki/电子游戏类型',
    wikiLabel: '维基百科 · 电子游戏类型总览',
    games: [
      { id: 'other-taiko', name: '太鼓达人', publisher: '', intro: '', imageUrl: '' },
      { id: 'other-fifa', name: 'FIFA', publisher: '', intro: '', imageUrl: '' },
      { id: 'other-sf6', name: '街头霸王6', publisher: '', intro: '', imageUrl: '' },
      { id: 'other-hs', name: '炉石传说', publisher: '', intro: '', imageUrl: '' },
      { id: 'other-sekiro', name: '只狼', publisher: '', intro: '', imageUrl: '' },
    ],
  },
]

function getTheme(themeKey) {
  return THEME_PRESETS.find(t => t.key === themeKey) || THEME_PRESETS[0]
}

function loadWiki() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function saveWiki(genres) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(genres))
}

function genId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

function normGenre(g) {
  const code = typeof g?.code === 'string' ? g.code.trim() : ''
  if (!code) return null
  return {
    code,
    name: typeof g?.name === 'string' ? g.name : code,
    full: typeof g?.full === 'string' ? g.full : '',
    theme: typeof g?.theme === 'string' ? g.theme : 'OTHER',
    icon: typeof g?.icon === 'string' ? g.icon : '🎮',
    desc: typeof g?.desc === 'string' ? g.desc : '',
    wikiUrl: typeof g?.wikiUrl === 'string' ? g.wikiUrl : '',
    wikiLabel: typeof g?.wikiLabel === 'string' ? g.wikiLabel : '查看链接',
    games: Array.isArray(g?.games)
      ? g.games
          .map(x => ({
            id: typeof x?.id === 'string' ? x.id : `${code}-${Math.random().toString(16).slice(2)}`,
            name: typeof x?.name === 'string' ? x.name : '',
            publisher: typeof x?.publisher === 'string' ? x.publisher : '',
            intro: typeof x?.intro === 'string' ? x.intro : '',
            imageUrl: typeof x?.imageUrl === 'string' ? x.imageUrl : '',
          }))
          .filter(x => x.name.trim())
      : [],
  }
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
    if (!code) return
    onSave({
      ...initial,
      code,
      name: form.name.trim() || code,
      full: form.full.trim(),
      icon: form.icon.trim() || '🎮',
      theme: form.theme,
      wikiUrl: form.wikiUrl.trim(),
      wikiLabel: form.wikiLabel.trim() || '查看链接',
      desc: form.desc.trim(),
    })
  }

  const title = mode === 'add' ? '新增类型' : '编辑类型'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{mode === 'add' ? '➕' : '✏️'}</span>
          {title}
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
    name: initial?.name || '',
    publisher: initial?.publisher || '',
    intro: initial?.intro || '',
    imageUrl: initial?.imageUrl || '',
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const name = form.name.trim()
    if (!name) return
    onSave({
      ...initial,
      name,
      publisher: form.publisher.trim(),
      intro: form.intro.trim(),
      imageUrl: form.imageUrl.trim(),
    })
  }

  const title = mode === 'add' ? '新增游戏' : '编辑游戏'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-title">
          <span style={{ fontSize: 22 }}>{mode === 'add' ? '➕' : '✏️'}</span>
          {title}
        </div>

        <div className="field">
          <label><span>🎮</span> 游戏名称</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例如：艾尔登法环" />
        </div>

        <div className="field">
          <label><span>🏢</span> 游戏厂商</label>
          <input value={form.publisher} onChange={e => set('publisher', e.target.value)} placeholder="例如：FromSoftware" />
        </div>

        <div className="field">
          <label><span>🖼️</span> 图片地址</label>
          <input value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://... 或 /xxx.png" />
        </div>

        <div className="field">
          <label><span>📖</span> 游戏介绍</label>
          <textarea value={form.intro} onChange={e => set('intro', e.target.value)} placeholder="写一段简短介绍（可选）" />
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

export default function Wiki() {
  const [expanded, setExpanded] = useState(() => new Set(['RPG']))
  const [genres, setGenres] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_GENRES
    const saved = loadWiki()
    if (!saved) return DEFAULT_GENRES
    const next = saved.map(normGenre).filter(Boolean)
    return next.length ? next : DEFAULT_GENRES
  })
  const [modal, setModal] = useState(null)

  const toggle = (code) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const genresByCode = useMemo(() => new Map(genres.map(g => [g.code, g])), [genres])

  const updateGenres = (updater) => {
    setGenres(prev => {
      const next = updater(prev)
      saveWiki(next)
      return next
    })
  }

  const openAddGenre = () => setModal({ type: 'genre', mode: 'add' })
  const openEditGenre = (code) => setModal({ type: 'genre', mode: 'edit', code })
  const openAddGame = (code) => setModal({ type: 'game', mode: 'add', code, gameId: genId(code) })
  const openEditGame = (code, gameId) => setModal({ type: 'game', mode: 'edit', code, gameId })

  const removeGame = (code, gameId) => {
    if (!confirm('确定要删除这条游戏百科信息吗？')) return
    updateGenres(prev => prev.map(g => (
      g.code !== code ? g : { ...g, games: (g.games || []).filter(x => x.id !== gameId) }
    )))
  }

  const removeGenre = (code) => {
    if (!confirm('确定要删除这个类型及其所有游戏百科信息吗？')) return
    updateGenres(prev => prev.filter(g => g.code !== code))
    setExpanded(prev => {
      const next = new Set(prev)
      next.delete(code)
      return next
    })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div className="page-title">
            <span style={{ fontSize: 32, marginRight: 10 }}>📚</span>
            游戏百科
          </div>
          <div className="page-subtitle">支持维护类型与代表游戏：介绍、厂商、图片，点击卡片展开详情</div>
        </div>
        <button className="btn btn-primary" onClick={openAddGenre} style={{ padding: '12px 22px', fontSize: 14 }}>
          <span style={{ marginRight: 6 }}>➕</span> 新增类型
        </button>
      </div>

      <div className="wiki-genre-grid">
        {genres.map(g => {
          const open = expanded.has(g.code)
          const theme = getTheme(g.theme)
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
                  {g.icon}
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
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>({(g.games || []).length})</span>
                      </div>
                      <button className="btn btn-primary" onClick={() => openAddGame(g.code)} style={{ padding: '8px 14px', fontSize: 13 }}>
                        <span style={{ marginRight: 6 }}>➕</span> 新增游戏
                      </button>
                    </div>

                    {(g.games || []).length === 0 ? (
                      <div className="empty-state" style={{ padding: '26px 0' }}>
                        <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
                        还没有游戏条目，点击右侧新增
                      </div>
                    ) : (
                      <div className="wiki-game-grid">
                        {(g.games || []).map(game => (
                          <div key={game.id} className="wiki-game-card">
                            {game.imageUrl ? (
                              <img className="wiki-game-img" src={game.imageUrl} alt={game.name} loading="lazy" />
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
                                  <button className="btn btn-sm btn-danger" onClick={() => removeGame(g.code, game.id)}>🗑️</button>
                                </div>
                              </div>
                              <div className="wiki-game-intro">{game.intro || '暂无介绍'}</div>
                            </div>
                          </div>
                        ))}
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

      {modal?.type === 'genre' && (
        <GenreModal
          mode={modal.mode}
          initial={modal.mode === 'edit' ? genresByCode.get(modal.code) : null}
          onClose={() => setModal(null)}
          onSave={(genre) => {
            const normalized = normGenre({ ...genre, games: genre.games || [] }) || null
            if (!normalized) return
            if (modal.mode === 'add') {
              if (genresByCode.has(normalized.code)) {
                alert('类型代码已存在，请更换')
                return
              }
              updateGenres(prev => [...prev, normalized])
              setExpanded(prev => new Set(prev).add(normalized.code))
            } else {
              updateGenres(prev => prev.map(g => (g.code === normalized.code ? { ...g, ...normalized } : g)))
            }
            setModal(null)
          }}
        />
      )}

      {modal?.type === 'game' && (
        <GameModal
          mode={modal.mode}
          initial={(() => {
            const genre = genresByCode.get(modal.code)
            if (!genre) return null
            if (modal.mode === 'edit') return (genre.games || []).find(x => x.id === modal.gameId) || null
            return { id: modal.gameId }
          })()}
          onClose={() => setModal(null)}
          onSave={(game) => {
            const code = modal.code
            if (!code) return
            updateGenres(prev => prev.map(g => {
              if (g.code !== code) return g
              const games = g.games || []
              if (modal.mode === 'add') return { ...g, games: [...games, game] }
              return { ...g, games: games.map(x => (x.id === game.id ? game : x)) }
            }))
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
