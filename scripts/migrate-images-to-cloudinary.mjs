// 既存レシピの base64 画像を Cloudinary に移行するスクリプト。
//
// 実行方法（プロジェクトルートで）:
//   node --env-file=.env.local scripts/migrate-images-to-cloudinary.mjs --dry-run
//     → 何件移行されるか確認するだけ（Cloudinaryには上げない・Redisも書き換えない）
//   node --env-file=.env.local scripts/migrate-images-to-cloudinary.mjs
//     → 実行（Cloudinaryアップロード＆Upstash更新）
//
// 必要な環境変数（すべて .env.local に設定済みであること）:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
//
// 動作:
//   1. Upstashから全レシピIDを取得
//   2. 各レシピを読み、image が "data:image" で始まるbase64ならCloudinaryへアップロード
//   3. recipe.image を返ってきた secure_url に置き換え、Upstashへ書き戻す
//   4. 進捗を順次ログ出力、最後にサマリを表示
//
// Node 20.6+ 必須（--env-file フラグ使用）。

import { Redis } from '@upstash/redis'
import crypto from 'node:crypto'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing env: ${name}. Did you run with: node --env-file=.env.local scripts/migrate-images-to-cloudinary.mjs ?`)
    process.exit(1)
  }
}
requireEnv('UPSTASH_REDIS_REST_URL', upstashUrl)
requireEnv('UPSTASH_REDIS_REST_TOKEN', upstashToken)
requireEnv('CLOUDINARY_CLOUD_NAME', cloudName)
requireEnv('CLOUDINARY_API_KEY', apiKey)
requireEnv('CLOUDINARY_API_SECRET', apiSecret)

const redis = new Redis({ url: upstashUrl, token: upstashToken })

const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id) => `meal-planner:recipe:${id}`

async function getAllRecipeIds() {
  // 現行: Redis Set。古いデプロイ: JSON配列文字列。両対応。
  try {
    const members = await redis.smembers(IDS_KEY)
    if (members && members.length > 0) {
      return members.map((m) => Number(m)).filter((n) => Number.isFinite(n))
    }
  } catch {
    // ignore — fall through
  }
  try {
    const arr = await redis.get(IDS_KEY)
    if (Array.isArray(arr)) return arr.filter((n) => Number.isFinite(n))
  } catch {
    // ignore
  }
  // 念のためSCANでrecipe:*をフォールバック取得
  const ids = []
  const prefix = 'meal-planner:recipe:'
  let cursor = 0
  let safety = 0
  do {
    const result = await redis.scan(cursor, { match: prefix + '*', count: 200 })
    cursor = result[0]
    for (const key of result[1]) {
      const id = Number(key.slice(prefix.length))
      if (Number.isFinite(id)) ids.push(id)
    }
    safety++
    if (safety > 50) break
  } while (cursor !== 0 && cursor !== '0')
  return ids
}

async function uploadToCloudinary(dataUri) {
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'meal-planner'
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex')

  const fd = new FormData()
  fd.append('file', dataUri)
  fd.append('api_key', apiKey)
  fd.append('timestamp', String(timestamp))
  fd.append('folder', folder)
  fd.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${text.slice(0, 300)}`)
  const data = JSON.parse(text)
  if (!data.secure_url) throw new Error(`No secure_url in response: ${text.slice(0, 200)}`)
  return data.secure_url
}

async function main() {
  console.log(`\n=== base64 → Cloudinary 移行スクリプト ${dryRun ? '(dry-run)' : ''} ===\n`)

  const ids = await getAllRecipeIds()
  console.log(`Upstashから ${ids.length} 件のレシピIDを取得しました`)

  let migrated = 0
  let alreadyUrl = 0
  let noImage = 0
  let notFound = 0
  let failed = 0

  for (const id of ids) {
    let recipe
    try {
      recipe = await redis.get(RECIPE_KEY(id))
    } catch (e) {
      console.error(`[id=${id}] 取得失敗: ${e.message}`)
      failed++
      continue
    }
    if (!recipe) { notFound++; continue }
    const img = recipe.image
    if (!img || typeof img !== 'string' || img.length === 0) { noImage++; continue }
    if (!img.startsWith('data:image')) {
      alreadyUrl++
      continue
    }

    const sizeKB = Math.round(img.length / 1024)
    process.stdout.write(`[id=${recipe.id}] ${recipe.name}  ${sizeKB}KB base64 …`)
    if (dryRun) {
      console.log(' (dry-run: スキップ)')
      migrated++
      continue
    }
    try {
      const url = await uploadToCloudinary(img)
      recipe.image = url
      await redis.set(RECIPE_KEY(id), recipe)
      console.log(`\n  → ${url}`)
      migrated++
    } catch (e) {
      console.log('')
      console.error(`  failed: ${e.message}`)
      failed++
    }
  }

  console.log('\n=== 移行サマリ ===')
  console.log(`  ${dryRun ? '移行対象' : '移行成功'} : ${migrated} 件`)
  console.log(`  すでにURL : ${alreadyUrl} 件（スキップ）`)
  console.log(`  画像なし   : ${noImage} 件（スキップ）`)
  console.log(`  取得不能   : ${notFound} 件`)
  console.log(`  失敗       : ${failed} 件`)
  if (dryRun) {
    console.log('\n本番実行する場合は --dry-run を外して再実行してください。')
  } else if (migrated > 0) {
    console.log('\n移行完了。Upstashの容量が大幅に減ります（base64 → 短いURL）。')
  }
}

main().catch((e) => {
  console.error('スクリプト全体の異常終了:', e)
  process.exit(1)
})
