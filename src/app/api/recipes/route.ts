import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const LEGACY_RECIPES_KEY = 'meal-planner:recipes'
const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

async function loadAllRecipes(): Promise<Recipe[]> {
  const ids = await redis.get<number[]>(IDS_KEY)
  if (ids && ids.length > 0) {
    const keys = ids.map(RECIPE_KEY)
    const values = await redis.mget<(Recipe | null)[]>(...keys)
    return values.filter((r): r is Recipe => !!r)
  }
  // migration from legacy single-key format
  const legacy = await redis.get<Recipe[]>(LEGACY_RECIPES_KEY)
  if (legacy && legacy.length > 0) {
    const pipeline = redis.pipeline()
    for (const r of legacy) pipeline.set(RECIPE_KEY(r.id), r)
    pipeline.set(IDS_KEY, legacy.map((r) => r.id))
    pipeline.del(LEGACY_RECIPES_KEY)
    await pipeline.exec()
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
    const existingIds = (await redis.get<number[]>(IDS_KEY)) ?? []
    const newIds = recipes.map((r) => r.id)
    const toDelete = existingIds.filter((id) => !newIds.includes(id))

    const pipeline = redis.pipeline()
    for (const r of recipes) pipeline.set(RECIPE_KEY(r.id), r)
    for (const id of toDelete) pipeline.del(RECIPE_KEY(id))
    pipeline.set(IDS_KEY, newIds)
    pipeline.del(LEGACY_RECIPES_KEY)
    await pipeline.exec()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('POST /api/recipes failed', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
