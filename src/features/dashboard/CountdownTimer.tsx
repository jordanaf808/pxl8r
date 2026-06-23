import { useState, useRef, useEffect } from 'react'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'
import { useCountdown } from './hooks/useCountdown'

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

interface CountdownTimerProps {
  minutes: number
}

export function CountdownTimer({ minutes }: CountdownTimerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { remainingSeconds, isRunning, start, pause, reset } =
    useCountdown(minutes)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((v) => !v)
        }}
        className="hover:opacity-100 cursor-pointer"
        aria-label="Start timer"
      >
        <Timer size={16} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-7 z-20 bg-[var(--journal-cream)] w-40 p-3 shadow-lg animate-float-in flex flex-col items-center gap-2"
          style={{
            border: '1.5px solid var(--journal-warm)',
            borderRadius: '3px 8px 5px 10px',
          }}
        >
          <span className="text-2xl font-bold font-serif text-[var(--journal-ink)]">
            {formatTime(remainingSeconds)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isRunning ? pause : start}
              className="p-1.5 hover:bg-[var(--journal-tan)] cursor-pointer text-[var(--journal-ink)]"
              style={{ borderRadius: '2px 5px 3px 6px' }}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={reset}
              className="p-1.5 hover:bg-[var(--journal-tan)] cursor-pointer text-[var(--journal-ink)]"
              style={{ borderRadius: '2px 5px 3px 6px' }}
              aria-label="Reset timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
