import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8808,
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
export const cancelSession = (sessionId) => api.post(`/sessions/${sessionId}/cancel`)
export const pauseSession = (sessionId) => api.post(`/sessions/${sessionId}/pause`)
export const resumeSession = (sessionId) => api.post(`/sessions/${sessionId}/resume`)
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

// ── 百科 ──
export const getWikiGenres = () => api.get('/wiki/genres')
export const createWikiGenre = (data) => api.post('/wiki/genres', data)
export const updateWikiGenre = (code, data) => api.put(`/wiki/genres/${encodeURIComponent(code)}`, data)
export const deleteWikiGenre = (code) => api.delete(`/wiki/genres/${encodeURIComponent(code)}`)
export const uploadWikiImage = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/wiki/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
