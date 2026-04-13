import { useSettings } from '../contexts/SettingsContext'
import { useState, useEffect } from 'react'
import { getGames } from '../api'

// 主题模式选项
const THEME_OPTIONS = [
  { key: 'light', label: '浅色模式', icon: '☀️', desc: '明亮的界面风格' },
  { key: 'dark', label: '深色模式', icon: '🌙', desc: '护眼的暗色风格' },
  { key: 'auto', label: '跟随系统', icon: '🔄', desc: '自动切换深浅色' },
]

// 手机模式选项
const MOBILE_OPTIONS = [
  { key: 'auto', label: '自动检测', icon: '🔍', desc: '根据设备和窗口自动判断' },
  { key: 'desktop', label: '桌面模式', icon: '💻', desc: '强制使用桌面布局' },
  { key: 'mobile', label: '手机模式', icon: '📱', desc: '强制使用手机布局' },
]

export default function Design() {
  const { settings, updateSettings, enableImmersiveMode, disableImmersiveMode } = useSettings()
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(settings.immersiveGameId)

  useEffect(() => {
    getGames().then(r => setGames(r.data))
  }, [])

  // 沉浸模式切换
  const handleImmersiveToggle = () => {
    if (settings.immersiveMode) {
      disableImmersiveMode()
    } else if (selectedGame) {
      enableImmersiveMode(selectedGame)
    }
  }

  // 选择沉浸游戏
  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId)
    if (settings.immersiveMode) {
      enableImmersiveMode(gameId)
    }
  }

  // 获取当前主题标签
  const currentTheme = THEME_OPTIONS.find(t => t.key === settings.themeMode)
  const currentMobile = MOBILE_OPTIONS.find(m => m.key === settings.mobileMode)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <span style={{ fontSize: 32, marginRight: 10 }}>🎨</span>
          设计
        </div>
        <div className="page-subtitle">自定义你的游戏体验</div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        
        {/* 沉浸模式 */}
        <div className="card" style={{ border: settings.immersiveMode ? '2px solid #0f6e56' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 14,
              background: settings.immersiveMode ? '#e1f5ee' : '#f1efe8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              {settings.immersiveMode ? '🧘' : '🎯'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>沉浸模式</div>
                  <div style={{ fontSize: 14, color: '#888780', marginTop: 4 }}>
                    限定只玩一款游戏，专注体验不被打扰
                  </div>
                </div>
                <button 
                  className="btn"
                  onClick={handleImmersiveToggle}
                  disabled={!settings.immersiveMode && !selectedGame}
                  style={{
                    background: settings.immersiveMode ? '#0f6e56' : '#534ab7',
                    color: '#fff',
                    borderColor: settings.immersiveMode ? '#0f6e56' : '#534ab7',
                    padding: '10px 24px',
                    fontSize: 15,
                    opacity: !settings.immersiveMode && !selectedGame ? 0.5 : 1
                  }}
                >
                  {settings.immersiveMode ? '退出沉浸' : '开启沉浸'}
                </button>
              </div>

              {settings.immersiveMode && (
                <div style={{ 
                  marginTop: 16, 
                  padding: '14px 18px', 
                  background: '#e1f5ee', 
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{ fontSize: 24 }}>🔒</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f6e56' }}>
                      沉浸模式已开启
                    </div>
                    <div style={{ fontSize: 13, color: '#0f6e56', marginTop: 2 }}>
                      当前限定游戏：{games.find(g => g.id === settings.immersiveGameId)?.name || '未选择'}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>选择限定游戏：</div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: 10,
                  maxHeight: settings.immersiveMode ? 'none' : 200,
                  overflow: settings.immersiveMode ? 'visible' : 'auto',
                  padding: 4
                }}>
                  {games.map(game => (
                    <div
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `2px solid ${selectedGame === game.id ? '#534ab7' : '#e8e6df'}`,
                        background: selectedGame === game.id ? '#eeedfe' : '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: selectedGame === game.id ? 600 : 500,
                        color: selectedGame === game.id ? '#534ab7' : '#2c2c2a',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span>🎮</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {game.name}
                      </span>
                      {selectedGame === game.id && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))}
                  {games.length === 0 && (
                    <div style={{ color: '#888780', fontSize: 14, padding: '20px 0' }}>
                      游戏库为空，请先添加游戏
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 开灯模式 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 14,
              background: '#faeeda',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              💡
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>开灯模式</div>
              <div style={{ fontSize: 14, color: '#888780', marginTop: 4, marginBottom: 16 }}>
                当前：{currentTheme?.icon} {currentTheme?.label}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {THEME_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => updateSettings({ themeMode: option.key })}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: 12,
                      border: `2px solid ${settings.themeMode === option.key ? '#534ab7' : '#e8e6df'}`,
                      background: settings.themeMode === option.key ? '#eeedfe' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</div>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: 600, 
                      color: settings.themeMode === option.key ? '#534ab7' : '#2c2c2a',
                      marginBottom: 4
                    }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#888780' }}>{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 手机模式 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 14,
              background: '#e6f1fb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              📱
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>手机模式</div>
              <div style={{ fontSize: 14, color: '#888780', marginTop: 4, marginBottom: 16 }}>
                当前：{currentMobile?.icon} {currentMobile?.label}
                {settings.mobileMode === 'auto' && (
                  <span style={{ marginLeft: 8, color: '#534ab7' }}>
                    ({settings.isMobileView ? '📱 手机视图' : '💻 桌面视图'})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {MOBILE_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    onClick={() => updateSettings({ mobileMode: option.key })}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: 12,
                      border: `2px solid ${settings.mobileMode === option.key ? '#534ab7' : '#e8e6df'}`,
                      background: settings.mobileMode === option.key ? '#eeedfe' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</div>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: 600, 
                      color: settings.mobileMode === option.key ? '#534ab7' : '#2c2c2a',
                      marginBottom: 4
                    }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#888780' }}>{option.desc}</div>
                  </button>
                ))}
              </div>

              {/* 设备信息 */}
              <div style={{ 
                marginTop: 16, 
                padding: '14px 18px', 
                background: '#fafaf9', 
                borderRadius: 10,
                fontSize: 13,
                color: '#666'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>📊 设备检测信息</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>窗口宽度: {typeof window !== 'undefined' ? window.innerWidth : '-'}px</div>
                  <div>UserAgent: {typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? '包含 Mobile' : '桌面端') : '-'}</div>
                  <div>当前视图: {settings.isMobileView ? '📱 手机' : '💻 桌面'}</div>
                  <div>触摸支持: {typeof window !== 'undefined' && 'ontouchstart' in window ? '✅ 支持' : '❌ 不支持'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 菜单悬浮开关 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 14,
              background: settings.sidebarFloat ? '#eeedfe' : '#f1efe8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              flexShrink: 0
            }}>
              {settings.sidebarFloat ? '🔘' : '⬛'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>菜单窗口悬浮</div>
              <div style={{ fontSize: 14, color: '#888780', marginTop: 4 }}>
                开启后侧边栏可以悬浮/缩放，关闭后固定显示
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {settings.sidebarFloat && (
                <button 
                  className="btn"
                  onClick={() => updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })}
                  style={{ padding: '10px 20px' }}
                >
                  {settings.sidebarCollapsed ? '🔲 展开' : '🔳 缩放'}
                </button>
              )}
              <button 
                className="btn"
                onClick={() => updateSettings({ sidebarFloat: !settings.sidebarFloat })}
                style={{
                  background: settings.sidebarFloat ? '#534ab7' : '#f1efe8',
                  color: settings.sidebarFloat ? '#fff' : '#666',
                  borderColor: settings.sidebarFloat ? '#534ab7' : '#d3d1c7',
                  padding: '10px 24px'
                }}
              >
                {settings.sidebarFloat ? '✅ 已开启' : '⭕ 已关闭'}
              </button>
            </div>
          </div>
        </div>

        {/* 重置设置 */}
        <div className="card" style={{ background: '#fafaf9', borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🔄</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>重置所有设置</div>
                <div style={{ fontSize: 13, color: '#888780' }}>恢复到默认状态</div>
              </div>
            </div>
            <button 
              className="btn btn-danger"
              onClick={() => {
                if (confirm('确定要重置所有设置吗？')) {
                  localStorage.removeItem('gametracker-settings')
                  window.location.reload()
                }
              }}
            >
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
