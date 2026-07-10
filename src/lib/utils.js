// 共享工具函数

/**
 * 格式化时间：今天 14:30 / 昨天 09:15 / 2026年7月10日 14:30
 * @param {string} iso - ISO 时间字符串
 * @param {boolean} useRelative - 是否使用"今天/昨天"（前台用，后台不）
 */
export function formatTime(iso, useRelative = true) {
  if (!iso) return ''
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const full = `${d.getFullYear()}年${month}月${day}日 ${hour}:${min}`

  if (!useRelative) return full

  const now = new Date()
  if (d.toDateString() === now.toDateString()) return `今天 ${hour}:${min}`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hour}:${min}`
  return full
}

/**
 * 评分徽章色（文字+背景）：绿(>=8) / 黄(>=6) / 红(<6)
 */
export function scoreBadge(score) {
  if (score >= 8) return 'text-green-600 bg-green-50'
  if (score >= 6) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

/**
 * 评分纯文字色
 */
export function scoreText(score) {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * 评分背景+边框
 */
export function scoreCard(score) {
  if (score >= 8) return 'bg-green-50 border-green-200'
  if (score >= 6) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}
