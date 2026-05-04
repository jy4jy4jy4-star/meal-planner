import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const RECIPES_KEY = 'meal-planner:recipes'

export async function GET() {
  try {
    const data = await redis.get<Recipe[]>(RECIPES_KEY)
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const recipes: Recipe[] = await req.json()
    await redis.set(RECIPES_KEY, recipes)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
