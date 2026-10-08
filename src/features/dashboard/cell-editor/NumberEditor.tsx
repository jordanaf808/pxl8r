import { useId } from 'react'
import { PIXEL_UNIT_LABELS } from '@/db/types'
import { getValueFields } from './getValueFields'
import type { ValueEditorProps } from './types'

// No cell has this type yet, so nothing shows this editor. It's the form from
// CreateGridModal, moved as it was
export function NumberEditor({ value, pixel, onChange }: ValueEditorProps) {
  const sliderId = useId()
  const endGoal = pixel.endGoal ?? 100
  const unit = PIXEL_UNIT_LABELS[pixel.unit].toLowerCase()
  const fillPct = Math.min(100, ((value ?? 0) / endGoal) * 100)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label
          htmlFor={sliderId}
          className="text-xs font-serif text-(--journal-ink) opacity-75"
        >
          value
        </label>
        <span className="text-sm font-sans text-(--journal-ink)">
          <span className="font-bold">{value ?? 0}</span>
          <span className="opacity-75">
            {' '}
            / {endGoal} {unit}
          </span>
        </span>
      </div>
      <div
        className="relative h-2 w-full rounded-full overflow-hidden"
        style={{
          background: 'var(--journal-warm)',
          opacity: 1,
        }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${fillPct}%`,
            background: 'var(--journal-ink)',
            borderRadius: 'inherit',
          }}
        />
      </div>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={endGoal}
        value={value ?? 0}
        // Without this a screen reader says only the number
        aria-valuetext={`${value ?? 0} of ${endGoal} ${unit}`}
        onChange={(e) =>
          onChange(getValueFields(Number(e.target.value), endGoal))
        }
        className="w-full mt-1 cursor-pointer accent-(--journal-ink)"
      />
    </div>
  )
}
