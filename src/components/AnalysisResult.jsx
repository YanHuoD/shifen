import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, AlertTriangle, CheckCircle2, Info, Share2, Loader2, Check } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { createPost } from '../lib/api'
import { scoreText, scoreCard } from '../lib/utils'

const riskConfig = {
  '安全': { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  '注意': { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  '慎用': { icon: Info, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

// 规范化 AI 返回的各种风险等级表述
function normalizeRisk(level) {
  if (!level) return '注意'
  const low = ['安全', '低', 'low', 'safe', '无害']
  const medium = ['注意', '中', 'medium', 'caution', '谨慎使用', '限量']
  const high = ['慎用', '高', 'high', 'danger', '危险', '避免']
  if (low.some(s => level.includes(s))) return '安全'
  if (high.some(s => level.includes(s))) return '慎用'
  return '注意'
}


export default function AnalysisResult({ data, ingredients }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { summary, healthScore, scoreLabel, ingredients: items, overallAdvice, tags } = data

  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [shareError, setShareError] = useState('')

  const handleShareToCommunity = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setSharing(true)
    setShareError('')
    try {
      await createPost({ ingredients, analysis: data })
      setShared(true)
    } catch (e) {
      setShareError(e.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 一句话总结 + 评分 */}
      <section className="card flex flex-col sm:flex-row gap-4 items-start">
        <div className={`flex-shrink-0 w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center ${scoreCard(healthScore)}`}>
          <span className={`text-2xl font-bold ${scoreText(healthScore)}`}>
            {healthScore}
          </span>
          <span className={`text-xs font-medium ${scoreText(healthScore)}`}>
            {scoreLabel || '一般'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">📋 综合评价</h3>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
          {tags && tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {tags.map((tag, i) => (
                <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 成分逐条解读 */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🔬 成分逐条解读</h3>
        <div className="space-y-3">
          {items?.map((item, i) => {
            const risk = riskConfig[normalizeRisk(item.riskLevel)]
            const RiskIcon = risk.icon
            return (
              <div key={i} className={`card border-l-4 ${risk.border}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${risk.bg} ${risk.color} font-medium`}>
                      <RiskIcon size={12} className="inline mr-0.5" />
                      {item.riskLevel}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{item.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {item.suitableFor?.length > 0 && (
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      ✅ 适合：{item.suitableFor.join('、')}
                    </span>
                  )}
                  {item.notSuitableFor?.length > 0 && (
                    <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      ⚠️ 慎用：{item.notSuitableFor.join('、')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 总体建议 */}
      {overallAdvice && (
        <section className="card bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800 mb-2">💡 总体建议</h3>
          <p className="text-primary-700 leading-relaxed">{overallAdvice}</p>
        </section>
      )}

      {/* 分享到社区 */}
      <div className="flex justify-center">
        <button
          onClick={handleShareToCommunity}
          disabled={sharing || shared}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
            shared
              ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
              : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 hover:border-primary-300'
          }`}
        >
          {sharing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : shared ? (
            <Check size={16} />
          ) : (
            <Share2 size={16} />
          )}
          {shared ? '已分享到社区' : sharing ? '分享中...' : '分享到社区'}
        </button>
        {shareError && (
          <p className="mt-2 text-sm text-red-500">{shareError}</p>
        )}
      </div>

      {/* 声明 */}
      <p className="text-xs text-gray-400 text-center">
        ⚠️ 以上解读由 AI 生成，仅供参考，不构成医学或营养建议。
        如有特殊饮食需求，请咨询专业医师或营养师。
      </p>
    </div>
  )
}
