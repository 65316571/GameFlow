import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { getGames, getPlatforms, startSession, stopSession, getActiveSession } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'
import dayjs from 'dayjs'

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

function PulseCircle() {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#0f6e56', animation: 'pulse-ring 1.5s ease-out infinite'
      }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#0f6e56'
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

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.5rem' }}>
          {active ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              {/* 状态指示器 */}
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', borderRadius: 24,
                background: '#e1f5ee', color: '#0f6e56', fontSize: 15, fontWeight: 600,
                marginBottom: 32
              }}>
                <PulseCircle />
                <span>正在游玩</span>
                <span style={{ fontSize: 20 }}>🎮</span>
              </div>
              
              {/* 游戏信息 */}
              <div style={{
                background: 'linear-gradient(135deg, #eeedfe 0%, #f8f8fc 100%)',
                borderRadius: 20,
                padding: '2rem',
                marginBottom: 36,
                border: '0.5px solid #afa9ec',
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
                  {active.game_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <span className="badge badge-platform" style={{ fontSize: 14, padding: '6px 14px' }}>
                    {PLATFORM_ICONS[active.platform_code] || '🎮'} {active.platform_code}
                  </span>
                  <span className={`badge badge-${active.genre_code}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                    {GENRE_ICONS[active.genre_code] || '🎯'} {active.genre_code}
                  </span>
                </div>
              </div>
              
              {/* 计时器 */}
              <div style={{ 
                fontSize: 88, fontWeight: 700, color: '#2c2c2a', 
                letterSpacing: 6, fontVariantNumeric: 'tabular-nums', 
                margin: '2.5rem 0', fontFamily: 'monospace',
                textShadow: '0 2px 12px rgba(127,119,221,0.15)',
                animation: 'timer-pulse 1s ease-in-out infinite'
              }}>
                {fmtElapsed(elapsed)}
              </div>
              
              {/* 开始时间 */}
              <div style={{ 
                fontSize: 16, color: '#888780', marginBottom: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                <span style={{ fontSize: 18 }}>🕐</span>
                开始时间：{dayjs(active.start_time).format('HH:mm:ss')}
              </div>
              
              {/* 停止按钮 */}
              <button 
                className="btn" 
                style={{ 
                  background: '#e24b4a', color: '#fff', borderColor: '#e24b4a', 
                  width: '100%', maxWidth: 320, padding: '18px', fontSize: 17,
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 16px rgba(226,75,74,0.35)',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleStop}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(226,75,74,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(226,75,74,0.35)'
                }}
              >
                <span style={{ fontSize: 22 }}>⏹️</span>
                停止计时
              </button>
            </div>
          ) : (
            <>
              {/* 步骤 1 */}
              <div style={{ marginBottom: 32, opacity: isPlatformDisabled ? 0.5 : 1 }}>
                <div style={{ 
                  fontSize: 15, color: '#666', marginBottom: 16, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span style={{ 
                    width: 28, height: 28, borderRadius: '50%', background: '#eeedfe',
                    color: '#534ab7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700
                  }}>1</span>
                  选择平台
                  {isPlatformDisabled && <span style={{ color: '#0f6e56', fontSize: 13 }}>(沉浸模式已限定)</span>}
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
                        transform: selPlatform === p.code ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.15s ease',
                        cursor: isPlatformDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{PLATFORM_ICONS[p.code] || '🎮'}</span>
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* 步骤 2 */}
              {selPlatform && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ 
                    fontSize: 15, color: '#666', marginBottom: 16, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ 
                      width: 28, height: 28, borderRadius: '50%', background: '#eeedfe',
                      color: '#534ab7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700
                    }}>2</span>
                    选择游戏（{selPlatform}）
                    {settings.immersiveMode && <span style={{ color: '#0f6e56', fontSize: 13 }}>(已自动选择限定游戏)</span>}
                  </div>
                  {filteredGames.length === 0 ? (
                    <div style={{ 
                      padding: '3rem', textAlign: 'center',
                      background: '#fafaf9', borderRadius: 14, color: '#b4b2a9',
                      border: '0.5px dashed #d3d1c7'
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
                            onClick={() => setSelGame(g)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, 
                              padding: '14px 16px',
                              borderRadius: 12, 
                              border: `2px solid ${isSelected ? '#afa9ec' : '#e8e6df'}`,
                              background: isSelected ? '#eeedfe' : '#fff',
                              cursor: 'pointer', fontSize: 15,
                              color: isSelected ? '#534ab7' : '#2c2c2a',
                              transition: 'all 0.15s ease',
                              transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                              boxShadow: isSelected ? '0 4px 12px rgba(127,119,221,0.15)' : 'none'
                            }}
                          >
                            <div 
                              className="game-avatar" 
                              style={{ ...colors, width: 44, height: 44, fontSize: 14 }}
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
                  boxShadow: selGame ? '0 4px 16px rgba(83,74,183,0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleStart}
                disabled={!selGame}
                onMouseEnter={(e) => {
                  if (selGame) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(83,74,183,0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = selGame ? '0 4px 16px rgba(83,74,183,0.35)' : 'none'
                }}
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
          <div style={{
            marginTop: 20,
            padding: '18px 22px',
            background: settings.immersiveMode ? '#e1f5ee' : '#fff',
            borderRadius: 14,
            border: `0.5px solid ${settings.immersiveMode ? '#0f6e56' : '#e8e6df'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            color: settings.immersiveMode ? '#0f6e56' : '#888780'
          }}>
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
