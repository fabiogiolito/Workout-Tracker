export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body'
  | 'cardio'

export type EquipmentTag =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'resistance_band'
  | 'kettlebell'
  | 'pull_up_bar'

export interface Exercise {
  id: string
  name: string
  muscleGroups: MuscleGroup[]
  equipmentTags: EquipmentTag[]
  isTimed: boolean
  defaultDurationSeconds?: number
  isCustom: boolean
  notes?: string
  createdAt?: string
}
