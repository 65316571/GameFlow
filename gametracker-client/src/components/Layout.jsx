import { NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '../contexts/SettingsContext'

const links = [
  { to: '/',        icon: '📊', label: '总览' },
  { to: '/library', icon: '🎮', label: '游戏库' },
  { to: '/timer',   icon: '⏱️', label: '开始游玩' },
  { to: '/stats',   icon: '📈', label: '记录统计' },
  { to: '/calendar',icon: '📅', label: '日历' },
  { to: '/wiki',    icon: '📚', label: '百科' },
  { to: '/design',  icon: '🎨', label: '设计' },
]

export default function Layout({ children }) {
  const { settings, updateSettings, disableImmersiveMode } = useSettings()
  const location = useLocation()
  
  // 沉浸模式下的游戏名称
  const immersiveGame = settings.immersiveMode ? 
    JSON.parse(localStorage.getItem('gametracker-games') || '[]').find(g => g.id === settings.immersiveGameId)?.name 
    : null

  // 计算侧边栏宽度
  const getSidebarWidth = () => {
    if (settings.isMobileView) {
      return settings.sidebarCollapsed ? 0 : 220
    }
    if (!settings.sidebarFloat) return 220
    return settings.sidebarCollapsed ? 72 : 220
  }

  const sidebarWidth = getSidebarWidth()

  return (
    <div className={`layout ${settings.themeMode} ${settings.isMobileView ? 'mobile-view' : ''}`}>
      {/* 沉浸模式提示条 */}
      {settings.immersiveMode && (
        <div className="immersive-banner">
          <div className="immersive-content">
            <span className="immersive-icon">🧘</span>
            <span className="immersive-text">
              沉浸模式 · 专注游玩：<strong>{immersiveGame || '未选择游戏'}</strong>
            </span>
            <button className="immersive-exit" onClick={disableImmersiveMode}>
              退出
            </button>
          </div>
        </div>
      )}

      {/* 侧边栏 */}
      <aside 
        className={`sidebar ${settings.sidebarFloat ? 'floating' : 'fixed'} ${settings.sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ 
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transform: settings.isMobileView && settings.sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🟪</span>
          {!settings.sidebarCollapsed && <span className="sidebar-logo-text">GameTracker</span>}
        </div>
        
        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              title={settings.sidebarCollapsed ? l.label : ''}
            >
              <span className="nav-icon">{l.icon}</span>
              {!settings.sidebarCollapsed && <span className="nav-label">{l.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!settings.sidebarCollapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">🎯 追踪你的游戏时光</div>
          </div>
        )}

        {/* 悬浮模式下的切换按钮 */}
        {/* {settings.sidebarFloat && !settings.isMobileView && (
          <button 
            className="sidebar-toggle"
            onClick={() => updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })}
            title={settings.sidebarCollapsed ? '展开' : '收起'}
          >
            {settings.sidebarCollapsed ? '▶' : '◀'}
          </button>
        )} */}
      </aside>

      {/* 移动端遮罩 */}
      {settings.isMobileView && !settings.sidebarCollapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => updateSettings({ sidebarCollapsed: true })}
        />
      )}

      {/* 主内容区 */}
      <div 
        className="main-wrapper"
        style={{ 
          marginLeft: settings.isMobileView ? 0 : sidebarWidth,
        }}
      >
        {/* 移动端菜单按钮 */}
        {settings.isMobileView && (
          <button 
            className="mobile-menu-btn"
            onClick={() => updateSettings({ sidebarCollapsed: false })}
          >
            ☰
          </button>
        )}
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
