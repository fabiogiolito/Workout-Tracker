export interface LoggedSet {
  id: string
  workoutId: string
  exerciseId: string
  exerciseName: string
  setNumber: number
  weightKg?: number
  reps?: number
  durationSeconds?: number
  rpe?: number
  isWarmup: boolean
  loggedAt: string
}

export interface WorkoutSession {
  id: string
  programId: string
  dayId: string
  dayLabel: string
  startedAt: string
  finishedAt?: string
  notes?: string
}
