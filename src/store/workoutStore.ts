import { create } from 'zustand'
import type { WorkoutSession, LoggedSet } from '@/types/workout'

interface WorkoutState {
  activeSession: WorkoutSession | null
  activeSets: LoggedSet[]
  allSessions: WorkoutSession[]
  allSets: LoggedSet[]
  isLoaded: boolean
  dirtySetIds: Set<string>

  startSession: (session: WorkoutSession) => void
  finishSession: (notes?: string) => WorkoutSession | null
  addSet: (set: LoggedSet) => void
  updateSet: (id: string, updates: Partial<LoggedSet>) => void
  removeSet: (id: string) => void
  markSetSynced: (id: string) => void
  markSetDirty: (id: string) => void
  loadData: (sessions: WorkoutSession[], sets: LoggedSet[]) => void
  getSetsForExercise: (exerciseId: string) => LoggedSet[]
  getSetsForWorkout: (workoutId: string) => LoggedSet[]
  getLastWorkoutForDay: (dayId: string) => WorkoutSession | null
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSession: null,
  activeSets: [],
  allSessions: [],
  allSets: [],
  isLoaded: false,
  dirtySetIds: new Set(),

  startSession: (session) => set({ activeSession: session, activeSets: [] }),

  finishSession: (notes) => {
    const { activeSession } = get()
    if (!activeSession) return null
    const finished = { ...activeSession, finishedAt: new Date().toISOString(), notes }
    set(s => ({
      activeSession: null,
      activeSets: [],
      allSessions: [...s.allSessions, finished],
    }))
    return finished
  },

  addSet: (setData) => {
    set(s => ({
      activeSets: [...s.activeSets, setData],
      allSets: [...s.allSets, setData],
    }))
  },

  updateSet: (id, updates) => {
    set(s => ({
      activeSets: s.activeSets.map(s => s.id === id ? { ...s, ...updates } : s),
      allSets: s.allSets.map(s => s.id === id ? { ...s, ...updates } : s),
    }))
  },

  removeSet: (id) => {
    set(s => ({
      activeSets: s.activeSets.filter(s => s.id !== id),
      allSets: s.allSets.filter(s => s.id !== id),
    }))
  },

  markSetSynced: (id) => {
    set(s => {
      const next = new Set(s.dirtySetIds)
      next.delete(id)
      return { dirtySetIds: next }
    })
  },

  markSetDirty: (id) => {
    set(s => ({ dirtySetIds: new Set([...s.dirtySetIds, id]) }))
  },

  loadData: (sessions, sets) => {
    set({ allSessions: sessions, allSets: sets, isLoaded: true })
  },

  getSetsForExercise: (exerciseId) => {
    return get().allSets.filter(s => s.exerciseId === exerciseId)
  },

  getSetsForWorkout: (workoutId) => {
    return get().allSets.filter(s => s.workoutId === workoutId)
  },

  getLastWorkoutForDay: (dayId) => {
    const sessions = get().allSessions
      .filter(s => s.dayId === dayId && s.finishedAt)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    return sessions[0] ?? null
  },
}))
