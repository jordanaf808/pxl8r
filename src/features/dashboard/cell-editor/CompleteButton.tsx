import { Check } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import { getLabelColor } from './getLabelColor'
import { BUTTON_RADIUS, FOCUS_RING } from './styles'
import type { ValueEditorProps } from './types'

export function CompleteButton({
  completedAt,
  pixel,
  onChange,
}: ValueEditorProps) {
  const isCompleted = completedAt !== null
  const background = PIXEL_COLORS[pixel.color].bg

  return (
    // The visible text is the name, so someone using voice control can say
    // what they see. aria-pressed carries the state
    <button
      type="button"
      aria-pressed={isCompleted}
      onClick={() =>
        onChange({
          value: isCompleted ? null : 100,
          progress: isCompleted ? 0 : 100,
          completedAt: isCompleted ? null : new Date(),
        })
      }
      className={`flex items-center justify-center gap-1.5 w-full h-12 text-[19px] font-bold border-[1.5px] border-(--journal-ink) cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING} ${
        isCompleted ? '' : 'bg-transparent text-(--journal-ink)'
      }`}
      style={{
        borderRadius: BUTTON_RADIUS,
        ...(isCompleted && {
          backgroundColor: background,
          color: getLabelColor(background),
        }),
      }}
    >
      {isCompleted && <Check size={20} strokeWidth={3} aria-hidden="true" />}
      {isCompleted ? 'Completed' : 'Complete'}
    </button>
  )
}
