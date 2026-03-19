import type { Program } from '@/types/program'
import { v4 as uuid } from 'uuid'

export function createTemplateProgram(templateId: string): Program | null {
  const now = new Date().toISOString()
  const id = uuid()

  switch (templateId) {
    case 'ppl': return {
      id, name: 'Push Pull Legs', description: '6-day split: Push, Pull, Legs × 2',
      createdAt: now, updatedAt: now,
      days: [
        { id: uuid(), label: 'Push A', exercises: [
          { exerciseId: 'barbell-bench-press', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'incline-dumbbell-press', sets: 3, repsTarget: '8-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'overhead-press', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 120 },
          { exerciseId: 'lateral-raise', sets: 3, repsTarget: '12-15', isTimed: false, restSeconds: 90 },
          { exerciseId: 'cable-pushdown', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
        ]},
        { id: uuid(), label: 'Pull A', exercises: [
          { exerciseId: 'deadlift', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 240 },
          { exerciseId: 'pull-up', sets: 4, repsTarget: '6-10', isTimed: false, restSeconds: 150 },
          { exerciseId: 'barbell-row', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 120 },
          { exerciseId: 'dumbbell-curl', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
          { exerciseId: 'hammer-curl', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
        ]},
        { id: uuid(), label: 'Legs A', exercises: [
          { exerciseId: 'barbell-squat', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 240 },
          { exerciseId: 'rdl', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 150 },
          { exerciseId: 'leg-press', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'leg-curl', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
          { exerciseId: 'standing-calf-raise', sets: 4, repsTarget: '15-20', isTimed: false, restSeconds: 60 },
        ]},
        { id: uuid(), label: 'Push B', exercises: [
          { exerciseId: 'overhead-press', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'dumbbell-bench-press', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'dumbbell-flye', sets: 3, repsTarget: '12-15', isTimed: false, restSeconds: 90 },
          { exerciseId: 'lateral-raise', sets: 3, repsTarget: '15', isTimed: false, restSeconds: 90 },
          { exerciseId: 'skull-crusher', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
        ]},
        { id: uuid(), label: 'Pull B', exercises: [
          { exerciseId: 'barbell-row', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'lat-pulldown', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'seated-cable-row', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'barbell-curl', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 90 },
          { exerciseId: 'face-pull', sets: 3, repsTarget: '15', isTimed: false, restSeconds: 60 },
        ]},
        { id: uuid(), label: 'Legs B', exercises: [
          { exerciseId: 'front-squat', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'bulgarian-split-squat', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 120 },
          { exerciseId: 'leg-extension', sets: 3, repsTarget: '12-15', isTimed: false, restSeconds: 90 },
          { exerciseId: 'hip-thrust', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'seated-calf-raise', sets: 4, repsTarget: '15-20', isTimed: false, restSeconds: 60 },
        ]},
      ]
    }

    case 'upper-lower': return {
      id, name: 'Upper / Lower', description: '4-day split for balanced strength',
      createdAt: now, updatedAt: now,
      days: [
        { id: uuid(), label: 'Upper A', exercises: [
          { exerciseId: 'barbell-bench-press', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'barbell-row', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'overhead-press', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 120 },
          { exerciseId: 'dumbbell-curl', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
          { exerciseId: 'cable-pushdown', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
        ]},
        { id: uuid(), label: 'Lower A', exercises: [
          { exerciseId: 'barbell-squat', sets: 4, repsTarget: '6-8', isTimed: false, restSeconds: 240 },
          { exerciseId: 'rdl', sets: 3, repsTarget: '8-10', isTimed: false, restSeconds: 150 },
          { exerciseId: 'leg-press', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'leg-curl', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 90 },
          { exerciseId: 'standing-calf-raise', sets: 4, repsTarget: '15', isTimed: false, restSeconds: 60 },
        ]},
        { id: uuid(), label: 'Upper B', exercises: [
          { exerciseId: 'incline-barbell-bench', sets: 4, repsTarget: '8-10', isTimed: false, restSeconds: 150 },
          { exerciseId: 'pull-up', sets: 4, repsTarget: 'AMRAP', isTimed: false, restSeconds: 150 },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'hammer-curl', sets: 3, repsTarget: '12', isTimed: false, restSeconds: 90 },
          { exerciseId: 'skull-crusher', sets: 3, repsTarget: '12', isTimed: false, restSeconds: 90 },
        ]},
        { id: uuid(), label: 'Lower B', exercises: [
          { exerciseId: 'deadlift', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 240 },
          { exerciseId: 'front-squat', sets: 3, repsTarget: '8', isTimed: false, restSeconds: 180 },
          { exerciseId: 'hip-thrust', sets: 3, repsTarget: '10-12', isTimed: false, restSeconds: 120 },
          { exerciseId: 'leg-extension', sets: 3, repsTarget: '12-15', isTimed: false, restSeconds: 90 },
          { exerciseId: 'seated-calf-raise', sets: 3, repsTarget: '15', isTimed: false, restSeconds: 60 },
        ]},
      ]
    }

    case 'full-body': return {
      id, name: 'Full Body 3×/Week', description: 'Monday, Wednesday, Friday',
      createdAt: now, updatedAt: now,
      days: [
        { id: uuid(), label: 'Day A', exercises: [
          { exerciseId: 'barbell-squat', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 180 },
          { exerciseId: 'barbell-bench-press', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 180 },
          { exerciseId: 'barbell-row', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 180 },
          { exerciseId: 'plank', sets: 3, repsTarget: '60s', isTimed: true, durationSeconds: 60, restSeconds: 60 },
        ]},
        { id: uuid(), label: 'Day B', exercises: [
          { exerciseId: 'barbell-squat', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 180 },
          { exerciseId: 'overhead-press', sets: 3, repsTarget: '5', isTimed: false, restSeconds: 180 },
          { exerciseId: 'deadlift', sets: 1, repsTarget: '5', isTimed: false, restSeconds: 300 },
          { exerciseId: 'plank', sets: 3, repsTarget: '60s', isTimed: true, durationSeconds: 60, restSeconds: 60 },
        ]},
      ]
    }

    case 'home-no-equipment': return {
      id, name: 'Home — No Equipment', description: 'Bodyweight only, 3-4 days/week',
      createdAt: now, updatedAt: now,
      days: [
        { id: uuid(), label: 'Upper Body', exercises: [
          { exerciseId: 'push-up', sets: 4, repsTarget: 'AMRAP', isTimed: false, restSeconds: 90 },
          { exerciseId: 'diamond-push-up', sets: 3, repsTarget: 'AMRAP', isTimed: false, restSeconds: 90 },
          { exerciseId: 'inverted-row', sets: 3, repsTarget: 'AMRAP', isTimed: false, restSeconds: 90 },
          { exerciseId: 'tricep-dip', sets: 3, repsTarget: 'AMRAP', isTimed: false, restSeconds: 90 },
          { exerciseId: 'plank', sets: 3, repsTarget: '60s', isTimed: true, durationSeconds: 60, restSeconds: 60 },
        ]},
        { id: uuid(), label: 'Lower Body', exercises: [
          { exerciseId: 'bodyweight-squat', sets: 4, repsTarget: '20', isTimed: false, restSeconds: 60 },
          { exerciseId: 'lunge', sets: 3, repsTarget: '12', isTimed: false, restSeconds: 60 },
          { exerciseId: 'glute-bridge', sets: 4, repsTarget: '15', isTimed: false, restSeconds: 60 },
          { exerciseId: 'wall-sit', sets: 3, repsTarget: '60s', isTimed: true, durationSeconds: 60, restSeconds: 90 },
          { exerciseId: 'donkey-calf-raise', sets: 3, repsTarget: '20', isTimed: false, restSeconds: 60 },
        ]},
      ]
    }

    default: return null
  }
}

export const PROGRAM_TEMPLATES = [
  { id: 'ppl', name: 'Push / Pull / Legs', description: '6-day split, intermediate', days: 6 },
  { id: 'upper-lower', name: 'Upper / Lower', description: '4-day split, beginner–intermediate', days: 4 },
  { id: 'full-body', name: 'Full Body 3×', description: 'Starting Strength style, beginner', days: 2 },
  { id: 'home-no-equipment', name: 'Home — Bodyweight', description: 'No equipment needed', days: 2 },
]
