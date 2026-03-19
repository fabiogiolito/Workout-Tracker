import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Program } from '@/types/program'

interface ProgramState {
  programs: Program[]
  activeProgramId: string | null
  isLoaded: boolean
  setPrograms: (programs: Program[]) => void
  upsertProgram: (program: Program) => void
  deleteProgram: (id: string) => void
  setActiveProgramId: (id: string | null) => void
  getActiveProgram: () => Program | null
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      programs: [],
      activeProgramId: null,
      isLoaded: false,

      setPrograms: (programs) => set({ programs, isLoaded: true }),

      upsertProgram: (program) => {
        set(s => {
          const existing = s.programs.findIndex(p => p.id === program.id)
          if (existing >= 0) {
            const next = [...s.programs]
            next[existing] = program
            return { programs: next }
          }
          return { programs: [...s.programs, program] }
        })
      },

      deleteProgram: (id) => set(s => ({
        programs: s.programs.filter(p => p.id !== id),
        activeProgramId: s.activeProgramId === id ? null : s.activeProgramId,
      })),

      setActiveProgramId: (id) => set({ activeProgramId: id }),

      getActiveProgram: () => {
        const { programs, activeProgramId } = get()
        return programs.find(p => p.id === activeProgramId) ?? null
      },
    }),
    {
      name: 'wt-programs',
      partialize: s => ({ activeProgramId: s.activeProgramId }),
    }
  )
)
