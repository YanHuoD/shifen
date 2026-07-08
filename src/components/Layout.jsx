import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Users, User, Menu, X, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { to: '/', label: '配料解读', icon: Search },
    { to: '/community', label: '社区', icon: Users },
    { to: '/profile', label: '我的', icon: User },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-lg no-underline">
            🥗 食分
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors no-underline ${
                  pathname === to
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}

            {/* 登录状态指示 */}
            {user && (
              <span className="ml-2 w-2 h-2 rounded-full bg-primary-500" title="已登录" />
            )}
          </nav>

          {/* 移动端菜单按钮 */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* 移动端菜单 */}
        {menuOpen && (
          <nav className="sm:hidden border-t border-gray-100 bg-white px-4 py-2 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors no-underline ${
                  pathname === to
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors no-underline"
              >
                <LogIn size={18} />
                登录
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        <p>食分 — 配料表解读，吃得明明白白</p>
        <p className="mt-1">内容由 AI 生成，仅供参考，不构成医学建议</p>
      </footer>
    </div>
  )
}
