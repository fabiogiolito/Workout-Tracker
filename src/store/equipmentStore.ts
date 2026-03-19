import { create } from 'zustand'
import type { Equipment } from '@/types/equipment'

interface EquipmentState {
  equipment: Equipment[]
  isLoaded: boolean
  setEquipment: (items: Equipment[]) => void
  upsertEquipment: (item: Equipment) => void
  removeEquipment: (id: string) => void
  toggleEquipment: (id: string) => void
  getEnabled: () => Equipment[]
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  isLoaded: false,

  setEquipment: (items) => set({ equipment: items, isLoaded: true }),

  upsertEquipment: (item) => {
    set(s => {
      const existing = s.equipment.findIndex(e => e.id === item.id)
      if (existing >= 0) {
        const next = [...s.equipment]
        next[existing] = item
        return { equipment: next }
      }
      return { equipment: [...s.equipment, item] }
    })
  },

  removeEquipment: (id) => set(s => ({ equipment: s.equipment.filter(e => e.id !== id) })),

  toggleEquipment: (id) => {
    set(s => ({
      equipment: s.equipment.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e)
    }))
  },

  getEnabled: () => get().equipment.filter(e => e.enabled),
}))
