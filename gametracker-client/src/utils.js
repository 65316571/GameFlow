export const GENRE_LABELS = {
  RPG: '角色扮演',
  FPS: '第一人称射击',
  MOBA: '多人在线战术',
  SIM: '模拟经营',
  ADV: '冒险解谜',
  OTHER: '其他',
}

export const PLATFORM_CODES = ['NS', 'PS4', 'PC', 'APP', '网站']

export const GENRE_CODES = ['RPG', 'FPS', 'MOBA', 'SIM', 'ADV', 'OTHER']

// 游戏名首字头像颜色映射（按类型）
export const GENRE_AVATAR_COLORS = {
  RPG:   { bg: 'var(--status-rpg-bg)', color: 'var(--status-rpg-text)' },
  FPS:   { bg: 'var(--status-fps-bg)', color: 'var(--status-fps-text)' },
  MOBA:  { bg: 'var(--status-moba-bg)', color: 'var(--status-moba-text)' },
  SIM:   { bg: 'var(--status-sim-bg)', color: 'var(--status-sim-text)' },
  ADV:   { bg: 'var(--status-adv-bg)', color: 'var(--status-adv-text)' },
  OTHER: { bg: 'var(--status-other-bg)', color: 'var(--status-other-text)' },
}

// 格式化时长（秒 → "1h 30m" 或 "45m"）
export function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// 格式化时长（分钟 → "1h 30m"）
export function fmtMinutes(minutes) {
  return fmtDuration(minutes * 60)
}

// 游戏名首字（支持英文取前两字母）
export function gameInitial(name) {
  if (!name) return '?'
  const first = name.trim()[0]
  return /[a-zA-Z]/.test(first) ? name.trim().slice(0, 2).toUpperCase() : first
}
