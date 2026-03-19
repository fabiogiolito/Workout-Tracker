import type { Equipment } from '@/types/equipment'
import type { Exercise } from '@/types/exercise'
import type { Program } from '@/types/program'
import type { WorkoutSession, LoggedSet } from '@/types/workout'
import type { NutritionEntry, FoodItem, BodyMetric } from '@/types/nutrition'

function s(v: string | number | boolean | undefined | null): string {
  if (v === undefined || v === null) return ''
  return String(v)
}

export function equipmentToRow(e: Equipment): string[] {
  return [
    e.id,
    e.type,
    e.name,
    String(e.enabled),
    s(e.barWeightKg),
    e.availablePlates ? JSON.stringify(e.availablePlates) : '',
    e.dumbbellWeights ? JSON.stringify(e.dumbbellWeights) : '',
    e.kettlebellWeights ? JSON.stringify(e.kettlebellWeights) : '',
    e.notes ?? '',
    e.updatedAt,
  ]
}

export function exerciseToRow(e: Exercise): string[] {
  return [
    e.id,
    e.name,
    e.muscleGroups.join(','),
    e.equipmentTags.join(','),
    String(e.isTimed),
    s(e.defaultDurationSeconds),
    String(e.isCustom),
    e.notes ?? '',
    e.createdAt ?? new Date().toISOString(),
  ]
}

export function programToRow(p: Program): string[] {
  return [
    p.id,
    p.name,
    p.description ?? '',
    JSON.stringify(p.days),
    p.createdAt,
    p.updatedAt,
  ]
}

export function workoutToRow(w: WorkoutSession): string[] {
  return [
    w.id,
    w.programId,
    w.dayId,
    w.dayLabel,
    w.startedAt,
    w.finishedAt ?? '',
    w.notes ?? '',
  ]
}

export function setToRow(set: LoggedSet): string[] {
  return [
    set.id,
    set.workoutId,
    set.exerciseId,
    set.exerciseName,
    String(set.setNumber),
    s(set.weightKg),
    s(set.reps),
    s(set.durationSeconds),
    s(set.rpe),
    String(set.isWarmup),
    set.loggedAt,
  ]
}

export function nutritionToRow(n: NutritionEntry): string[] {
  return [
    n.id,
    n.date,
    n.mealName,
    n.foodId,
    n.foodName,
    String(n.quantityG),
    String(n.calories),
    String(n.proteinG),
    String(n.carbsG),
    String(n.fatG),
    n.loggedAt,
  ]
}

export function foodToRow(f: FoodItem): string[] {
  return [
    f.id,
    f.name,
    String(f.caloriesPer100g),
    String(f.proteinPer100g),
    String(f.carbsPer100g),
    String(f.fatPer100g),
    String(f.isCustom),
    f.createdAt ?? new Date().toISOString(),
  ]
}

export function metricToRow(m: BodyMetric): string[] {
  return [
    m.id,
    m.date,
    s(m.bodyWeightKg),
    s(m.bodyFatPct),
    s(m.waistCm),
    s(m.chestCm),
    s(m.armsCm),
    m.loggedAt,
  ]
}

export function configToRows(config: Record<string, string>): string[][] {
  const now = new Date().toISOString()
  return Object.entries(config).map(([k, v]) => [k, v, now])
}
