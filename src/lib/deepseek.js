// AI 解读 — 生产环境走 Vercel 函数中转，开发环境直连 DeepSeek

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

    const systemPrompt = `你是一位专业的食品营养专家，擅长解读食品配料表。你的任务是用通俗易懂的中文，帮助普通消费者理解他们吃的食物。

请严格按照以下 JSON 格式返回结果（不要包含任何其他文字，只返回 JSON）：

{
  "summary": "一句话总结（不超过50字），告诉用户这东西整体怎么样",
  "healthScore": 7.5,
  "scoreLabel": "比较健康",
  "ingredients": [
    {
      "name": "成分名",
      "category": "基础原料 | 食品添加剂 | 甜味剂 | 防腐剂 | 色素 | 香精 | 其他",
      "riskLevel": "安全 | 注意 | 慎用",
      "description": "用通俗语言解释这个成分",
      "suitableFor": ["一般人群"],
      "notSuitableFor": ["糖尿病人群"]
    }
  ],
  "overallAdvice": "总体建议（30-100字）",
  "tags": ["高蛋白", "低糖"]
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
