import { Pause, Play, Timer, X } from 'lucide-react'
import { useCountdown } from './hooks/useCountdown'

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

  return (
    <div
      className="flex items-center gap-2 p-2"
      style={{
        backgroundColor: 'var(--journal-cream)',
        border: '1.5px solid var(--journal-warm)',
        borderRadius: '2px 6px 3px 7px',
      }}
    >
      <Timer size={14} className="text-(--journal-ink) opacity-60 shrink-0" />

      {isRunning ? (
        <span className="text-lg font-bold font-serif text-(--journal-ink) flex-1">
          {formatTime(remainingSeconds)}
        </span>
      ) : (
        <input
          type="number"
          min={1}
          max={120}
          value={timerMinutes}
          onChange={(e) => {
            const value = Math.min(
              120,
              Math.max(1, Number(e.target.value) || 1),
            )
            onEditMinutes(value)
          }}
          className="flex-1 w-12 bg-transparent text-(--journal-ink) text-sm font-serif outline-none border-b border-(--journal-warm)"
        />
      )}

      <button
        type="button"
        onClick={isRunning ? onPause : onStart}
        className="p-1 hover:bg-(--journal-tan) cursor-pointer text-(--journal-ink)"
        style={{ borderRadius: '2px 5px 3px 6px' }}
        aria-label={isRunning ? 'Pause timer' : 'Start timer'}
      >
        {isRunning ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button
        type="button"
        onClick={onDisable}
        className="p-1 hover:bg-(--journal-tan) cursor-pointer text-(--journal-ink) opacity-60"
        style={{ borderRadius: '2px 5px 3px 6px' }}
        aria-label="Disable timer"
      >
        <X size={13} />
      </button>
    </div>
  )
}
