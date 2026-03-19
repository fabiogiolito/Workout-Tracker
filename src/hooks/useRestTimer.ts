import { useCallback, useEffect, useRef, useState } from 'react'

export function useRestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [targetSeconds, setTargetSeconds] = useState(90)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const start = useCallback((seconds: number) => {
    setTargetSeconds(seconds)
    setRemaining(seconds)
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    setRemaining(0)
    clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    if (!isActive) return
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setIsActive(false)
          // Notification
          if (Notification.permission === 'granted') {
            new Notification('Rest complete!', { body: 'Time for your next set.', silent: false })
          }
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isActive])

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return { remaining, isActive, targetSeconds, start, stop, requestNotificationPermission }
}
