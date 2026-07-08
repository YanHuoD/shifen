import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { signIn, signUp, isReady } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const data = await signUp(email, password)
        if (data.user && !data.session) {
          // Supabase 默认需要邮箱确认，也可能直接登录
          setSuccess('注册成功！请查收邮箱验证邮件（如有），或直接登录。')
        } else {
          setSuccess('注册成功！')
          setTimeout(() => navigate('/profile'), 1000)
        }
      } else {
        await signIn(email, password)
        // 检查是否被封禁
        const { data: profile } = await supabase.from('profiles').select('status').eq('id', (await supabase.auth.getSession()).data.session?.user?.id).maybeSingle()
        if (profile?.status === 'banned') {
          await supabase.auth.signOut()
          setError('该账号已被封禁，请联系管理员')
          return
        }
        navigate('/profile')
      }
    } catch (err) {
      // 翻译常见错误
      const msg = err.message || '未知错误'
      if (msg.includes('Invalid login credentials')) {
        setError('邮箱或密码错误')
      } else if (msg.includes('User already registered')) {
        setError('该邮箱已注册，请直接登录')
      } else if (msg.includes('Supabase 未配置')) {
        setError('用户系统尚未配置，请联系开发者')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? '👋 欢迎回来' : '🎉 注册账号'}
        </h2>
        <p className="text-gray-500 mt-1">
          {mode === 'login' ? '登录后查看解读历史和社区互动' : '注册后解锁全部功能'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* Supabase 未配置提示 */}
        {!isReady && (
          <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Supabase 尚未配置。请在 .env 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field pl-10"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isReady}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {mode === 'login' ? '登录' : '注册'}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
        )}

        <p className="text-sm text-center text-gray-400">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
            className="text-primary-600 hover:underline ml-1"
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </p>
      </form>
    </div>
  )
}
