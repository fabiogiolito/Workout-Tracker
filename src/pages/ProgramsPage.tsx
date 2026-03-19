import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, ChevronRight, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useProgramStore } from '@/store/programStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parsePrograms } from '@/lib/google/sheetReader'
import { programToRow } from '@/lib/google/sheetWriter'
import { TABS } from '@/lib/google/sheetSchema'
import * as sheetsApi from '@/lib/google/sheetsApi'
import { PROGRAM_TEMPLATES, createTemplateProgram } from '@/constants/programTemplates'

export default function ProgramsPage() {
  const navigate = useNavigate()
  const { programs, activeProgramId, setPrograms, setActiveProgramId, deleteProgram, upsertProgram } = useProgramStore()
  const sheetId = useSheetStore(s => s.activeSheetId)
  const [showTemplates, setShowTemplates] = useState(false)

  const { isLoading } = useSheetData(TABS.PROGRAMS, parsePrograms, setPrograms)
  if (isLoading) return <PageSpinner />
  const appendProgram = useAppendRow(TABS.PROGRAMS)

  async function setActive(id: string) {
    setActiveProgramId(id)
    if (sheetId) {
      try {
        const rows = await sheetsApi.getRange(sheetId, 'Config!A:C')
        const now = new Date().toISOString()
        const rowIdx = rows.findIndex(r => r[0] === 'active_program_id')
        if (rowIdx >= 0) {
          await sheetsApi.batchUpdateValues(sheetId, [{
            range: `Config!A${rowIdx + 1}:C${rowIdx + 1}`,
            values: [['active_program_id', id, now]]
          }])
        } else {
          await sheetsApi.appendRow(sheetId, 'Config', ['active_program_id', id, now])
        }
      } catch (e) { console.error(e) }
    }
  }

  async function handleDelete(id: string) {
    deleteProgram(id)
    if (!sheetId) return
    try {
      const rows = await sheetsApi.getRange(sheetId, `${TABS.PROGRAMS}!A:F`)
      const rowIdx = rows.findIndex(r => r[0] === id)
      if (rowIdx >= 0) {
        const ids = await sheetsApi.getSheetInternalIds(sheetId)
        const internalId = ids[TABS.PROGRAMS]
        if (internalId !== undefined) {
          await sheetsApi.deleteRow(sheetId, internalId, rowIdx)
        }
      }
    } catch (e) { console.error(e) }
  }

  async function addFromTemplate(templateId: string) {
    const program = createTemplateProgram(templateId)
    if (!program) return
    upsertProgram(program)
    appendProgram(programToRow(program))
    setShowTemplates(false)
  }

  return (
    <div className="px-6 pb-6">
      <PageHeader
        title="Programs"
        right={
          <button onClick={() => navigate('/programs/new')} className="p-1 -mr-1">
            <Plus size={22} strokeWidth={1.5} />
          </button>
        }
      />

      {programs.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">No programs yet.</p>
          <button onClick={() => setShowTemplates(true)} className="text-sm underline underline-offset-4">
            Start from a template →
          </button>
        </div>
      ) : (
        <div className="space-y-0 mb-8">
          {programs.map(p => (
            <div key={p.id} className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
              <button
                className="flex-1 flex items-center gap-3 text-left"
                onClick={() => navigate(`/programs/${p.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    {activeProgramId === p.id && (
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">active</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">{p.days.length} days</p>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </button>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setActive(p.id)}
                  className={`p-2 rounded-lg transition-colors ${activeProgramId === p.id ? 'text-black' : 'text-neutral-300'}`}
                >
                  <Check size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-neutral-300 hover:text-neutral-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowTemplates(!showTemplates)} className="text-sm text-neutral-400 flex items-center gap-1">
        {showTemplates ? 'Hide' : 'Start from a template'}
      </button>

      {showTemplates && (
        <div className="mt-4 space-y-0">
          {PROGRAM_TEMPLATES.map(t => (
            <div key={t.id} className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{t.description}</p>
              </div>
              <button
                onClick={() => addFromTemplate(t.id)}
                className="text-xs px-3 py-1.5 border border-neutral-200 rounded-lg"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
