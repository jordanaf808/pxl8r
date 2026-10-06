import { useId, useState } from 'react'
import { Pause, Play, Timer, X } from 'lucide-react'
import { useCountdown } from './hooks/useCountdown'
import { FOCUS_RING } from './cell-editor/styles'

const MIN_MINUTES = 1
const MAX_MINUTES = 120

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

interface CountdownTimerProps {
  timerMinutes: number
  timerStartedAt: Date | null
  onStart: () => void
  onPause: () => void
  onDisable: () => void
  /** Called when the minutes field loses focus or on Enter, and only with a changed number */
  onEditMinutes: (minutes: number) => void
}

export function CountdownTimer({
  timerMinutes,
  timerStartedAt,
  onStart,
  onPause,
  onDisable,
  onEditMinutes,
}: CountdownTimerProps) {
  const { remainingSeconds, isRunning } = useCountdown({
    timerMinutes,
    timerStartedAt,
  })
  const minutesId = useId()
  // What's typed in the minutes field and not reported yet. While it's null
  // the field shows timerMinutes
  const [draft, setDraft] = useState<string | null>(null)

  // Reporting each keystroke would report 4, then 45, for a typed "45"
  function reportMinutes() {
    if (draft === null) return
    const typed = Math.round(Number(draft))
    setDraft(null)
    if (draft.trim() === '' || Number.isNaN(typed)) return

    const minutes = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, typed))
    if (minutes !== timerMinutes) onEditMinutes(minutes)
  }

  return (
    <div
      className="flex items-center gap-2.5 h-13.5 pl-3 pr-2 bg-(--journal-paper) border-[1.5px] border-(--journal-ink)/60 text-(--journal-ink)"
      style={{ borderRadius: '2px 6px 3px 7px' }}
    >
      <Timer size={18} className="shrink-0" aria-hidden="true" />

      {isRunning ? (
        <>
          <span className="text-[22px] font-bold tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[13px] font-serif opacity-70">left</span>
        </>
      ) : (
        <>
          <label htmlFor={minutesId} className="text-[13px] font-semibold">
            Timer
          </label>
          <input
            id={minutesId}
            type="text"
            inputMode="numeric"
            value={draft ?? timerMinutes}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={reportMinutes}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              reportMinutes()
            }}
            className={`w-12 h-8 px-1.5 text-center text-[15px] font-semibold bg-(--journal-cream) border-[1.5px] border-(--journal-ink)/60 ${FOCUS_RING}`}
            style={{ borderRadius: '2px 5px 3px 6px' }}
          />
          <span className="text-[13px] font-serif opacity-70">min</span>
        </>
      )}

      <span className="flex-1" />

      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className={`flex items-center gap-1.5 h-9 px-3 text-sm font-semibold border-[1.5px] border-(--journal-ink) cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING} ${
          isRunning
            ? 'bg-transparent text-(--journal-ink)'
            : 'bg-(--journal-ink) text-(--journal-paper)'
        }`}
        style={{ borderRadius: '2px 6px 3px 7px' }}
      >
        {isRunning ? (
          <Pause size={12} fill="currentColor" aria-hidden="true" />
        ) : (
          <Play size={12} fill="currentColor" aria-hidden="true" />
        )}
        {isRunning ? 'Pause' : 'Start'}
      </button>
      <button
        type="button"
        onClick={onDisable}
        className={`flex items-center justify-center w-9 h-9 rounded-sm cursor-pointer hover:bg-(--journal-tan) disabled:cursor-default disabled:opacity-50 ${FOCUS_RING}`}
        aria-label="Remove timer"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
