import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { useEquipmentStore } from '@/store/equipmentStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parseEquipment } from '@/lib/google/sheetReader'
import { equipmentToRow } from '@/lib/google/sheetWriter'
import { TABS } from '@/lib/google/sheetSchema'
import * as sheetsApi from '@/lib/google/sheetsApi'
import type { Equipment, PlateCount } from '@/types/equipment'
import { cn } from '@/lib/utils/formatters'

const PRESET_PLATE_WEIGHTS = [1.25, 2.5, 5, 10, 15, 20, 25]
const PRESET_DUMBBELL_WEIGHTS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40, 45, 50]

export default function EquipmentPage() {
  const { equipment, setEquipment, upsertEquipment, removeEquipment, toggleEquipment } = useEquipmentStore()
  const sheetId = useSheetStore(s => s.activeSheetId)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const appendEquipment = useAppendRow(TABS.EQUIPMENT)

  useSheetData(TABS.EQUIPMENT, parseEquipment, setEquipment)

  async function saveEquipment(item: Equipment) {
    upsertEquipment(item)
    if (!sheetId) return
    try {
      const rows = await sheetsApi.getRange(sheetId, `${TABS.EQUIPMENT}!A:J`)
      const rowIdx = rows.findIndex(r => r[0] === item.id)
      if (rowIdx >= 0) {
        await sheetsApi.batchUpdateValues(sheetId, [{
          range: `${TABS.EQUIPMENT}!A${rowIdx + 1}:J${rowIdx + 1}`,
          values: [equipmentToRow(item)]
        }])
      } else {
        appendEquipment(equipmentToRow(item))
      }
    } catch (e) { console.error(e) }
  }

  async function handleToggle(id: string) {
    toggleEquipment(id)
    const item = equipment.find(e => e.id === id)
    if (item) saveEquipment({ ...item, enabled: !item.enabled })
  }

  async function addPreset(preset: Partial<Equipment>) {
    const item: Equipment = {
      id: uuid(),
      type: preset.type ?? 'other',
      name: preset.name ?? '',
      enabled: true,
      barWeightKg: preset.barWeightKg,
      availablePlates: preset.availablePlates,
      dumbbellWeights: preset.dumbbellWeights,
      updatedAt: new Date().toISOString(),
    }
    await saveEquipment(item)
    setExpandedId(item.id)
  }

  async function deleteItem(id: string) {
    removeEquipment(id)
    if (!sheetId) return
    try {
      const rows = await sheetsApi.getRange(sheetId, `${TABS.EQUIPMENT}!A:J`)
      const rowIdx = rows.findIndex(r => r[0] === id)
      if (rowIdx >= 0) {
        const ids = await sheetsApi.getSheetInternalIds(sheetId)
        const internalId = ids[TABS.EQUIPMENT]
        if (internalId !== undefined) await sheetsApi.deleteRow(sheetId, internalId, rowIdx)
      }
    } catch (e) { console.error(e) }
  }

  const barbells = equipment.filter(e => e.type === 'barbell')
  const dumbbells = equipment.filter(e => e.type === 'dumbbell_set')
  const other = equipment.filter(e => !['barbell', 'dumbbell_set'].includes(e.type))

  return (
    <div className="px-6 pb-10">
      <PageHeader title="Equipment" subtitle="What do you have available?" />

      {/* Quick setup */}
      {equipment.length === 0 && (
        <div className="mb-10">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Quick setup</p>
          <div className="space-y-0">
            {[
              { label: 'Full gym (barbell + dumbbells)', action: () => {
                addPreset({ type: 'barbell', name: 'Olympic Barbell', barWeightKg: 20, availablePlates: [{ weight: 20, qty: 4 }, { weight: 15, qty: 2 }, { weight: 10, qty: 4 }, { weight: 5, qty: 4 }, { weight: 2.5, qty: 4 }, { weight: 1.25, qty: 4 }] })
                addPreset({ type: 'dumbbell_set', name: 'Dumbbell Set', dumbbellWeights: [5, 7.5, 10, 12.5, 15, 20, 25, 30] })
                addPreset({ type: 'cable', name: 'Cable Machine', enabled: true })
                addPreset({ type: 'machine', name: 'Machines', enabled: true })
              }},
              { label: 'Home gym (barbell only)', action: () => {
                addPreset({ type: 'barbell', name: 'Barbell', barWeightKg: 20, availablePlates: [{ weight: 20, qty: 2 }, { weight: 10, qty: 4 }, { weight: 5, qty: 4 }, { weight: 2.5, qty: 2 }] })
              }},
              { label: 'Dumbbells only', action: () => {
                addPreset({ type: 'dumbbell_set', name: 'Dumbbells', dumbbellWeights: [5, 7.5, 10, 12.5, 15, 20] })
              }},
              { label: 'No equipment (bodyweight)', action: () => {
                addPreset({ type: 'pull_up_bar', name: 'Pull-Up Bar', enabled: true })
              }},
            ].map(p => (
              <button key={p.label} onClick={p.action} className="flex items-center justify-between w-full py-4 border-b border-neutral-100 last:border-0 text-left text-sm">
                {p.label}
                <Plus size={16} className="text-neutral-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barbells */}
      {barbells.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Barbells</p>
          {barbells.map(item => (
            <BarbellEditor key={item.id} item={item} isExpanded={expandedId === item.id} onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)} onSave={saveEquipment} onDelete={() => deleteItem(item.id)} />
          ))}
          <button onClick={() => addPreset({ type: 'barbell', name: 'Barbell', barWeightKg: 20 })} className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
            <Plus size={12} /> Add barbell
          </button>
        </div>
      )}

      {/* Dumbbells */}
      {dumbbells.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Dumbbells</p>
          {dumbbells.map(item => (
            <DumbbellEditor key={item.id} item={item} isExpanded={expandedId === item.id} onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)} onSave={saveEquipment} onDelete={() => deleteItem(item.id)} />
          ))}
          <button onClick={() => addPreset({ type: 'dumbbell_set', name: 'Dumbbells' })} className="flex items-center gap-2 text-xs text-neutral-400 mt-2">
            <Plus size={12} /> Add dumbbell set
          </button>
        </div>
      )}

      {/* Other */}
      {other.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Other equipment</p>
          {other.map(item => (
            <div key={item.id} className="flex items-center justify-between py-3 border-b border-neutral-100">
              <p className="text-sm">{item.name}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(item.id)}
                  className={cn('w-10 h-5 rounded-full transition-colors relative', item.enabled ? 'bg-black' : 'bg-neutral-200')}
                >
                  <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', item.enabled ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
                <button onClick={() => deleteItem(item.id)} className="text-neutral-300 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {equipment.length > 0 && (
        <div className="flex gap-3 flex-wrap mt-4">
          {[
            { type: 'barbell' as const, label: '+ Barbell' },
            { type: 'dumbbell_set' as const, label: '+ Dumbbells' },
            { type: 'cable' as const, label: '+ Cable' },
            { type: 'machine' as const, label: '+ Machine' },
            { type: 'resistance_band' as const, label: '+ Band' },
            { type: 'kettlebell' as const, label: '+ Kettlebell' },
            { type: 'pull_up_bar' as const, label: '+ Pull-up bar' },
          ].map(({ type, label }) => (
            <button key={type} onClick={() => addPreset({ type, name: label.slice(2) })} className="text-xs px-3 py-1.5 border border-neutral-200 rounded-full">
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BarbellEditor({ item, isExpanded, onToggleExpand, onSave, onDelete }: {
  item: Equipment; isExpanded: boolean; onToggleExpand: () => void
  onSave: (item: Equipment) => void; onDelete: () => void
}) {
  const [barWeight, setBarWeight] = useState(String(item.barWeightKg ?? 20))
  const [plates, setPlates] = useState<PlateCount[]>(item.availablePlates ?? [])

  function save() {
    onSave({ ...item, barWeightKg: parseFloat(barWeight) || 20, availablePlates: plates, updatedAt: new Date().toISOString() })
  }

  function updatePlate(weight: number, qty: number) {
    const existing = plates.findIndex(p => p.weight === weight)
    if (qty <= 0) {
      setPlates(plates.filter(p => p.weight !== weight))
    } else if (existing >= 0) {
      const next = [...plates]; next[existing] = { weight, qty }; setPlates(next)
    } else {
      setPlates([...plates, { weight, qty }].sort((a, b) => b.weight - a.weight))
    }
  }

  return (
    <div className="border-b border-neutral-100 py-3">
      <button className="flex items-center justify-between w-full text-left" onClick={onToggleExpand}>
        <div>
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-neutral-400">{item.barWeightKg ?? 20}kg bar · {plates.length} plate sizes</p>
        </div>
        <div className="flex items-center gap-2">
          <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs text-neutral-400 mb-2">Bar weight (kg)</p>
            <input type="number" value={barWeight} onChange={e => setBarWeight(e.target.value)} className="w-20 text-sm border-b border-neutral-200 pb-1 outline-none bg-transparent" />
          </div>
          <div>
            <p className="text-xs text-neutral-400 mb-3">Plates available (pairs)</p>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_PLATE_WEIGHTS.map(w => {
                const qty = plates.find(p => p.weight === w)?.qty ?? 0
                return (
                  <div key={w} className="text-center">
                    <p className="text-xs text-neutral-400 mb-1">{w}kg</p>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => updatePlate(w, qty - 2)} className="w-5 h-5 text-neutral-400 border border-neutral-200 rounded text-xs">−</button>
                      <span className="text-xs w-4 text-center">{qty / 2}</span>
                      <button onClick={() => updatePlate(w, qty + 2)} className="w-5 h-5 text-neutral-400 border border-neutral-200 rounded text-xs">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="text-sm px-4 py-2 bg-black text-white rounded-lg">Save</button>
            <button onClick={onDelete} className="text-sm px-4 py-2 border border-neutral-200 rounded-lg text-neutral-600">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DumbbellEditor({ item, isExpanded, onToggleExpand, onSave, onDelete }: {
  item: Equipment; isExpanded: boolean; onToggleExpand: () => void
  onSave: (item: Equipment) => void; onDelete: () => void
}) {
  const [selected, setSelected] = useState<number[]>(item.dumbbellWeights ?? [])

  function toggle(w: number) {
    setSelected(s => s.includes(w) ? s.filter(x => x !== w) : [...s, w].sort((a, b) => a - b))
  }

  function save() {
    onSave({ ...item, dumbbellWeights: selected, updatedAt: new Date().toISOString() })
  }

  return (
    <div className="border-b border-neutral-100 py-3">
      <button className="flex items-center justify-between w-full text-left" onClick={onToggleExpand}>
        <div>
          <p className="text-sm font-medium">{item.name}</p>
          <p className="text-xs text-neutral-400">{selected.length} weights selected</p>
        </div>
        <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
      </button>

      {isExpanded && (
        <div className="mt-4">
          <p className="text-xs text-neutral-400 mb-3">Select available weights (kg)</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_DUMBBELL_WEIGHTS.map(w => (
              <button
                key={w}
                onClick={() => toggle(w)}
                className={cn('text-xs px-2.5 py-1.5 rounded-full border transition-colors', selected.includes(w) ? 'border-black bg-black text-white' : 'border-neutral-200')}
              >
                {w}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="text-sm px-4 py-2 bg-black text-white rounded-lg">Save</button>
            <button onClick={onDelete} className="text-sm px-4 py-2 border border-neutral-200 rounded-lg text-neutral-600">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}
