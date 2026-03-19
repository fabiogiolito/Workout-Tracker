import type { Exercise } from '@/types/exercise'

export const EXERCISE_LIBRARY: Exercise[] = [
  // CHEST - Barbell
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'incline-barbell-bench', name: 'Incline Barbell Bench Press', muscleGroups: ['chest', 'shoulders', 'triceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'decline-barbell-bench', name: 'Decline Barbell Bench Press', muscleGroups: ['chest', 'triceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },

  // CHEST - Dumbbell
  { id: 'dumbbell-bench-press', name: 'Dumbbell Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'dumbbell-flye', name: 'Dumbbell Flye', muscleGroups: ['chest'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroups: ['chest', 'shoulders', 'triceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },

  // CHEST - Bodyweight
  { id: 'push-up', name: 'Push-Up', muscleGroups: ['chest', 'triceps', 'shoulders'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'wide-push-up', name: 'Wide Push-Up', muscleGroups: ['chest'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'diamond-push-up', name: 'Diamond Push-Up', muscleGroups: ['chest', 'triceps'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'decline-push-up', name: 'Decline Push-Up', muscleGroups: ['chest', 'shoulders'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },

  // CHEST - Cable
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroups: ['chest'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'cable-flye', name: 'Cable Flye', muscleGroups: ['chest'], equipmentTags: ['cable'], isTimed: false, isCustom: false },

  // BACK - Barbell
  { id: 'barbell-row', name: 'Barbell Bent-Over Row', muscleGroups: ['back', 'biceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'deadlift', name: 'Deadlift', muscleGroups: ['back', 'glutes', 'hamstrings', 'quads'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', muscleGroups: ['glutes', 'hamstrings', 'back', 'quads'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'rdl', name: 'Romanian Deadlift (RDL)', muscleGroups: ['hamstrings', 'glutes', 'back'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'barbell-shrug', name: 'Barbell Shrug', muscleGroups: ['back', 'forearms'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },

  // BACK - Dumbbell
  { id: 'dumbbell-row', name: 'Dumbbell Row', muscleGroups: ['back', 'biceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'dumbbell-rdl', name: 'Dumbbell Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes', 'back'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },

  // BACK - Bodyweight
  { id: 'pull-up', name: 'Pull-Up', muscleGroups: ['back', 'biceps'], equipmentTags: ['pull_up_bar'], isTimed: false, isCustom: false },
  { id: 'chin-up', name: 'Chin-Up', muscleGroups: ['back', 'biceps'], equipmentTags: ['pull_up_bar'], isTimed: false, isCustom: false },
  { id: 'inverted-row', name: 'Inverted Row', muscleGroups: ['back', 'biceps'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'dead-hang', name: 'Dead Hang', muscleGroups: ['back', 'forearms'], equipmentTags: ['pull_up_bar'], isTimed: true, defaultDurationSeconds: 30, isCustom: false },

  // BACK - Cable/Machine
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroups: ['back', 'biceps'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroups: ['back', 'biceps'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['shoulders', 'back'], equipmentTags: ['cable'], isTimed: false, isCustom: false },

  // SHOULDERS
  { id: 'overhead-press', name: 'Barbell Overhead Press', muscleGroups: ['shoulders', 'triceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroups: ['shoulders', 'triceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroups: ['shoulders'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'front-raise', name: 'Front Raise', muscleGroups: ['shoulders'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'rear-delt-flye', name: 'Rear Delt Flye', muscleGroups: ['shoulders', 'back'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroups: ['shoulders', 'triceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroups: ['shoulders'], equipmentTags: ['cable'], isTimed: false, isCustom: false },

  // BICEPS
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroups: ['biceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroups: ['biceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroups: ['biceps', 'forearms'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'incline-curl', name: 'Incline Dumbbell Curl', muscleGroups: ['biceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroups: ['biceps'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'concentration-curl', name: 'Concentration Curl', muscleGroups: ['biceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroups: ['biceps'], equipmentTags: ['machine'], isTimed: false, isCustom: false },

  // TRICEPS
  { id: 'close-grip-bench', name: 'Close Grip Bench Press', muscleGroups: ['triceps', 'chest'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroups: ['triceps'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', muscleGroups: ['triceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'tricep-dip', name: 'Tricep Dip', muscleGroups: ['triceps', 'chest'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'cable-pushdown', name: 'Cable Pushdown', muscleGroups: ['triceps'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'kickback', name: 'Tricep Kickback', muscleGroups: ['triceps'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },

  // LEGS - Quads
  { id: 'barbell-squat', name: 'Barbell Back Squat', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'front-squat', name: 'Front Squat', muscleGroups: ['quads', 'glutes'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'goblet-squat', name: 'Goblet Squat', muscleGroups: ['quads', 'glutes'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['quads', 'glutes'], equipmentTags: ['machine'], isTimed: false, isCustom: false },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroups: ['quads'], equipmentTags: ['machine'], isTimed: false, isCustom: false },
  { id: 'lunge', name: 'Dumbbell Lunge', muscleGroups: ['quads', 'glutes'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroups: ['quads', 'glutes'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'wall-sit', name: 'Wall Sit', muscleGroups: ['quads'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 60, isCustom: false },
  { id: 'bodyweight-squat', name: 'Bodyweight Squat', muscleGroups: ['quads', 'glutes'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },

  // LEGS - Hamstrings/Glutes
  { id: 'leg-curl', name: 'Leg Curl', muscleGroups: ['hamstrings'], equipmentTags: ['machine'], isTimed: false, isCustom: false },
  { id: 'nordic-curl', name: 'Nordic Hamstring Curl', muscleGroups: ['hamstrings'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['glutes', 'hamstrings'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'dumbbell-hip-thrust', name: 'Dumbbell Hip Thrust', muscleGroups: ['glutes', 'hamstrings'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroups: ['glutes'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },

  // CALVES
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', muscleGroups: ['calves'], equipmentTags: ['machine'], isTimed: false, isCustom: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroups: ['calves'], equipmentTags: ['machine'], isTimed: false, isCustom: false },
  { id: 'donkey-calf-raise', name: 'Donkey Calf Raise', muscleGroups: ['calves'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },

  // CORE
  { id: 'plank', name: 'Plank', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 60, isCustom: false },
  { id: 'side-plank', name: 'Side Plank', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 30, isCustom: false },
  { id: 'crunch', name: 'Crunch', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'sit-up', name: 'Sit-Up', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'leg-raise', name: 'Hanging Leg Raise', muscleGroups: ['core'], equipmentTags: ['pull_up_bar'], isTimed: false, isCustom: false },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroups: ['core'], equipmentTags: ['dumbbell'], isTimed: false, isCustom: false },
  { id: 'hollow-hold', name: 'Hollow Hold', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 30, isCustom: false },
  { id: 'l-sit', name: 'L-Sit', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 20, isCustom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroups: ['core'], equipmentTags: ['cable'], isTimed: false, isCustom: false },
  { id: 'bicycle-crunch', name: 'Bicycle Crunch', muscleGroups: ['core'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'mountain-climber', name: 'Mountain Climber', muscleGroups: ['core', 'cardio'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 30, isCustom: false },

  // FULL BODY / COMPOUND
  { id: 'clean-and-press', name: 'Clean and Press', muscleGroups: ['full_body'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'thruster', name: 'Thruster', muscleGroups: ['full_body', 'quads', 'shoulders'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'burpee', name: 'Burpee', muscleGroups: ['full_body', 'cardio'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroups: ['glutes', 'hamstrings', 'back', 'shoulders'], equipmentTags: ['kettlebell'], isTimed: false, isCustom: false },
  { id: 'turkish-get-up', name: 'Turkish Get-Up', muscleGroups: ['full_body'], equipmentTags: ['kettlebell'], isTimed: false, isCustom: false },

  // CARDIO
  { id: 'treadmill', name: 'Treadmill', muscleGroups: ['cardio'], equipmentTags: ['machine'], isTimed: true, defaultDurationSeconds: 1800, isCustom: false },
  { id: 'rowing', name: 'Rowing Machine', muscleGroups: ['cardio', 'back'], equipmentTags: ['machine'], isTimed: true, defaultDurationSeconds: 1800, isCustom: false },
  { id: 'stationary-bike', name: 'Stationary Bike', muscleGroups: ['cardio', 'quads'], equipmentTags: ['machine'], isTimed: true, defaultDurationSeconds: 1800, isCustom: false },
  { id: 'jump-rope', name: 'Jump Rope', muscleGroups: ['cardio', 'calves'], equipmentTags: ['bodyweight'], isTimed: true, defaultDurationSeconds: 120, isCustom: false },
  { id: 'box-jump', name: 'Box Jump', muscleGroups: ['cardio', 'quads', 'glutes'], equipmentTags: ['bodyweight'], isTimed: false, isCustom: false },

  // FOREARMS
  { id: 'wrist-curl', name: 'Wrist Curl', muscleGroups: ['forearms'], equipmentTags: ['barbell'], isTimed: false, isCustom: false },
  { id: 'farmers-carry', name: "Farmer's Carry", muscleGroups: ['forearms', 'full_body'], equipmentTags: ['dumbbell'], isTimed: true, defaultDurationSeconds: 30, isCustom: false },
]

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find(e => e.id === id)
}
