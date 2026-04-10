import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 8000,
})

// ── 总览 ──
export const getOverview = () => api.get('/overview')

// ── 游戏库 ──
export const getGames = (params) => api.get('/games', { params })
export const createGame = (data) => api.post('/games', data)
export const updateGame = (id, data) => api.put(`/games/${id}`, data)
export const deleteGame = (id) => api.delete(`/games/${id}`)

// ── 类型 / 平台 ──
export const getGenres = () => api.get('/genres')
export const getPlatforms = () => api.get('/platforms')

// ── 计时 ──
export const startSession = (gameId) => api.post('/sessions/start', { game_id: gameId })
export const stopSession = (sessionId) => api.post(`/sessions/${sessionId}/stop`)
export const getActiveSession = () => api.get('/sessions/active')
export const addManualSession = (data) => api.post('/sessions/manual', data)
export const getRecentSessions = () => api.get('/sessions/recent')

// ── 统计 ──
export const getPlaytimeStats = (period) => api.get('/stats/playtime', { params: { period } })

// ── 日历 ──
export const getCalendarMonth = (year, month) =>
  api.get('/calendar', { params: { year, month } })
export const getCalendarDay = (date) =>
  api.get('/calendar/day', { params: { date } })
