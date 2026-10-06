import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Pixel } from '@/db/types'
import { countLabel } from '@/lib/utils/format'
import { BUTTON_RADIUS, FOCUS_RING } from '../cell-editor/styles'
import { useListFocus } from '../hooks/useListFocus'
import { RemoveRowDialog } from './RemoveRowDialog'

export interface GridRowItem {
  pixel: Pixel
  /** Left out for a grid that isn't saved yet: its rows can't have cells */
  cellCount?: number
}

interface RowToRemove {
  pixel: Pixel
  cellCount: number
  index: number
}

interface GridRowsListProps {
  /** In row order */
  rows: GridRowItem[]
  onRemove: (pixel: Pixel) => void
  /**
   * Shows a warning before removing. For a saved grid, where a row's cells
   * are deleted with it and can't be brought back
   */
  asksBeforeRemoving?: boolean
}

export function GridRowsList({
  rows,
  onRemove,
  asksBeforeRemoving = false,
}: GridRowsListProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { listRef, noteLeavingRow, focusRow } = useListFocus<HTMLOListElement>(
    rows.map((row) => row.pixel.id),
    headingRef,
  )
  // Kept once the warning closes, so its text doesn't empty while it fades out
  const [rowToRemove, setRowToRemove] = useState<RowToRemove | null>(null)
  const [isWarningOpen, setIsWarningOpen] = useState(false)

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
              {/* On a phone the count goes under the name. Beside it, the
                  name had about 110px and an 18-letter one was cut short */}
              <div className="flex flex-col flex-1 min-w-0 sm:flex-row sm:items-center sm:gap-2.5">
                <span className="text-sm font-bold leading-tight truncate sm:flex-1">
                  {pixel.name}
                </span>
                {cellCount !== undefined && (
                  <span className="shrink-0 text-xs font-serif leading-tight opacity-70">
                    {cellCount === 0
                      ? 'No cells yet'
                      : countLabel(cellCount, 'cell')}
                  </span>
                )}
              </div>
              <button
                type="button"
                data-row-control={pixel.id}
                aria-label={`Remove ${pixel.name}`}
                onClick={() => {
                  if (asksBeforeRemoving) {
                    setRowToRemove({ pixel, cellCount: cellCount ?? 0, index })
                    setIsWarningOpen(true)
                    return
                  }
                  noteLeavingRow(pixel.id)
                  onRemove(pixel)
                }}
                className={`flex items-center justify-center shrink-0 w-9 h-9 rounded-sm cursor-pointer hover:bg-(--journal-tan) ${FOCUS_RING}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      )}

      {rowToRemove && (
        <RemoveRowDialog
          isOpen={isWarningOpen}
          pixelName={rowToRemove.pixel.name}
          cellCount={rowToRemove.cellCount}
          onCancel={() => setIsWarningOpen(false)}
          onConfirm={() => {
            setIsWarningOpen(false)
            onRemove(rowToRemove.pixel)
          }}
          // After Cancel, back to the row's own button. After a removal that
          // row is gone, so to the row now in its place
          onClosed={() =>
            focusRow({ id: rowToRemove.pixel.id, index: rowToRemove.index })
          }
        />
      )}
    </section>
  )
}
