import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Loader2, ChevronDown, FileText, PackageOpen, Trash2, MessageSquare, ExternalLink, Share2, Edit3 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { getLocalHistory, deleteLocalHistory } from '../lib/localHistory'
import EditPostModal from '../components/EditPostModal'
import { formatTime } from '../lib/utils'


function getScoreColor(score) {
  if (score >= 8) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

export default function History() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'comments' ? 'comments' : 'posts')
  const [comments, setComments] = useState([])
  const [profile, setProfile] = useState(null)

  const handleDelete = async (post) => {
    setDeleteConfirm(null)
    setDeleteError('')
    try {
      if (post.isLocal) {
        deleteLocalHistory(post.id)
      } else {
        const { error } = await supabase.from('posts').delete().eq('id', post.id)
        if (error) throw error
      }
      setPosts(posts.filter(p => p.id !== post.id))
    } catch (e) {
      setDeleteError(e.message || '删除失败')
    }
  }

  useEffect(() => {
    if (user) {
      loadProfile()
      loadHistory()
      loadMyComments()
    } else setLoading(false)
  }, [user])

  const [shareLoading, setShareLoading] = useState(null)
  const [editPost, setEditPost] = useState(null)

  const handleShareLocal = async (post) => {
    setShareLoading(post.id)
    try {
      const { data: profileData } = await supabase.from('profiles').select('display_name,avatar_emoji').eq('id', user.id).maybeSingle()
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        user_name: profileData?.display_name || user.email?.split('@')[0] || '食分用户',
        user_avatar: profileData?.avatar_emoji || '👤',
        ingredients: post.ingredients,
        summary: post.summary,
        health_score: post.health_score,
        score_label: post.score_label,
        analysis_json: post.analysis_json,
        shared: true,
        created_at: new Date().toISOString(),
      })
      if (error) throw error
      // 从本地删除，刷新列表
      deleteLocalHistory(post.id)
      loadHistory()
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setShareLoading(null)
    }
  }

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile(data)
  }

  const loadHistory = async () => {
    // 本地历史（未分享的）
    const local = getLocalHistory().map(item => ({
      ...item,
      isLocal: true,
      health_score: item.analysis?.healthScore,
      summary: item.analysis?.summary,
      score_label: item.analysis?.scoreLabel,
      analysis_json: item.analysis,
    }))

    // 数据库记录（已分享的）
    if (user) {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      // 合并，按时间排序
      const all = [...local, ...(data || [])]
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setPosts(all)
    } else {
      setPosts(local)
    }
    setLoading(false)
  }

  const loadMyComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setComments(data || [])
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-sm mx-auto pt-12 text-center">
        <p className="text-5xl mb-4">📋</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">登录后查看解读历史</h2>
        <p className="text-gray-500 mb-6">你的每次配料分析都会记录在这里</p>
        <Link to="/login" className="btn-primary inline-block no-underline">
          去登录
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* 顶部 */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/profile" className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab('posts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm transition-colors ${
                tab === 'posts' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'
              }`}
            >
              <FileText size={14} />
              全部记录
            </button>
            <button
              onClick={() => setTab('comments')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm transition-colors ${
                tab === 'comments' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'
              }`}
            >
              <MessageSquare size={14} />
              我的评论
            </button>
          </div>
        </div>
      </div>

      {deleteError && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
      )}

      {/* ===== 我的分享 ===== */}
      {tab === 'posts' && (
      <>
      {/* 空态 */}
      {posts.length === 0 && (
        <div className="text-center py-16">
          <PackageOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">还没有分享记录</p>
          <Link to="/" className="text-sm text-primary-500 hover:underline mt-1 inline-block">
            去首页开始第一次解读 →
          </Link>
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-3">
        {posts.map((post) => {
          const isExpanded = expandedId === post.id
          const analysis = post.analysis_json || {}
          const items = analysis.ingredients || []

          return (
            <div key={post.id} className="card hover:shadow-md transition-shadow">
              {/* 标题行 */}
              <div className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center border ${getScoreColor(post.health_score)}`}>
                  {post.health_score}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{post.ingredients}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>{formatTime(post.created_at)}</span>
                    {post.isLocal ? (
                      <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">未分享</span>
                    ) : (
                      <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">已分享</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {/* 分享按钮（仅本地记录） */}
                  {post.isLocal && (
                    <button
                      onClick={() => handleShareLocal(post)}
                      disabled={shareLoading === post.id}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-300 hover:text-primary-500 transition-colors"
                      title="分享到社区"
                    >
                      {shareLoading === post.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Share2 size={16} />
                      )}
                    </button>
                  )}
                  {/* 编辑按钮（仅已分享的帖子） */}
                  {!post.isLocal && (
                    <button
                      onClick={() => setEditPost(post)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                      title="编辑"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-1 text-xs">
                      <button onClick={() => handleDelete(post)} className="text-red-500 hover:underline px-1">确认</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:underline px-1">取消</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* 展开内容 */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  {/* 总结 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">综合评价</p>
                    <p className="text-sm text-gray-700">{post.summary}</p>
                  </div>

                  {/* 成分列表 */}
                  {items.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">成分 ({items.length})</p>
                      <div className="space-y-1.5">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.riskLevel === '安全' || item.riskLevel === '低' ? 'bg-green-500' :
                              item.riskLevel === '慎用' || item.riskLevel === '高' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`} />
                            <span className="font-medium text-gray-700">{item.name}</span>
                            <span className="text-gray-400">{item.riskLevel || item.risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建议 */}
                  {analysis.overallAdvice && (
                    <div className="bg-primary-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-primary-600">{analysis.overallAdvice}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </>
      )}

      {/* ===== 我的评论 ===== */}
      {tab === 'comments' && (
      <>
      {comments.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">还没有评论过</p>
          <Link to="/community" className="text-sm text-primary-500 hover:underline mt-1 inline-block">
            去社区参与讨论 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card">
              <p className="text-sm text-gray-700 mb-2">💬 {c.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{c.user_avatar || profile?.avatar_emoji || '👤'}</span>
                  <span>{c.user_name || profile?.display_name || '食分用户'}</span>
                  <span>·</span>
                  <span>{formatTime(c.created_at)}</span>
                </div>
                <Link
                  to="/community"
                  className="flex items-center gap-1 text-xs text-primary-500 hover:underline no-underline flex-shrink-0"
                >
                  <ExternalLink size={12} />
                  查看原帖
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

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
