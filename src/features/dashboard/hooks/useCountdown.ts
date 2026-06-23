import { useState, useRef, useCallback, useEffect } from 'react'

export function useCountdown(initialMinutes: number) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialMinutes * 60,
  )
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const start = useCallback(() => {
    if (remainingSeconds > 0) setIsRunning(true)
  }, [remainingSeconds])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setRemainingSeconds(initialMinutes * 60)
  }, [initialMinutes])

  return { remainingSeconds, isRunning, start, pause, reset }
}
