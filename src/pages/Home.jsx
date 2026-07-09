import { useState } from 'react'
import { Send, Loader2, Search } from 'lucide-react'
import { analyzeIngredients } from '../lib/deepseek'
import { saveToLocalHistory } from '../lib/localHistory'
import AnalysisResult from '../components/AnalysisResult'

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // 示例配料表
  const examples = [
    '小麦粉、白砂糖、精炼植物油、可可粉、碳酸氢钠、食用香精',
    '水、赤藓糖醇、柠檬酸、柠檬酸钠、山梨酸钾、阿斯巴甜、安赛蜜',
    '全脂乳粉、脱脂乳粉、麦芽糊精、低聚果糖、乳清蛋白粉、维生素D、碳酸钙',
  ]

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await analyzeIngredients(input.trim())
      setResult(data)
      // 自动保存到本地历史
      saveToLocalHistory({ ingredients: input.trim(), analysis: data })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="text-center py-3 sm:py-6">
        <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
          🥗 配料表，看得明明白白
        </h1>
        <p className="text-gray-500 text-sm sm:text-lg">
          输入食品配料表，AI 帮你解读每一行小字
        </p>
      </section>

      {/* 输入区域 */}
      <section className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          粘贴配料表文字
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：小麦粉、白砂糖、精炼植物油、可可粉、碳酸氢钠、食用香精..."
          className="input-field min-h-[120px] resize-y"
          rows={4}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-2 flex-wrap">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
              >
                示例{i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {loading ? '分析中...' : '开始解读'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </section>

      {/* 占位 / 引导 */}
      {!result && !loading && (
        <section className="text-center py-12">
          <div className="max-w-sm mx-auto space-y-3">
            <Search size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-400">输入配料表开始分析</p>
            <p className="text-gray-300 text-sm">
              把食品包装上的配料表粘贴到上方输入框，或者点一个示例试试
            </p>
          </div>
        </section>
      )}

      {/* 结果区域 */}
      {result && (
        <AnalysisResult data={result} ingredients={input} />
      )}
    </div>
  )
}
