export type RecipeType = 'healsio' | 'normal'

export interface Recipe {
  id: number
  name: string
  type: RecipeType
  servings: number
  time: string
  mode: string
  ingredients: string[]
  steps: string[]
}

export interface CellData {
  persons: number
  recipeIds: number[]
}

export interface MealPlan {
  [key: string]: CellData
}

export interface ShoppingItem {
  id: number
  name: string
  category: string
  checked: boolean
  amount: string
  recipes: string[]
}
