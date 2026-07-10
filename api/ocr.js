// Vercel Serverless Function — 百度 OCR 代理
// 凭证存服务端，前端不可见

const BAIDU_API_KEY = process.env.BAIDU_OCR_API_KEY || ''
const BAIDU_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY || ''

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`,
    { method: 'POST' }
  )
  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    if (!BAIDU_API_KEY) return res.status(500).json({ error: '百度 OCR API Key 未配置' })

    const { image } = req.body // base64 图片
    if (!image) return res.status(400).json({ error: '未提供图片' })

    const token = await getAccessToken()
    const response = await fetch(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(image)}`,
      }
    )

    const data = await response.json()

    if (data.error_code) {
      return res.status(500).json({ error: `OCR 失败: ${data.error_msg}` })
    }

    const words = (data.words_result || []).map(w => w.words)

    // 找配料表起始位置
    const headerIdx = words.findIndex(line => /配料[表：:]|原料[：:]|成分[表：:]/ .test(line))
    let filtered = headerIdx >= 0 ? words.slice(headerIdx) : words

    // 温和过滤：去掉明确不是配料的噪音
    const separatorPattern = /[，,、、]/
    const noisePattern = /^[\d.]+[%克克gG毫升mLml]|保质期|生产日期|储存|贮藏|出品|地址|电话|网址|www|营养成分|能量|蛋白质|脂肪|碳水化合物|钠$/

    filtered = filtered.filter(line => {
      if (noisePattern.test(line)) return false  // 明确噪音
      if (line.length < 2) return false           // 单字
      return true
    })

    // 若过滤后太少，保留全部
    if (filtered.length < 2) filtered = words

    const text = filtered.join('，')

    return res.status(200).json({ text })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
