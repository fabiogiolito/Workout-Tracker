import type { Exercise, MuscleGroup, EquipmentTag } from '@/types/exercise'
import type { Program, WorkoutDay } from '@/types/program'
import type { WorkoutSession, LoggedSet } from '@/types/workout'
import type { NutritionEntry, FoodItem, BodyMetric } from '@/types/nutrition'

function s(val: string | undefined): string {
  return val ?? ''
}
function b(val: string | undefined): boolean {
  return val === 'true'
}
function n(val: string | undefined): number {
  return val ? parseFloat(val) : 0
}
function ni(val: string | undefined): number | undefined {
  return val ? parseFloat(val) : undefined
}

export function parseExercises(rows: string[][]): Exercise[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    name: s(r[1]),
    muscleGroups: s(r[2]).split(',').filter(Boolean) as MuscleGroup[],
    equipmentTags: s(r[3]).split(',').filter(Boolean) as EquipmentTag[],
    isTimed: b(r[4]),
    defaultDurationSeconds: ni(r[5]),
    isCustom: b(r[6]),
    notes: r[7],
    createdAt: r[8],
  }))
}

export function parsePrograms(rows: string[][]): Program[] {
  return rows.slice(1).filter(r => r[0]).map(r => {
    let days: WorkoutDay[] = []
    try { days = r[3] ? JSON.parse(r[3]) : [] } catch { days = [] }
    return {
      id: s(r[0]),
      name: s(r[1]),
      description: r[2],
      days,
      createdAt: s(r[4]),
      updatedAt: s(r[5]),
    }
  })
}

export function parseWorkouts(rows: string[][]): WorkoutSession[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    programId: s(r[1]),
    dayId: s(r[2]),
    dayLabel: s(r[3]),
    startedAt: s(r[4]),
    finishedAt: r[5] || undefined,
    notes: r[6],
  }))
}

export function parseSets(rows: string[][]): LoggedSet[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    workoutId: s(r[1]),
    exerciseId: s(r[2]),
    exerciseName: s(r[3]),
    setNumber: n(r[4]),
    weightKg: ni(r[5]),
    reps: ni(r[6]),
    durationSeconds: ni(r[7]),
    rpe: ni(r[8]),
    isWarmup: b(r[9]),
    loggedAt: s(r[10]),
  }))
}

export function parseNutrition(rows: string[][]): NutritionEntry[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    date: s(r[1]),
    mealName: s(r[2]),
    foodId: s(r[3]),
    foodName: s(r[4]),
    quantityG: n(r[5]),
    calories: n(r[6]),
    proteinG: n(r[7]),
    carbsG: n(r[8]),
    fatG: n(r[9]),
    loggedAt: s(r[10]),
  }))
}

export function parseFoods(rows: string[][]): FoodItem[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    name: s(r[1]),
    caloriesPer100g: n(r[2]),
    proteinPer100g: n(r[3]),
    carbsPer100g: n(r[4]),
    fatPer100g: n(r[5]),
    isCustom: b(r[6]),
    createdAt: r[7],
  }))
}

export function parseMetrics(rows: string[][]): BodyMetric[] {
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id: s(r[0]),
    date: s(r[1]),
    bodyWeightKg: ni(r[2]),
    bodyFatPct: ni(r[3]),
    waistCm: ni(r[4]),
    chestCm: ni(r[5]),
    armsCm: ni(r[6]),
    loggedAt: s(r[7]),
  }))
}

export function parseConfig(rows: string[][]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const row of rows.slice(1)) {
    if (row[0]) result[row[0]] = row[1] ?? ''
  }
  return result
}
