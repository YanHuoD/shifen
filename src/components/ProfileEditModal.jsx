import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EMOJI_OPTIONS = ['👤', '👩', '👨', '👩‍👧', '💪', '🏃', '🥗', '🍎', '👩‍🍳', '🧘', '🤱', '🎯']

export default function ProfileEditModal({ profile, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || '👤')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // upsert: 有就更新，没有就插入
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          avatar_emoji: avatar,
          updated_at: new Date().toISOString(),
        })

      if (upsertError) throw upsertError
      onSaved({ display_name: displayName.trim(), avatar_emoji: avatar })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">编辑个人信息</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 头像选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'bg-primary-100 ring-2 ring-primary-500 scale-110'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="给自己起个名字"
              maxLength={20}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
