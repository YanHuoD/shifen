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
      saveToLocalHistory({ ingredients: input.trim(), analysis: data })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-[12vh] sm:pt-0 space-y-4 sm:space-y-6">
      {/* Hero */}
      <section className="text-center pt-4 pb-3 sm:py-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
          🥗 配料表，看得明明白白
        </h1>
        <p className="text-gray-500 text-sm sm:text-lg mt-1 sm:mt-2">
          输入食品配料表，AI 帮你解读每一行小字
        </p>
      </section>

      {/* 输入区域 */}
      <section className="card">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴配料表文字，如：小麦粉、白砂糖..."
          className="input-field min-h-[100px] sm:min-h-[120px] resize-y text-sm"
          rows={4}
        />
        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="hidden sm:flex gap-2 flex-wrap">
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
            className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? '分析中...' : '开始解读'}
          </button>
        </div>
        {/* 手机端示例横排 */}
        <div className="flex sm:hidden gap-1.5 mt-2 flex-wrap">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="text-xs text-gray-400 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full transition-colors border border-gray-100"
            >
              示例{i + 1}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </section>

      {/* 空态引导 */}
      {!result && !loading && (
        <section className="text-center py-8 sm:py-12">
          <Search size={36} className="mx-auto text-gray-200 sm:text-gray-300 mb-2 sm:mb-3" />
          <p className="text-gray-400 text-sm">粘贴配料表，点「开始解读」</p>
        </section>
      )}

      {/* 结果 */}
      {result && (
        <AnalysisResult data={result} ingredients={input} />
      )}
    </div>
  )
}
