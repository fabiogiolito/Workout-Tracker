import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, Search, X, GripVertical } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { useProgramStore } from '@/store/programStore'
import { useSheetStore } from '@/store/sheetStore'
import { useAppendRow } from '@/hooks/useSheetSync'
import { programToRow } from '@/lib/google/sheetWriter'
import { TABS } from '@/lib/google/sheetSchema'
import { EXERCISE_LIBRARY } from '@/constants/exerciseLibrary'
import * as sheetsApi from '@/lib/google/sheetsApi'
import type { Program, WorkoutDay, ExerciseSlot } from '@/types/program'
import type { Exercise, MuscleGroup } from '@/types/exercise'
import { cn } from '@/lib/utils/formatters'
import { formatDuration } from '@/lib/utils/formatters'

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body', 'cardio']

export default function ProgramEditorPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const isNew = programId === 'new'
  const { programs, upsertProgram } = useProgramStore()
  const sheetId = useSheetStore(s => s.activeSheetId)
  const appendProgram = useAppendRow(TABS.PROGRAMS)

  const existing = programs.find(p => p.id === programId)
  const [name, setName] = useState(existing?.name ?? '')
  const [days, setDays] = useState<WorkoutDay[]>(existing?.days ?? [])
  const [expandedDay, setExpandedDay] = useState<string | null>(days[0]?.id ?? null)
  const [showExercisePicker, setShowExercisePicker] = useState<string | null>(null) // day id
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null)
  const [saving, setSaving] = useState(false)

  function addDay() {
    const day: WorkoutDay = { id: uuid(), label: `Day ${days.length + 1}`, exercises: [] }
    setDays([...days, day])
    setExpandedDay(day.id)
  }

  function removeDay(id: string) {
    setDays(days.filter(d => d.id !== id))
  }

  function updateDayLabel(id: string, label: string) {
    setDays(days.map(d => d.id === id ? { ...d, label } : d))
  }

  function addExercise(dayId: string, exercise: Exercise) {
    const slot: ExerciseSlot = {
      exerciseId: exercise.id,
      sets: 3,
      repsTarget: exercise.isTimed ? `${exercise.defaultDurationSeconds ?? 60}s` : '8-12',
      isTimed: exercise.isTimed,
      durationSeconds: exercise.isTimed ? (exercise.defaultDurationSeconds ?? 60) : undefined,
      restSeconds: 90,
    }
    setDays(days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, slot] } : d))
    setShowExercisePicker(null)
    setExerciseSearch('')
    setMuscleFilter(null)
  }

  function removeExercise(dayId: string, exerciseId: string) {
    setDays(days.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.exerciseId !== exerciseId) } : d))
  }

  function updateSlot(dayId: string, exerciseId: string, updates: Partial<ExerciseSlot>) {
    setDays(days.map(d => d.id === dayId ? {
      ...d,
      exercises: d.exercises.map(e => e.exerciseId === exerciseId ? { ...e, ...updates } : e)
    } : d))
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const program: Program = {
      id: isNew ? uuid() : (existing?.id ?? uuid()),
      name: name.trim(),
      days,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    upsertProgram(program)

    if (sheetId) {
      try {
        if (isNew) {
          appendProgram(programToRow(program))
        } else {
          const rows = await sheetsApi.getRange(sheetId, `${TABS.PROGRAMS}!A:F`)
          const rowIdx = rows.findIndex(r => r[0] === program.id)
          if (rowIdx >= 0) {
            await sheetsApi.batchUpdateValues(sheetId, [{
              range: `${TABS.PROGRAMS}!A${rowIdx + 1}:F${rowIdx + 1}`,
              values: [programToRow(program)]
            }])
          } else {
            appendProgram(programToRow(program))
          }
        }
      } catch (e) { console.error(e) }
    }
    setSaving(false)
    navigate('/programs')
  }

  const filteredExercises = EXERCISE_LIBRARY.filter(e => {
    if (muscleFilter && !e.muscleGroups.includes(muscleFilter)) return false
    if (exerciseSearch && !e.name.toLowerCase().includes(exerciseSearch.toLowerCase())) return false
    return true
  })

  return (
    <div className="px-6 pb-24">
      <PageHeader
        title={isNew ? 'New Program' : 'Edit Program'}
        back="/programs"
        right={
          <button onClick={save} disabled={saving || !name.trim()} className="text-sm font-medium disabled:opacity-40">
            {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div className="mb-8">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Program name"
          className="w-full text-xl font-semibold border-b border-neutral-200 pb-3 outline-none placeholder:text-neutral-300 focus:border-black transition-colors bg-transparent"
        />
      </div>

      <div className="space-y-4">
        {days.map(day => (
          <DayEditor
            key={day.id}
            day={day}
            isExpanded={expandedDay === day.id}
            onToggle={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
            onLabelChange={label => updateDayLabel(day.id, label)}
            onRemove={() => removeDay(day.id)}
            onAddExercise={() => setShowExercisePicker(day.id)}
            onRemoveExercise={exId => removeExercise(day.id, exId)}
            onUpdateSlot={(exId, u) => updateSlot(day.id, exId, u)}
          />
        ))}
      </div>

      <button
        onClick={addDay}
        className="flex items-center gap-2 text-sm text-neutral-400 mt-6"
      >
        <Plus size={16} /> Add day
      </button>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="px-6 pt-14 pb-4 flex items-center justify-between border-b border-neutral-100">
            <h2 className="text-lg font-semibold">Add exercise</h2>
            <button onClick={() => { setShowExercisePicker(null); setExerciseSearch('') }}>
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
              <Search size={16} className="text-neutral-400" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)}
                placeholder="Search exercises…"
                className="flex-1 text-sm outline-none bg-transparent"
                autoFocus
              />
            </div>
          </div>
          <div className="px-6 py-3 flex gap-2 flex-wrap border-b border-neutral-100">
            <button
              onClick={() => setMuscleFilter(null)}
              className={cn('text-xs px-2.5 py-1 rounded-full border', !muscleFilter ? 'border-black bg-black text-white' : 'border-neutral-200')}
            >
              All
            </button>
            {MUSCLE_GROUPS.map(m => (
              <button
                key={m}
                onClick={() => setMuscleFilter(muscleFilter === m ? null : m)}
                className={cn('text-xs px-2.5 py-1 rounded-full border capitalize', muscleFilter === m ? 'border-black bg-black text-white' : 'border-neutral-200')}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {filteredExercises.map(exercise => (
              <button
                key={exercise.id}
                className="flex items-center justify-between w-full px-6 py-4 border-b border-neutral-100 text-left"
                onClick={() => addExercise(showExercisePicker, exercise)}
              >
                <div>
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 capitalize">
                    {exercise.muscleGroups.join(', ')}
                    {exercise.isTimed && ` · timed`}
                  </p>
                </div>
                <Plus size={16} className="text-neutral-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DayEditor({ day, isExpanded, onToggle, onLabelChange, onRemove, onAddExercise, onRemoveExercise, onUpdateSlot }: {
  day: WorkoutDay
  isExpanded: boolean
  onToggle: () => void
  onLabelChange: (label: string) => void
  onRemove: () => void
  onAddExercise: () => void
  onRemoveExercise: (exId: string) => void
  onUpdateSlot: (exId: string, u: Partial<ExerciseSlot>) => void
}) {
  const exercise = (exId: string) => EXERCISE_LIBRARY.find(e => e.id === exId)

  return (
    <div className="border-b border-neutral-100 pb-4">
      <div className="flex items-center gap-3 py-2">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left">
          <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
          <input
            type="text"
            value={day.label}
            onChange={e => onLabelChange(e.target.value)}
            className="text-sm font-semibold bg-transparent outline-none w-full"
            onClick={e => e.stopPropagation()}
          />
        </button>
        <button onClick={onRemove} className="text-neutral-300 hover:text-neutral-600 p-1">
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="pl-7 space-y-3 mt-2">
          {day.exercises.map(slot => {
            const ex = exercise(slot.exerciseId)
            return (
              <div key={slot.exerciseId} className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{ex?.name ?? slot.exerciseId}</p>
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={slot.sets}
                        onChange={e => onUpdateSlot(slot.exerciseId, { sets: parseInt(e.target.value) || 1 })}
                        className="w-8 text-xs border-b border-neutral-200 text-center outline-none bg-transparent"
                        min={1}
                      />
                      <span className="text-xs text-neutral-400">sets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={slot.isTimed ? formatDuration(slot.durationSeconds ?? 60) : slot.repsTarget}
                        onChange={e => {
                          if (slot.isTimed) {
                            const sec = parseInt(e.target.value) || 60
                            onUpdateSlot(slot.exerciseId, { durationSeconds: sec })
                          } else {
                            onUpdateSlot(slot.exerciseId, { repsTarget: e.target.value })
                          }
                        }}
                        className="w-14 text-xs border-b border-neutral-200 text-center outline-none bg-transparent"
                      />
                      <span className="text-xs text-neutral-400">{slot.isTimed ? '' : 'reps'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={slot.restSeconds}
                        onChange={e => onUpdateSlot(slot.exerciseId, { restSeconds: parseInt(e.target.value) || 60 })}
                        className="w-10 text-xs border-b border-neutral-200 text-center outline-none bg-transparent"
                      />
                      <span className="text-xs text-neutral-400">s rest</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onRemoveExercise(slot.exerciseId)} className="text-neutral-300 mt-1 p-1">
                  <X size={14} />
                </button>
              </div>
            )
          })}
          <button onClick={onAddExercise} className="flex items-center gap-1 text-xs text-neutral-400">
            <Plus size={12} /> Add exercise
          </button>
        </div>
      )}
    </div>
  )
}
