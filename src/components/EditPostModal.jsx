import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EditPostModal({ post, onClose, onSaved }) {
  const [ingredients, setIngredients] = useState(post.ingredients || '')
  const [summary, setSummary] = useState(post.summary || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!ingredients.trim()) return
    setSaving(true)
    setError('')
    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          ingredients: ingredients.trim(),
          summary: summary.trim(),
        })
        .eq('id', post.id)

      if (updateError) throw updateError
      onSaved({ ...post, ingredients: ingredients.trim(), summary: summary.trim() })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm mx-0 sm:mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">编辑帖子</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配料表</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="input-field min-h-[80px] resize-y text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">总结</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="input-field min-h-[60px] resize-y text-sm"
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !ingredients.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
