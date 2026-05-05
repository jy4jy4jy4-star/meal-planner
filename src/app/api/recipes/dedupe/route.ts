import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

// Score a recipe so we can pick the "best" copy among duplicates by name.
// Prefer ones with image, then more ingredients/steps, then the highest id (newest).
function score(r: Recipe): number {
  let s = 0
  if ((r as Recipe & { image?: string }).image) s += 10000
  s += (r.ingredients?.length || 0) * 100
  s += (r.steps?.length || 0) * 50
  if ((r.mode || '').length > 0) s += 30
  if ((r.time || '').length > 0) s += 10
  s += r.id // tiebreaker: keep newer ID
  return s
}

async function fetchAll(ids: number[]): Promise<Recipe[]> {
  const CHUNK = 10
  const out: Recipe[] = []
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK)
    const keys = slice.map(RECIPE_KEY)
    try {
      const values = await redis.mget<(Recipe | null)[]>(...keys)
      for (const v of values) if (v) out.push(v)
    } catch {
      for (const id of slice) {
        try {
          const r = await redis.get<Recipe>(RECIPE_KEY(id))
          if (r) out.push(r)
        } catch { /* ignore */ }
      }
    }
  }
  return out
}

// POST /api/recipes/dedupe — removes duplicate recipes by name.
// Keeps the highest-scoring copy and deletes the rest.
// Body: { dryRun?: boolean }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun: boolean = !!body?.dryRun

    const members = await redis.smembers(IDS_KEY)
    const ids = (members ?? []).map((m) => Number(m)).filter((n) => Number.isFinite(n))
    const recipes = await fetchAll(ids)

    const groups = new Map<string, Recipe[]>()
    for (const r of recipes) {
      const key = (r.name || '').trim()
      if (!key) continue
      const arr = groups.get(key) || []
      arr.push(r)
      groups.set(key, arr)
    }

    const toDelete: { id: number; name: string }[] = []
    const kept: { id: number; name: string }[] = []
    for (const [name, arr] of groups.entries()) {
      if (arr.length <= 1) continue
      const sorted = [...arr].sort((a, b) => score(b) - score(a))
      kept.push({ id: sorted[0].id, name })
      for (const dup of sorted.slice(1)) toDelete.push({ id: dup.id, name })
    }

    if (!dryRun && toDelete.length > 0) {
      const pipeline = redis.pipeline()
      for (const d of toDelete) pipeline.del(RECIPE_KEY(d.id))
      const idStrs = toDelete.map((d) => String(d.id))
      const [first, ...rest] = idStrs
      pipeline.srem(IDS_KEY, first, ...rest)
      await pipeline.exec()
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      duplicateGroupCount: kept.length,
      keptCount: kept.length,
      deletedCount: toDelete.length,
      kept,
      deleted: toDelete,
    })
  } catch (e) {
    console.error('POST /api/recipes/dedupe failed', e)
    return NextResponse.json({ error: 'Failed to dedupe', message: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
