import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useWorkoutStore } from '@/store/workoutStore'
import { useProgramStore } from '@/store/programStore'
import { useNutritionStore } from '@/store/nutritionStore'
import { useSheetStore } from '@/store/sheetStore'
import { useSheetData, useAppendRow } from '@/hooks/useSheetSync'
import { parseWorkouts, parseSets, parsePrograms, parseMetrics } from '@/lib/google/sheetReader'
import { metricToRow } from '@/lib/google/sheetWriter'
import { formatDateShort, today } from '@/lib/utils/formatters'
import { TABS } from '@/lib/google/sheetSchema'
import type { BodyMetric } from '@/types/nutrition'
import * as sheetsApi from '@/lib/google/sheetsApi'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { allSessions, allSets, loadData: loadWorkouts } = useWorkoutStore()
  const { programs, activeProgramId, setPrograms } = useProgramStore()
  const { entries, macroGoals, waterToday, metrics, setMetrics, addMetric } = useNutritionStore()
  const sheetTitle = useSheetStore(s => s.activeSheetTitle)
  const sheetId = useSheetStore(s => s.activeSheetId)

  const [showMetrics, setShowMetrics] = useState(false)
  const [metricWeight, setMetricWeight] = useState('')
  const [metricFat, setMetricFat] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingMetric, setSavingMetric] = useState(false)

  const { isLoading: loadingWorkouts } = useSheetData(TABS.WORKOUTS, parseWorkouts, (data) => {
    const sets = useWorkoutStore.getState().allSets
    loadWorkouts(data, sets)
  })
  const { isLoading: loadingSets } = useSheetData(TABS.SETS, parseSets, (data) => {
    const sessions = useWorkoutStore.getState().allSessions
    loadWorkouts(sessions, data)
  })
  const { isLoading: loadingPrograms } = useSheetData(TABS.PROGRAMS, parsePrograms, setPrograms)
  useSheetData(TABS.METRICS, parseMetrics, setMetrics)

  const appendMetric = useAppendRow(TABS.METRICS)

  const activeProgram = programs.find(p => p.id === activeProgramId)

  // Determine next suggested day
  const suggestedDayIdx = useMemo(() => {
    if (!activeProgram) return 0
    if (allSessions.length === 0) return 0
    const finished = allSessions.filter(s => s.finishedAt && s.programId === activeProgramId)
    if (finished.length === 0) return 0
    const last = finished.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
    const lastDayIdx = activeProgram.days.findIndex(d => d.id === last.dayId)
    return (lastDayIdx + 1) % activeProgram.days.length
  }, [activeProgram, allSessions, activeProgramId])

  const suggestedDay = activeProgram?.days[suggestedDayIdx]

  // Today's nutrition
  const todayDate = today()
  const todayEntries = entries.filter(e => e.date === todayDate)
  const totalCal = todayEntries.reduce((sum, e) => sum + e.calories, 0)
  const totalProtein = todayEntries.reduce((sum, e) => sum + e.proteinG, 0)

  // Streaks
  const thisWeek = allSessions.filter(s => {
    const d = new Date(s.startedAt)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    return d >= startOfWeek && s.finishedAt
  }).length

  const lastSession = allSessions
    .filter(s => s.finishedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]

  // Deload check
  const deloadNeeded = useMemo(() => {
    if (allSets.length === 0) return false
    const exerciseIds = [...new Set(allSets.map(s => s.exerciseId))]
    let flagged = 0
    for (const exId of exerciseIds) {
      const exSets = allSets.filter(s => s.exerciseId === exId && !s.isWarmup)
      const byWorkout = new Map<string, number>()
      for (const s of exSets) {
        const current = byWorkout.get(s.workoutId) ?? 0
        byWorkout.set(s.workoutId, Math.max(current, s.reps ?? 0))
      }
      const sessions = [...byWorkout.entries()].sort((a, b) => {
        const sa = allSets.find(s => s.workoutId === a[0])
        const sb = allSets.find(s => s.workoutId === b[0])
        return new Date(sa?.loggedAt ?? 0).getTime() - new Date(sb?.loggedAt ?? 0).getTime()
      })
      if (sessions.length >= 2) {
        const last2 = sessions.slice(-2)
        if (last2[0][1] < 6 && last2[1][1] < 6) flagged++
      }
    }
    return flagged >= 2
  }, [allSets])

  // Latest body metric
  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latestMetric = sortedMetrics[sortedMetrics.length - 1]

  if (loadingWorkouts || loadingSets || loadingPrograms) return <PageSpinner />

  function openEditMetric(m: BodyMetric) {
    setEditingId(m.id)
    setMetricWeight(m.bodyWeightKg ? String(m.bodyWeightKg) : '')
    setMetricFat(m.bodyFatPct ? String(m.bodyFatPct) : '')
  }

  function resetMetricForm() {
    setEditingId(null)
    setMetricWeight('')
    setMetricFat('')
  }

  async function saveMetric() {
    if (!metricWeight && !metricFat) return
    setSavingMetric(true)
    if (editingId) {
      const updated = metrics.map(m => m.id === editingId ? {
        ...m,
        bodyWeightKg: metricWeight ? parseFloat(metricWeight) : m.bodyWeightKg,
        bodyFatPct: metricFat ? parseFloat(metricFat) : m.bodyFatPct,
        loggedAt: new Date().toISOString(),
      } : m)
      setMetrics(updated)
      if (sheetId) {
        try {
          const rows = await sheetsApi.getRange(sheetId, `${TABS.METRICS}!A:H`)
          const rowIdx = rows.findIndex(r => r[0] === editingId)
          if (rowIdx >= 0) {
            const entry = updated.find(m => m.id === editingId)!
            await sheetsApi.batchUpdateValues(sheetId, [{
              range: `${TABS.METRICS}!A${rowIdx + 1}:H${rowIdx + 1}`,
              values: [metricToRow(entry)],
            }])
          }
        } catch (e) { console.error(e) }
      }
    } else {
      const metric: BodyMetric = {
        id: uuid(),
        date: today(),
        bodyWeightKg: metricWeight ? parseFloat(metricWeight) : undefined,
        bodyFatPct: metricFat ? parseFloat(metricFat) : undefined,
        loggedAt: new Date().toISOString(),
      }
      addMetric(metric)
      appendMetric(metricToRow(metric))
    }
    resetMetricForm()
    setSavingMetric(false)
  }

  return (
    <div className="px-6 pb-6">
      <PageHeader
        title={sheetTitle ?? 'Dashboard'}
        subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      />

      {/* Stats row */}
      <div className="flex gap-8 mb-10">
        <div>
          <p className="text-2xl font-semibold">{thisWeek}</p>
          <p className="text-xs text-neutral-400 mt-0.5">sessions this week</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{allSessions.filter(s => s.finishedAt).length}</p>
          <p className="text-xs text-neutral-400 mt-0.5">total sessions</p>
        </div>
      </div>

      {/* Deload suggestion */}
      {deloadNeeded && (
        <div className="mb-8 py-4 border-b border-neutral-100">
          <p className="text-sm font-medium">Consider a deload week</p>
          <p className="text-xs text-neutral-400 mt-1">You've missed target reps on several exercises recently. A lighter week may help recovery.</p>
        </div>
      )}

      {/* Next workout */}
      <div className="mb-10">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Next workout</p>
        {activeProgram && suggestedDay ? (
          <button
            onClick={() => navigate('/workout')}
            className="flex items-center justify-between w-full text-left py-1"
          >
            <div>
              <p className="text-xl font-semibold">{suggestedDay.label}</p>
              <p className="text-sm text-neutral-400 mt-0.5">
                {activeProgram.name} · {suggestedDay.exercises.length} exercises
              </p>
            </div>
            <ArrowRight size={20} className="text-neutral-300" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/programs')}
            className="flex items-center gap-2 text-sm text-neutral-400"
          >
            <span>Set up a program</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="mb-10">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Last session</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{lastSession.dayLabel}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{formatDateShort(lastSession.startedAt)}</p>
            </div>
            <button
              onClick={() => navigate('/workout/history')}
              className="text-xs text-neutral-400 flex items-center gap-1"
            >
              History <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Body metrics */}
      <div className="mb-10">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Body</p>
        <button onClick={() => setShowMetrics(true)} className="flex gap-8 text-left w-full">
          {latestMetric?.bodyWeightKg ? (
            <div>
              <p className="text-2xl font-semibold">{latestMetric.bodyWeightKg}</p>
              <p className="text-xs text-neutral-400 mt-0.5">kg</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-semibold text-neutral-300">—</p>
              <p className="text-xs text-neutral-400 mt-0.5">kg</p>
            </div>
          )}
          {latestMetric?.bodyFatPct ? (
            <div>
              <p className="text-2xl font-semibold">{latestMetric.bodyFatPct}%</p>
              <p className="text-xs text-neutral-400 mt-0.5">body fat</p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-semibold text-neutral-300">—</p>
              <p className="text-xs text-neutral-400 mt-0.5">body fat</p>
            </div>
          )}
        </button>
      </div>

      {/* Nutrition summary */}
      <div className="mb-10">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Today's nutrition</p>
        <div className="flex gap-8">
          <button onClick={() => navigate('/nutrition')} className="text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold">{Math.round(totalCal)}</span>
              <span className="text-xs text-neutral-400">/ {macroGoals.calories} kcal</span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {Math.round(totalProtein)}g protein
            </p>
          </button>
          <button onClick={() => navigate('/nutrition')} className="text-left">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold">{Math.round(waterToday / 100) / 10}</span>
              <span className="text-xs text-neutral-400">/ {macroGoals.waterMl / 1000}L water</span>
            </div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: Math.min(Math.floor(waterToday / 250), 10) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-black" />
              ))}
              {Array.from({ length: Math.max(0, Math.ceil(macroGoals.waterMl / 250) - Math.floor(waterToday / 250)) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* Metrics modal */}
      {showMetrics && (
        <div className="fixed inset-0 bg-black/20 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-lg font-semibold">Body Metrics</p>
              <button onClick={() => { setShowMetrics(false); resetMetricForm() }}>
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            {/* Add / edit form */}
            <div className="mb-6 pb-6 border-b border-neutral-100">
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">
                {editingId ? 'Edit entry' : 'Log today'}
              </p>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Weight (kg)</p>
                  <input
                    type="number"
                    value={metricWeight}
                    onChange={e => setMetricWeight(e.target.value)}
                    className="text-xl font-semibold border-b border-neutral-200 pb-1 outline-none w-24 bg-transparent"
                    placeholder="—"
                  />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Body fat (%)</p>
                  <input
                    type="number"
                    value={metricFat}
                    onChange={e => setMetricFat(e.target.value)}
                    className="text-xl font-semibold border-b border-neutral-200 pb-1 outline-none w-20 bg-transparent"
                    placeholder="—"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveMetric}
                  disabled={(!metricWeight && !metricFat) || savingMetric}
                  className="text-sm px-4 py-2 bg-black text-white rounded-lg disabled:opacity-40"
                >
                  {editingId ? 'Update' : 'Log'}
                </button>
                {editingId && (
                  <button onClick={resetMetricForm} className="text-sm px-4 py-2 border border-neutral-200 rounded-lg">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* History */}
            {sortedMetrics.length > 0 && (
              <div>
                <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">History</p>
                <div className="space-y-0">
                  {[...sortedMetrics].reverse().map(m => (
                    <button
                      key={m.id}
                      onClick={() => openEditMetric(m)}
                      className={`flex items-center justify-between w-full py-3 border-b border-neutral-100 text-left ${editingId === m.id ? 'opacity-40' : ''}`}
                    >
                      <p className="text-sm text-neutral-600">{formatDateShort(m.date)}</p>
                      <div className="flex gap-4 text-sm text-neutral-400">
                        {m.bodyWeightKg && <span>{m.bodyWeightKg}kg</span>}
                        {m.bodyFatPct && <span>{m.bodyFatPct}%</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
