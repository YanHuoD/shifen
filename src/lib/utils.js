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
