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
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'API Key 未配置，请在 Vercel 环境变量中设置 DEEPSEEK_API_KEY' })

    const { ingredients } = req.body
    if (!ingredients) return res.status(400).json({ error: 'Missing ingredients' })

    const systemPrompt = `你是一位专业的食品营养专家，擅长解读食品配料表。你的任务是用通俗易懂的中文，帮助普通消费者理解他们吃的食物。

请严格按照以下 JSON 格式返回结果（不要包含任何其他文字，只返回 JSON）：

{
  "summary": "一句话总结（不超过50字），告诉用户这东西整体怎么样",
  "healthScore": 7.5,  // 1-10分，10分最健康
  "scoreLabel": "比较健康",  // 对应的等级标签
  "ingredients": [
    {
      "name": "成分名",
      "category": "基础原料 | 食品添加剂 | 甜味剂 | 防腐剂 | 色素 | 香精 | 其他",
      "riskLevel": "安全 | 注意 | 慎用",
      "description": "用通俗语言解释这个成分是干什么的，对健康有什么影响（20-80字）",
      "suitableFor": ["一般人群", "孕妇", "儿童"],  // 适合哪些人群
      "notSuitableFor": ["糖尿病人群"]  // 不适合哪些人群
    }
  ],
  "overallAdvice": "总体建议（30-100字）：这东西适合谁，不适合谁，吃多少合适",
  "tags": ["高蛋白", "低糖"]  // 标签，最多5个
}

分析要点：
1. 注意区分"配料"和"营养成分"——用户可能会混合输入，都要处理
2. 对食品添加剂要特别说明其安全性和用途
3. 考虑宝妈、减脂健身人群、慢性病患者等特殊人群的关切
4. 语气要客观、专业但不吓唬人，避免制造食品安全焦虑
5. 如果有不确定的成分，诚实标注，不要编造`

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

    if (!response.ok) {
      const errText = await response.text()
      return res.status(500).json({ error: `DeepSeek API 报错: ${response.status} ${errText.slice(0, 200)}` })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(jsonStr)

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
