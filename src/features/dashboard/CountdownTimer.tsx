import { useId, useState } from 'react'
import { Pause, Play, RotateCcw, Timer, Trash } from 'lucide-react'
import { useCountdown } from './hooks/useCountdown'
import { FOCUS_RING } from './cell-editor/styles'
import { TimerButton } from './cell-editor/TimerButton'

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
  timerElapsedSeconds: number
  /** Starts the timer, or resumes it after a pause */
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onRemove: () => void
  /** Called when the minutes field loses focus or on Enter, and only with a changed number */
  onEditMinutes: (minutes: number) => void
}

export function CountdownTimer({
  timerMinutes,
  timerStartedAt,
  timerElapsedSeconds,
  onStart,
  onPause,
  onReset,
  onRemove,
  onEditMinutes,
}: CountdownTimerProps) {
  const { remainingSeconds, isRunning, isFinished } = useCountdown({
    timerMinutes,
    timerStartedAt,
    timerElapsedSeconds,
  })
  // Paused, the time left shows in the input's place. A reset brings the
  // input back, because it sets the seconds run to zero
  const isStarted = isRunning || timerElapsedSeconds > 0
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

      {isStarted ? (
        <>
          <span className="text-[22px] font-bold tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[13px] font-serif opacity-70">
            {isFinished ? 'time’s up' : 'left'}
          </span>
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

      {/* The three buttons keep their places in every state. One with
          nothing to do is dimmed, so nothing moves under the pointer */}
      <div className="flex items-center gap-1">
        {isRunning && !isFinished ? (
          <TimerButton
            name="Pause timer"
            hoverLabel="Pause"
            variant="outline"
            onClick={onPause}
          >
            <Pause size={14} fill="currentColor" aria-hidden="true" />
          </TimerButton>
        ) : (
          <TimerButton
            name={isStarted && !isFinished ? 'Resume timer' : 'Start timer'}
            hoverLabel={isStarted && !isFinished ? 'Resume' : 'Start'}
            variant="filled"
            onClick={onStart}
            disabled={isFinished}
          >
            <Play size={14} fill="currentColor" aria-hidden="true" />
          </TimerButton>
        )}
        <TimerButton
          name="Reset timer"
          hoverLabel="Reset"
          variant="plain"
          onClick={onReset}
          disabled={!isStarted}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </TimerButton>
        <TimerButton
          name="Remove timer"
          hoverLabel="Remove"
          variant="plain"
          onClick={onRemove}
        >
          <Trash size={16} aria-hidden="true" />
        </TimerButton>
      </div>
    </div>
  )
}
