import { useState, useEffect } from 'react'
import { Heart, Share2, Loader2, AlertCircle, PackageOpen, Trash2, ChevronDown, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchPosts, toggleLike, deletePost } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import CommentSection from '../components/CommentSection'
import EditPostModal from '../components/EditPostModal'
import { formatTime } from '../lib/utils'

// 本地 mock 数据（Supabase 未配置时展示）
const FALLBACK_POSTS = [
  {
    id: 1,
    user_name: '宝妈小王',
    ingredients: '小麦粉、白砂糖、精炼植物油、可可粉、碳酸氢钠、食用香精',
    summary: '偶尔吃可以，但代糖和添加剂不少，孩子要控制量',
    health_score: 5.5,
    likes_count: 23,
    comments_count: 5,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2,
    user_name: '健身老李',
    ingredients: '水、赤藓糖醇、柠檬酸、山梨酸钾、阿斯巴甜',
    summary: '零糖饮料，代糖方案还可以，但不要过量',
    health_score: 7.0,
    likes_count: 18,
    comments_count: 3,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
]


function getScoreColor(score) {
  if (score >= 8) return 'text-green-600 bg-green-50'
  if (score >= 6) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export default function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likedPosts, setLikedPosts] = useState(new Set())

  useEffect(() => {
    loadPosts()
  }, [user])

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPosts()
      setPosts(data?.length ? data : [])

      // 恢复用户点赞状态
      if (user && data?.length) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map(p => p.id))
        if (userLikes) {
          setLikedPosts(new Set(userLikes.map(l => l.post_id)))
        }
      }
    } catch (e) {
      setError(e.message)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    const isLiked = likedPosts.has(postId)
    const newLiked = new Set(likedPosts)
    if (isLiked) {
      newLiked.delete(postId)
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p))
    } else {
      newLiked.add(postId)
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
    }
    setLikedPosts(newLiked)
    try {
      await toggleLike(postId, isLiked)
    } catch {
      // API 失败，重新加载数据恢复正确状态
      loadPosts()
    }
  }

  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null)
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [editPost, setEditPost] = useState(null)

  const handleDeletePost = async (postId) => {
    setDeleteConfirmPost(null)
    try {
      await deletePost(postId)
      setPosts(posts.filter(p => p.id !== postId))
    } catch {}
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="flex items-center justify-between pt-1 sm:pt-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌐 社区</h2>
          <p className="text-gray-500 mt-0.5 sm:mt-1 text-xs sm:text-base">看看别人扫到了什么，发现了什么</p>
        </div>
        {!user && (
          <Link to="/login" className="text-sm text-primary-600 hover:underline">
            登录后参与互动 →
          </Link>
        )}
      </section>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>无法加载最新数据：{error}</span>
        </div>
      )}

      {/* 空态 */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <PackageOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-lg">社区还没有分享</p>
          <p className="text-gray-300 text-sm mt-1">解读一个配料表，成为社区第一人 ✨</p>
        </div>
      )}

      {/* 帖子列表 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="card hover:shadow-md transition-shadow">
            {/* 用户信息 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm">
                {post.user_avatar || '👤'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {post.user_name || '食分用户'}
                </p>
                <p className="text-xs text-gray-400">{formatTime(post.created_at)}</p>
              </div>
              {/* 自己的帖子：编辑 + 删除 */}
              {user && user.id === post.user_id && (
                deleteConfirmPost === post.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:underline">确认</button>
                    <button onClick={() => setDeleteConfirmPost(null)} className="text-gray-400 hover:underline">取消</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setEditPost(post)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                      title="编辑"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmPost(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                      title="删除帖子"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              )}
            </div>

            {/* 配料原文 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">📝 配料表</p>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{post.ingredients}</p>
            </div>

            {/* 解读结果 */}
            <div className="flex items-start gap-3 mb-3">
              <span className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center ${getScoreColor(post.health_score)}`}>
                {post.health_score}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{post.summary}</p>
            </div>

            {/* 展开查看详情 */}
            {(() => {
              const analysis = post.analysis_json || {}
              const items = analysis.ingredients || []
              const isExpanded = expandedPostId === post.id
              return (
                <>
                  {items.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? '收起详情' : '查看成分详情'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3">
                          {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.riskLevel === '安全' || item.riskLevel === '低' ? 'bg-green-500' :
                                item.riskLevel === '慎用' || item.riskLevel === '高' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`} />
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <span className="text-gray-400">· {item.category}</span>
                              <span className="text-gray-500">{item.description}</span>
                            </div>
                          ))}
                          {analysis.overallAdvice && (
                            <div className="bg-primary-50 rounded-lg px-3 py-2 mt-2">
                              <p className="text-xs text-primary-700">💡 {analysis.overallAdvice}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}

            {/* 互动栏 */}
            <div className="flex items-center gap-4 text-gray-400 border-t border-gray-100 pt-3">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  likedPosts.has(post.id) ? 'text-red-500' : 'hover:text-red-500'
                }`}
              >
                <Heart size={16} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                {post.likes_count || 0}
              </button>
              <button className="flex items-center gap-1.5 text-sm hover:text-primary-500 transition-colors ml-auto">
                <Share2 size={16} />
                分享
              </button>
            </div>

            {/* 评论区 */}
            <CommentSection
              postId={post.id}
              commentCount={post.comments_count}
              onToggle={() => loadPosts()}
            />
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {editPost && (
        <EditPostModal
          post={editPost}
          onClose={() => setEditPost(null)}
          onSaved={(updated) => {
            setPosts(posts.map(p => p.id === updated.id ? updated : p))
            setEditPost(null)
          }}
        />
      )}
    </div>
  )
}
