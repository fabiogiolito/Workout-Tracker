export const TABS = {
  CONFIG: 'Config',
  EQUIPMENT: 'Equipment',
  EXERCISES: 'Exercises',
  PROGRAMS: 'Programs',
  WORKOUTS: 'Workouts',
  SETS: 'Sets',
  NUTRITION: 'Nutrition',
  FOODS: 'Foods',
  METRICS: 'Metrics',
} as const

export const HEADERS: Record<string, string[]> = {
  [TABS.CONFIG]: ['key', 'value', 'updated_at'],
  [TABS.EQUIPMENT]: ['id', 'type', 'name', 'enabled', 'bar_weight_kg', 'available_plates_json', 'dumbbell_weights_json', 'kettlebell_weights_json', 'notes', 'updated_at'],
  [TABS.EXERCISES]: ['id', 'name', 'muscle_groups', 'equipment_types', 'is_timed', 'default_duration_seconds', 'is_custom', 'notes', 'created_at'],
  [TABS.PROGRAMS]: ['id', 'name', 'description', 'days_json', 'created_at', 'updated_at'],
  [TABS.WORKOUTS]: ['id', 'program_id', 'day_id', 'day_label', 'started_at', 'finished_at', 'notes'],
  [TABS.SETS]: ['id', 'workout_id', 'exercise_id', 'exercise_name', 'set_number', 'weight_kg', 'reps', 'duration_seconds', 'rpe', 'is_warmup', 'logged_at'],
  [TABS.NUTRITION]: ['id', 'date', 'meal_name', 'food_id', 'food_name', 'quantity_g', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'logged_at'],
  [TABS.FOODS]: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'is_custom', 'created_at'],
  [TABS.METRICS]: ['id', 'date', 'body_weight_kg', 'body_fat_pct', 'waist_cm', 'chest_cm', 'arms_cm', 'logged_at'],
}

export function parseSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}
