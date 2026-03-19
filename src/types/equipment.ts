export type EquipmentType =
  | 'barbell'
  | 'dumbbell_set'
  | 'machine'
  | 'cable'
  | 'resistance_band'
  | 'kettlebell'
  | 'pull_up_bar'
  | 'other'

export interface PlateCount {
  weight: number // kg
  qty: number
}

export interface Equipment {
  id: string
  type: EquipmentType
  name: string
  enabled: boolean
  barWeightKg?: number
  availablePlates?: PlateCount[] // for barbells
  dumbbellWeights?: number[] // available dumbbell weights in kg
  kettlebellWeights?: number[]
  notes?: string
  updatedAt: string
}

export interface WeightOption {
  totalKg: number
  plateBreakdown?: string // e.g. "2×20 + 2×10"
}
