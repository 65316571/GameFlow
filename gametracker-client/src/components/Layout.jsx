import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useSettings } from '../contexts/useSettings'

const links = [
  { to: '/',        icon: '📊', label: '总览' },
  { to: '/library', icon: '🎮', label: '游戏库' },
  { to: '/timer',   icon: '⏱️', label: '游玩' },
  { to: '/stats',   icon: '📈', label: '记录' },
  { to: '/calendar',icon: '📅', label: '日历' },
  { to: '/wiki',    icon: '📚', label: '百科' },
  { to: '/design',  icon: '🎨', label: '设计' },
]

export default function Layout({ children }) {
  const { settings, disableImmersiveMode, toggleTheme, toggleMobileMode } = useSettings()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const isTimerRoute = location.pathname === '/timer'
  const isDesktopZoomRoute = !settings.isMobileView && (
    location.pathname === '/' ||
    location.pathname === '/calendar' ||
    location.pathname === '/stats'
  )
  
  // 沉浸模式下的游戏名称
  const immersiveGame = settings.immersiveMode ? 
    JSON.parse(localStorage.getItem('GameTracker-games') || '[]').find(g => g.id === settings.immersiveGameId)?.name 
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
    <div className={`layout ${settings.themeMode} ${settings.isMobileView ? 'mobile-view' : ''} ${settings.isMobileView && settings.sidebarFloat ? 'sidebar-float' : ''}`}>
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

      {settings.isMobileView && (
        <header className="mobile-topbar">
          <div className="mobile-topbar-inner">
            <div className="mobile-brand">
              <img src="/logo.jpg" alt="GameTracker" className="mobile-brand-logo" />
              <span className="mobile-brand-text">GameTracker</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                className="btn btn-sm btn-ghost" 
                onClick={toggleMobileMode} 
                style={{ padding: '8px 12px', width: 44, fontSize: 16 }}
                title="切换视图模式"
              >
                {settings.mobileMode === 'auto' ? '💻' : settings.mobileMode === 'mobile' ? '📱' : '🖥️'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={toggleTheme} style={{ padding: '8px 12px', width: 44 }}>
                {settings.themeMode === 'dark' ? '🌙' : settings.themeMode === 'light' ? '☀️' : '🌓'}
              </button>
              {settings.sidebarFloat && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setMobileMenuOpen(v => !v)}
                  style={{ padding: '8px 12px', width: 44 }}
                >
                  {mobileMenuOpen ? '✕' : '☰'}
                </button>
              )}
            </div>
          </div>
          {!settings.sidebarFloat && (
            <nav className="mobile-nav">
              {links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => 'mobile-nav-link' + (isActive ? ' active' : '')}
                >
                  <span className="mobile-nav-icon">{l.icon}</span>
                  <span className="mobile-nav-label">{l.label}</span>
                </NavLink>
              ))}
            </nav>
          )}
        </header>
      )}

      {settings.isMobileView && settings.sidebarFloat && mobileMenuOpen && (
        <>
          <div className="mobile-float-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="mobile-float-menu">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 'mobile-float-link' + (isActive ? ' active' : '')}
              >
                <span className="mobile-float-icon">{l.icon}</span>
                <span className="mobile-float-label">{l.label}</span>
              </NavLink>
            ))}
          </div>
        </>
      )}

      {/* 侧边栏 */}
      {!settings.isMobileView && (
        <aside 
          className={`sidebar ${settings.sidebarFloat ? 'floating' : 'fixed'} ${settings.sidebarCollapsed ? 'collapsed' : ''}`}
          style={{ 
            width: sidebarWidth,
            minWidth: sidebarWidth,
            transform: 'translateX(0)'
          }}
        >
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="GameTracker" className="sidebar-logo-img" />
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
            <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button 
                  className="btn btn-sm btn-ghost" 
                  onClick={toggleMobileMode} 
                  style={{ padding: '8px 12px', width: 44, fontSize: 16 }}
                  title="切换视图模式"
                >
                  {settings.mobileMode === 'auto' ? '💻' : settings.mobileMode === 'mobile' ? '📱' : '🖥️'}
                </button>
                <button 
                  className="btn btn-sm btn-ghost" 
                  onClick={toggleTheme} 
                  style={{ padding: '8px 12px', width: 44 }}
                  title="切换主题"
                >
                  {settings.themeMode === 'dark' ? '🌙' : settings.themeMode === 'light' ? '☀️' : '🌓'}
                </button>
              </div>
              <div className="sidebar-footer-text">🎯 追踪你的游戏时光</div>
            </div>
          )}
        </aside>
      )}

      {/* 主内容区 */}
      <div 
        className={
          'main-wrapper' +
          (isTimerRoute ? ' is-timer' : '') +
          (isDesktopZoomRoute ? ' desktop-zoom-120' : '')
        }
        style={{ 
          marginLeft: settings.isMobileView ? 0 : sidebarWidth,
        }}
      >
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
