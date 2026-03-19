import { useState } from 'react'
import { Plus, Search, X, Droplets, ChevronDown, Trash2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { useNutritionStore } from '@/store/nutritionStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parseNutrition, parseFoods } from '@/lib/google/sheetReader'
import { nutritionToRow } from '@/lib/google/sheetWriter'
import { FOOD_DATABASE, searchFoods } from '@/constants/foodDatabase'
import { today } from '@/lib/utils/formatters'
import { TABS } from '@/lib/google/sheetSchema'
import type { FoodItem, NutritionEntry } from '@/types/nutrition'
import { cn } from '@/lib/utils/formatters'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const WATER_AMOUNTS = [150, 250, 330, 500]
const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout']

export default function NutritionPage() {
  const { entries, customFoods, macroGoals, waterToday, setEntries, setCustomFoods, addEntry, removeEntry, addWater } = useNutritionStore()
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(MEAL_NAMES[0])
  const [foodSearch, setFoodSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState('100')
  const appendNutrition = useAppendRow(TABS.NUTRITION)

  useSheetData(TABS.NUTRITION, parseNutrition, setEntries)
  useSheetData(TABS.FOODS, parseFoods, setCustomFoods)

  const todayDate = today()
  const todayEntries = entries.filter(e => e.date === todayDate)

  const totalCal = todayEntries.reduce((s, e) => s + e.calories, 0)
  const totalProtein = todayEntries.reduce((s, e) => s + e.proteinG, 0)
  const totalCarbs = todayEntries.reduce((s, e) => s + e.carbsG, 0)
  const totalFat = todayEntries.reduce((s, e) => s + e.fatG, 0)

  const allFoods = [...FOOD_DATABASE, ...customFoods]
  const filteredFoods = foodSearch ? searchFoods(foodSearch) : allFoods.slice(0, 15)

  function computeMacros(food: FoodItem, grams: number) {
    const factor = grams / 100
    return {
      calories: Math.round(food.caloriesPer100g * factor),
      proteinG: Math.round(food.proteinPer100g * factor * 10) / 10,
      carbsG: Math.round(food.carbsPer100g * factor * 10) / 10,
      fatG: Math.round(food.fatPer100g * factor * 10) / 10,
    }
  }

  function addFood() {
    if (!selectedFood) return
    const grams = parseFloat(quantity) || 100
    const macros = computeMacros(selectedFood, grams)
    const entry: NutritionEntry = {
      id: uuid(),
      date: todayDate,
      mealName: selectedMeal,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantityG: grams,
      ...macros,
      loggedAt: new Date().toISOString(),
    }
    addEntry(entry)
    appendNutrition(nutritionToRow(entry))
    setSelectedFood(null)
    setQuantity('100')
    setFoodSearch('')
    setShowFoodSearch(false)
  }

  const byMeal = MEAL_NAMES.reduce((acc, meal) => {
    acc[meal] = todayEntries.filter(e => e.mealName === meal)
    return acc
  }, {} as Record<string, NutritionEntry[]>)

  const macroData = [
    { name: 'Protein', value: Math.min((totalProtein / macroGoals.proteinG) * 100, 100), fill: '#000' },
    { name: 'Carbs', value: Math.min((totalCarbs / macroGoals.carbsG) * 100, 100), fill: '#525252' },
    { name: 'Fat', value: Math.min((totalFat / macroGoals.fatG) * 100, 100), fill: '#a3a3a3' },
  ]

  const waterPct = Math.min((waterToday / macroGoals.waterMl) * 100, 100)

  return (
    <div className="px-6 pb-6">
      <PageHeader
        title="Nutrition"
        right={
          <button onClick={() => setShowFoodSearch(true)} className="p-1 -mr-1">
            <Plus size={22} strokeWidth={1.5} />
          </button>
        }
      />

      {/* Macro ring */}
      <div className="flex items-center gap-6 mb-10">
        <div className="relative w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="50%" outerRadius="100%" data={macroData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" background={{ fill: '#f5f5f5' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">{Math.round(totalCal)}</span>
            <span className="text-[10px] text-neutral-400">kcal</span>
          </div>
        </div>
        <div className="space-y-2">
          <MacroRow label="Protein" value={totalProtein} goal={macroGoals.proteinG} unit="g" />
          <MacroRow label="Carbs" value={totalCarbs} goal={macroGoals.carbsG} unit="g" />
          <MacroRow label="Fat" value={totalFat} goal={macroGoals.fatG} unit="g" />
        </div>
      </div>

      {/* Water tracker */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-neutral-400 uppercase tracking-wider">Water</p>
          <p className="text-xs text-neutral-400">{(waterToday / 1000).toFixed(1)}L / {macroGoals.waterMl / 1000}L</p>
        </div>
        <div className="h-1 bg-neutral-100 rounded mb-3">
          <div className="h-full bg-black rounded transition-all" style={{ width: `${waterPct}%` }} />
        </div>
        <div className="flex gap-2">
          {WATER_AMOUNTS.map(ml => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              className="text-xs px-3 py-1.5 border border-neutral-200 rounded-full"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Meals */}
      {MEAL_NAMES.map(meal => {
        const mealEntries = byMeal[meal]
        if (mealEntries.length === 0) return null
        const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0)
        return (
          <div key={meal} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{meal}</p>
              <p className="text-xs text-neutral-400">{Math.round(mealCal)} kcal</p>
            </div>
            {mealEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div>
                  <p className="text-xs">{entry.foodName}</p>
                  <p className="text-xs text-neutral-400">{entry.quantityG}g · {Math.round(entry.calories)}kcal · {Math.round(entry.proteinG)}g protein</p>
                </div>
                <button onClick={() => removeEntry(entry.id)} className="text-neutral-300 p-1 ml-2">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )
      })}

      {todayEntries.length === 0 && (
        <p className="text-sm text-neutral-400">Nothing logged yet today.</p>
      )}

      {/* Food search modal */}
      {showFoodSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="px-6 pt-14 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add food</h2>
            <button onClick={() => { setShowFoodSearch(false); setSelectedFood(null); setFoodSearch('') }}>
              <X size={20} />
            </button>
          </div>

          {/* Meal selector */}
          <div className="px-6 pb-3 flex gap-2 flex-wrap">
            {MEAL_NAMES.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMeal(m)}
                className={cn('text-xs px-2.5 py-1 rounded-full border', selectedMeal === m ? 'border-black bg-black text-white' : 'border-neutral-200')}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="px-6 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
              <Search size={16} className="text-neutral-400" />
              <input
                type="text"
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
                placeholder="Search food…"
                className="flex-1 text-sm outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {selectedFood ? (
            <div className="flex-1 overflow-auto px-6 pt-4">
              <p className="text-sm font-semibold mb-1">{selectedFood.name}</p>
              <p className="text-xs text-neutral-400 mb-4">per 100g: {selectedFood.caloriesPer100g}kcal · {selectedFood.proteinPer100g}g P · {selectedFood.carbsPer100g}g C · {selectedFood.fatPer100g}g F</p>
              <div className="mb-4">
                <p className="text-xs text-neutral-400 mb-1">Amount (g)</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="text-2xl font-semibold border-b border-neutral-200 pb-2 outline-none w-28 bg-transparent"
                />
              </div>
              {quantity && (
                <div className="flex gap-6 mb-6">
                  {(() => { const m = computeMacros(selectedFood, parseFloat(quantity) || 0); return (
                    <>
                      <div><p className="text-sm font-semibold">{m.calories}</p><p className="text-xs text-neutral-400">kcal</p></div>
                      <div><p className="text-sm font-semibold">{m.proteinG}g</p><p className="text-xs text-neutral-400">protein</p></div>
                      <div><p className="text-sm font-semibold">{m.carbsG}g</p><p className="text-xs text-neutral-400">carbs</p></div>
                      <div><p className="text-sm font-semibold">{m.fatG}g</p><p className="text-xs text-neutral-400">fat</p></div>
                    </>
                  )})()}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={addFood} className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium">Add to {selectedMeal}</button>
                <button onClick={() => setSelectedFood(null)} className="px-4 py-3 border border-neutral-200 rounded-xl text-sm">Back</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              {filteredFoods.map(food => (
                <button
                  key={food.id}
                  className="flex items-center justify-between w-full px-6 py-3 border-b border-neutral-100 text-left"
                  onClick={() => setSelectedFood(food)}
                >
                  <div>
                    <p className="text-sm">{food.name}</p>
                    <p className="text-xs text-neutral-400">{food.caloriesPer100g}kcal/100g · {food.proteinPer100g}g protein</p>
                  </div>
                  <Plus size={16} className="text-neutral-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MacroRow({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-neutral-600">{label}</span>
        <span className="text-neutral-400">{Math.round(value)}/{goal}{unit}</span>
      </div>
      <div className="h-1 bg-neutral-100 rounded w-32">
        <div className="h-full bg-black rounded transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
