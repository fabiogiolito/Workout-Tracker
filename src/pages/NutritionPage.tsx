import { useState } from 'react'
import { Plus, Search, X, ChevronLeft, ChevronRight, Pencil, Loader2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useNutritionStore } from '@/store/nutritionStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parseNutrition, parseFoods } from '@/lib/google/sheetReader'
import { nutritionToRow, foodToRow } from '@/lib/google/sheetWriter'
import { FOOD_DATABASE } from '@/constants/foodDatabase'
import { today } from '@/lib/utils/formatters'
import { TABS } from '@/lib/google/sheetSchema'
import type { FoodItem, NutritionEntry } from '@/types/nutrition'
import { cn } from '@/lib/utils/formatters'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import * as sheetsApi from '@/lib/google/sheetsApi'

const WATER_AMOUNTS = [150, 250, 330, 500]
const MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout']

type ModalScreen = 'search' | 'quantity' | 'create' | 'edit'

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatViewDate(dateStr: string): string {
  const t = today()
  if (dateStr === t) return 'Today'
  if (dateStr === offsetDate(t, -1)) return 'Yesterday'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function NutritionPage() {
  const {
    entries, customFoods, macroGoals, waterToday,
    setEntries, setCustomFoods, addEntry, removeEntry, addWater,
    addCustomFood, updateCustomFood, patchEntries,
  } = useNutritionStore()
  const sheetId = useSheetStore(s => s.activeSheetId)

  // Date navigation
  const [viewDate, setViewDate] = useState(today())
  const isToday = viewDate === today()

  // Modal state
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [modalScreen, setModalScreen] = useState<ModalScreen>('search')
  const [selectedMeal, setSelectedMeal] = useState(MEAL_NAMES[0])
  const [foodSearch, setFoodSearch] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState('100')

  // Custom food creation
  const [customName, setCustomName] = useState('')
  const [customCals, setCustomCals] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')

  // Custom food editing
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)
  const [editCals, setEditCals] = useState('')
  const [editProtein, setEditProtein] = useState('')
  const [editCarbs, setEditCarbs] = useState('')
  const [editFat, setEditFat] = useState('')
  const [savingFood, setSavingFood] = useState(false)

  const appendNutrition = useAppendRow(TABS.NUTRITION)
  const appendFood = useAppendRow(TABS.FOODS)

  const { isLoading: loadingNutrition } = useSheetData(TABS.NUTRITION, parseNutrition, setEntries)
  const { isLoading: loadingFoods } = useSheetData(TABS.FOODS, parseFoods, setCustomFoods)

  if (loadingNutrition || loadingFoods) return <PageSpinner />

  const viewEntries = entries.filter(e => e.date === viewDate)
  const totalCal = viewEntries.reduce((s, e) => s + e.calories, 0)
  const totalProtein = viewEntries.reduce((s, e) => s + e.proteinG, 0)
  const totalCarbs = viewEntries.reduce((s, e) => s + e.carbsG, 0)
  const totalFat = viewEntries.reduce((s, e) => s + e.fatG, 0)

  const allFoods = [...FOOD_DATABASE, ...customFoods]
  const filteredFoods = foodSearch.trim()
    ? allFoods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).slice(0, 20)
    : allFoods.slice(0, 15)

  function computeMacros(food: FoodItem, grams: number) {
    const factor = grams / 100
    return {
      calories: Math.round(food.caloriesPer100g * factor),
      proteinG: Math.round(food.proteinPer100g * factor * 10) / 10,
      carbsG: Math.round(food.carbsPer100g * factor * 10) / 10,
      fatG: Math.round(food.fatPer100g * factor * 10) / 10,
    }
  }

  function closeModal() {
    setShowFoodSearch(false)
    setSelectedFood(null)
    setFoodSearch('')
    setModalScreen('search')
    setCustomName(''); setCustomCals(''); setCustomProtein(''); setCustomCarbs(''); setCustomFat('')
    setEditingFood(null)
  }

  function addFood() {
    if (!selectedFood) return
    const grams = parseFloat(quantity) || 100
    const macros = computeMacros(selectedFood, grams)
    const entry: NutritionEntry = {
      id: uuid(),
      date: viewDate,
      mealName: selectedMeal,
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantityG: grams,
      ...macros,
      loggedAt: new Date().toISOString(),
    }
    addEntry(entry)
    appendNutrition(nutritionToRow(entry))
    closeModal()
  }

  function saveCustomFood() {
    if (!customName.trim()) return
    const food: FoodItem = {
      id: uuid(),
      name: customName.trim(),
      caloriesPer100g: parseFloat(customCals) || 0,
      proteinPer100g: parseFloat(customProtein) || 0,
      carbsPer100g: parseFloat(customCarbs) || 0,
      fatPer100g: parseFloat(customFat) || 0,
      isCustom: true,
      createdAt: new Date().toISOString(),
    }
    addCustomFood(food)
    appendFood(foodToRow(food))
    setSelectedFood(food)
    setQuantity('100')
    setCustomName(''); setCustomCals(''); setCustomProtein(''); setCustomCarbs(''); setCustomFat('')
    setModalScreen('quantity')
  }

  function startEditFood(food: FoodItem) {
    setEditingFood(food)
    setEditCals(food.caloriesPer100g > 0 ? String(food.caloriesPer100g) : '')
    setEditProtein(food.proteinPer100g > 0 ? String(food.proteinPer100g) : '')
    setEditCarbs(food.carbsPer100g > 0 ? String(food.carbsPer100g) : '')
    setEditFat(food.fatPer100g > 0 ? String(food.fatPer100g) : '')
    setModalScreen('edit')
  }

  async function saveEditedFood() {
    if (!editingFood || !sheetId) return
    setSavingFood(true)
    const updated: FoodItem = {
      ...editingFood,
      caloriesPer100g: parseFloat(editCals) || 0,
      proteinPer100g: parseFloat(editProtein) || 0,
      carbsPer100g: parseFloat(editCarbs) || 0,
      fatPer100g: parseFloat(editFat) || 0,
    }
    try {
      // Update FOODS sheet row
      const foodRows = await sheetsApi.getRange(sheetId, `${TABS.FOODS}!A:H`)
      const foodRowIdx = foodRows.findIndex(r => r[0] === updated.id)
      if (foodRowIdx >= 0) {
        await sheetsApi.batchUpdateValues(sheetId, [{
          range: `${TABS.FOODS}!A${foodRowIdx + 1}:H${foodRowIdx + 1}`,
          values: [foodToRow(updated)],
        }])
      }

      // Recalculate and batch-update all matching NUTRITION rows
      const nutritionRows = await sheetsApi.getRange(sheetId, `${TABS.NUTRITION}!A:K`)
      const sheetUpdates: { range: string; values: string[][] }[] = []
      const storeUpdates: NutritionEntry[] = []
      for (let i = 0; i < nutritionRows.length; i++) {
        const row = nutritionRows[i]
        if (!row[0] || row[3] !== updated.id) continue
        const quantityG = parseFloat(row[5]) || 0
        const factor = quantityG / 100
        const updatedEntry: NutritionEntry = {
          id: row[0], date: row[1], mealName: row[2],
          foodId: row[3], foodName: row[4], quantityG,
          calories: Math.round(updated.caloriesPer100g * factor),
          proteinG: Math.round(updated.proteinPer100g * factor * 10) / 10,
          carbsG: Math.round(updated.carbsPer100g * factor * 10) / 10,
          fatG: Math.round(updated.fatPer100g * factor * 10) / 10,
          loggedAt: row[10] ?? '',
        }
        storeUpdates.push(updatedEntry)
        sheetUpdates.push({ range: `${TABS.NUTRITION}!A${i + 1}:K${i + 1}`, values: [nutritionToRow(updatedEntry)] })
      }
      if (sheetUpdates.length > 0) await sheetsApi.batchUpdateValues(sheetId, sheetUpdates)

      updateCustomFood(updated)
      if (storeUpdates.length > 0) patchEntries(storeUpdates)

      // Return to quantity screen if we were editing the currently selected food
      if (selectedFood?.id === updated.id) {
        setSelectedFood(updated)
        setModalScreen('quantity')
      } else {
        setModalScreen('search')
      }
      setEditingFood(null)
    } catch (e) {
      console.error('Failed to update food:', e)
    } finally {
      setSavingFood(false)
    }
  }

  const byMeal = MEAL_NAMES.reduce((acc, meal) => {
    acc[meal] = viewEntries.filter(e => e.mealName === meal)
    return acc
  }, {} as Record<string, NutritionEntry[]>)

  const macroData = [
    { name: 'Protein', value: Math.min((totalProtein / macroGoals.proteinG) * 100, 100), fill: '#000' },
    { name: 'Carbs', value: Math.min((totalCarbs / macroGoals.carbsG) * 100, 100), fill: '#525252' },
    { name: 'Fat', value: Math.min((totalFat / macroGoals.fatG) * 100, 100), fill: '#a3a3a3' },
  ]
  const waterPct = Math.min((waterToday / macroGoals.waterMl) * 100, 100)
  const affectedEntryCount = editingFood ? entries.filter(e => e.foodId === editingFood.id).length : 0

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

      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6 -mt-2">
        <button onClick={() => setViewDate(offsetDate(viewDate, -1))} className="p-2 -ml-2 text-neutral-400">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setViewDate(today())}
          className={cn('text-sm font-medium', isToday ? 'text-black' : 'text-neutral-500')}
        >
          {formatViewDate(viewDate)}
        </button>
        <button onClick={() => setViewDate(offsetDate(viewDate, 1))} className="p-2 -mr-2 text-neutral-400">
          <ChevronRight size={18} />
        </button>
      </div>

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

      {/* Water tracker — today only */}
      {isToday && (
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
              <button key={ml} onClick={() => addWater(ml)} className="text-xs px-3 py-1.5 border border-neutral-200 rounded-full">
                +{ml}ml
              </button>
            ))}
          </div>
        </div>
      )}

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

      {viewEntries.length === 0 && (
        <p className="text-sm text-neutral-400">
          Nothing logged{isToday ? ' yet today' : ` on ${formatViewDate(viewDate).toLowerCase()}`}.
        </p>
      )}

      {/* Food search modal */}
      {showFoodSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">

          {/* Header */}
          <div className="px-6 pt-14 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {modalScreen === 'create' ? 'New food' : modalScreen === 'edit' ? 'Edit macros' : 'Add food'}
            </h2>
            <button onClick={closeModal}><X size={20} /></button>
          </div>

          {/* Meal selector */}
          {(modalScreen === 'search' || modalScreen === 'quantity') && (
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
          )}

          {/* Search input */}
          {modalScreen === 'search' && (
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
          )}

          {/* Screen: food list */}
          {modalScreen === 'search' && (
            <div className="flex-1 overflow-auto flex flex-col">
              <div className="flex-1">
                {filteredFoods.map(food => (
                  <div key={food.id} className="flex items-center border-b border-neutral-100">
                    <button
                      className="flex-1 flex items-center justify-between px-6 py-3 text-left"
                      onClick={() => { setSelectedFood(food); setQuantity('100'); setModalScreen('quantity') }}
                    >
                      <div>
                        <p className="text-sm">{food.name}</p>
                        <p className="text-xs text-neutral-400">
                          {food.caloriesPer100g > 0
                            ? `${food.caloriesPer100g}kcal/100g · ${food.proteinPer100g}g protein`
                            : 'Macros unknown'}
                        </p>
                      </div>
                      <Plus size={16} className="text-neutral-400 shrink-0 ml-3" />
                    </button>
                    {food.isCustom && (
                      <button
                        onClick={() => startEditFood(food)}
                        className="px-4 py-3 text-neutral-300 hover:text-neutral-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {filteredFoods.length === 0 && foodSearch.trim() && (
                  <p className="px-6 py-4 text-sm text-neutral-400">No results for "{foodSearch}"</p>
                )}
              </div>
              <div className="px-6 py-4 border-t border-neutral-100">
                <button
                  onClick={() => { setCustomName(foodSearch.trim()); setModalScreen('create') }}
                  className="flex items-center gap-2 text-sm text-neutral-500"
                >
                  <Plus size={16} />
                  {foodSearch.trim() ? `Add "${foodSearch.trim()}" as custom food` : 'Add custom food'}
                </button>
              </div>
            </div>
          )}

          {/* Screen: quantity */}
          {modalScreen === 'quantity' && selectedFood && (
            <div className="flex-1 overflow-auto px-6 pt-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold">{selectedFood.name}</p>
                {selectedFood.isCustom && (
                  <button onClick={() => startEditFood(selectedFood)} className="text-neutral-400 p-1 -mt-1">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              {selectedFood.caloriesPer100g > 0 ? (
                <p className="text-xs text-neutral-400 mb-4">
                  per 100g: {selectedFood.caloriesPer100g}kcal · {selectedFood.proteinPer100g}g P · {selectedFood.carbsPer100g}g C · {selectedFood.fatPer100g}g F
                </p>
              ) : (
                <p className="text-xs text-neutral-400 mb-4">
                  Macros unknown —{' '}
                  <button className="underline underline-offset-2" onClick={() => startEditFood(selectedFood)}>add them</button>
                </p>
              )}
              <div className="mb-4">
                <p className="text-xs text-neutral-400 mb-1">Amount (g)</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="text-2xl font-semibold border-b border-neutral-200 pb-2 outline-none w-28 bg-transparent"
                />
              </div>
              {quantity && selectedFood.caloriesPer100g > 0 && (() => {
                const m = computeMacros(selectedFood, parseFloat(quantity) || 0)
                return (
                  <div className="flex gap-6 mb-6">
                    <div><p className="text-sm font-semibold">{m.calories}</p><p className="text-xs text-neutral-400">kcal</p></div>
                    <div><p className="text-sm font-semibold">{m.proteinG}g</p><p className="text-xs text-neutral-400">protein</p></div>
                    <div><p className="text-sm font-semibold">{m.carbsG}g</p><p className="text-xs text-neutral-400">carbs</p></div>
                    <div><p className="text-sm font-semibold">{m.fatG}g</p><p className="text-xs text-neutral-400">fat</p></div>
                  </div>
                )
              })()}
              <div className="flex gap-3">
                <button onClick={addFood} className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium">
                  Add to {selectedMeal}
                </button>
                <button onClick={() => { setSelectedFood(null); setModalScreen('search') }} className="px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Screen: create custom food */}
          {modalScreen === 'create' && (
            <div className="flex-1 overflow-auto px-6 pt-2 space-y-4">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Food name</p>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full border-b border-neutral-200 pb-2 text-sm font-medium outline-none bg-transparent"
                  placeholder="e.g. Homemade granola"
                  autoFocus
                />
              </div>
              <p className="text-xs text-neutral-400">Per 100g — leave blank if unknown, you can add them later.</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <MacroField label="Calories (kcal)" value={customCals} onChange={setCustomCals} />
                <MacroField label="Protein (g)" value={customProtein} onChange={setCustomProtein} />
                <MacroField label="Carbs (g)" value={customCarbs} onChange={setCustomCarbs} />
                <MacroField label="Fat (g)" value={customFat} onChange={setCustomFat} />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveCustomFood}
                  disabled={!customName.trim()}
                  className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Save food
                </button>
                <button onClick={() => setModalScreen('search')} className="px-4 py-3 border border-neutral-200 rounded-xl text-sm">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Screen: edit custom food macros */}
          {modalScreen === 'edit' && editingFood && (
            <div className="flex-1 overflow-auto px-6 pt-2 space-y-4">
              <p className="text-sm font-medium">{editingFood.name}</p>
              <p className="text-xs text-neutral-400">Per 100g</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <MacroField label="Calories (kcal)" value={editCals} onChange={setEditCals} />
                <MacroField label="Protein (g)" value={editProtein} onChange={setEditProtein} />
                <MacroField label="Carbs (g)" value={editCarbs} onChange={setEditCarbs} />
                <MacroField label="Fat (g)" value={editFat} onChange={setEditFat} />
              </div>
              {affectedEntryCount > 0 && (
                <p className="text-xs text-neutral-400">
                  Will recalculate {affectedEntryCount} previous {affectedEntryCount === 1 ? 'entry' : 'entries'}.
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveEditedFood}
                  disabled={savingFood}
                  className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingFood && <Loader2 size={14} className="animate-spin" />}
                  {affectedEntryCount > 0 ? 'Save & update history' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingFood(null); setModalScreen(selectedFood ? 'quantity' : 'search') }}
                  className="px-4 py-3 border border-neutral-200 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function MacroField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border-b border-neutral-200 pb-1 text-sm outline-none bg-transparent"
        placeholder="—"
      />
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
