import { Star } from 'lucide-react'
import type { ValueEditorProps } from './types'

// No cell has this type yet, so nothing shows this editor. It's the form from
// CreateGridModal, moved as it was, with its known bugs
export function RatingEditor({ value, pixel, onChange }: ValueEditorProps) {
  const endGoal = pixel.endGoal ?? 100

  return (
    <div>
      <span className="text-xs font-serif text-(--journal-ink) opacity-50 block mb-1.5">
        rating
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              const newDate = new Date()
              // flip if selected star is clicked again, else set to star value
              onChange({
                value: value === star ? null : star,
                progress: value === star ? 0 : (star / endGoal) * 100,
                completedAt:
                  value === star
                    ? null
                    : star === endGoal // if star value matches endGoal, set to completed
                      ? newDate
                      : null,
              })
            }}
            className="cursor-pointer transition-all hover:scale-110"
          >
            <Star
              size={22}
              className={
                (value ?? 0) >= star
                  ? 'text-(--journal-gold) fill-(--journal-gold)'
                  : 'text-(--journal-warm)'
              }
            />
          </button>
        ))}
      </div>
    </div>
  )
}
