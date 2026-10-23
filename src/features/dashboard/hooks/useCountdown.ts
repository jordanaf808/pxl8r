import { useCallback, useEffect, useState } from 'react'

/**
 * Derives remaining time from a persisted duration, the seconds already run
 * and the start of the current run, rather than owning a local countdown —
 * this is what lets the timer survive a reload instead of resetting.
 */
export function useCountdown({
  timerMinutes,
  timerStartedAt,
  timerElapsedSeconds,
}: {
  timerMinutes: number
  timerStartedAt: Date | null
  timerElapsedSeconds: number
}) {
  const isRunning = !!timerStartedAt

  const computeRemaining = useCallback(() => {
    const runSeconds = timerStartedAt
      ? Math.floor((Date.now() - timerStartedAt.getTime()) / 1000)
      : 0
    return Math.max(0, timerMinutes * 60 - timerElapsedSeconds - runSeconds)
  }, [timerMinutes, timerStartedAt, timerElapsedSeconds])

  const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining)

  useEffect(() => {
    setRemainingSeconds(computeRemaining())
    if (!isRunning) return

    const interval = setInterval(() => {
      setRemainingSeconds(computeRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, computeRemaining])

  return { remainingSeconds, isRunning, isFinished: remainingSeconds === 0 }
}
