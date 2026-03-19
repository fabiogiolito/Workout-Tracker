import type { LoggedSet } from '@/types/workout'
import type { MuscleGroup } from '@/types/exercise'

// Upper body muscles get smaller increments
const UPPER_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms']

function isUpperBody(muscleGroups: MuscleGroup[]): boolean {
  return muscleGroups.some(m => UPPER_MUSCLES.includes(m))
}

interface SessionBest {
  workoutId: string
  date: string
  bestWeight: number
  maxReps: number
  setCount: number
  targetReps?: number
  rpe?: number
}

export function getBestPerSession(sets: LoggedSet[]): SessionBest[] {
  const byWorkout = new Map<string, LoggedSet[]>()
  for (const s of sets) {
    const arr = byWorkout.get(s.workoutId) ?? []
    arr.push(s)
    byWorkout.set(s.workoutId, arr)
  }

  const sessions: SessionBest[] = []
  for (const [workoutId, workoutSets] of byWorkout) {
    const workSets = workoutSets.filter(s => !s.isWarmup)
    if (workSets.length === 0) continue
    const bestWeight = Math.max(...workSets.map(s => s.weightKg ?? 0))
    const maxReps = Math.max(...workSets.map(s => s.reps ?? 0))
    const avgRpe = workSets.filter(s => s.rpe).reduce((a, b) => a + (b.rpe ?? 0), 0) / workSets.filter(s => s.rpe).length
    sessions.push({
      workoutId,
      date: workSets[0].loggedAt,
      bestWeight,
      maxReps,
      setCount: workSets.length,
      rpe: isNaN(avgRpe) ? undefined : avgRpe,
    })
  }

  return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export interface ProgressionSuggestion {
  suggestedWeight: number
  reason: string
  isDeload: boolean
  prAlert: boolean
}

export function suggestNextWeight(
  sets: LoggedSet[],
  muscleGroups: MuscleGroup[],
  targetRepsStr: string,
): ProgressionSuggestion {
  const sessions = getBestPerSession(sets)
  if (sessions.length === 0) {
    return { suggestedWeight: 0, reason: 'Start light to learn the movement', isDeload: false, prAlert: false }
  }

  const last = sessions[sessions.length - 1]
  const increment = isUpperBody(muscleGroups) ? 2.5 : 5
  const targetRepsMax = parseRepsMax(targetRepsStr)

  // Check for deload: last 2 sessions failed to hit target reps
  if (sessions.length >= 2) {
    const prev = sessions[sessions.length - 2]
    if (last.maxReps < targetRepsMax && prev.maxReps < targetRepsMax) {
      const deloadWeight = Math.round(last.bestWeight * 0.9 / 2.5) * 2.5
      return {
        suggestedWeight: deloadWeight,
        reason: 'Deload suggested — missed target reps twice in a row',
        isDeload: true,
        prAlert: false,
      }
    }
  }

  // RPE-based hold: if last session RPE ≥ 9, don't increase
  if (last.rpe !== undefined && last.rpe >= 9) {
    return {
      suggestedWeight: last.bestWeight,
      reason: `High effort last session (RPE ${last.rpe.toFixed(1)}) — stay at same weight`,
      isDeload: false,
      prAlert: false,
    }
  }

  // If hit target reps, increase
  if (last.maxReps >= targetRepsMax) {
    const newWeight = last.bestWeight + increment
    const allBests = sessions.map(s => s.bestWeight)
    const currentMax = Math.max(...allBests)
    return {
      suggestedWeight: newWeight,
      reason: `Hit target reps — increase by ${increment}kg`,
      isDeload: false,
      prAlert: newWeight > currentMax,
    }
  }

  // Otherwise stay the same
  return {
    suggestedWeight: last.bestWeight,
    reason: `Keep same weight until you hit ${targetRepsStr} reps`,
    isDeload: false,
    prAlert: false,
  }
}

function parseRepsMax(repsTarget: string): number {
  if (!repsTarget) return 10
  if (repsTarget.includes('-')) {
    return parseInt(repsTarget.split('-')[1]) || 10
  }
  if (repsTarget.toUpperCase() === 'AMRAP') return 999
  return parseInt(repsTarget) || 10
}

export function getPersonalBest(sets: LoggedSet[]): number {
  const sessions = getBestPerSession(sets)
  if (sessions.length === 0) return 0
  return Math.max(...sessions.map(s => s.bestWeight))
}

export function getPersonalBestDuration(sets: LoggedSet[]): number {
  const timedSets = sets.filter(s => s.durationSeconds !== undefined && !s.isWarmup)
  if (timedSets.length === 0) return 0
  return Math.max(...timedSets.map(s => s.durationSeconds ?? 0))
}
