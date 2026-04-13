import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',        icon: '📊', label: '总览' },
  { to: '/library', icon: '🎮', label: '游戏库' },
  { to: '/timer',   icon: '⏱️', label: '开始游玩' },
  { to: '/stats',   icon: '📈', label: '记录统计' },
  { to: '/calendar',icon: '📅', label: '日历' },
  { to: '/wiki',    icon: '📚', label: '百科' },
]

export default function Layout({ children }) {
  return (
    <div className="layout">
      {/* 侧边栏 - 固定 */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🎮</span>
          <span className="sidebar-logo-text">GameTracker</span>
        </div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{l.icon}</span>
              <span className="nav-label">{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-text">🎯 追踪你的游戏时光</div>
        </div>
      </aside>

      {/* 主内容区 - 独立滚动 */}
      <div className="main-wrapper">
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
