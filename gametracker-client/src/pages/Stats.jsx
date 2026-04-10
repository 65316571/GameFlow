import { useEffect, useState } from 'react'
import { getGames, addManualSession, getRecentSessions } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'
import dayjs from 'dayjs'

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
    // 重置表单
    setManualForm({
      game_id: '', start_time: '', end_time: '',
      date: dayjs().format('YYYY-MM-DD'), hours: '', minutes: '',
    })
    loadRecent()
  }

  // 计算统计数据
  const totalSessions = recent.length
  const totalDuration = recent.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const timerSessions = recent.filter(s => s.source === 'timer').length
  const manualSessions = recent.filter(s => s.source === 'manual').length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">记录统计</div>
        <div className="page-subtitle">查看记录历史，手动补录游玩时长</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="metric-card">
          <div className="metric-label">总记录数</div>
          <div className="metric-value">{totalSessions}</div>
          <div className="metric-sub">条游玩记录</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">累计时长</div>
          <div className="metric-value">{fmtDuration(totalDuration)}</div>
          <div className="metric-sub">最近10条统计</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">计时记录</div>
          <div className="metric-value">{timerSessions}</div>
          <div className="metric-sub">通过计时器</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">补录记录</div>
          <div className="metric-value">{manualSessions}</div>
          <div className="metric-sub">手动添加</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 补录表单 */}
        <div className="card">
          <div className="section-label">补录记录</div>
          <div style={{ display: 'flex', borderBottom: '0.5px solid #e8e6df', marginBottom: '1rem' }}>
            {['timerange', 'duration'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ 
                  padding: '7px 14px', fontSize: 13, background: 'none', border: 'none', 
                  cursor: 'pointer', 
                  borderBottom: `2px solid ${tab === t ? '#7f77dd' : 'transparent'}`, 
                  color: tab === t ? '#534ab7' : '#888780', 
                  fontWeight: tab === t ? 500 : 400 
                }}>
                {t === 'timerange' ? '填写时间段' : '直接填时长'}
              </button>
            ))}
          </div>

          <div className="field">
            <label>选择游戏</label>
            <select value={manualForm.game_id} onChange={e => setM('game_id', e.target.value)}>
              <option value="">请选择游戏</option>
              {allGames.map(g => <option key={g.id} value={g.id}>{g.name} ({g.platform_code})</option>)}
            </select>
          </div>

          {tab === 'timerange' ? (
            <div className="field-row">
              <div className="field">
                <label>开始时间</label>
                <input type="datetime-local" value={manualForm.start_time} onChange={e => setM('start_time', e.target.value)} />
              </div>
              <div className="field">
                <label>结束时间</label>
                <input type="datetime-local" value={manualForm.end_time} onChange={e => setM('end_time', e.target.value)} />
              </div>
            </div>
          ) : (
            <>
              <div className="field">
                <label>日期</label>
                <input type="date" value={manualForm.date} onChange={e => setM('date', e.target.value)} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>小时</label>
                  <input type="number" min="0" max="23" placeholder="0" value={manualForm.hours} onChange={e => setM('hours', e.target.value)} />
                </div>
                <div className="field">
                  <label>分钟</label>
                  <input type="number" min="0" max="59" placeholder="0" value={manualForm.minutes} onChange={e => setM('minutes', e.target.value)} />
                </div>
              </div>
            </>
          )}
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 4 }}
            onClick={handleManual}
            disabled={!manualForm.game_id}
          >
            确认补录
          </button>
        </div>

        {/* 最近记录 */}
        <div className="card">
          <div className="section-label">最近记录</div>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : recent.length === 0 ? (
            <div className="empty-state">暂无记录</div>
          ) : (
            recent.map(s => {
              const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
              return (
                <div key={s.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, 
                  padding: '10px 0', borderBottom: '0.5px solid #f1efe8', fontSize: 13 
                }}>
                  <div className="game-avatar" style={{ ...colors, width: 32, height: 32, fontSize: 12 }}>
                    {gameInitial(s.game_name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{s.game_name}</div>
                    <div style={{ fontSize: 11, color: '#b4b2a9', marginTop: 2 }}>
                      {dayjs(s.start_time).format('MM/DD HH:mm')} · {s.platform_code}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: 10, padding: '2px 6px', borderRadius: 3, 
                    background: s.source === 'timer' ? '#e1f5ee' : '#faeeda',
                    color: s.source === 'timer' ? '#0f6e56' : '#854f0b',
                    marginRight: 8
                  }}>
                    {s.source === 'timer' ? '计时' : '补录'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#534ab7' }}>
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
