import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const IDS_KEY = 'meal-planner:recipe-ids'
const RECIPE_KEY = (id: number) => `meal-planner:recipe:${id}`

// DELETE /api/recipes/[id] — removes a single recipe.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params
    const id = Number(idStr)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    const pipeline = redis.pipeline()
    pipeline.del(RECIPE_KEY(id))
    pipeline.srem(IDS_KEY, String(id))
    await pipeline.exec()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/recipes/[id] failed', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
