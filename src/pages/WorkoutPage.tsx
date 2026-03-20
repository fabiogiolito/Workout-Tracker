import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, X, ChevronDown, History, Timer } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageSpinner } from '@/components/layout/PageSpinner'
import { useWorkoutStore } from '@/store/workoutStore'
import { useProgramStore } from '@/store/programStore'
import { useSheetStore } from '@/store/sheetStore'
import { useRestTimer } from '@/hooks/useRestTimer'
import { useExerciseTimer } from '@/hooks/useExerciseTimer'
import { useAppendRow, useSheetData } from '@/hooks/useSheetSync'
import { parseWorkouts, parseSets, parsePrograms } from '@/lib/google/sheetReader'
import { workoutToRow, setToRow } from '@/lib/google/sheetWriter'
import { suggestNextWeight, getBestPerSession, getPersonalBest, getPersonalBestDuration } from '@/lib/progression/progressionEngine'
import { EXERCISE_LIBRARY, getExerciseById } from '@/constants/exerciseLibrary'
import { formatDuration, formatDateShort } from '@/lib/utils/formatters'
import { TABS } from '@/lib/google/sheetSchema'
import type { ExerciseSlot } from '@/types/program'
import type { LoggedSet } from '@/types/workout'
import type { Exercise } from '@/types/exercise'
import { cn } from '@/lib/utils/formatters'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import * as sheetsApi from '@/lib/google/sheetsApi'

export default function WorkoutPage() {
  const navigate = useNavigate()
  const { activeSession, activeSets, allSessions, allSets, startSession, finishSession, addSet, loadData } = useWorkoutStore()
  const { programs, activeProgramId, setPrograms, setActiveProgramId } = useProgramStore()
  const sheetId = useSheetStore(s => s.activeSheetId)
  const restTimer = useRestTimer()
  const [_showDaySelector, setShowDaySelector] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState('')

  // Sync selectedProgramId once activeProgramId hydrates from localStorage
  // (zustand persist hydrates after the first render, so useState initial value is always '')
  useEffect(() => {
    if (activeProgramId) setSelectedProgramId(activeProgramId)
  }, [activeProgramId])
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [_activeTimer, setActiveTimer] = useState<{ exerciseId: string; setNum: number } | null>(null)
  const [prAlert, setPrAlert] = useState<string | null>(null)

  const { isLoading: loadingPrograms } = useSheetData(TABS.PROGRAMS, parsePrograms, (data) => {
    setPrograms(data)
    // If activeProgramId isn't in localStorage, try to restore it from the Config sheet
    if (!activeProgramId && sheetId && data.length > 0) {
      sheetsApi.getRange(sheetId, 'Config!A:B').then(rows => {
        const row = rows.find(r => r[0] === 'active_program_id')
        if (row?.[1] && data.find(p => p.id === row[1])) {
          setActiveProgramId(row[1])
        }
      }).catch(() => {})
    }
  })
  const { isLoading: loadingWorkouts } = useSheetData(TABS.WORKOUTS, parseWorkouts, (data) => loadData(data, allSets))
  const { isLoading: loadingSets } = useSheetData(TABS.SETS, parseSets, (data) => loadData(allSessions, data))
  const appendWorkout = useAppendRow(TABS.WORKOUTS)
  const appendSet = useAppendRow(TABS.SETS)

  // Determine suggested day — fall back to first program if no active ID is set yet
  const effectiveProgramId = selectedProgramId || activeProgramId || programs[0]?.id
  const activeProgram = programs.find(p => p.id === effectiveProgramId)
  const suggestedDayIdx = (() => {
    if (!activeProgram) return 0
    const finished = allSessions.filter(s => s.finishedAt && s.programId === activeProgram.id)
    if (finished.length === 0) return 0
    const last = finished.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
    const lastIdx = activeProgram.days.findIndex(d => d.id === last.dayId)
    return (lastIdx + 1) % activeProgram.days.length
  })()

  useEffect(() => {
    setSelectedDayIdx(suggestedDayIdx)
  }, [suggestedDayIdx])

  const currentDay = activeProgram?.days[selectedDayIdx] ?? (activeSession ? programs.flatMap((p) => p.days).find((d) => d.id === activeSession.dayId) : undefined)

  function startWorkout() {
    if (!activeProgram || !currentDay) return
    const session = {
      id: uuid(),
      programId: activeProgram.id,
      dayId: currentDay.id,
      dayLabel: currentDay.label,
      startedAt: new Date().toISOString(),
    }
    startSession(session)
    appendWorkout(workoutToRow(session))
    restTimer.requestNotificationPermission()
    setShowDaySelector(false)
  }

  function logSet(slot: ExerciseSlot, exercise: Exercise, weightKg: number | undefined, reps: number | undefined, durationSeconds: number | undefined, isWarmup = false) {
    if (!activeSession) return
    const existing = activeSets.filter(s => s.exerciseId === slot.exerciseId)
    const setNum = existing.length + 1
    const setData: LoggedSet = {
      id: uuid(),
      workoutId: activeSession.id,
      exerciseId: slot.exerciseId,
      exerciseName: exercise.name,
      setNumber: setNum,
      weightKg,
      reps,
      durationSeconds,
      isWarmup,
      loggedAt: new Date().toISOString(),
    }
    addSet(setData)
    appendSet(setToRow(setData))

    // PR check
    if (!isWarmup && weightKg !== undefined) {
      const prevBest = getPersonalBest(allSets.filter(s => s.exerciseId === slot.exerciseId))
      if (weightKg > prevBest) {
        setPrAlert(exercise.name)
        setTimeout(() => setPrAlert(null), 3000)
      }
    }
    if (!isWarmup && durationSeconds !== undefined) {
      const prevBest = getPersonalBestDuration(allSets.filter(s => s.exerciseId === slot.exerciseId))
      if (durationSeconds > prevBest) {
        setPrAlert(exercise.name)
        setTimeout(() => setPrAlert(null), 3000)
      }
    }

    if (!isWarmup) restTimer.start(slot.restSeconds)
  }

  async function handleFinish() {
    const session = finishSession()
    if (!session || !sheetId) return
    // Update finished_at in sheet
    try {
      const rows = await sheetsApi.getRange(sheetId, `${TABS.WORKOUTS}!A:G`)
      const rowIdx = rows.findIndex(r => r[0] === session.id)
      if (rowIdx >= 0) {
        await sheetsApi.batchUpdateValues(sheetId, [{
          range: `${TABS.WORKOUTS}!A${rowIdx + 1}:G${rowIdx + 1}`,
          values: [workoutToRow(session)]
        }])
      }
    } catch (e) { console.error(e) }
    setShowFinishConfirm(false)
    navigate('/dashboard')
  }

  if (loadingPrograms || loadingWorkouts || loadingSets) return <PageSpinner />

  if (!activeSession && programs.length === 0) {
    return (
      <div className="px-6">
        <PageHeader title="Workout" />
        <p className="text-sm text-neutral-400 mb-6">No program set up yet.</p>
        <button onClick={() => navigate('/programs')} className="text-sm underline underline-offset-4">Set up a program →</button>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="px-6">
        <PageHeader title="Start Workout" />

        {/* Program selector */}
        {programs.length > 1 && (
          <div className="mb-6">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Program</p>
            <div className="flex gap-2 flex-wrap">
              {programs.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProgramId(p.id)}
                  className={cn('text-sm px-3 py-1.5 rounded-full border transition-colors',
                    (selectedProgramId || activeProgramId) === p.id ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-600'
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day selector */}
        {activeProgram && (
          <div className="mb-8">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Today's session</p>
            <div className="space-y-0">
              {activeProgram.days.map((day, idx) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={cn(
                    'flex items-center justify-between w-full py-4 border-b border-neutral-100 last:border-0 text-left',
                  )}
                >
                  <div>
                    <p className={cn('text-sm', idx === selectedDayIdx ? 'font-semibold' : 'font-medium')}>
                      {day.label}
                      {idx === suggestedDayIdx && idx !== selectedDayIdx && (
                        <span className="ml-2 text-xs text-neutral-400 font-normal">suggested</span>
                      )}
                      {idx === suggestedDayIdx && idx === selectedDayIdx && (
                        <span className="ml-2 text-xs text-neutral-400 font-normal">suggested</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">{day.exercises.length} exercises</p>
                  </div>
                  {idx === selectedDayIdx && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startWorkout}
          className="w-full py-4 bg-black text-white text-sm font-medium rounded-xl"
        >
          Start {currentDay?.label}
        </button>

        <button onClick={() => navigate('/workout/history')} className="flex items-center gap-2 text-sm text-neutral-400 mt-6 mx-auto">
          <History size={14} /> View history
        </button>
      </div>
    )
  }

  // Active session
  return (
    <div className="px-6 pb-8">
      {/* PR Alert */}
      {prAlert && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <p className="text-4xl font-bold">PR</p>
            <p className="text-sm text-neutral-600 mt-1">{prAlert}</p>
          </div>
        </div>
      )}

      {/* Rest timer */}
      {restTimer.isActive && (
        <div className="fixed bottom-20 left-0 right-0 mx-6 z-30">
          <div className="bg-black text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Rest</p>
              <p className="text-2xl font-semibold tabular-nums">{restTimer.remaining}s</p>
            </div>
            <div className="w-24 h-1 bg-neutral-700 rounded">
              <div
                className="h-full bg-white rounded transition-all"
                style={{ width: `${(restTimer.remaining / restTimer.targetSeconds) * 100}%` }}
              />
            </div>
            <button onClick={restTimer.stop} className="text-neutral-400">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-14 pb-6">
        <div>
          <h1 className="text-2xl font-semibold">{activeSession.dayLabel}</h1>
          <p className="text-xs text-neutral-400 mt-0.5">{new Date(activeSession.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button
          onClick={() => setShowFinishConfirm(true)}
          className="text-sm px-4 py-2 border border-neutral-200 rounded-lg"
        >
          Finish
        </button>
      </div>

      {currentDay?.exercises.map(slot => {
        const exercise = getExerciseById(slot.exerciseId) ?? EXERCISE_LIBRARY[0]
        const slotSets = activeSets.filter(s => s.exerciseId === slot.exerciseId && !s.isWarmup)
        const historySets = allSets.filter(s => s.exerciseId === slot.exerciseId && !s.isWarmup)
        const isExpanded = expandedExercise === slot.exerciseId

        return (
          <ExerciseBlock
            key={slot.exerciseId}
            slot={slot}
            exercise={exercise}
            loggedSets={slotSets}
            historySets={historySets}
            isExpanded={isExpanded}
            onToggle={() => setExpandedExercise(isExpanded ? null : slot.exerciseId)}
            onLogSet={(w, r, d, warmup) => logSet(slot, exercise, w, r, d, warmup)}
            onSetTimerActive={(setNum: number | null) => setActiveTimer(setNum !== null ? { exerciseId: slot.exerciseId, setNum } : null)}
          />
        )
      })}

      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/20 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10">
            <p className="text-lg font-semibold mb-2">Finish workout?</p>
            <p className="text-sm text-neutral-400 mb-6">{activeSets.filter(s => !s.isWarmup).length} sets logged</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 py-3 border border-neutral-200 rounded-xl text-sm">Cancel</button>
              <button onClick={handleFinish} className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium">Finish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ExerciseBlockProps {
  slot: ExerciseSlot
  exercise: Exercise
  loggedSets: LoggedSet[]
  historySets: LoggedSet[]
  isExpanded: boolean
  onToggle: () => void
  onLogSet: (weightKg: number | undefined, reps: number | undefined, durationSeconds: number | undefined, isWarmup?: boolean) => void
  onSetTimerActive: (setNum: number | null) => void
}

function ExerciseBlock({ slot, exercise, loggedSets, historySets, isExpanded, onToggle, onLogSet }: ExerciseBlockProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState(slot.repsTarget ? String(slot.repsTarget) : '')
  const sessions = getBestPerSession(historySets)
  const lastSession = sessions[sessions.length - 1]
  const suggestion = suggestNextWeight(historySets, exercise.muscleGroups, slot.repsTarget)
  const chartData = sessions.slice(-8).map(s => ({ w: s.bestWeight, d: formatDateShort(s.date) }))
  const exerciseTimer = useExerciseTimer(slot.durationSeconds ?? exercise.defaultDurationSeconds ?? 60)

  // Pre-fill weight from last session for this exercise
  useEffect(() => {
    if (!weight) {
      const lastWeight = lastSession?.bestWeight
      if (lastWeight && lastWeight > 0) {
        setWeight(String(lastWeight))
      } else if (suggestion.suggestedWeight > 0) {
        setWeight(String(suggestion.suggestedWeight))
      }
    }
  }, [lastSession?.bestWeight, suggestion.suggestedWeight])

  function handleLog() {
    if (exercise.isTimed) {
      onLogSet(undefined, undefined, exerciseTimer.elapsed > 0 ? exerciseTimer.elapsed : (slot.durationSeconds ?? exercise.defaultDurationSeconds), false)
    } else {
      const w = weight ? parseFloat(weight) : undefined
      const r = reps ? parseInt(reps) : undefined
      if (!w && !r) return
      onLogSet(w, r, undefined, false)
    }
  }

  const done = loggedSets.length >= slot.sets

  return (
    <div className={cn('py-5 border-b border-neutral-100', done ? 'opacity-60' : '')}>
      <button className="flex items-center justify-between w-full text-left" onClick={onToggle}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{exercise.name}</p>
            {done && <Check size={14} />}
            {suggestion.prAlert && <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 rounded">PR</span>}
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {slot.sets}×{exercise.isTimed ? formatDuration(slot.durationSeconds ?? exercise.defaultDurationSeconds ?? 60) : slot.repsTarget}
            {lastSession && !exercise.isTimed && ` · last: ${lastSession.bestWeight}kg`}
          </p>
        </div>
        <ChevronDown size={16} className={cn('text-neutral-400 transition-transform', isExpanded ? 'rotate-180' : '')} />
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Suggestion */}
          {!exercise.isTimed && suggestion.suggestedWeight > 0 && (
            <div>
              <p className="text-xs text-neutral-400">{suggestion.reason}</p>
            </div>
          )}

          {/* History mini-chart */}
          {chartData.length >= 2 && (
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="w" stroke="#000" strokeWidth={1.5} dot={false} />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="bg-white border border-neutral-200 text-xs px-2 py-1 rounded">
                        {payload[0].payload.d}: {payload[0].value}kg
                      </div>
                    ) : null}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Logged sets */}
          {loggedSets.length > 0 && (
            <div className="space-y-1">
              {loggedSets.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="w-5 text-right text-neutral-300">{i + 1}</span>
                  <span>
                    {s.durationSeconds !== undefined
                      ? formatDuration(s.durationSeconds)
                      : `${s.weightKg}kg × ${s.reps}`}
                  </span>
                  <Check size={10} />
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          {!done && (
            <div className="pt-2">
              {exercise.isTimed ? (
                <TimedSetInput exerciseTimer={exerciseTimer} onLog={handleLog} slot={slot} exercise={exercise} />
              ) : (
                <RepsSetInput
                  weight={weight}
                  reps={reps}
                  onWeightChange={setWeight}
                  onRepsChange={setReps}
                  onLog={() => handleLog()}
                  suggestion={suggestion.suggestedWeight > 0 ? suggestion.suggestedWeight : undefined}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TimedSetInput({ exerciseTimer, onLog, slot, exercise }: {
  exerciseTimer: ReturnType<typeof useExerciseTimer>
  onLog: (warmup?: boolean) => void
  slot: ExerciseSlot
  exercise: Exercise
}) {
  const targetSeconds = slot.durationSeconds ?? exercise.defaultDurationSeconds ?? 60

  return (
    <div className="space-y-3">
      {exerciseTimer.state === 'idle' && (
        <button
          onClick={() => exerciseTimer.start(targetSeconds)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Timer size={16} /> Start {formatDuration(targetSeconds)} timer
        </button>
      )}
      {(exerciseTimer.state === 'running' || exerciseTimer.state === 'paused') && (
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-semibold tabular-nums">{exerciseTimer.remaining}</p>
            <p className="text-xs text-neutral-400">seconds left</p>
          </div>
          <div className="flex gap-2">
            {exerciseTimer.state === 'running' ? (
              <button onClick={exerciseTimer.pause} className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg">Pause</button>
            ) : (
              <button onClick={exerciseTimer.resume} className="text-sm px-3 py-1.5 border border-neutral-200 rounded-lg">Resume</button>
            )}
            <button onClick={() => { onLog(); exerciseTimer.reset() }} className="text-sm px-3 py-1.5 bg-black text-white rounded-lg">Log set</button>
          </div>
        </div>
      )}
      {exerciseTimer.state === 'done' && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-neutral-600">Completed {formatDuration(exerciseTimer.elapsed)}</p>
          <button onClick={() => { onLog(); exerciseTimer.reset() }} className="text-sm px-4 py-2 bg-black text-white rounded-lg">Log set</button>
          <button onClick={() => exerciseTimer.reset()} className="text-sm text-neutral-400">Reset</button>
        </div>
      )}
    </div>
  )
}

function RepsSetInput({ weight, reps, onWeightChange, onRepsChange, onLog, suggestion }: {
  weight: string; reps: string
  onWeightChange: (v: string) => void; onRepsChange: (v: string) => void
  onLog: () => void
  suggestion?: number
}) {
  return (
    <div className="space-y-4">
      {suggestion !== undefined && (
        <button
          onClick={() => onWeightChange(String(suggestion))}
          className="text-xs text-neutral-500 underline underline-offset-2"
        >
          Use suggested: {suggestion}kg
        </button>
      )}
      <div>
        <p className="text-xs text-neutral-400 mb-2">Weight (kg)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeightChange(String(Math.max(0, (parseFloat(weight) || 0) - 5)))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-500"
          >−5</button>
          <button
            onClick={() => onWeightChange(String(Math.max(0, (parseFloat(weight) || 0) - 1)))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-lg font-light"
          >−</button>
          <input
            type="number"
            value={weight}
            onChange={e => onWeightChange(e.target.value)}
            className="flex-1 text-center text-xl font-semibold outline-none bg-transparent"
            placeholder="0"
          />
          <button
            onClick={() => onWeightChange(String((parseFloat(weight) || 0) + 1))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-lg font-light"
          >+</button>
          <button
            onClick={() => onWeightChange(String((parseFloat(weight) || 0) + 5))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-[11px] font-medium text-neutral-500"
          >+5</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-neutral-400 mb-2">Reps</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRepsChange(String(Math.max(0, (parseInt(reps) || 0) - 1)))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-lg font-light"
          >−</button>
          <input
            type="number"
            value={reps}
            onChange={e => onRepsChange(e.target.value)}
            className="flex-1 text-center text-xl font-semibold outline-none bg-transparent"
            placeholder="0"
          />
          <button
            onClick={() => onRepsChange(String((parseInt(reps) || 0) + 1))}
            className="w-9 h-9 flex items-center justify-center border border-neutral-200 rounded-lg text-lg font-light"
          >+</button>
        </div>
      </div>
      <button
        onClick={onLog}
        className="w-full py-3 bg-black text-white text-sm font-medium rounded-xl"
      >
        Log set
      </button>
    </div>
  )
}
