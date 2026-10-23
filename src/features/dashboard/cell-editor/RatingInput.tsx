import { useId } from 'react'
import { Star } from 'lucide-react'

const STARS = [1, 2, 3, 4, 5]

interface RatingInputProps {
  /** Open only while the cell is completed */
  isOpen: boolean
  rating: number | null
  onChange: (rating: number | null) => void
}

export function RatingInput({ isOpen, rating, onChange }: RatingInputProps) {
  const labelId = useId()

  return (
    // The row opens by growing its grid row from 0fr to 1fr, which animates
    // to the content's height in every current browser. Closed, it's inert so
    // Tab skips stars nobody can see. The negative margin cancels the editor's
    // gap while the row has no height; the padding inside brings it back
    <div
      inert={!isOpen}
      className={`grid -mt-4.5 transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        isOpen
          ? 'grid-rows-[1fr] opacity-100 delay-620'
          : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      {/* Wider than the column by the stars' 7px pull to the left, so the
          clipping that hides the row while it opens doesn't cut off the first
          star's focus ring */}
      <div className="min-h-0 overflow-hidden -mx-1.75 px-1.75">
        <div className="flex flex-col gap-1.5 pt-4.5">
          <div className="flex items-baseline justify-between">
            <span id={labelId} className="text-[13px] font-semibold">
              Rating
            </span>
            <span className="text-xs font-serif opacity-75">
              {rating ? `${rating} of 5` : 'Not rated'}
            </span>
          </div>
          <div
            role="group"
            aria-labelledby={labelId}
            className="flex gap-1 -ml-1.75"
          >
            {STARS.map((star) => {
              const isFilled = rating !== null && star <= rating
              return (
                <button
                  key={star}
                  type="button"
                  // Pressing the chosen star again clears the rating
                  aria-pressed={rating === star}
                  aria-label={star === 1 ? '1 star' : `${star} stars`}
                  onClick={() => onChange(rating === star ? null : star)}
                  className="flex items-center justify-center w-10 h-10.5 rounded-sm cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:-outline-offset-5 focus-visible:outline-(--journal-ink)"
                  style={{
                    color: isFilled
                      ? 'var(--journal-star)'
                      : 'var(--journal-star-empty)',
                  }}
                >
                  <Star
                    size={26}
                    fill={isFilled ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
