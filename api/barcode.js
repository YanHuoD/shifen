// Vercel Serverless Function — 条码查商品配料
// 数据来源：Open Food Facts（免费全球商品数据库）

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { barcode } = req.body
    if (!barcode) return res.status(400).json({ error: '未提供条码' })

    const resp = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    )
    const data = await resp.json()

    if (!data.product) {
      return res.status(404).json({ error: '未找到该商品' })
    }

    const p = data.product
    const result = {
      name: p.product_name || '',
      brand: p.brands || '',
      ingredients: p.ingredients_text || '',
    }

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
