import { useRef } from 'react'
import { X } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Pixel } from '@/db/types'
import { countLabel } from '@/lib/utils/format'
import { BUTTON_RADIUS, FOCUS_RING } from '../cell-editor/styles'
import { useListFocus } from '../hooks/useListFocus'

export interface GridRowItem {
  pixel: Pixel
  /** Left out for a grid that isn't saved yet: its rows can't have cells */
  cellCount?: number
}

interface GridRowsListProps {
  /** In row order */
  rows: GridRowItem[]
  /** Left out, rows can't be removed here */
  onRemove?: (pixel: Pixel) => void
}

export function GridRowsList({ rows, onRemove }: GridRowsListProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { listRef, noteLeavingRow } = useListFocus<HTMLOListElement>(
    rows.map((row) => row.pixel.id),
    headingRef,
  )

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Focusable by script only: it takes focus when the last row is removed */}
        <h3
          ref={headingRef}
          tabIndex={-1}
          className={`text-[15px] font-bold ${FOCUS_RING}`}
        >
          In this grid
        </h3>
        <span className="text-xs font-serif opacity-70">
          {rows.length === 0
            ? 'No pixels yet'
            : `${countLabel(rows.length, 'pixel')}, in row order`}
        </span>
      </div>

      {rows.length === 0 ? (
        <p
          className="px-5 py-6 text-center text-[13px] font-serif leading-snug border-[1.5px] border-dashed border-(--journal-ink)/60"
          style={{ borderRadius: BUTTON_RADIUS }}
        >
          Each pixel you add becomes a row. A grid can also start empty.
        </p>
      ) : (
        // Safari drops a list's role when its markers are removed, so it's set by hand
        <ol
          ref={listRef}
          role="list"
          aria-label="Pixels in this grid"
          className="border-[1.5px] border-(--journal-warm)"
          style={{ borderRadius: BUTTON_RADIUS }}
        >
          {rows.map(({ pixel, cellCount }, index) => (
            <li
              key={pixel.id}
              className="flex items-center gap-2.5 h-11 pl-1.5 pr-1 border-b border-(--journal-tan) last:border-b-0"
            >
              {/* The list already tells a screen reader each row's place */}
              <span
                aria-hidden="true"
                className="w-5 shrink-0 text-center text-xs font-serif opacity-70"
              >
                {index + 1}
              </span>
              <span
                aria-hidden="true"
                className="w-3 h-3 shrink-0"
                style={{
                  backgroundColor: PIXEL_COLORS[pixel.color].bg,
                  borderRadius: '1px 3px 2px 4px',
                }}
              />
              <span className="flex-1 min-w-0 text-sm font-bold truncate">
                {pixel.name}
              </span>
              {cellCount !== undefined && (
                <span className="shrink-0 text-xs font-serif opacity-70">
                  {cellCount === 0
                    ? 'No cells yet'
                    : countLabel(cellCount, 'cell')}
                </span>
              )}
              {onRemove ? (
                <button
                  type="button"
                  data-row-control={pixel.id}
                  aria-label={`Remove ${pixel.name}`}
                  onClick={() => {
                    noteLeavingRow(pixel.id)
                    onRemove(pixel)
                  }}
                  className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-sm cursor-pointer hover:bg-(--journal-tan) ${FOCUS_RING}`}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : (
                // Keeps the cell count off the box's edge
                <span className="w-2 shrink-0" />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
