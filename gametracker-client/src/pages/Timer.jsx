import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../contexts/useSettings'
import { getGames, getPlatforms, startSession, stopSession, getActiveSession } from '../api'
import { gameInitial, GENRE_AVATAR_COLORS, PLATFORM_ICONS } from '../utils'
import dayjs from 'dayjs'

const GENRE_ICONS = {
  'RPG': '⚔️',
  'FPS': '🔫',
  'MOBA': '⚡',
  'SIM': '🏗️',
  'ADV': '🗺️',
  'OTHER': '🎯',
}

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

function PulseCircle() {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'var(--status-moba-text)', animation: 'pulse-ring 1.5s ease-out infinite'
      }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'var(--status-moba-text)'
      }} />
    </span>
  )
}

// 沉浸模式阻止遮罩
function ImmersiveBlockOverlay({ gameName, onExit }) {
  return (
    <div className="immersive-block-overlay" onClick={onExit}>
      <div className="immersive-block-content" onClick={e => e.stopPropagation()}>
        <div className="immersive-block-icon">🧘</div>
        <div className="immersive-block-title">沉浸模式已开启</div>
        <div className="immersive-block-text">
          你正处于沉浸模式，只能游玩限定游戏
        </div>
        <div className="immersive-block-game">🎮 {gameName}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={onExit}>
            退出沉浸模式
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Timer() {
  const { settings, disableImmersiveMode } = useSettings()
  const [platforms, setPlatforms] = useState([])
  const [allGames, setAllGames] = useState([])
  const [selPlatform, setSelPlatform] = useState('')
  const [selGame, setSelGame] = useState(null)
  const [active, setActive] = useState(null)
  const [showImmersiveBlock, setShowImmersiveBlock] = useState(false)
  const [blockedGameName, setBlockedGameName] = useState('')

  const elapsed = useTimer(active)

  useEffect(() => {
    getPlatforms().then(r => setPlatforms(r.data))
    getGames().then(r => {
      setAllGames(r.data)
      // 如果在沉浸模式下，自动选中限定游戏
      if (settings.immersiveMode && settings.immersiveGameId) {
        const game = r.data.find(g => g.id === settings.immersiveGameId)
        if (game) {
          setSelPlatform(game.platform_code)
          setSelGame(game)
        }
      }
    })
    getActiveSession().then(r => {
      if (r.data) setActive(r.data)
    }).catch(() => {})
  }, [settings.immersiveMode, settings.immersiveGameId])

  const filteredGames = selPlatform
    ? allGames.filter(g => g.platform_code === selPlatform)
    : []

  const handleStart = async () => {
    if (!selGame) return

    // 检查沉浸模式
    if (settings.immersiveMode && settings.immersiveGameId !== selGame.id) {
      const immersiveGame = allGames.find(g => g.id === settings.immersiveGameId)
      setBlockedGameName(immersiveGame?.name || '限定游戏')
      setShowImmersiveBlock(true)
      return
    }

    const res = await startSession(selGame.id)
    setActive(res.data)
  }

  const handleStop = async () => {
    if (!active) return
    await stopSession(active.id)
    setActive(null)
    setSelGame(null)
    // 如果在沉浸模式下，重新选中限定游戏
    if (settings.immersiveMode && settings.immersiveGameId) {
      const game = allGames.find(g => g.id === settings.immersiveGameId)
      if (game) {
        setSelPlatform(game.platform_code)
        setSelGame(game)
      }
    }
  }

  // 沉浸模式下禁用平台切换
  const isPlatformDisabled = settings.immersiveMode && !active

  return (
    <div>
      {/* 沉浸模式阻止遮罩 */}
      {showImmersiveBlock && (
        <ImmersiveBlockOverlay 
          gameName={blockedGameName}
          onExit={() => {
            setShowImmersiveBlock(false)
            disableImmersiveMode()
          }}
        />
      )}

      <div className="page-header">
        <div className="page-title">
          <span style={{ fontSize: 32, marginRight: 10 }}>⏱️</span>
          开始游玩
        </div>
        <div className="page-subtitle">
          {settings.immersiveMode 
            ? `🧘 沉浸模式：专注体验一款游戏` 
            : '选择游戏，开始计时，结束后自动保存记录'}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          {active ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              {/* 状态指示器 */}
              <div className="timer-status-badge" style={{ marginBottom: 32 }}>
                <PulseCircle />
                <span>正在游玩</span>
                <span style={{ fontSize: 20 }}>🎮</span>
              </div>
              
              {/* 游戏信息 */}
              <div className="timer-game-card" style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
                  {active.game_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <span className="badge badge-platform" style={{ fontSize: 14, padding: '6px 14px' }}>
                    {PLATFORM_ICONS[active.platform_code] ? (
                      <span 
                        className="platform-icon" 
                        data-platform={active.platform_code}
                        style={{ 
                          maskImage: `url(${PLATFORM_ICONS[active.platform_code]})`,
                          WebkitMaskImage: `url(${PLATFORM_ICONS[active.platform_code]})`
                        }}
                      />
                    ) : '🎮'}
                    {active.platform_code}
                  </span>
                  <span className={`badge badge-${active.genre_code}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                    {GENRE_ICONS[active.genre_code] || '🎯'} {active.genre_code}
                  </span>
                </div>
              </div>
              
              {/* 计时器 */}
              <div className="timer-display" style={{ margin: '2.5rem 0' }}>
                {fmtElapsed(elapsed)}
              </div>
              
              {/* 开始时间 */}
              <div style={{ 
                fontSize: 16, color: 'var(--text-tertiary)', marginBottom: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                <span style={{ fontSize: 18 }}>🕐</span>
                开始时间：{dayjs(active.start_time).format('HH:mm:ss')}
              </div>
              
              {/* 停止按钮 */}
              <button 
                className="btn btn-danger" 
                style={{ 
                  width: '100%', maxWidth: 320, padding: '18px', fontSize: 17,
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: 'var(--shadow-md)',
                }}
                onClick={handleStop}
              >
                <span style={{ fontSize: 22 }}>⏹️</span>
                停止计时
              </button>
            </div>
          ) : (
            <>
              {/* 步骤 1 */}
              <div style={{ marginBottom: 32, opacity: isPlatformDisabled ? 0.5 : 1 }}>
                <div className="step-item">
                  <span className="step-number">1</span>
                  选择平台
                  {isPlatformDisabled && <span style={{ color: 'var(--status-moba-text)', fontSize: 13 }}>(沉浸模式已限定)</span>}
                </div>
                <div className="chip-group" style={{ gap: 12 }}>
                  {platforms.map(p => (
                    <button 
                      key={p.id} 
                      className={`chip ${selPlatform === p.code ? 'active' : ''}`}
                      onClick={() => { 
                        if (!isPlatformDisabled) {
                          setSelPlatform(p.code); setSelGame(null) 
                        }
                      }}
                      disabled={isPlatformDisabled}
                      style={{ 
                        fontSize: 15, padding: '12px 22px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        cursor: isPlatformDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 18 }}>
                        {PLATFORM_ICONS[p.code] ? (
                          <span 
                            className="platform-icon lg" 
                            data-platform={p.code}
                            style={{ 
                              maskImage: `url(${PLATFORM_ICONS[p.code]})`,
                              WebkitMaskImage: `url(${PLATFORM_ICONS[p.code]})`
                            }}
                          />
                        ) : '🎮'}
                      </span>
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* 步骤 2 */}
              {selPlatform && (
                <div style={{ marginBottom: 32 }}>
                  <div className="step-item">
                    <span className="step-number">2</span>
                    选择游戏（{selPlatform}）
                    {settings.immersiveMode && <span style={{ color: 'var(--status-moba-text)', fontSize: 13 }}>(已自动选择限定游戏)</span>}
                  </div>
                  {filteredGames.length === 0 ? (
                    <div className="empty-state" style={{ 
                      padding: '3rem',
                      background: 'var(--bg-tertiary)', borderRadius: 14,
                      border: '1px dashed var(--border-color)'
                    }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                      该平台暂无游戏，请先前往游戏库添加
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 12 
                    }}>
                      {filteredGames.map(g => {
                        const colors = GENRE_AVATAR_COLORS[g.genre_code] || GENRE_AVATAR_COLORS.OTHER
                        const isImmersiveGame = settings.immersiveMode && settings.immersiveGameId === g.id
                        const isSelected = selGame?.id === g.id
                        // 沉浸模式下只显示限定游戏
                        if (settings.immersiveMode && !isImmersiveGame) return null
                        
                        return (
                          <div 
                            key={g.id}
                            className={`selection-card ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelGame(g)}
                          >
                            <div 
                              className="game-avatar" 
                              style={{ background: colors.bg, color: colors.color, width: 44, height: 44, fontSize: 14 }}
                            >
                              {gameInitial(g.name)}
                            </div>
                            <span style={{ 
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              fontWeight: isSelected ? 600 : 500,
                              flex: 1
                            }}>
                              {g.name}
                            </span>
                            {isSelected && (
                              <span style={{ fontSize: 18, marginLeft: 'auto' }}>✓</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 开始按钮 */}
              <button
                className="btn btn-primary"
                style={{ 
                  width: '100%', padding: '18px', fontSize: 16, 
                  marginTop: 12, borderRadius: 14,
                  opacity: selGame ? 1 : 0.5,
                  cursor: selGame ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: selGame ? 'var(--shadow-md)' : 'none',
                }}
                onClick={handleStart}
                disabled={!selGame}
              >
                {selGame ? (
                  <>
                    <span style={{ fontSize: 22 }}>▶️</span>
                    开始游玩「{selGame.name}」
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>👆</span>
                    请先选择游戏
                  </>
                )}
              </button>
            </>
          )}
        </div>
        
        {/* 提示 */}
        {!active && (
          <div className={`timer-info-box ${settings.immersiveMode ? 'immersive' : ''}`} style={{ marginTop: 20 }}>
            <span style={{ fontSize: 20 }}>{settings.immersiveMode ? '🧘' : '💡'}</span>
            <span>
              {settings.immersiveMode 
                ? '沉浸模式已开启，你只能游玩限定的游戏。如需切换游戏，请先退出沉浸模式。'
                : '提示：同时只能有一个游戏在计时，请先停止当前计时再开始新的游戏'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
