import type { FoodItem } from '@/types/nutrition'

export const FOOD_DATABASE: FoodItem[] = [
  // Proteins
  { id: 'chicken-breast', name: 'Chicken Breast (cooked)', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, isCustom: false },
  { id: 'chicken-thigh', name: 'Chicken Thigh (cooked)', caloriesPer100g: 209, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11, isCustom: false },
  { id: 'ground-beef-lean', name: 'Ground Beef 90% Lean', caloriesPer100g: 176, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 8, isCustom: false },
  { id: 'salmon', name: 'Salmon (cooked)', caloriesPer100g: 206, proteinPer100g: 28, carbsPer100g: 0, fatPer100g: 10, isCustom: false },
  { id: 'tuna-canned', name: 'Tuna (canned in water)', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, isCustom: false },
  { id: 'eggs-whole', name: 'Eggs (whole)', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, isCustom: false },
  { id: 'egg-whites', name: 'Egg Whites', caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, isCustom: false },
  { id: 'whey-protein', name: 'Whey Protein Powder', caloriesPer100g: 375, proteinPer100g: 80, carbsPer100g: 6, fatPer100g: 5, isCustom: false },
  { id: 'greek-yogurt', name: 'Greek Yogurt (plain)', caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, isCustom: false },
  { id: 'cottage-cheese', name: 'Cottage Cheese', caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, isCustom: false },
  { id: 'turkey-breast', name: 'Turkey Breast (cooked)', caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1, isCustom: false },
  { id: 'beef-steak', name: 'Beef Steak (lean, cooked)', caloriesPer100g: 217, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12, isCustom: false },
  { id: 'shrimp', name: 'Shrimp (cooked)', caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 0.3, isCustom: false },
  { id: 'tofu', name: 'Tofu (firm)', caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, isCustom: false },
  { id: 'tempeh', name: 'Tempeh', caloriesPer100g: 193, proteinPer100g: 20, carbsPer100g: 9, fatPer100g: 11, isCustom: false },
  { id: 'lentils', name: 'Lentils (cooked)', caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, isCustom: false },
  { id: 'black-beans', name: 'Black Beans (cooked)', caloriesPer100g: 132, proteinPer100g: 8.9, carbsPer100g: 24, fatPer100g: 0.5, isCustom: false },

  // Carbohydrates
  { id: 'white-rice', name: 'White Rice (cooked)', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, isCustom: false },
  { id: 'brown-rice', name: 'Brown Rice (cooked)', caloriesPer100g: 122, proteinPer100g: 2.6, carbsPer100g: 25, fatPer100g: 1, isCustom: false },
  { id: 'oats', name: 'Oats (dry)', caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7, isCustom: false },
  { id: 'sweet-potato', name: 'Sweet Potato (cooked)', caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1, isCustom: false },
  { id: 'potato', name: 'Potato (boiled)', caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, isCustom: false },
  { id: 'pasta', name: 'Pasta (cooked)', caloriesPer100g: 158, proteinPer100g: 5.8, carbsPer100g: 31, fatPer100g: 0.9, isCustom: false },
  { id: 'bread-whole-wheat', name: 'Whole Wheat Bread (1 slice=30g)', caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 4, isCustom: false },
  { id: 'banana', name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, isCustom: false },
  { id: 'apple', name: 'Apple', caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, isCustom: false },
  { id: 'berries', name: 'Mixed Berries', caloriesPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14, fatPer100g: 0.3, isCustom: false },
  { id: 'orange', name: 'Orange', caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, isCustom: false },

  // Fats
  { id: 'avocado', name: 'Avocado', caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, isCustom: false },
  { id: 'almonds', name: 'Almonds', caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, isCustom: false },
  { id: 'peanut-butter', name: 'Peanut Butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, isCustom: false },
  { id: 'olive-oil', name: 'Olive Oil', caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, isCustom: false },
  { id: 'cheese-cheddar', name: 'Cheddar Cheese', caloriesPer100g: 402, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, isCustom: false },
  { id: 'milk-whole', name: 'Whole Milk', caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, isCustom: false },
  { id: 'milk-skim', name: 'Skim Milk', caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1, isCustom: false },

  // Common meals
  { id: 'protein-bar', name: 'Protein Bar (generic)', caloriesPer100g: 350, proteinPer100g: 25, carbsPer100g: 40, fatPer100g: 8, isCustom: false },
  { id: 'granola', name: 'Granola', caloriesPer100g: 471, proteinPer100g: 10, carbsPer100g: 64, fatPer100g: 20, isCustom: false },
  { id: 'rice-cakes', name: 'Rice Cakes', caloriesPer100g: 387, proteinPer100g: 8, carbsPer100g: 81, fatPer100g: 3, isCustom: false },
]

export function searchFoods(query: string): FoodItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return FOOD_DATABASE.slice(0, 10)
  return FOOD_DATABASE.filter(f => f.name.toLowerCase().includes(q))
}
