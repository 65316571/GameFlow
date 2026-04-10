import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { getCalendarMonth, getCalendarDay } from '../api'
import { fmtDuration, gameInitial, GENRE_AVATAR_COLORS } from '../utils'

function durLevel(minutes) {
  if (!minutes || minutes === 0) return 'none'
  if (minutes < 60) return 'low'
  if (minutes < 180) return 'mid'
  return 'high'
}

const DUR_STYLES = {
  none: { bg: 'transparent', color: '#b4b2a9', border: 'none' },
  low:  { bg: '#eeedfe', color: '#534ab7', border: 'none' },
  mid:  { bg: '#cecbf6', color: '#3c3489', border: 'none' },
  high: { bg: '#7f77dd', color: '#fff',    border: 'none' },
}

export default function Calendar() {
  const [current, setCurrent] = useState(dayjs())
  const [monthData, setMonthData] = useState({})
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [dayDetail, setDayDetail] = useState(null)

  const loadMonth = async (d) => {
    const res = await getCalendarMonth(d.year(), d.month() + 1)
    const map = {}
    res.data.forEach(item => { map[item.date] = item })
    setMonthData(map)
  }

  const loadDay = async (date) => {
    const res = await getCalendarDay(date)
    setDayDetail(res.data)
  }

  useEffect(() => { loadMonth(current) }, [current])
  useEffect(() => { loadDay(selectedDate) }, [selectedDate])

  const startOfMonth = current.startOf('month')
  const daysInMonth = current.daysInMonth()
  const startDow = startOfMonth.day()

  const handlePrev = () => setCurrent(c => c.subtract(1, 'month'))
  const handleNext = () => setCurrent(c => c.add(1, 'month'))

  const today = dayjs().format('YYYY-MM-DD')

  return (
    <div>
      <div className="page-header">
        <div className="page-title">日历</div>
        <div className="page-subtitle">查看每天的游玩时长</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

        {/* 日历 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>
              {current.format('YYYY年 M月')}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={handlePrev}>‹</button>
              <button className="btn btn-sm" onClick={() => setCurrent(dayjs())}>今天</button>
              <button className="btn btn-sm" onClick={handleNext}>›</button>
            </div>
          </div>

          {/* 星期头 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
            {['日','一','二','三','四','五','六'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#b4b2a9', padding: '4px 0', fontWeight: 500 }}>{d}</div>
            ))}
          </div>

          {/* 日期格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = current.format(`YYYY-MM-${String(day).padStart(2,'0')}`)
              const info = monthData[dateStr]
              const mins = info?.total_minutes || 0
              const level = durLevel(mins)
              const style = DUR_STYLES[level]
              const isToday = dateStr === today
              const isSel = dateStr === selectedDate

              return (
                <div key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    borderRadius: 8, padding: '6px 4px', minHeight: 52,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 3,
                    border: `0.5px solid ${isSel ? '#afa9ec' : 'transparent'}`,
                    background: isSel ? '#eeedfe' : 'transparent',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, borderRadius: '50%',
                    background: isToday ? '#7f77dd' : 'transparent',
                    color: isToday ? '#fff' : level === 'none' ? '#b4b2a9' : '#2c2c2a',
                    fontWeight: isToday ? 500 : 400,
                  }}>{day}</div>
                  {mins > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 500, borderRadius: 3,
                      padding: '1px 4px', whiteSpace: 'nowrap',
                      background: style.bg, color: style.color,
                    }}>
                      {fmtDuration(mins * 60)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 图例 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'flex-end' }}>
            {[
              { label: '< 1h',  bg: '#eeedfe', border: '0.5px solid #afa9ec' },
              { label: '1~3h', bg: '#cecbf6', border: 'none' },
              { label: '3h+',  bg: '#7f77dd', border: 'none' },
              { label: '无记录', bg: '#f1efe8', border: '0.5px solid #e8e6df' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#888780' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, border: l.border }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* 日期详情 */}
        <div className="card">
          {!selectedDate
            ? <div className="empty-state">点击日期查看明细</div>
            : (() => {
                const d = dayjs(selectedDate)
                const sessions = dayDetail?.sessions || []
                const totalSec = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
                return (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                      {d.format('YYYY年M月D日')}
                    </div>
                    <div style={{ fontSize: 12, color: '#888780', marginBottom: '1rem' }}>
                      共 {sessions.length} 条记录
                    </div>

                    {sessions.length === 0
                      ? <div style={{ fontSize: 13, color: '#b4b2a9', padding: '1rem 0' }}>今日暂无游玩记录</div>
                      : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '0 0 1rem', borderBottom: '0.5px solid #e8e6df', marginBottom: '1rem' }}>
                            <span style={{ fontSize: 28, fontWeight: 600, color: '#534ab7' }}>{fmtDuration(totalSec)}</span>
                            <span style={{ fontSize: 13, color: '#888780' }}>今日总时长</span>
                          </div>
                          {sessions.map(s => {
                            const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
                            const pct = totalSec > 0 ? Math.round(s.duration_seconds / totalSec * 100) : 0
                            return (
                              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '0.5px solid #f1efe8' }}>
                                <div className="game-avatar" style={{ background: colors.bg, color: colors.color }}>
                                  {gameInitial(s.game_name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.game_name}</div>
                                  <div style={{ marginTop: 4, height: 4, background: '#f1efe8', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: 4, width: `${pct}%`, background: '#7f77dd', borderRadius: 2 }} />
                                  </div>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 500, color: '#534ab7', minWidth: 48, textAlign: 'right' }}>
                                  {fmtDuration(s.duration_seconds)}
                                </span>
                              </div>
                            )
                          })}
                        </>
                      )
                    }
                  </>
                )
              })()
          }
        </div>
      </div>
    </div>
  )
}
