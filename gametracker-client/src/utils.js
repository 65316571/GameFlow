export const GENRE_LABELS = {
  RPG: '角色扮演',
  ARPG: '动作角色扮演',
  MMORPG: '大型多人在线角色扮演',
  FPS: '第一人称射击',
  TPS: '第三人称射击',
  ACT: '动作',
  MOBA: '多人在线战术竞技',
  RTS: '即时战略',
  SLG: '策略战棋',
  SIM: '模拟经营',
  RAC: '竞速',
  SPG: '体育',
  FTG: '格斗',
  ADV: '冒险解谜',
  PUZ: '益智休闲',
  Roguelike: '肉鸽',
  Horror: '恐怖生存',
  Sandbox: '沙盒',
  Rhythm: '音乐节奏',
  OTHER: '其他',
}

export const PLATFORM_CODES = ['NS', 'PS4', 'Xbox', 'Steam', 'APP']

export const PLATFORM_ICONS = {
  'NS': '/ns.svg',
  'PS4': '/ps.svg',
  'Xbox': '/xbox.svg',
  'Steam': '/steam.svg',
  'APP': '/phone.svg',
  // 'Web': '/web.svg',  // 已合并到 Steam
}

export const GENRE_CODES = ['RPG', 'ARPG', 'MMORPG', 'FPS', 'TPS', 'ACT', 'MOBA', 'RTS', 'SLG', 'SIM', 'RAC', 'SPG', 'FTG', 'ADV', 'PUZ', 'Roguelike', 'Horror', 'Sandbox', 'Rhythm', 'OTHER']

// 游戏名首字头像颜色映射（按类型）
export const GENRE_AVATAR_COLORS = {
  RPG:       { bg: 'var(--status-rpg-bg)', color: 'var(--status-rpg-text)' },
  ARPG:      { bg: 'var(--status-arpg-bg)', color: 'var(--status-arpg-text)' },
  MMORPG:    { bg: 'var(--status-mmorpg-bg)', color: 'var(--status-mmorpg-text)' },
  FPS:       { bg: 'var(--status-fps-bg)', color: 'var(--status-fps-text)' },
  TPS:       { bg: 'var(--status-tps-bg)', color: 'var(--status-tps-text)' },
  ACT:       { bg: 'var(--status-act-bg)', color: 'var(--status-act-text)' },
  MOBA:      { bg: 'var(--status-moba-bg)', color: 'var(--status-moba-text)' },
  RTS:       { bg: 'var(--status-rts-bg)', color: 'var(--status-rts-text)' },
  SLG:       { bg: 'var(--status-slg-bg)', color: 'var(--status-slg-text)' },
  SIM:       { bg: 'var(--status-sim-bg)', color: 'var(--status-sim-text)' },
  RAC:       { bg: 'var(--status-rac-bg)', color: 'var(--status-rac-text)' },
  SPG:       { bg: 'var(--status-spg-bg)', color: 'var(--status-spg-text)' },
  FTG:       { bg: 'var(--status-ftg-bg)', color: 'var(--status-ftg-text)' },
  ADV:       { bg: 'var(--status-adv-bg)', color: 'var(--status-adv-text)' },
  PUZ:       { bg: 'var(--status-puz-bg)', color: 'var(--status-puz-text)' },
  Roguelike: { bg: 'var(--status-rogue-bg)', color: 'var(--status-rogue-text)' },
  Horror:    { bg: 'var(--status-horror-bg)', color: 'var(--status-horror-text)' },
  Sandbox:   { bg: 'var(--status-sandbox-bg)', color: 'var(--status-sandbox-text)' },
  Rhythm:    { bg: 'var(--status-rhythm-bg)', color: 'var(--status-rhythm-text)' },
  OTHER:     { bg: 'var(--status-other-bg)', color: 'var(--status-other-text)' },
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
