import { Link, useLocation } from 'react-router-dom'
import { Search, Users, User } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: '解读', icon: Search },
  { to: '/community', label: '社区', icon: Users },
  { to: '/profile', label: '我的', icon: User },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      {/* 顶部导航 — 桌面专用 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 hidden sm:block">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-lg no-underline">
            🥗 食分
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
            {user && (
              <span className="ml-2 w-2 h-2 rounded-full bg-primary-500" title="已登录" />
            )}
          </nav>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 pt-4 pb-3 sm:py-6">
        {children}
      </main>

      {/* 桌面底部 */}
      <footer className="hidden sm:block border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        <p>食分 — 配料表解读，吃得明明白白</p>
        <p className="mt-1">内容由 AI 生成，仅供参考，不构成医学建议</p>
      </footer>

      {/* 底部导航 — 手机专用 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[64px] px-3 rounded-lg text-xs transition-colors no-underline ${
                pathname === to
                  ? 'text-primary-600 font-medium'
                  : 'text-gray-400'
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
