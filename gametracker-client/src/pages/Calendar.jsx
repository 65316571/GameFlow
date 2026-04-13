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

const WEEKDAY_ICONS = ['日', '一', '二', '三', '四', '五', '六']

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
        <div className="page-title">
          <span style={{ fontSize: 32, marginRight: 10 }}>📅</span>
          日历
        </div>
        <div className="page-subtitle">查看每天的游玩时长 🎯</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* 日历 */}
        <div className="card" style={{ minHeight: 520 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📆</span>
              {current.format('YYYY年 M月')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={handlePrev} style={{ fontSize: 18, padding: '8px 14px' }}>◀</button>
              <button className="btn" onClick={() => setCurrent(dayjs())} style={{ padding: '8px 16px' }}>
                <span style={{ marginRight: 6 }}>📍</span>今天
              </button>
              <button className="btn" onClick={handleNext} style={{ fontSize: 18, padding: '8px 14px' }}>▶</button>
            </div>
          </div>

          {/* 星期头 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
            {WEEKDAY_ICONS.map((d, i) => (
              <div key={d} style={{ 
                textAlign: 'center', fontSize: 14, 
                color: i === 0 || i === 6 ? '#e24b4a' : '#888780', 
                padding: '8px 0', fontWeight: 600 
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
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
                    borderRadius: 12, padding: '10px 6px', minHeight: 72,
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    border: `2px solid ${isSel ? '#afa9ec' : 'transparent'}`,
                    background: isSel ? '#eeedfe' : 'transparent',
                    transition: 'all 0.15s ease',
                    transform: isSel ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, borderRadius: '50%',
                    background: isToday ? '#7f77dd' : 'transparent',
                    color: isToday ? '#fff' : level === 'none' ? '#b4b2a9' : '#2c2c2a',
                    fontWeight: isToday ? 700 : 600,
                  }}>{day}</div>
                  {mins > 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 600, borderRadius: 4,
                      padding: '2px 6px', whiteSpace: 'nowrap',
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
          <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'flex-end' }}>
            {[
              { label: '< 1h',  bg: '#eeedfe', border: '0.5px solid #afa9ec' },
              { label: '1~3h', bg: '#cecbf6', border: 'none' },
              { label: '3h+',  bg: '#7f77dd', border: 'none' },
              { label: '无记录', bg: '#f1efe8', border: '0.5px solid #e8e6df' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888780' }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: l.bg, border: l.border }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* 日期详情 */}
        <div className="card" style={{ minHeight: 520 }}>
          {!selectedDate
            ? (
              <div className="empty-state">
                <div style={{ fontSize: 56, marginBottom: 16 }}>👆</div>
                点击日期查看明细
              </div>
            )
            : (() => {
                const d = dayjs(selectedDate)
                const sessions = dayDetail?.sessions || []
                const totalSec = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
                return (
                  <>
                    <div style={{ 
                      fontSize: 18, fontWeight: 700, marginBottom: 4,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <span style={{ fontSize: 22 }}>📆</span>
                      {d.format('YYYY年M月D日')}
                      {selectedDate === today && (
                        <span style={{ 
                          fontSize: 12, padding: '4px 10px', borderRadius: 6,
                          background: '#eeedfe', color: '#534ab7',
                          fontWeight: 600
                        }}>今天</span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, color: '#888780', marginBottom: '1.25rem' }}>
                      共 {sessions.length} 条记录 📝
                    </div>

                    {sessions.length === 0
                      ? (
                        <div style={{ 
                          fontSize: 15, color: '#b4b2a9', padding: '2.5rem 0',
                          textAlign: 'center', background: '#fafaf9', borderRadius: 12
                        }}>
                          <div style={{ fontSize: 40, marginBottom: 10 }}>🎮</div>
                          今日暂无游玩记录
                        </div>
                      )
                      : (
                        <>
                          <div style={{ 
                            display: 'flex', alignItems: 'baseline', gap: 8, 
                            padding: '0 0 1.25rem', borderBottom: '0.5px solid #e8e6df', marginBottom: '1.25rem' 
                          }}>
                            <span style={{ fontSize: 36, fontWeight: 700, color: '#534ab7' }}>
                              {fmtDuration(totalSec)}
                            </span>
                            <span style={{ fontSize: 15, color: '#888780' }}>今日总时长 ⏱️</span>
                          </div>
                          {sessions.map(s => {
                            const colors = GENRE_AVATAR_COLORS[s.genre_code] || GENRE_AVATAR_COLORS.OTHER
                            const pct = totalSec > 0 ? Math.round(s.duration_seconds / totalSec * 100) : 0
                            return (
                              <div key={s.id} style={{ 
                                display: 'flex', alignItems: 'center', gap: 14, 
                                padding: '14px 0', borderBottom: '0.5px solid #f1efe8' 
                              }}>
                                <div className="game-avatar" style={{ background: colors.bg, color: colors.color, width: 48, height: 48, fontSize: 15 }}>
                                  {gameInitial(s.game_name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 15, fontWeight: 600 }}>{s.game_name}</div>
                                  <div style={{ marginTop: 6, height: 6, background: '#f1efe8', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ height: 6, width: `${pct}%`, background: '#7f77dd', borderRadius: 3 }} />
                                  </div>
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#534ab7', minWidth: 60, textAlign: 'right' }}>
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
