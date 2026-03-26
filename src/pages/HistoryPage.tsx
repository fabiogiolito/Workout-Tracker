import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useWorkoutStore } from '@/store/workoutStore'
import { useSheetData } from '@/hooks/useSheetSync'
import { parseWorkouts, parseSets } from '@/lib/google/sheetReader'
import { EXERCISE_LIBRARY, getExerciseById } from '@/constants/exerciseLibrary'
import { getBestPerSession } from '@/lib/progression/progressionEngine'
import { formatDate, formatDateShort, formatDuration } from '@/lib/utils/formatters'
import { TABS } from '@/lib/google/sheetSchema'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function HistoryPage() {
  const { allSessions, allSets, loadData } = useWorkoutStore()
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  const { isLoading: loadingWorkouts } = useSheetData(TABS.WORKOUTS, parseWorkouts, (data) => loadData(data, allSets))
  const { isLoading: loadingSets } = useSheetData(TABS.SETS, parseSets, (data) => loadData(allSessions, data))

  if (loadingWorkouts || loadingSets) return <PageSpinner />

  const finishedSessions = [...allSessions]
    .filter(s => s.finishedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  // All exercises that have history
  const exercisesWithHistory = [...new Set(allSets.map(s => s.exerciseId))]
    .map(id => {
      const ex = getExerciseById(id)
      const sets = allSets.filter(s => s.exerciseId === id && !s.isWarmup)
      return { id, name: ex?.name ?? id, sets, isTimed: ex?.isTimed ?? false }
    })
    .filter(e => e.sets.length > 0)

  const selectedExerciseData = exercisesWithHistory.find(e => e.id === selectedExercise)
  const chartData = selectedExerciseData
    ? getBestPerSession(selectedExerciseData.sets).slice(-12).map(s => ({
        d: formatDateShort(s.date),
        w: selectedExerciseData.isTimed ? s.maxReps : s.bestWeight,
      }))
    : []

  return (
    <div className="px-6 pb-6">
      <PageHeader title="History" back />

      {/* Exercise progress section */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider mb-4">Progress by exercise</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {exercisesWithHistory.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedExercise(selectedExercise === e.id ? null : e.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedExercise === e.id ? 'bg-black text-white' : 'bg-neutral-100'
              }`}
            >
              {e.name}
            </button>
          ))}
        </div>

        {selectedExerciseData && chartData.length >= 2 && (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm font-semibold">{selectedExerciseData.name}</p>
              <p className="text-xs text-neutral-400">
                {selectedExerciseData.isTimed ? 'Best duration' : 'Best weight'} over time
              </p>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="bg-white border border-neutral-200 text-xs px-2 py-1 rounded">
                        {payload[0].payload.d}: {payload[0].value}{selectedExerciseData.isTimed ? 's' : 'kg'}
                      </div>
                    ) : null}
                  />
                  <Line type="monotone" dataKey="w" stroke="#000" strokeWidth={1.5} dot={{ r: 3, fill: '#000' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {selectedExerciseData && chartData.length < 2 && (
          <p className="text-sm text-neutral-400">Need at least 2 sessions to show progress</p>
        )}
      </div>

      {/* Session list */}
      <p className="text-xs font-semibold uppercase tracking-wider mb-4">Sessions</p>
      {finishedSessions.length === 0 && (
        <p className="text-sm text-neutral-400">No completed sessions yet</p>
      )}
      <div className="space-y-0">
        {finishedSessions.map(session => {
          const sessionSets = allSets.filter(s => s.workoutId === session.id && !s.isWarmup)
          const isExpanded = expandedSession === session.id
          const duration = session.finishedAt
            ? Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
            : null

          return (
            <div key={session.id} className="border-b border-neutral-100 last:border-0">
              <button
                className="flex items-center justify-between w-full py-4 text-left"
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <div>
                  <p className="text-sm font-medium">{session.dayLabel}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatDate(session.startedAt)}
                    {duration !== null && ` · ${duration}m`}
                    {` · ${sessionSets.length} sets`}
                  </p>
                </div>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && sessionSets.length > 0 && (
                <div className="pb-4 space-y-2">
                  {[...new Set(sessionSets.map(s => s.exerciseId))].map(exId => {
                    const exSets = sessionSets.filter(s => s.exerciseId === exId)
                    const ex = getExerciseById(exId)
                    return (
                      <div key={exId} className="pl-4">
                        <p className="text-xs font-medium">{ex?.name ?? exId}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {exSets.map(s => (
                            <span key={s.id} className="text-xs text-neutral-400">
                              {s.durationSeconds !== undefined
                                ? formatDuration(s.durationSeconds)
                                : `${s.weightKg}kg×${s.reps}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
