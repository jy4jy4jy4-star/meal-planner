import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const LEGACY_RECIPES_KEY = 'meal-planner:recipes'
// IDS_KEY is a Redis Set so concurrent SADD/SREM never lose updates.
const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

async function getAllIds(): Promise<number[]> {
  // Try as Set first (current format)
  try {
    const members = await redis.smembers(IDS_KEY)
    if (members && members.length > 0) {
      return members.map((m) => Number(m)).filter((n) => Number.isFinite(n))
    }
  } catch {
    // key may exist as a different type from older deploys — fall through to migration
  }
  // Migrate from older array-string format if present
  try {
    const arr = await redis.get<number[]>(IDS_KEY)
    if (arr && Array.isArray(arr) && arr.length > 0) {
      await redis.del(IDS_KEY)
      const [first, ...rest] = arr.map(String)
      await redis.sadd(IDS_KEY, first, ...rest)
      return arr
    }
  } catch {
    // ignore
  }
  return []
}

async function loadAllRecipes(): Promise<Recipe[]> {
  const ids = await getAllIds()
  if (ids.length > 0) {
    const keys = ids.map(RECIPE_KEY)
    const values = await redis.mget<(Recipe | null)[]>(...keys)
    return values.filter((r): r is Recipe => !!r)
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

// Bulk POST kept for backward compatibility, but now splits into per-recipe keys.
// Avoid using this from the client for large datasets — prefer /api/recipes/upsert.
export async function POST(req: Request) {
  try {
    const recipes: Recipe[] = await req.json()
    const existingIds = await getAllIds()
    const newIds = recipes.map((r) => r.id)
    const toDelete = existingIds.filter((id) => !newIds.includes(id))

    const pipeline = redis.pipeline()
    for (const r of recipes) pipeline.set(RECIPE_KEY(r.id), r)
    for (const id of toDelete) pipeline.del(RECIPE_KEY(id))
    if (toDelete.length > 0) {
      const [first, ...rest] = toDelete.map(String)
      pipeline.srem(IDS_KEY, first, ...rest)
    }
    if (newIds.length > 0) {
      const [first, ...rest] = newIds.map(String)
      pipeline.sadd(IDS_KEY, first, ...rest)
    }
    pipeline.del(LEGACY_RECIPES_KEY)
    await pipeline.exec()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/recipes failed', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
