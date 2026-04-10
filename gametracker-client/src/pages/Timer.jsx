import { useEffect, useRef, useState } from 'react'
import { getGames, getPlatforms, startSession, stopSession, getActiveSession, addManualSession, getRecentSessions } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'
import dayjs from 'dayjs'

function useTimer(active) {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (active) {
      const startTs = active.start_time ? dayjs(active.start_time).valueOf() : Date.now()
      const tick = () => setElapsed(Math.floor((Date.now() - startTs) / 1000))
      tick()
      ref.current = setInterval(tick, 1000)
    } else {
      clearInterval(ref.current)
      setElapsed(0)
    }
    return () => clearInterval(ref.current)
  }, [active])

  return elapsed
}

function fmtElapsed(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Timer() {
  const [platforms, setPlatforms] = useState([])
  const [allGames, setAllGames] = useState([])
  const [selPlatform, setSelPlatform] = useState('')
  const [selGame, setSelGame] = useState(null)
  const [active, setActive] = useState(null)
  const [recent, setRecent] = useState([])
  const [tab, setTab] = useState('timerange')

  const [manualForm, setManualForm] = useState({
    game_id: '', start_time: '', end_time: '',
    date: dayjs().format('YYYY-MM-DD'), hours: '', minutes: '',
  })

  const elapsed = useTimer(active)

  const loadRecent = () => getRecentSessions().then(r => setRecent(r.data))

  useEffect(() => {
    getPlatforms().then(r => setPlatforms(r.data))
    getGames().then(r => setAllGames(r.data))
    getActiveSession().then(r => {
      if (r.data) setActive(r.data)
    }).catch(() => {})
    loadRecent()
  }, [])

  const filteredGames = selPlatform
    ? allGames.filter(g => g.platform_code === selPlatform)
    : []

  const handleStart = async () => {
    if (!selGame) return
    const res = await startSession(selGame.id)
    setActive(res.data)
  }

  const handleStop = async () => {
    if (!active) return
    await stopSession(active.id)
    setActive(null)
    loadRecent()
  }

  const setM = (k, v) => setManualForm(f => ({ ...f, [k]: v }))

  const handleManual = async () => {
    const payload = { game_id: manualForm.game_id, source: tab }
    if (tab === 'timerange') {
      if (!manualForm.start_time || !manualForm.end_time) return
      payload.start_time = manualForm.start_time
      payload.end_time = manualForm.end_time
    } else {
      const totalSec = (parseInt(manualForm.hours || 0) * 3600) + (parseInt(manualForm.minutes || 0) * 60)
      if (!totalSec) return
      payload.date = manualForm.date
      payload.duration_seconds = totalSec
    }
    await addManualSession(payload)
    loadRecent()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">游玩计时</div>
        <div className="page-subtitle">开始游戏，结束后自动记录时长</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 左：计时器 */}
        <div className="card">
          <div className="section-label">开始计时</div>

          {active ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: 11, color: '#888780', marginBottom: 8 }}>正在游玩</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{active.game_name}</div>
              <div style={{ marginBottom: 4 }}><span className="badge badge-platform">{active.platform_code}</span></div>
              <div style={{ fontSize: 48, fontWeight: 600, color: '#2c2c2a', letterSpacing: 2, fontVariantNumeric: 'tabular-nums', margin: '1rem 0' }}>
                {fmtElapsed(elapsed)}
              </div>
              <button className="btn" style={{ background: '#e24b4a', color: '#fff', borderColor: '#e24b4a', width: '100%', padding: '10px', fontSize: 14 }}
                onClick={handleStop}>
                停止游戏
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 6 }}>① 选择平台</div>
                <div className="chip-group">
                  {platforms.map(p => (
                    <button key={p.id} className={`chip ${selPlatform === p.code ? 'active' : ''}`}
                      onClick={() => { setSelPlatform(p.code); setSelGame(null) }}>
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              {selPlatform && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#888780', marginBottom: 6 }}>② 选择游戏（{selPlatform}）</div>
                  {filteredGames.length === 0
                    ? <div style={{ fontSize: 13, color: '#b4b2a9' }}>该平台暂无游戏</div>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredGames.map(g => {
                          const colors = GENRE_AVATAR_COLORS[g.genre_code] || GENRE_AVATAR_COLORS.OTHER
                          return (
                            <div key={g.id}
                              onClick={() => setSelGame(g)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                                borderRadius: 8, border: `0.5px solid ${selGame?.id === g.id ? '#afa9ec' : '#e8e6df'}`,
                                background: selGame?.id === g.id ? '#eeedfe' : '#fff',
                                cursor: 'pointer', fontSize: 13,
                                color: selGame?.id === g.id ? '#534ab7' : '#2c2c2a',
                              }}>
                              <div className="game-avatar" style={{ ...colors, width: 28, height: 28, fontSize: 11 }}>
                                {gameInitial(g.name)}
                              </div>
                              {g.name}
                            </div>
                          )
                        })}
                      </div>
                    )
                  }
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: 14, marginTop: 8, opacity: selGame ? 1 : 0.4 }}
                onClick={handleStart}
                disabled={!selGame}
              >
                开始游戏
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 补录 */}
          <div className="card">
            <div className="section-label">补录记录</div>
            <div style={{ display: 'flex', borderBottom: '0.5px solid #e8e6df', marginBottom: '1rem' }}>
              {['timerange', 'duration'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '7px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t ? '#7f77dd' : 'transparent'}`, color: tab === t ? '#534ab7' : '#888780', fontWeight: tab === t ? 500 : 400 }}>
                  {t === 'timerange' ? '填写时间段' : '直接填时长'}
                </button>
              ))}
            </div>

            <div className="field">
              <label>游戏</label>
              <select value={manualForm.game_id} onChange={e => setM('game_id', e.target.value)}>
                <option value="">请选择游戏</option>
                {allGames.map(g => <option key={g.id} value={g.id}>{g.name} ({g.platform_code})</option>)}
              </select>
            </div>

            {tab === 'timerange' ? (
              <div className="field-row">
                <div className="field">
                  <label>开始时间</label>
                  <input type="datetime-local" value={manualForm.start_time} onChange={e => setM('start_time', e.target.value)} />
                </div>
                <div className="field">
                  <label>结束时间</label>
                  <input type="datetime-local" value={manualForm.end_time} onChange={e => setM('end_time', e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>日期</label>
                  <input type="date" value={manualForm.date} onChange={e => setM('date', e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>小时</label>
                    <input type="number" min="0" max="23" placeholder="0" value={manualForm.hours} onChange={e => setM('hours', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>分钟</label>
                    <input type="number" min="0" max="59" placeholder="0" value={manualForm.minutes} onChange={e => setM('minutes', e.target.value)} />
                  </div>
                </div>
              </>
            )}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} onClick={handleManual}>
              确认补录
            </button>
          </div>

          {/* 最近记录 */}
          <div className="card">
            <div className="section-label">最近记录</div>
            {recent.length === 0
              ? <div className="empty-state">暂无记录</div>
              : recent.slice(0, 5).map(s => {
                  const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '0.5px solid #f1efe8', fontSize: 13 }}>
                      <div className="game-avatar" style={{ ...colors, width: 28, height: 28, fontSize: 11 }}>
                        {gameInitial(s.game_name)}
                      </div>
                      <div style={{ flex: 1, fontWeight: 500 }}>{s.game_name}</div>
                      <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 3, background: '#f1efe8', color: '#888780' }}>
                        {s.source === 'timer' ? '计时' : '补录'}
                      </span>
                      <span style={{ fontSize: 11, color: '#b4b2a9' }}>{dayjs(s.started_at).format('MM/DD')}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#534ab7' }}>{fmtDuration(s.duration_seconds)}</span>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}
