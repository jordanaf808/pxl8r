import { useState } from 'react'
import { Check } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import { getLabelColor } from './getLabelColor'
import { BUTTON_RADIUS, FOCUS_RING } from './styles'
import type { ValueEditorProps } from './types'

// rust, gold and slate, then the pixel's own color lands last and stays
const SWEEP_COLORS = ['#c75c4a', '#c9963a', '#6b83a6']

export function CompleteButton({
  completedAt,
  pixel,
  onChange,
}: ValueEditorProps) {
  const isCompleted = completedAt !== null
  // Only the press that completes the cell plays the sweep. Opened on a
  // completed cell, the button is filled from the start
  const [isSweeping, setIsSweeping] = useState(false)
  const background = PIXEL_COLORS[pixel.color].bg
  const showsSweep = isCompleted && isSweeping

  return (
    // The visible text is the name, so someone using voice control can say
    // what they see. aria-pressed carries the state
    <button
      type="button"
      aria-pressed={isCompleted}
      onClick={() => {
        setIsSweeping(!isCompleted)
        onChange({
          value: isCompleted ? null : 100,
          progress: isCompleted ? 0 : 100,
          completedAt: isCompleted ? null : new Date(),
        })
      }}
      className={`relative overflow-hidden flex items-center justify-center w-full h-12 text-[19px] font-bold border-[1.5px] border-(--journal-ink) cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING} ${
        // The label turns as the pixel's color passes under it
        showsSweep
          ? 'transition-colors duration-200 delay-300 ease-linear motion-reduce:transition-none'
          : ''
      }`}
      style={{
        borderRadius: BUTTON_RADIUS,
        backgroundColor:
          isCompleted && !showsSweep ? background : 'transparent',
        color: isCompleted ? getLabelColor(background) : 'var(--journal-ink)',
      }}
    >
      {showsSweep &&
        [...SWEEP_COLORS, background].map((color, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="complete-sweep absolute inset-y-0 -left-[15%] w-[130%]"
            style={{
              backgroundColor: color,
              animationDelay: `${i * 100}ms`,
              animationDuration:
                i === SWEEP_COLORS.length ? '460ms' : undefined,
            }}
          />
        ))}
      <span className="relative flex items-center gap-2">
        {isCompleted && (
          <Check
            size={20}
            strokeWidth={3}
            aria-hidden="true"
            className={showsSweep ? 'complete-pop' : undefined}
          />
        )}
        {isCompleted ? 'Completed' : 'Complete'}
      </span>
    </button>
  )
}
