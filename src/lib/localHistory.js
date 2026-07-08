const STORAGE_KEY = 'shifen_history'

// 获取本地历史
export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 保存一条解读到本地
export function saveToLocalHistory(entry) {
  const history = getLocalHistory()
  history.unshift({
    id: 'local_' + Date.now(),
    ...entry,
    created_at: new Date().toISOString(),
  })
  // 最多保留 30 条
  if (history.length > 30) history.length = 30
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

// 删除本地记录
export function deleteLocalHistory(id) {
  const history = getLocalHistory().filter(h => h.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}
