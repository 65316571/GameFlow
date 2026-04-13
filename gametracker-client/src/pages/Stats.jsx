import { useEffect, useState } from 'react'
import { getGames, addManualSession, getRecentSessions } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'
import dayjs from 'dayjs'

const STAT_ICONS = {
  total: '📋',
  duration: '⏱️',
  timer: '⏲️',
  manual: '✏️',
}

export default function Stats() {
  const [allGames, setAllGames] = useState([])
  const [recent, setRecent] = useState([])
  const [tab, setTab] = useState('timerange')
  const [loading, setLoading] = useState(true)

  const [manualForm, setManualForm] = useState({
    game_id: '', start_time: '', end_time: '',
    date: dayjs().format('YYYY-MM-DD'), hours: '', minutes: '',
  })

  const loadRecent = () => {
    getRecentSessions().then(r => {
      setRecent(r.data)
      setLoading(false)
    })
  }

  useEffect(() => {
    getGames().then(r => setAllGames(r.data))
    loadRecent()
  }, [])

  const setM = (k, v) => setManualForm(f => ({ ...f, [k]: v }))

  const handleManual = async () => {
    const payload = { game_id: manualForm.game_id, source: tab }
    if (tab === 'timerange') {
      if (!manualForm.start_time || !manualForm.end_time) return
      payload.start_time = manualForm.start_time
      payload.end_time = manualForm.end_time
    } else {
      const totalSec = (parseInt(manualForm.hours || 0) * 3600) + (parseInt(manualForm.minutes || 0) * 60)
      if (!totalSec) return
      payload.date = manualForm.date
      payload.duration_seconds = totalSec
    }
    await addManualSession(payload)
    setManualForm({
      game_id: '', start_time: '', end_time: '',
      date: dayjs().format('YYYY-MM-DD'), hours: '', minutes: '',
    })
    loadRecent()
  }

  const totalSessions = recent.length
  const totalDuration = recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const timerSessions = recent.filter(s => s.source === 'timer').length
  const manualSessions = recent.filter(s => s.source === 'manual').length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <span style={{ fontSize: 32, marginRight: 10 }}>📈</span>
          记录统计
        </div>
        <div className="page-subtitle">查看记录历史，手动补录游玩时长</div>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="metric-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>{STAT_ICONS.total}</div>
          <div className="metric-label">总记录数</div>
          <div className="metric-value">{totalSessions}</div>
          <div className="metric-sub">条游玩记录 📝</div>
        </div>
        <div className="metric-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>{STAT_ICONS.duration}</div>
          <div className="metric-label">累计时长</div>
          <div className="metric-value">{fmtDuration(totalDuration)}</div>
          <div className="metric-sub">最近10条统计 📊</div>
        </div>
        <div className="metric-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>{STAT_ICONS.timer}</div>
          <div className="metric-label">计时记录</div>
          <div className="metric-value">{timerSessions}</div>
          <div className="metric-sub">通过计时器 ⏱️</div>
        </div>
        <div className="metric-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>{STAT_ICONS.manual}</div>
          <div className="metric-label">补录记录</div>
          <div className="metric-value">{manualSessions}</div>
          <div className="metric-sub">手动添加 ✍️</div>
        </div>
      </div>

      {/* 补录表单和记录列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* 补录表单 */}
        <div className="card">
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>➕</span> 补录记录
          </div>
          <div className="tabs">
            {[
              { key: 'timerange', label: '⏰ 填写时间段' },
              { key: 'duration', label: '📝 直接填时长' }
            ].map(t => (
              <button 
                key={t.key} 
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="field">
            <label><span>🎮</span> 选择游戏</label>
            <select value={manualForm.game_id} onChange={e => setM('game_id', e.target.value)}>
              <option value="">请选择游戏</option>
              {allGames.map(g => <option key={g.id} value={g.id}>{g.name} ({g.platform_code})</option>)}
            </select>
          </div>

          {tab === 'timerange' ? (
            <div className="field-row">
              <div className="field">
                <label><span>🚀</span> 开始时间</label>
                <input type="datetime-local" value={manualForm.start_time} onChange={e => setM('start_time', e.target.value)} />
              </div>
              <div className="field">
                <label><span>🏁</span> 结束时间</label>
                <input type="datetime-local" value={manualForm.end_time} onChange={e => setM('end_time', e.target.value)} />
              </div>
            </div>
          ) : (
            <>
              <div className="field">
                <label><span>📅</span> 日期</label>
                <input type="date" value={manualForm.date} onChange={e => setM('date', e.target.value)} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label><span>🕐</span> 小时</label>
                  <input type="number" min="0" max="23" placeholder="0" value={manualForm.hours} onChange={e => setM('hours', e.target.value)} />
                </div>
                <div className="field">
                  <label><span>⏱️</span> 分钟</label>
                  <input type="number" min="0" max="59" placeholder="0" value={manualForm.minutes} onChange={e => setM('minutes', e.target.value)} />
                </div>
              </div>
            </>
          )}
          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', marginTop: 8, padding: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            onClick={handleManual}
            disabled={!manualForm.game_id}
          >
            <span style={{ fontSize: 18 }}>✅</span> 确认补录
          </button>
        </div>

        {/* 最近记录 */}
        <div className="card">
          <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📋</span> 最近记录
          </div>
          {loading ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              加载中...
            </div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              暂无记录
            </div>
          ) : (
            recent.map(s => {
              const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
              return (
                <div key={s.id} className="record-item">
                  <div className="game-avatar" style={{ background: colors.bg, color: colors.color, width: 44, height: 44, fontSize: 14 }}>
                    {gameInitial(s.game_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.game_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>
                      {dayjs(s.start_time).format('MM/DD HH:mm')} · {s.platform_code}
                    </div>
                  </div>
                  <span className={`record-source-tag ${s.source}`}>
                    {s.source === 'timer' ? '⏱️' : '✏️'}
                    {s.source === 'timer' ? '计时' : '补录'}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary-color)', minWidth: 60, textAlign: 'right' }}>
                    {fmtDuration(s.duration_seconds)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
