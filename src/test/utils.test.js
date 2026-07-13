import { describe, it, expect } from 'vitest'
import { formatTime, scoreBadge, scoreText, scoreCard } from '../lib/utils'

describe('formatTime', () => {
  it('返回完整日期格式（含年份）', () => {
    const result = formatTime('2026-07-10T14:30:00Z', false)
    expect(result).toMatch(/2026年7月/)
  })

  it('今天显示相对时间', () => {
    const today = new Date().toISOString()
    const result = formatTime(today)
    expect(result).toMatch(/今天/)
  })

  it('空值返回空字符串', () => {
    expect(formatTime('')).toBe('')
  })
})

describe('scoreBadge', () => {
  it('>=8 分返回绿色', () => {
    expect(scoreBadge(8.5)).toContain('text-green-600')
  })
  it('6-7.9 分返回黄色', () => {
    expect(scoreBadge(6.5)).toContain('text-yellow-600')
  })
  it('<6 分返回红色', () => {
    expect(scoreBadge(3.5)).toContain('text-red-600')
  })
})

describe('scoreText', () => {
  it('只返回文字色不含背景', () => {
    const result = scoreText(9)
    expect(result).toContain('text-')
    expect(result).not.toContain('bg-')
  })
})

describe('scoreCard', () => {
  it('返回背景色包含 border', () => {
    const result = scoreCard(7)
    expect(result).toContain('bg-')
    expect(result).toContain('border-')
  })
})
