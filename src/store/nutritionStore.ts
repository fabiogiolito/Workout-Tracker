import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { NutritionEntry, FoodItem, MacroGoals, BodyMetric } from '@/types/nutrition'

interface NutritionState {
  entries: NutritionEntry[]
  customFoods: FoodItem[]
  metrics: BodyMetric[]
  macroGoals: MacroGoals
  waterToday: number // ml
  isLoaded: boolean

  setEntries: (entries: NutritionEntry[]) => void
  addEntry: (entry: NutritionEntry) => void
  removeEntry: (id: string) => void
  setCustomFoods: (foods: FoodItem[]) => void
  addCustomFood: (food: FoodItem) => void
  setMetrics: (metrics: BodyMetric[]) => void
  addMetric: (metric: BodyMetric) => void
  setMacroGoals: (goals: MacroGoals) => void
  setWaterToday: (ml: number) => void
  addWater: (ml: number) => void
  getEntriesForDate: (date: string) => NutritionEntry[]
}

const defaultGoals: MacroGoals = {
  calories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 65,
  waterMl: 2500,
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      entries: [],
      customFoods: [],
      metrics: [],
      macroGoals: defaultGoals,
      waterToday: 0,
      isLoaded: false,

      setEntries: (entries) => set({ entries, isLoaded: true }),
      addEntry: (entry) => set(s => ({ entries: [...s.entries, entry] })),
      removeEntry: (id) => set(s => ({ entries: s.entries.filter(e => e.id !== id) })),
      setCustomFoods: (foods) => set({ customFoods: foods }),
      addCustomFood: (food) => set(s => ({ customFoods: [...s.customFoods, food] })),
      setMetrics: (metrics) => set({ metrics }),
      addMetric: (metric) => set(s => ({ metrics: [...s.metrics, metric] })),
      setMacroGoals: (goals) => set({ macroGoals: goals }),
      setWaterToday: (ml) => set({ waterToday: ml }),
      addWater: (ml) => set(s => ({ waterToday: s.waterToday + ml })),
      getEntriesForDate: (date) => get().entries.filter(e => e.date === date),
    }),
    {
      name: 'wt-nutrition',
      partialize: s => ({ macroGoals: s.macroGoals, waterToday: s.waterToday }),
    }
  )
)
