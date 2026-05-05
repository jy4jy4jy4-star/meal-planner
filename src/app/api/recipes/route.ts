import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const LEGACY_RECIPES_KEY = 'meal-planner:recipes'
// IDS_KEY is a Redis Set so concurrent SADD/SREM never lose updates.
const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

async function scanRecipeIds(): Promise<number[]> {
  const ids: number[] = []
  const prefix = 'meal-planner:recipe:'
  let cursor: string | number = 0
  let safety = 0
  do {
    const result: [string | number, string[]] = await redis.scan(cursor as number, { match: prefix + '*', count: 200 })
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

async function getAllIds(): Promise<number[]> {
  let ids: number[] = []
  // Current format: Redis Set
  try {
    const members = await redis.smembers(IDS_KEY)
    if (members && members.length > 0) {
      ids = members.map((m) => Number(m)).filter((n) => Number.isFinite(n))
    }
  } catch {
    // WRONGTYPE — IDS_KEY exists as a string from older deploys
  }
  // Older format: JSON-array string under same key
  if (ids.length === 0) {
    try {
      const arr = await redis.get<number[]>(IDS_KEY)
      if (arr && Array.isArray(arr) && arr.length > 0) {
        await redis.del(IDS_KEY)
        const [first, ...rest] = arr.map(String)
        await redis.sadd(IDS_KEY, first, ...rest)
        ids = arr
      }
    } catch {
      // ignore
    }
  }
  // Defensive recovery: scan for orphaned recipe:* keys not present in the index.
  // Concurrent upserts in older deploys could save the recipe value but lose the
  // ID from the JSON-array index due to read-modify-write races.
  try {
    const scanned = await scanRecipeIds()
    const known = new Set(ids)
    const missing = scanned.filter((id) => !known.has(id))
    if (missing.length > 0) {
      const [first, ...rest] = missing.map(String)
      await redis.sadd(IDS_KEY, first, ...rest)
      ids = [...ids, ...missing]
    }
  } catch (e) {
    console.error('scan recovery failed', e)
  }
  return ids
}

async function fetchRecipesByIds(ids: number[]): Promise<Recipe[]> {
  // Chunk to keep each Upstash response under size limits when recipes carry large base64 images.
  const CHUNK = 10
  const out: Recipe[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK)
    const keys = slice.map(RECIPE_KEY)
    try {
      const values = await redis.mget<(Recipe | null)[]>(...keys)
      for (const v of values) if (v) out.push(v)
    } catch (e) {
      console.error('mget chunk failed', { from: i, to: i + slice.length, err: e instanceof Error ? e.message : String(e) })
      // Fall back to per-key get so one bad/oversized recipe doesn't kill the whole batch
      for (const id of slice) {
        try {
          const r = await redis.get<Recipe>(RECIPE_KEY(id))
          if (r) out.push(r)
        } catch (e2) {
          console.error('get single recipe failed', { id, err: e2 instanceof Error ? e2.message : String(e2) })
        }
      }
    }
  }
  return out
}

async function loadAllRecipes(): Promise<Recipe[]> {
  const ids = await getAllIds()
  if (ids.length > 0) {
    return await fetchRecipesByIds(ids)
  }
  // migration from legacy single-key (whole array under one key)
  const legacy = await redis.get<Recipe[]>(LEGACY_RECIPES_KEY)
  if (legacy && legacy.length > 0) {
    const pipeline = redis.pipeline()
    for (const r of legacy) pipeline.set(RECIPE_KEY(r.id), r)
    pipeline.del(LEGACY_RECIPES_KEY)
    await pipeline.exec()
    if (legacy.length > 0) {
      const [first, ...rest] = legacy.map((r) => String(r.id))
      await redis.sadd(IDS_KEY, first, ...rest)
    }
    return legacy
  }
  return []
}

export async function GET() {
  try {
    const recipes = await loadAllRecipes()
    return NextResponse.json(recipes)
  } catch (e) {
    console.error('GET /api/recipes failed', e)
    return NextResponse.json([], { status: 200 })
  }
}

// Bulk POST is now ADDITIVE ONLY. It used to delete IDs that were not in the
// incoming list, but that caused data loss when stale browser caches sent partial
// recipe lists. Prefer /api/recipes/upsert and DELETE /api/recipes/[id] for
// explicit operations.
export async function POST(req: Request) {
  try {
    const recipes: Recipe[] = await req.json()
    const newIds = recipes.map((r) => r.id)

    const pipeline = redis.pipeline()
    for (const r of recipes) pipeline.set(RECIPE_KEY(r.id), r)
    if (newIds.length > 0) {
      const [first, ...rest] = newIds.map(String)
      pipeline.sadd(IDS_KEY, first, ...rest)
    }
    await pipeline.exec()

    return NextResponse.json({ ok: true, additiveOnly: true })
  } catch (e) {
    console.error('POST /api/recipes failed', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
