// AI 解读 — 生产环境走 Vercel 函数中转，开发环境直连 DeepSeek
import { SYSTEM_PROMPT } from './prompt'

/**
 * 解析配料表，返回结构化解读
 * @param {string} ingredients — 用户输入的配料表原文
 * @returns {object} 结构化解读结果
 */
export async function analyzeIngredients(ingredients) {
  const isProd = import.meta.env.PROD

  if (isProd) {
    // 生产：走 Vercel Serverless 函数，Key 在服务端
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `请求失败: ${response.status}`)
    }
    return response.json()
  } else {
    // 开发：直连 DeepSeek
    const key = import.meta.env.VITE_DEEPSEEK_API_KEY
    if (!key) throw new Error('DeepSeek API Key 未配置')

    const systemPrompt = SYSTEM_PROMPT

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请分析以下配料表：\n\n${ingredients}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`DeepSeek API 调用失败: ${response.status} ${err}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  }
}
