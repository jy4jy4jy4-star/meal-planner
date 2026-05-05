import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

// POST /api/recipes/upsert — saves a single recipe.
// Body: { recipe: Recipe }
// Avoids the 4.5MB request limit that bulk POST hits when many recipes have images.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const recipe: Recipe | undefined = body?.recipe
    if (!recipe || typeof recipe.id !== 'number') {
      return NextResponse.json({ error: 'invalid recipe' }, { status: 400 })
    }

    const ids = (await redis.get<number[]>(IDS_KEY)) ?? []
    const nextIds = ids.includes(recipe.id) ? ids : [...ids, recipe.id]

    const pipeline = redis.pipeline()
    pipeline.set(RECIPE_KEY(recipe.id), recipe)
    pipeline.set(IDS_KEY, nextIds)
    await pipeline.exec()

    return NextResponse.json({ ok: true, id: recipe.id })
  } catch (e) {
    console.error('POST /api/recipes/upsert failed', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
