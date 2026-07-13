import { describe, it, expect, beforeEach } from 'vitest'
import { getLocalHistory, saveToLocalHistory, deleteLocalHistory } from '../lib/localHistory'

beforeEach(() => {
  localStorage.clear()
})

describe('localHistory', () => {
  it('初始为空', () => {
    expect(getLocalHistory()).toEqual([])
  })

  it('保存和读取', () => {
    saveToLocalHistory({ ingredients: '小麦粉、白砂糖', analysis: { healthScore: 5 } })
    const history = getLocalHistory()
    expect(history).toHaveLength(1)
    expect(history[0].ingredients).toBe('小麦粉、白砂糖')
  })

  it('最多保存 30 条', () => {
    for (let i = 0; i < 35; i++) {
      saveToLocalHistory({ ingredients: `item${i}`, analysis: {} })
    }
    expect(getLocalHistory()).toHaveLength(30)
  })

  it('删除单条', async () => {
    saveToLocalHistory({ ingredients: 'a', analysis: {} })
    await new Promise(r => setTimeout(r, 2)) // 避免 ID 碰撞
    saveToLocalHistory({ ingredients: 'b', analysis: {} })
    const history = getLocalHistory()
    deleteLocalHistory(history[0].id)
    expect(getLocalHistory()).toHaveLength(1)
  })

  it('按时间倒序排列', () => {
    saveToLocalHistory({ ingredients: 'older', analysis: {} })
    saveToLocalHistory({ ingredients: 'newer', analysis: {} })
    expect(getLocalHistory()[0].ingredients).toBe('newer')
  })
})
