import { useState, useRef } from 'react'
import { Send, Loader2, Search, Camera, ScanLine } from 'lucide-react'
import { analyzeIngredients } from '../lib/deepseek'
import { saveToLocalHistory } from '../lib/localHistory'
import AnalysisResult from '../components/AnalysisResult'

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const [scanning, setScanning] = useState(false)

  const handleBarcode = async () => {
    // 优先使用 BarcodeDetector API（Chrome）
    if ('BarcodeDetector' in window) {
      let stream = null
      try {
        setScanning(true)
        setScanLoading(true)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] })
        const detect = async () => {
          if (!videoRef.current) return
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue
            stream.getTracks().forEach(t => t.stop())
            setScanning(false)
            await lookupBarcode(code)
            return
          }
          requestAnimationFrame(detect)
        }
        detect()
        return
      } catch (e) {
        setScanning(false)
        stream && stream.getTracks().forEach(t => t.stop())
      }
    }
    // 回退：手动输入
    const code = prompt('请输入商品条码（13位数字）：')
    if (code) lookupBarcode(code)
    setScanLoading(false)
  }

  const lookupBarcode = async (code) => {
    setScanLoading(true)
    setError('')
    try {
      const res = await fetch('/api/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.ingredients) {
        setInput(data.ingredients)
      } else {
        setError(`找到「${data.name}」但无配料数据，请拍照识别`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setScanLoading(false)
    }
  }

  const handleOCR = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    setError('')
    try {
      // 转 base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(file)
      })

      // 调 OCR
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.text) setInput(data.text)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcrLoading(false)
    }
  }

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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleOCR}
          className="hidden"
        />
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            粘贴配料表文字
          </label>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {ocrLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            {ocrLoading ? '识别中...' : '拍照识别'}
          </button>
          <button
            onClick={handleBarcode}
            disabled={scanLoading}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {scanLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ScanLine size={14} />
            )}
            {scanLoading ? '查询中...' : '扫条码'}
          </button>
        </div>
        {/* 条码扫描器 */}
        {scanning && (
          <div className="relative w-full max-w-sm mx-auto aspect-video bg-black rounded-lg overflow-hidden mb-3">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <p className="absolute bottom-2 left-0 right-0 text-white text-xs text-center bg-black/40 py-1">
              将条码对准屏幕
            </p>
            <button
              onClick={() => {
                setScanning(false)
                setScanLoading(false)
                if (videoRef.current?.srcObject) {
                  videoRef.current.srcObject.getTracks().forEach(t => t.stop())
                }
              }}
              className="absolute top-2 right-2 text-white bg-black/40 rounded-full p-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}
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
