import { Link, useNavigate } from 'react-router-dom'
import { History, Settings, LogOut, ChevronRight, Mail, Calendar, Loader2, FileText, Heart, MessageSquare, Edit3, Shield } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import ProfileEditModal from '../components/ProfileEditModal'
import { scoreBadge } from '../lib/utils'

export default function Profile() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0 })
  const [recentPosts, setRecentPosts] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    setStatsLoading(true)
    try {
      // 加载 profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        if (profileData.role && profileData.role !== 'user') setIsAdmin(true)
      }

      // 统计帖子数
      const { data: myPosts } = await supabase
        .from('posts')
        .select('id, likes_count')
        .eq('user_id', user.id)

      const postCount = myPosts?.length || 0
      const totalLikes = myPosts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0

      // 统计评论数（别人在自己帖子下的评论）
      let commentCount = 0
      if (myPosts?.length) {
        const { count } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .in('post_id', myPosts.map(p => p.id))
        commentCount = count || 0
      }

      setStats({
        posts: postCount,
        likes: totalLikes,
        comments: commentCount,
      })

      // 最近已分享的帖子
      const { data: recent } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('shared', true)
        .order('created_at', { ascending: false })
        .limit(3)

      setRecentPosts(recent || [])
    } catch (e) {
      // 静默失败，统计保持 0
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut()
    setLoggingOut(false)
    navigate('/')
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    )
  }

  // 未登录
  if (!user) {
    return (
      <div className="max-w-sm mx-auto pt-12 text-center">
        <p className="text-5xl mb-4">🥗</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">登录解锁更多功能</h2>
        <p className="text-gray-500 mb-6">记录解读历史、参与社区互动、保存个人偏好</p>
        <Link to="/login" className="btn-primary inline-block no-underline">
          去登录
        </Link>
      </div>
    )
  }

  // 已登录
  const displayName = profile?.display_name || user.email?.split('@')[0] || '食分用户'
  const avatarEmoji = profile?.avatar_emoji || '👤'
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '未知'


  return (
    <div className="space-y-6 max-w-sm mx-auto">
      {/* 用户信息卡片 */}
      <section className="card text-center relative">
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="编辑资料"
        >
          <Edit3 size={16} />
        </button>
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">{avatarEmoji}</span>
        </div>
        <h3 className="font-semibold text-gray-900">{displayName}</h3>
        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 mt-1">
          <Mail size={14} />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-0.5">
          <Calendar size={12} />
          <span>{joinDate} 加入</span>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="card">
        {statsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.posts}</p>
              <p className="text-xs text-gray-400">社区分享</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.likes}</p>
              <p className="text-xs text-gray-400">获得点赞</p>
            </div>
            <Link to="/history?tab=comments" className="no-underline">
              <p className="text-xl font-bold text-gray-900">{stats.comments}</p>
              <p className="text-xs text-gray-400">评论</p>
            </Link>
          </div>
        )}
      </section>

      {/* 最近记录 */}
      <section className="card p-0">
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            最近分享
          </h4>
          <span className="text-xs text-gray-400">{stats.posts} 条</span>
        </div>
        {recentPosts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">还没有解读记录</p>
            <Link to="/" className="text-xs text-primary-500 hover:underline mt-1 inline-block">
              去解读一个配料表 →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-3 flex items-center gap-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center ${scoreBadge(post.health_score)}`}>
                  {post.health_score}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{post.ingredients}</p>
                  <p className="text-xs text-gray-400 truncate">{post.summary}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-300 mt-0.5">
                    {post.likes_count > 0 && <span>❤️ {post.likes_count}</span>}
                    {post.comments_count > 0 && <span>💬 {post.comments_count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {stats.posts > 0 && (
          <Link to="/history" className="block px-6 py-3 text-center text-xs text-primary-500 hover:underline border-t border-gray-50 no-underline">
            查看全部 {stats.posts} 条 →
          </Link>
        )}
      </section>

      {/* 功能列表 */}
      <section className="card divide-y divide-gray-100 p-0">
        <Link to="/history" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors no-underline">
          <div className="flex items-center gap-3">
            <History size={20} className="text-gray-400" />
            <span className="text-gray-700">历史记录</span>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors no-underline">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-400" />
              <span className="text-gray-700">后台管理</span>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </Link>
        )}
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors w-full text-left"
        >
          <div className="flex items-center gap-3">
            {loggingOut ? (
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            ) : (
              <LogOut size={20} className="text-red-400" />
            )}
            <span className="text-red-500">{loggingOut ? '退出中...' : '退出登录'}</span>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </section>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <ProfileEditModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSaved={(newProfile) => setProfile(newProfile)}
        />
      )}
    </div>
  )
}
