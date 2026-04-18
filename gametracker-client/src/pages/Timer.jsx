import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../contexts/useSettings'
import { getGames, getPlatforms, startSession, stopSession, cancelSession, pauseSession, resumeSession, getActiveSession } from '../api'
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
    clearInterval(ref.current)
    if (active) {
      const accumulated = parseInt(active.accumulated_seconds || 0)
      if (active.paused) {
        setTimeout(() => setElapsed(accumulated), 0)
      } else {
        const startTs = active.start_time ? dayjs(active.start_time).valueOf() : Date.now()
        const tick = () => setElapsed(accumulated + Math.floor((Date.now() - startTs) / 1000))
        setTimeout(tick, 0)
        ref.current = setInterval(tick, 1000)
      }
    } else {
      clearInterval(ref.current)
      setTimeout(() => setElapsed(0), 0)
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
  const navigate = useNavigate()
  const [platforms, setPlatforms] = useState([])
  const [allGames, setAllGames] = useState([])
  const [selPlatform, setSelPlatform] = useState('')
  const [selGame, setSelGame] = useState(null)
  const [active, setActive] = useState(null)
  const [showImmersiveBlock, setShowImmersiveBlock] = useState(false)
  const [blockedGameName, setBlockedGameName] = useState('')
  const [showEndModal, setShowEndModal] = useState(false)
  const [endBusy, setEndBusy] = useState(false)

  const elapsed = useTimer(active)

  const selectImmersiveGame = useCallback((games) => {
    if (settings.immersiveMode && settings.immersiveGameId) {
      const game = (games || allGames).find(g => g.id === settings.immersiveGameId)
      if (game) {
        setSelPlatform(game.platform_code)
        setSelGame(game)
      }
    }
  }, [settings.immersiveMode, settings.immersiveGameId, allGames])

  useEffect(() => {
    getPlatforms().then(r => setPlatforms(r.data))
    getGames().then(r => {
      setAllGames(r.data)
      selectImmersiveGame(r.data)
    })
    getActiveSession().then(r => {
      if (r.data) setActive(r.data)
    }).catch(() => {})
  }, [settings.immersiveMode, settings.immersiveGameId, selectImmersiveGame])

  useEffect(() => {
    if (!active?.paused || !active?.paused_at) return

    const pausedAtMs = dayjs(active.paused_at).valueOf()
    const remainingMs = 15 * 60 * 1000 - (Date.now() - pausedAtMs)
    if (remainingMs <= 0) {
      stopSession(active.id).then(() => {
        setActive(null)
        setSelGame(null)
        selectImmersiveGame()
      }).catch(() => {})
      return
    }

    const t = setTimeout(() => {
      stopSession(active.id).then(() => {
        setActive(null)
        setSelGame(null)
        selectImmersiveGame()
      }).catch(() => {})
    }, remainingMs + 200)

    return () => clearTimeout(t)
  }, [active?.id, active?.paused, active?.paused_at, selectImmersiveGame])

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

  const handlePauseToggle = async () => {
    if (!active) return
    const res = active.paused ? await resumeSession(active.id) : await pauseSession(active.id)
    setActive(res.data)
  }

  const handleEndSave = async () => {
    if (!active) return
    setEndBusy(true)
    try {
      await stopSession(active.id)
      setActive(null)
      setSelGame(null)
      selectImmersiveGame()
      setShowEndModal(false)
      navigate('/stats')
    } finally {
      setEndBusy(false)
    }
  }

  const handleEndDiscard = async () => {
    if (!active) return
    setEndBusy(true)
    try {
      await cancelSession(active.id)
      setActive(null)
      setSelGame(null)
      selectImmersiveGame()
      setShowEndModal(false)
    } finally {
      setEndBusy(false)
    }
  }

  // 沉浸模式下禁用平台切换
  const isPlatformDisabled = settings.immersiveMode && !active

  return (
    <div className="timer-page">
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
          游玩
        </div>
        <div className="page-subtitle">
          {settings.immersiveMode 
            ? `🧘 沉浸模式：专注体验一款游戏` 
            : '选择游戏，开始计时，结束后自动保存记录'}
        </div>
      </div>

      <div className="timer-body">
        <div className="timer-card-center timer-card-wrap">
          <div className="card timer-card-root" style={{ padding: '2.5rem' }}>
            {active ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              {/* 状态指示器 */}
              <div className="timer-status-badge" style={{ marginBottom: 32 }}>
                <PulseCircle />
                <span>{active.paused ? '已暂停：' : '正在游玩：'}{active.game_name}</span>
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
                开始时间：{dayjs(active.session_start_time || active.start_time).format('HH:mm:ss')}
              </div>
              
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    width: '100%', maxWidth: 240, padding: '18px', fontSize: 16,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: 'var(--shadow-md)',
                  }}
                  onClick={handlePauseToggle}
                >
                  <span style={{ fontSize: 20 }}>{active.paused ? '▶️' : '⏸️'}</span>
                  {active.paused ? '继续计时' : '暂停计时'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  style={{ 
                    width: '100%', maxWidth: 240, padding: '18px', fontSize: 16,
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                  onClick={() => setShowEndModal(true)}
                >
                  <span style={{ fontSize: 20 }}>⏹️</span>
                  结束计时
                </button>
              </div>
              </div>
            ) : (
              <div className="timer-select-flow">
                {/* 步骤 1 */}
                <div className="timer-step-compact" style={{ marginBottom: 20, opacity: isPlatformDisabled ? 0.5 : 1 }}>
                  <div className="step-item" style={{ marginBottom: 10 }}>
                    <span className="step-number">1</span>
                    选择平台
                    {isPlatformDisabled && <span style={{ color: 'var(--status-moba-text)', fontSize: 13 }}>(沉浸模式已限定)</span>}
                  </div>
                  <div className="chip-group" style={{ gap: 8 }}>
                    {platforms.map(p => (
                      <button 
                        key={p.id} 
                        className={`chip ${selPlatform === p.code ? 'active' : ''}`}
                        onClick={() => { 
                          if (!isPlatformDisabled) {
                            setSelPlatform(p.code)
                            setSelGame(null)
                          }
                        }}
                        disabled={isPlatformDisabled}
                        style={{ 
                          fontSize: 14, padding: '10px 16px',
                          display: 'flex', alignItems: 'center', gap: 6,
                          cursor: isPlatformDisabled ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <span style={{ fontSize: 16 }}>
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
                  <div className="timer-step2" style={{ marginBottom: 20 }}>
                    <div className="step-item" style={{ marginBottom: 10 }}>
                      <span className="step-number">2</span>
                      选择游戏（{selPlatform}）
                      {settings.immersiveMode && <span style={{ color: 'var(--status-moba-text)', fontSize: 13 }}>(已自动选择限定游戏)</span>}
                    </div>
                    {filteredGames.length === 0 ? (
                      <div className="empty-state" style={{ 
                        padding: '2rem',
                        background: 'var(--bg-tertiary)', borderRadius: 14,
                        border: '1px dashed var(--border-color)'
                      }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                        该平台暂无游戏，请先前往游戏库添加
                      </div>
                    ) : (
                      <div className="timer-game-scroll">
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: 10 
                        }}>
                        {filteredGames.map(g => {
                          const colors = GENRE_AVATAR_COLORS[g.genre_code] || GENRE_AVATAR_COLORS.OTHER
                          const isImmersiveGame = settings.immersiveMode && settings.immersiveGameId === g.id
                          const isSelected = selGame?.id === g.id
                          if (settings.immersiveMode && !isImmersiveGame) return null
                          
                          return (
                            <div 
                              key={g.id}
                              className={`selection-card ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelGame(g)}
                              style={{ padding: '10px 12px' }}
                            >
                              <div 
                                className="game-avatar" 
                                style={{ background: colors.bg, color: colors.color, width: 36, height: 36, fontSize: 12 }}
                              >
                                {gameInitial(g.name)}
                              </div>
                              <span style={{ 
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                fontWeight: isSelected ? 600 : 500,
                                flex: 1, fontSize: 14
                              }}>
                                {g.name}
                              </span>
                              {isSelected && (
                                <span style={{ fontSize: 16, marginLeft: 'auto' }}>✓</span>
                              )}
                            </div>
                          )
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 开始按钮 - 固定底部 */}
                <div className="timer-start-bar">
                  <button
                    className="btn btn-primary"
                    style={{ 
                      width: '100%',
                      padding: selGame ? '16px' : '12px 16px',
                      fontSize: selGame ? 15 : 14,
                      borderRadius: 14,
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
                        <span style={{ fontSize: 20 }}>▶️</span>
                        游玩「{selGame.name}」
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 16 }}>👆</span>
                        请先选择游戏
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEndModal && (
        <div className="modal-overlay" onClick={() => !endBusy && setShowEndModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">结束计时</div>
            <div style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              是否保存本次游玩记录？
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleEndDiscard} disabled={endBusy}>
                不保存
              </button>
              <button className="btn btn-primary" onClick={handleEndSave} disabled={endBusy}>
                保存
              </button>
              <button className="btn btn-ghost" onClick={() => setShowEndModal(false)} disabled={endBusy}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
