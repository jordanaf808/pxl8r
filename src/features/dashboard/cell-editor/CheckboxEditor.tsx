import { Check } from 'lucide-react'
import { FOCUS_RING } from './styles'
import type { ValueEditorProps } from './types'

export function CheckboxEditor({
  completedAt,
  pixel,
  onChange,
}: ValueEditorProps) {
  const isCompleted = completedAt !== null

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {/* The button holds only an icon, so the role, the state and the name
          are what a screen reader has to go on */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={`${pixel.name} completed`}
        onClick={() =>
          onChange({
            value: isCompleted ? null : 100,
            progress: isCompleted ? 0 : 100,
            completedAt: isCompleted ? null : new Date(),
          })
        }
        className={`w-6 h-6 flex items-center justify-center shrink-0 border-2 cursor-pointer disabled:cursor-default ${FOCUS_RING} ${
          isCompleted
            ? 'bg-(--journal-ink) border-(--journal-ink)'
            : 'border-(--journal-ink)/60'
        }`}
        style={{ borderRadius: '2px 5px 3px 6px' }}
      >
        {isCompleted && (
          <Check
            size={15}
            strokeWidth={3}
            className="text-(--journal-paper)"
            aria-hidden="true"
          />
        )}
      </button>
      <span className="text-[15px]">
        {isCompleted ? 'Completed' : 'Not done'}
      </span>
    </div>
  )
}
