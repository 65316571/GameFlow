import { useEffect, useRef, useState } from 'react'
import { getGames, getPlatforms, startSession, stopSession, getActiveSession } from '../api'
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

  const elapsed = useTimer(active)

  useEffect(() => {
    getPlatforms().then(r => setPlatforms(r.data))
    getGames().then(r => setAllGames(r.data))
    getActiveSession().then(r => {
      if (r.data) setActive(r.data)
    }).catch(() => {})
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
    setSelGame(null)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">开始游玩</div>
        <div className="page-subtitle">选择游戏，开始计时，结束后自动保存记录</div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ padding: '2rem' }}>
          {active ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 20,
                background: '#e1f5ee', color: '#0f6e56', fontSize: 13, fontWeight: 500,
                marginBottom: 24
              }}>
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: '#0f6e56', animation: 'pulse 1.5s infinite' 
                }}></span>
                正在游玩
              </div>
              
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {active.game_name}
              </div>
              <div style={{ marginBottom: 32 }}>
                <span className="badge badge-platform">{active.platform_code}</span>
                <span className={`badge badge-${active.genre_code}`} style={{ marginLeft: 6 }}>
                  {active.genre_code}
                </span>
              </div>
              
              <div style={{ 
                fontSize: 64, fontWeight: 700, color: '#2c2c2a', 
                letterSpacing: 4, fontVariantNumeric: 'tabular-nums', 
                margin: '2rem 0', fontFamily: 'monospace'
              }}>
                {fmtElapsed(elapsed)}
              </div>
              
              <div style={{ fontSize: 13, color: '#888780', marginBottom: 24 }}>
                开始时间：{dayjs(active.start_time).format('HH:mm:ss')}
              </div>
              
              <button 
                className="btn" 
                style={{ 
                  background: '#e24b4a', color: '#fff', borderColor: '#e24b4a', 
                  width: '100%', maxWidth: 280, padding: '14px', fontSize: 15,
                  borderRadius: 8
                }}
                onClick={handleStop}
              >
                停止计时
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, color: '#888780', marginBottom: 10, fontWeight: 500 }}>
                  ① 选择平台
                </div>
                <div className="chip-group" style={{ gap: 10 }}>
                  {platforms.map(p => (
                    <button 
                      key={p.id} 
                      className={`chip ${selPlatform === p.code ? 'active' : ''}`}
                      onClick={() => { setSelPlatform(p.code); setSelGame(null) }}
                      style={{ fontSize: 14, padding: '8px 16px' }}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              {selPlatform && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, color: '#888780', marginBottom: 10, fontWeight: 500 }}>
                    ② 选择游戏（{selPlatform}）
                  </div>
                  {filteredGames.length === 0 ? (
                    <div style={{ 
                      padding: '2rem', textAlign: 'center',
                      background: '#fafaf9', borderRadius: 8, color: '#b4b2a9' 
                    }}>
                      该平台暂无游戏，请先前往游戏库添加
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 10 
                    }}>
                      {filteredGames.map(g => {
                        const colors = GENRE_AVATAR_COLORS[g.genre_code] || GENRE_AVATAR_COLORS.OTHER
                        const isSelected = selGame?.id === g.id
                        return (
                          <div 
                            key={g.id}
                            onClick={() => setSelGame(g)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, 
                              padding: '10px 12px',
                              borderRadius: 8, 
                              border: `1.5px solid ${isSelected ? '#afa9ec' : '#e8e6df'}`,
                              background: isSelected ? '#eeedfe' : '#fff',
                              cursor: 'pointer', fontSize: 13,
                              color: isSelected ? '#534ab7' : '#2c2c2a',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div 
                              className="game-avatar" 
                              style={{ ...colors, width: 32, height: 32, fontSize: 12 }}
                            >
                              {gameInitial(g.name)}
                            </div>
                            <span style={{ 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              fontWeight: isSelected ? 500 : 400
                            }}>
                              {g.name}
                            </span>
                            {isSelected && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ 
                  width: '100%', padding: '14px', fontSize: 15, 
                  marginTop: 8, borderRadius: 8,
                  opacity: selGame ? 1 : 0.5,
                  cursor: selGame ? 'pointer' : 'not-allowed'
                }}
                onClick={handleStart}
                disabled={!selGame}
              >
                {selGame ? `开始游玩「${selGame.name}」` : '请先选择游戏'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
