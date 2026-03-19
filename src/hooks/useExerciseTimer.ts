import { useCallback, useEffect, useRef, useState } from 'react'

export type TimerState = 'idle' | 'running' | 'paused' | 'done'

export function useExerciseTimer(defaultSeconds: number) {
  const [state, setState] = useState<TimerState>('idle')
  const [remaining, setRemaining] = useState(defaultSeconds)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const start = useCallback((seconds?: number) => {
    const target = seconds ?? defaultSeconds
    setRemaining(target)
    setElapsed(0)
    setState('running')
  }, [defaultSeconds])

  const pause = useCallback(() => {
    setState(s => s === 'running' ? 'paused' : s)
  }, [])

  const resume = useCallback(() => {
    setState(s => s === 'paused' ? 'running' : s)
  }, [])

  const stop = useCallback(() => {
    setState('idle')
    clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback((seconds?: number) => {
    clearInterval(intervalRef.current)
    const target = seconds ?? defaultSeconds
    setRemaining(target)
    setElapsed(0)
    setState('idle')
  }, [defaultSeconds])

  useEffect(() => {
    if (state !== 'running') {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setState('done')
          setElapsed(e => e + 1)
          return 0
        }
        setElapsed(e => e + 1)
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [state])

  return { state, remaining, elapsed, start, pause, resume, stop, reset }
}
