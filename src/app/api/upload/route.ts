import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Cloudinaryに画像をアップロードするAPI。
// クライアントは multipart/form-data で "file" フィールドに画像ファイルを送る。
// 成功時: { url: "https://res.cloudinary.com/..." } を返す。
//
// API_SECRET は絶対にクライアントに渡さないため、サーバ側で署名を作って
// Cloudinaryに送る "Signed Upload" 方式を採用している。

export const runtime = 'nodejs' // crypto を使うので Node ランタイム必須

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB（Vercelのリクエスト上限は約4.5MBだが将来用にゆとり）

export async function POST(req: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary credentials are not configured on the server' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided (field name: "file")' }, { status: 400 })
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large: ${Math.round(file.size / 1024)}KB (max ${MAX_FILE_BYTES / 1024 / 1024}MB)` },
        { status: 413 }
      )
    }

    // ファイル本体を base64 dataURI に変換（Cloudinaryのアップロードに最も互換性がある形式）
    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type || 'image/jpeg'
    const dataUri = `data:${mime};base64,${buffer.toString('base64')}`

    // Cloudinary 署名作成
    // 署名するパラメータは「file, api_key, resource_type, cloud_name, signature 以外の全パラメータ」を
    // アルファベット順に key=value & で連結し、末尾に API_SECRET を付け SHA1。
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'meal-planner'
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex')

    // Cloudinary アップロード（multipart/form-data）
    const uploadForm = new FormData()
    uploadForm.append('file', dataUri)
    uploadForm.append('api_key', apiKey)
    uploadForm.append('timestamp', String(timestamp))
    uploadForm.append('folder', folder)
    uploadForm.append('signature', signature)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const res = await fetch(uploadUrl, { method: 'POST', body: uploadForm })
    const text = await res.text()
    if (!res.ok) {
      console.error('Cloudinary upload failed', { status: res.status, body: text })
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${res.status} ${text.slice(0, 300)}` },
        { status: 502 }
      )
    }

    let data: { secure_url?: string; public_id?: string }
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: `Cloudinary returned non-JSON: ${text.slice(0, 200)}` }, { status: 502 })
    }
    if (!data.secure_url) {
      return NextResponse.json({ error: 'Cloudinary response missing secure_url' }, { status: 502 })
    }

    return NextResponse.json({ url: data.secure_url, public_id: data.public_id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('upload route error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
