import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { Recipe } from '@/lib/types'

const LEGACY_RECIPES_KEY = 'meal-planner:recipes'
const IDS_KEY = 'meal-planner:recipe-ids'

// GET /api/recipes/debug — read-only inspection of the underlying Redis state.
// Helps diagnose missing recipes by showing what keys actually exist.
export async function GET() {
  const result: Record<string, unknown> = {}

  // Check IDS_KEY type & contents
  try {
    const t = await redis.type(IDS_KEY)
    result.idsKeyType = t
  } catch (e) {
    result.idsKeyType = `ERROR ${e instanceof Error ? e.message : ''}`
  }

  try {
    const members = await redis.smembers(IDS_KEY)
    result.idsAsSet = members
  } catch (e) {
    result.idsAsSet = `ERROR ${e instanceof Error ? e.message : ''}`
  }

  try {
    const arr = await redis.get<unknown>(IDS_KEY)
    result.idsAsString = arr
  } catch (e) {
    result.idsAsString = `ERROR ${e instanceof Error ? e.message : ''}`
  }

  // SCAN for all recipe:* keys
  const recipeKeys: string[] = []
  let cursor: string | number = 0
  let safety = 0
  try {
    do {
      const r: [string | number, string[]] = await redis.scan(cursor as number, { match: 'meal-planner:recipe:*', count: 200 })
      cursor = r[0]
      for (const k of r[1]) recipeKeys.push(k)
      safety++
      if (safety > 50) break
    } while (cursor !== 0 && cursor !== '0')
  } catch (e) {
    result.scanError = e instanceof Error ? e.message : String(e)
  }
  result.recipeKeyCount = recipeKeys.length
  result.recipeKeys = recipeKeys.sort()

  // Sample one recipe to confirm content shape
  if (recipeKeys.length > 0) {
    try {
      const sample = await redis.get<Recipe>(recipeKeys[0])
      result.sampleRecipe = sample
    } catch (e) {
      result.sampleRecipe = `ERROR ${e instanceof Error ? e.message : ''}`
    }
  }

  // Legacy single-key
  try {
    const legacy = await redis.get<Recipe[]>(LEGACY_RECIPES_KEY)
    result.legacyKeyExists = !!legacy
    result.legacyKeyLength = Array.isArray(legacy) ? legacy.length : null
  } catch (e) {
    result.legacyKey = `ERROR ${e instanceof Error ? e.message : ''}`
  }

  return NextResponse.json(result, { status: 200 })
}
