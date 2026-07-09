import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, MessageSquare, Trash2, Loader2, ExternalLink, ChevronLeft, AlertCircle, Shield, Edit3, Check, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function getTabs(isSuperAdmin) {
  const tabs = [
    { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { key: 'posts', label: '帖子', icon: FileText },
    { key: 'users', label: '用户', icon: Users },
    { key: 'comments', label: '评论', icon: MessageSquare },
  ]
  if (isSuperAdmin) {
    tabs.push({ key: 'admins', label: '管理员', icon: Shield })
  }
  return tabs
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}年${month}月${day}日 ${hour}:${min}`
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const [error, setError] = useState('')
  const isSuperAdmin = role === 'super_admin'

  // 统计数据
  const [stats, setStats] = useState({ users: 0, posts: 0, todayPosts: 0, todayComments: 0 })
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [user])

  const checkAdmin = async () => {
    if (!user) { navigate('/login'); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.role || profile.role === 'user') {
      navigate('/')
      return
    }
    setRole(profile.role)
    loadAll()
  }

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      // 统计数据
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const today = new Date().toISOString().split('T')[0]
      const { count: todayPostCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today)
      const { count: todayCommentCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', today)

      setStats({ users: userCount || 0, posts: postCount || 0, todayPosts: todayPostCount || 0, todayComments: todayCommentCount || 0 })

      // 帖子列表
      const { data: allPosts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100)
      setPosts(allPosts || [])

      // 用户列表
      const { data: allUsers } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false }).limit(100)
      setUsers(allUsers || [])

      // 评论列表
      const { data: allComments } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(100)
      setComments(allComments || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    setDeleteConfirm(null)
    try {
      await supabase.from('posts').delete().eq('id', postId)
      setPosts(posts.filter(p => p.id !== postId))
      setStats(s => ({ ...s, posts: s.posts - 1 }))
    } catch {}
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newEmail || !newPassword || newPassword.length < 6) return
    setCreating(true)
    setCreateMsg('')
    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (!url || !key) throw new Error('Supabase 未配置')
      const res = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': key },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.msg || data.message || ''
        if (msg.includes('already registered')) throw new Error('该邮箱已注册')
        throw new Error(msg || '注册失败')
      }
      // 为新用户创建 profile
      if (data.user?.id) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: newEmail.split('@')[0],
          avatar_emoji: '👤',
          role: 'user',
          status: 'active',
        })
      }
      setCreateMsg('创建成功')
      setNewEmail('')
      setNewPassword('')
      loadAll()
    } catch (e) {
      setCreateMsg('创建失败: ' + e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSaveUser = async () => {
    await supabase.from('profiles')
      .update({ display_name: editName, avatar_emoji: editAvatar, updated_at: new Date().toISOString() })
      .eq('id', editingUser)
    setUsers(users.map(u => u.id === editingUser ? { ...u, display_name: editName, avatar_emoji: editAvatar } : u))
    setEditingUser(null)
  }

  const handleDeleteUser = async (userId) => {
    setDeleteConfirm(null)
    try {
      await supabase.from('profiles').delete().eq('id', userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch {}
  }

  const handleDeleteComment = async (commentId) => {
    setDeleteConfirm(null)
    try {
      await supabase.from('comments').delete().eq('id', commentId)
      setComments(comments.filter(c => c.id !== commentId))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    )
  }

  if (!role) return null
  const tabs = getTabs(isSuperAdmin)

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <ChevronLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">⚙️ 后台管理</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Tab 导航 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ===== 仪表盘 ===== */}
      {tab === 'dashboard' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '总用户', value: stats.users },
            { label: '总帖子', value: stats.posts },
            { label: '今日帖子', value: stats.todayPosts },
            { label: '今日评论', value: stats.todayComments },
          ].map((item) => (
            <div key={item.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== 帖子管理 ===== */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无帖子</p>
          ) : (
            posts.map(p => {
              const analysis = p.analysis_json || {}
              const items = analysis.ingredients || []
              const isExpanded = deleteConfirm === `expand-${p.id}`
              return (
              <div key={p.id} className="card">
                {/* 头部信息行 */}
                <div className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center border ${
                    p.health_score >= 8 ? 'text-green-600 bg-green-50 border-green-200' :
                    p.health_score >= 6 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                    'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {p.health_score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.ingredients}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                      <span>{p.user_name || '食分用户'} {p.user_avatar || ''}</span>
                      <span>评分 {p.health_score} · {p.score_label || '一般'}</span>
                      {p.shared && <span className="text-green-500">已分享</span>}
                      {p.likes_count > 0 && <span>❤️ {p.likes_count}</span>}
                      {p.comments_count > 0 && <span>💬 {p.comments_count}</span>}
                      <span>{formatTime(p.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setDeleteConfirm(isExpanded ? null : `expand-${p.id}`)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                    >
                      <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {deleteConfirm === `del-${p.id}` ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button onClick={() => handleDeletePost(p.id)} className="text-red-500 hover:underline">确认</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:underline">取消</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(`del-${p.id}`)} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    {p.summary && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">AI 总结</p>
                        <p className="text-sm text-gray-700">{p.summary}</p>
                      </div>
                    )}
                    {items.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">成分列表 ({items.length})</p>
                        <div className="space-y-1">
                          {items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                item.riskLevel === '安全' || item.riskLevel === '低' ? 'bg-green-500' :
                                item.riskLevel === '慎用' || item.riskLevel === '高' ? 'bg-red-500' : 'bg-yellow-500'
                              }`} />
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-400">· {item.category} · {item.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.overallAdvice && (
                      <div className="bg-primary-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-primary-700">💡 {analysis.overallAdvice}</p>
                      </div>
                    )}
                    {analysis.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {analysis.tags.map((t, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )})
          )}
        </div>
      )}

      {/* ===== 用户管理 ===== */}
      {tab === 'users' && (
        <div className="space-y-3">
          {/* 创建用户 */}
          <form onSubmit={handleCreateUser} className="card flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">邮箱</label>
              <input
                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="user@example.com" className="input-field py-1.5 text-sm" required
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">密码</label>
              <input
                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="至少6位" className="input-field py-1.5 text-sm" minLength={6} required
              />
            </div>
            <button type="submit" disabled={creating} className="btn-primary py-1.5 text-sm flex-shrink-0">
              {creating ? '创建中...' : '创建用户'}
            </button>
          </form>
          {createMsg && (
            <p className={`text-xs px-3 py-1.5 rounded-lg ${createMsg.includes('失败') ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              {createMsg}
            </p>
          )}
          {users.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无用户</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="card flex items-center gap-3">
                {editingUser === u.id ? (
                  <>
                    <input
                      value={editAvatar}
                      onChange={e => setEditAvatar(e.target.value)}
                      className="text-lg w-10 h-10 text-center border border-gray-200 rounded-lg"
                      maxLength={4}
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="text-sm font-medium border border-gray-200 rounded px-2 py-1 w-full"
                        maxLength={20}
                      />
                    </div>
                    <button onClick={handleSaveUser} className="p-1.5 rounded hover:bg-green-50 text-green-500">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingUser(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg">{u.avatar_emoji || '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {u.display_name || '食分用户'}
                        {u.role === 'super_admin' && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">超级管理员</span>}
                        {u.role === 'admin' && <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">管理员</span>}
                        {u.status === 'banned' && <span className="ml-1.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">已封禁</span>}
                      </p>
                      <p className="text-xs text-gray-400">注册于 {u.updated_at ? formatTime(u.updated_at) : '未知'}</p>
                    </div>
                    {/* 状态切换：super_admin 可管所有人，admin 只能管普通用户 */}
                    {((isSuperAdmin && u.role !== 'super_admin') || (!isSuperAdmin && u.role === 'user')) && (
                      <select
                        value={u.status || 'active'}
                        onChange={async (e) => {
                          const newStatus = e.target.value
                          await supabase.from('profiles').update({ status: newStatus }).eq('id', u.id)
                          setUsers(users.map(x => x.id === u.id ? { ...x, status: newStatus } : x))
                        }}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none mr-1"
                      >
                        <option value="active">正常</option>
                        <option value="banned">封禁</option>
                      </select>
                    )}
                    <button
                      onClick={() => { setEditingUser(u.id); setEditName(u.display_name || ''); setEditAvatar(u.avatar_emoji || '👤') }}
                      className="p-1.5 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500"
                    >
                      <Edit3 size={14} />
                    </button>
                    {/* 删除用户：超级管理员可删，不能删自己 */}
                    {isSuperAdmin && u.id !== user.id && (
                      deleteConfirm === `user-${u.id}` ? (
                        <div className="flex items-center gap-1 text-xs">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:underline">确认</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:underline">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(`user-${u.id}`)} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== 评论管理 ===== */}
      {tab === 'comments' && (
        <div className="space-y-2">
          {comments.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无评论</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="card flex items-start gap-3">
                <span className="text-sm mt-0.5">{c.user_avatar || '👤'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.user_name || '食分用户'} · 帖#{c.post_id} · {formatTime(c.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link to="/community" className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-blue-400">
                    <ExternalLink size={14} />
                  </Link>
                  {deleteConfirm === `comment-${c.id}` ? (
                    <div className="flex items-center gap-1 text-xs">
                      <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 hover:underline">确认</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:underline">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(`comment-${c.id}`)} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== 管理员管理（仅超级管理员） ===== */}
      {tab === 'admins' && isSuperAdmin && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-2">设置或取消管理员权限</p>
          {users.length === 0 ? (
            <p className="text-center text-gray-400 py-12">暂无用户</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="card flex items-center gap-3">
                <span className="text-lg">{u.avatar_emoji || '👤'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{u.display_name || '食分用户'}</p>
                  <p className="text-xs text-gray-400">
                    {u.role === 'super_admin' ? '超级管理员' : u.role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
                {u.role !== 'super_admin' && isSuperAdmin && (
                  <select
                    value={u.role || 'user'}
                    onChange={async (e) => {
                      const newRole = e.target.value
                      await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
                      setUsers(users.map(x => x.id === u.id ? { ...x, role: newRole } : x))
                    }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                )}
                {u.role === 'super_admin' && (
                  <span className="text-xs text-gray-400">最高权限</span>
                )}
                {u.role !== 'user' && !isSuperAdmin && (
                  <span className="text-xs text-gray-400">无权限修改</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
