import { useState, useEffect } from 'react'
import { MessageCircle, Send, Loader2, ChevronDown, Trash2 } from 'lucide-react'
import { fetchComments, addComment, deleteComment } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { Link } from 'react-router-dom'

import { formatTime } from '../lib/utils'

export default function CommentSection({ postId, commentCount, onToggle }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (expanded && comments.length === 0) {
      loadComments()
    }
  }, [expanded])

  const loadComments = async () => {
    setLoading(true)
    try {
      const data = await fetchComments(postId)
      setComments(data)
    } catch {
      // 静默失败
    } finally {
      setLoading(false)
    }
  }

  const [commentError, setCommentError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleDelete = async (commentId) => {
    setDeleteConfirm(null)
    try {
      await deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      if (onToggle) onToggle(-1)
    } catch {
      // 失败静默
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    setCommentError('')
    try {
      const comment = await addComment(postId, newComment.trim())
      setComments([...comments, comment])
      setNewComment('')
      if (onToggle) onToggle(1) // 通知父组件评论数+1
    } catch (e) {
      setCommentError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = () => {
    setExpanded(!expanded)
  }

  return (
    <div className="border-t border-gray-100">
      {/* 展开按钮 */}
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full"
      >
        <MessageCircle size={14} />
        <span>{commentCount || 0} 条评论</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="pb-3 space-y-3">
          {/* 评论列表 */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-300" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">暂无评论，来说两句吧</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((c, i) => (
                <div key={c.id || i} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{c.user_avatar || '👤'}</span>
                      <span className="text-xs font-medium text-gray-600">
                        {c.user_name || '食分用户'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {user && user.id === c.user_id && (
                        deleteConfirm === c.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-red-500 hover:underline"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-400 hover:underline"
                            >
                              取消
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(c.id)}
                            className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={12} />
                          </button>
                        )
                      )}
                      <span className="text-xs text-gray-400">{formatTime(c.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 评论输入 */}
          {commentError && (
            <p className="text-xs text-red-500">{commentError}</p>
          )}
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写评论..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          ) : (
            <Link to="/login" className="block text-xs text-center text-primary-500 hover:underline">
              登录后参与评论
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
