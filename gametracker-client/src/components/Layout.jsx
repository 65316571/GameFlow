import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',        icon: '⊞', label: '总览' },
  { to: '/library', icon: '◫', label: '游戏库' },
  { to: '/timer',   icon: '◷', label: '开始游玩' },
  { to: '/stats',   icon: '◧', label: '记录统计' },
  { to: '/calendar',icon: '▦', label: '日历' },
  { to: '/wiki',    icon: '◉', label: '百科' },
]

export default function Layout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">GameTracker</div>
        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
