export interface FoodItem {
  id: string
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  isCustom: boolean
  createdAt?: string
}

export interface NutritionEntry {
  id: string
  date: string // YYYY-MM-DD
  mealName: string
  foodId: string
  foodName: string
  quantityG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  loggedAt: string
}

export interface MacroGoals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

export interface BodyMetric {
  id: string
  date: string
  bodyWeightKg?: number
  bodyFatPct?: number
  waistCm?: number
  chestCm?: number
  armsCm?: number
  loggedAt: string
}
