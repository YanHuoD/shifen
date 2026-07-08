// DeepSeek API 封装
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'

/**
 * 解析配料表，返回结构化解读
 * @param {string} ingredients — 用户输入的配料表原文
 * @param {object} userContext — 可选：用户画像（年龄、目标等）
 * @returns {object} 结构化解读结果
 */
export async function analyzeIngredients(ingredients, userContext = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API Key 未配置，请在 .env 中设置 VITE_DEEPSEEK_API_KEY')
  }

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

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
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

  // 尝试从回复中提取 JSON
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`AI 返回结果解析失败：${content.slice(0, 200)}`)
  }
}
