import { useCallback, useEffect, useState } from 'react'

/**
 * Derives remaining time from a persisted duration + start timestamp,
 * rather than owning a local countdown — this is what lets the timer
 * survive a reload instead of resetting.
 */
export function useCountdown({
  timerMinutes,
  timerStartedAt,
}: {
  timerMinutes: number
  timerStartedAt: Date | null
}) {
  const isRunning = !!timerStartedAt

  const computeRemaining = useCallback(() => {
    if (!timerStartedAt) return timerMinutes * 60
    const elapsed = Math.floor((Date.now() - timerStartedAt.getTime()) / 1000)
    return Math.max(0, timerMinutes * 60 - elapsed)
  }, [timerMinutes, timerStartedAt])

  const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining)

  useEffect(() => {
    setRemainingSeconds(computeRemaining())
    if (!isRunning) return

    const interval = setInterval(() => {
      setRemainingSeconds(computeRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, computeRemaining])

  return { remainingSeconds, isRunning }
}
