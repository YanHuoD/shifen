// Vercel Serverless Function — DeepSeek API 代理
// Key 存在 Vercel 环境变量，不暴露到前端

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { ingredients } = req.body
    if (!ingredients) return res.status(400).json({ error: 'Missing ingredients' })

    const systemPrompt = `你是一位专业的食品营养专家，擅长解读食品配料表。用通俗易懂的中文帮助普通消费者理解他们吃的食物。

请严格按照以下 JSON 格式返回结果（只返回 JSON）：
{
  "summary": "一句话总结（不超过50字）",
  "healthScore": 7.5,
  "scoreLabel": "比较健康",
  "ingredients": [
    {
      "name": "成分名",
      "category": "基础原料 | 食品添加剂 | 甜味剂 | 防腐剂 | 色素 | 香精 | 其他",
      "riskLevel": "安全 | 注意 | 慎用",
      "description": "通俗解释（20-80字）",
      "suitableFor": ["一般人群"],
      "notSuitableFor": ["糖尿病人群"]
    }
  ],
  "overallAdvice": "总体建议（30-100字）",
  "tags": ["高蛋白", "低糖"]
}`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonStr)

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
