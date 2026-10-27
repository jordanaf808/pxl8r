import { Star } from 'lucide-react'
import type { Cell } from '@/db/types'
import { averageRating, computeGridStats } from '@/lib/utils/stats'
import { BUTTON_RADIUS } from '../cell-editor/styles'

// The label comes first, so a screen reader says "progress, 75%". The value
// is drawn above it
const STAT = 'flex flex-col-reverse gap-0.5 px-3.5 py-2.5'
const DIVIDED_STAT = `${STAT} border-l-[1.5px] border-(--journal-warm)`
const LABEL = 'text-xs font-serif opacity-75'
const VALUE = 'text-[22px] font-bold leading-tight'

export function RowStats({ cells }: { cells: Cell[] }) {
  const { avgProgress, completedCount, totalCells } = computeGridStats(cells)
  const rating = averageRating(cells)

  return (
    <dl
      className="grid grid-cols-3 border-[1.5px] border-(--journal-warm)"
      style={{ borderRadius: BUTTON_RADIUS }}
    >
      <div className={STAT}>
        <dt className={LABEL}>progress</dt>
        <dd className={VALUE}>{avgProgress}%</dd>
      </div>
      <div className={DIVIDED_STAT}>
        <dt className={LABEL}>completed</dt>
        <dd className={VALUE}>
          {completedCount} / {totalCells}
        </dd>
      </div>
      <div className={DIVIDED_STAT}>
        <dt className={LABEL}>average rating</dt>
        <dd className={`${VALUE} flex items-center gap-1`}>
          <Star
            size={18}
            fill="currentColor"
            aria-hidden="true"
            className="text-(--journal-star)"
          />
          {rating === null ? (
            <>
              <span aria-hidden="true">–</span>
              <span className="sr-only">No ratings yet</span>
            </>
          ) : (
            rating.toFixed(1)
          )}
        </dd>
      </div>
    </dl>
  )
}
