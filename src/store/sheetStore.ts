import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SheetMeta } from '@/types/sheet'

interface SheetState {
  activeSheetId: string | null
  activeSheetUrl: string | null
  activeSheetTitle: string | null
  sheetHistory: SheetMeta[]
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'
  error: string | null

  setActiveSheet: (meta: SheetMeta) => void
  clearActiveSheet: () => void
  updateHistory: (meta: SheetMeta) => void
  removeFromHistory: (id: string) => void
  setConnectionStatus: (status: SheetState['connectionStatus'], error?: string) => void
}

export const useSheetStore = create<SheetState>()(
  persist(
    (set, get) => ({
      activeSheetId: null,
      activeSheetUrl: null,
      activeSheetTitle: null,
      sheetHistory: [],
      connectionStatus: 'idle',
      error: null,

      setActiveSheet: (meta) => {
        set({
          activeSheetId: meta.id,
          activeSheetUrl: meta.url,
          activeSheetTitle: meta.title,
          connectionStatus: 'connected',
          error: null,
        })
        get().updateHistory(meta)
      },

      clearActiveSheet: () => {
        set({ activeSheetId: null, activeSheetUrl: null, activeSheetTitle: null, connectionStatus: 'idle' })
      },

      updateHistory: (meta) => {
        const history = get().sheetHistory.filter(s => s.id !== meta.id)
        set({ sheetHistory: [{ ...meta, lastUsedAt: new Date().toISOString() }, ...history] })
      },

      removeFromHistory: (id) => {
        set(s => ({
          sheetHistory: s.sheetHistory.filter(h => h.id !== id),
          ...(s.activeSheetId === id ? { activeSheetId: null, activeSheetUrl: null, activeSheetTitle: null, connectionStatus: 'idle' } : {}),
        }))
      },

      setConnectionStatus: (status, error) => {
        set({ connectionStatus: status, error: error ?? null })
      },
    }),
    {
      name: 'wt-sheets',
      partialize: (s) => ({
        activeSheetId: s.activeSheetId,
        activeSheetUrl: s.activeSheetUrl,
        activeSheetTitle: s.activeSheetTitle,
        sheetHistory: s.sheetHistory,
      }),
    }
  )
)
