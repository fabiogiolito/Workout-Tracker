export interface ExerciseSlot {
  exerciseId: string
  sets: number
  repsTarget: string // e.g. "6-8" or "10" or "AMRAP"
  isTimed: boolean
  durationSeconds?: number
  restSeconds: number
}

export interface WorkoutDay {
  id: string
  label: string
  exercises: ExerciseSlot[]
}

export interface Program {
  id: string
  name: string
  description?: string
  days: WorkoutDay[]
  createdAt: string
  updatedAt: string
}
