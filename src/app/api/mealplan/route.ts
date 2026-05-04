import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { MealPlan } from '@/lib/types'

const MEALPLAN_KEY = 'meal-planner:mealplan'

export async function GET() {
  try {
    const data = await redis.get<MealPlan>(MEALPLAN_KEY)
    return NextResponse.json(data ?? {})
  } catch {
    return NextResponse.json({}, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const mealPlan: MealPlan = await req.json()
    await redis.set(MEALPLAN_KEY, mealPlan)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
