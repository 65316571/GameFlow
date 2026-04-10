import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Tooltip,
} from 'chart.js'
import { getOverview, getPlaytimeStats } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip)

export default function Overview() {
  const [overview, setOverview] = useState(null)
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOverview(), getPlaytimeStats('week')])
      .then(([ov, wk]) => {
        setOverview(ov.data)
        setWeekData(wk.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state">加载中…</div>

  const todaySession = overview?.today_sessions?.[0]
  const recentSessions = overview?.recent_sessions || []

  // 新的数据结构：weekData = { labels, thisWeek, lastWeek }
  const chartLabels = weekData.labels || []
  const thisWeekValues = weekData.thisWeek || []
  const lastWeekValues = weekData.lastWeek || []

  return (
    <div>
      <div className="page-header">
        <div className="page-title">总览</div>
        <div className="page-subtitle">你的游戏数据一览</div>
      </div>

      {todaySession && (
        <div className="today-banner">
          <div className="today-dot" />
          <span className="today-text">今日有游玩记录</span>
          <span className="today-sub">{todaySession.game_name} · {fmtDuration(todaySession.total_seconds)}</span>
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">游戏总数</div>
          <div className="metric-value">{overview?.total_games ?? 0}</div>
          <div className="metric-sub">跨 {overview?.total_platforms ?? 0} 个平台</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">累计游玩</div>
          <div className="metric-value">{fmtDuration((overview?.total_seconds) || 0)}</div>
          <div className="metric-sub">共 {overview?.total_sessions ?? 0} 次记录</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">本周时长</div>
          <div className="metric-value">{fmtDuration((overview?.week_seconds) || 0)}</div>
          <div className="metric-sub">日均 {fmtDuration(Math.round((overview?.week_seconds || 0) / 7))}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">本月时长</div>
          <div className="metric-value">{fmtDuration((overview?.month_seconds) || 0)}</div>
          <div className="metric-sub">{overview?.month_days_played ?? 0} 天有游玩记录</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="section-label">本周每日时长</div>
          <div style={{ position: 'relative', height: 180 }}>
            <Bar
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    type: 'bar',
                    label: '本周',
                    data: thisWeekValues,
                    backgroundColor: '#afa9ec',
                    borderRadius: 4,
                    borderSkipped: false,
                    order: 2,
                  },
                  {
                    type: 'line',
                    label: '上周',
                    data: lastWeekValues,
                    borderColor: '#b4b2a9',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 3,
                    pointBackgroundColor: '#b4b2a9',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    order: 1,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                      usePointStyle: true,
                      boxWidth: 8,
                      font: { size: 11 }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const label = ctx.dataset.label
                        const m = ctx.raw
                        if (m === 0) return `${label}: 无记录`
                        const h = Math.floor(m / 60)
                        const min = m % 60
                        const timeStr = h > 0 ? `${h}h ${min}m` : `${min}m`
                        return `${label}: ${timeStr}`
                      }
                    }
                  }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#888780' } },
                  y: { display: false, beginAtZero: true },
                }
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-label">最近游玩</div>
          {recentSessions.length === 0
            ? <div className="empty-state">暂无记录</div>
            : recentSessions.map((s) => {
                const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f1efe8' }}>
                    <div className="game-avatar" style={{ background: colors.bg, color: colors.color }}>
                      {gameInitial(s.game_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.game_name}</div>
                      <div style={{ fontSize: 11, color: '#b4b2a9', marginTop: 1 }}>
                        {s.played_at} · <span className={`badge badge-platform`}>{s.platform_code}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#534ab7' }}>
                      {fmtDuration(s.duration_seconds)}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </div>
  )
}
