import { useId } from 'react'
import type { RefObject } from 'react'
import { Layers, Search, X } from 'lucide-react'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import type { Pixel } from '@/db/types'
import { FOCUS_RING } from './cell-editor/styles'

interface PixelAxisProps {
  /** The rows to show, in row order. GridView has already filtered them */
  pixels: Pixel[]
  /** Every pixel in the grid, filtered out or not */
  pixelCount: number
  filter: string
  onFilterChange: (filter: string) => void
  /** Both set by GridView, so each axis row sits beside its cell row */
  headerHeight: number
  rowHeight: number
  onOpenRow: (pixelId: string) => void
  /** GridView moves focus to a row's label once the row modal closes */
  listRef: RefObject<HTMLUListElement | null>
  /** Takes focus when no row is left */
  headingRef: RefObject<HTMLHeadingElement | null>
}

interface AxisRowProps {
  pixel: Pixel
  height: number
  onOpen: () => void
}

function AxisRow({ pixel, height, onOpen }: AxisRowProps) {
  const nameId = useId()
  const typeId = useId()
  const descriptionId = useId()
  const goalId = useId()

  return (
    // The height is fixed, not left to the text: a row with no description
    // would be shorter, and every row below it would slip out of line with
    // its cells. Each line is cut short instead of wrapping for the same reason
    <li
      className="border-b border-(--journal-tan) last:border-b-0"
      style={{ height }}
    >
      {/* Named by the pixel alone, so a screen reader says the name first and
          the rest as a description. A button may hold only inline elements,
          so every line is a span */}
      <button
        type="button"
        data-row-control={pixel.id}
        aria-labelledby={nameId}
        aria-describedby={[typeId, pixel.description && descriptionId, goalId]
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="dialog"
        onClick={onOpen}
        className="grid grid-cols-[auto_minmax(0,1fr)] content-center gap-x-2.5 w-full h-full px-3 text-left cursor-pointer hover:bg-(--journal-tan)/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--journal-ink)"
      >
        <span
          className="w-2.5 h-2.5 self-center"
          style={{
            backgroundColor: PIXEL_COLORS[pixel.color].bg,
            borderRadius: '1px 3px 2px 4px',
          }}
        />
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            id={nameId}
            className="text-sm font-bold text-(--journal-ink) truncate leading-tight flex-1"
          >
            {pixel.name}
          </span>
          <span
            id={typeId}
            className="hidden md:inline text-[10px] font-serif px-1.5 py-0.5 bg-(--journal-tan) text-(--journal-ink) shrink-0 whitespace-nowrap"
            style={{ borderRadius: '1px 4px 2px 5px' }}
          >
            {PIXEL_TYPE_LABELS[pixel.type]}
          </span>
        </span>

        {pixel.description && (
          <span
            id={descriptionId}
            className="col-start-2 text-xs text-(--journal-ink) opacity-75 font-serif truncate leading-snug"
          >
            {pixel.description}
          </span>
        )}

        <span
          id={goalId}
          className="col-start-2 text-[10px] font-serif text-(--journal-ink) opacity-70 truncate leading-tight"
        >
          <span className="capitalize">{pixel.unit}</span>
          {pixel.endGoal != null && ` · goal: ${pixel.endGoal}`}
        </span>
      </button>
    </li>
  )
}

export function PixelAxis({
  pixels,
  pixelCount,
  filter,
  onFilterChange,
  headerHeight,
  rowHeight,
  onOpenRow,
  listRef,
  headingRef,
}: PixelAxisProps) {
  const filterId = useId()

  return (
    // No scroll of its own: scrolled alone, its rows would slide past the
    // cell rows. The page scrolls both boxes together
    <aside
      className="w-40 md:w-64 shrink-0 flex flex-col bg-(--journal-cream)"
      style={{
        border: '2px solid var(--journal-ink)',
        borderRight: 'none',
        borderRadius: '3px 0 0 12px',
        boxShadow: '0 3px 0px var(--journal-warm)',
      }}
    >
      <div className="flex flex-col shrink-0" style={{ height: headerHeight }}>
        <div className="flex flex-1 items-center gap-2 px-3 border-b-2 border-(--journal-warm)">
          <Layers size={16} className="text-(--journal-ink) opacity-60" />
          {/* Focusable by script only: it takes focus when the last row is deleted */}
          <h3
            ref={headingRef}
            tabIndex={-1}
            className={`text-base font-bold text-(--journal-ink) ${FOCUS_RING}`}
          >
            Pixels
          </h3>
          <span
            className="text-[10px] font-serif px-1.5 py-0.5 bg-(--journal-tan) text-(--journal-ink)"
            style={{ borderRadius: '2px 5px 3px 6px' }}
          >
            {pixelCount}
          </span>
        </div>

        <div className="flex items-center h-10 px-2 border-b border-(--journal-warm)">
          <div
            className="flex items-center gap-1.5 w-full bg-(--journal-paper) px-2 py-1 border border-(--journal-warm) focus-within:border-(--journal-ink) transition-colors"
            style={{ borderRadius: '2px 7px 4px 9px' }}
          >
            <Search
              size={12}
              className="text-(--journal-ink) opacity-40 shrink-0"
            />
            <input
              id={filterId}
              name="pixel-filter"
              type="search"
              aria-label="Filter pixels"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="bg-transparent text-(--journal-ink) text-xs placeholder:text-(--journal-ink)/70 outline-none w-full min-w-0 font-serif [&::-webkit-search-cancel-button]:hidden"
            />
            {filter && (
              <button
                type="button"
                onClick={() => onFilterChange('')}
                aria-label="Clear filter"
                className="text-(--journal-ink) opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Safari drops a list's role when its markers are removed, so it's set by hand */}
      <ul ref={listRef} role="list" aria-label="Pixels">
        {pixels.map((pixel) => (
          <AxisRow
            key={pixel.id}
            pixel={pixel}
            height={rowHeight}
            onOpen={() => onOpenRow(pixel.id)}
          />
        ))}
      </ul>

      {pixels.length === 0 && (
        <p className="px-3 py-4 text-xs text-(--journal-ink) opacity-70 font-serif">
          {filter ? 'No pixels match' : 'No pixels in this grid yet'}
        </p>
      )}
    </aside>
  )
}
