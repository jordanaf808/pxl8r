import { useMemo, useState } from 'react'
import { Timer } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Cell, Grid, GridPixel, Pixel } from '@/db/types'
import { buildGridRows } from '@/lib/utils/grid'
import { computeGridStats } from '@/lib/utils/stats'
import { useGridColumns } from './hooks/useGridColumns'
import { PixelAxis } from './PixelAxis'

// Each slot is a 64px square with the 52px cell centred in it, as in mockup
// 2b. The graph paper's dots sit at the slot corners, so they fall every 64px
const SLOT_SIZE = 64
const CELL_SIZE = 52

// The stats block and the column labels sit above the first cell row. The
// axis header is as tall as both together, so its first row lines up with it
const STATS_HEIGHT = 64
const LABELS_HEIGHT = 24

interface GridViewProps {
  grid: Grid
  gridPixels: GridPixel[]
  cells: Cell[]
  // Only 'horizontal' is laid out so far. The vertical layout, for mobile,
  // will key its styles off data-orientation
  orientation: 'horizontal' | 'vertical'
}

function matchesFilter(pixel: Pixel, filter: string): boolean {
  const term = filter.trim().toLowerCase()
  return [pixel.name, pixel.type, pixel.description ?? ''].some((text) =>
    text.toLowerCase().includes(term),
  )
}

function FilledCell({ cell, pixel }: { cell: Cell; pixel: Pixel }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: PIXEL_COLORS[pixel.color].bg + 'ee',
        border: '1px solid var(--journal-warm)',
        borderRadius: '4px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.20)',
      }}
      title={pixel.name}
    >
      {cell.timerStartedAt && (
        <Timer
          size={12}
          className="absolute top-0.5 right-0.5 text-(--journal-ink) opacity-70"
        />
      )}

      {cell.progress > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${cell.progress}%`,
              backgroundColor: 'rgba(255,255,255,0.45)',
              borderRadius: '0 1px 1px 0',
            }}
          />
        </div>
      )}
    </div>
  )
}

export function GridView({
  grid,
  gridPixels,
  cells,
  orientation,
}: GridViewProps) {
  const rows = useMemo(
    () => buildGridRows(gridPixels, cells),
    [gridPixels, cells],
  )
  const perRowMax = Math.max(0, ...rows.map((row) => row.cells.length))

  // A slot's width already includes the space between cells, so n slots need
  // exactly n * SLOT_SIZE and there's no separate gap
  const { ref, columns } = useGridColumns({
    perRowMax,
    cellWidth: SLOT_SIZE,
    gap: 0,
  })

  // Filtered once, here, so the axis and the cell area get the same rows
  const [filter, setFilter] = useState('')
  const visibleRows = rows.filter((row) => matchesFilter(row.pixel, filter))

  const { avgProgress, completedCount, totalCells } = computeGridStats(cells)
  const slotColumns = {
    gridTemplateColumns: `repeat(${columns}, ${SLOT_SIZE}px)`,
  }

  return (
    <div className="flex items-stretch" data-orientation={orientation}>
      <PixelAxis
        pixels={visibleRows.map((row) => row.pixel)}
        pixelCount={rows.length}
        filter={filter}
        onFilterChange={setFilter}
        headerHeight={STATS_HEIGHT + LABELS_HEIGHT}
        rowHeight={SLOT_SIZE}
      />
      {/* Padding goes here, not on the cell area: useGridColumns measures the
          cell area's clientWidth, which would count its own padding as room
          for columns */}
      <div
        className="flex-1 min-w-0 px-6 pb-4 bg-(--journal-cream)"
        style={{
          border: '2px solid var(--journal-ink)',
          borderLeft: 'none',
          borderRadius: '0 12px 6px 0',
          boxShadow: '2px 3px 0px var(--journal-warm)',
        }}
      >
        <div
          className="flex items-start justify-between gap-5 pt-5"
          style={{ height: STATS_HEIGHT }}
        >
          <p className="text-base font-serif text-(--journal-ink) opacity-55 truncate">
            {grid.description}
          </p>
          <div className="flex items-baseline gap-2.5 shrink-0 text-(--journal-ink)">
            <span className="text-xl font-bold leading-tight">
              {avgProgress}%
            </span>
            <span className="text-sm font-serif opacity-50">
              {completedCount} / {totalCells} completed
            </span>
          </div>
        </div>

        {/* The cell area. It takes its width from the panel, holds only the
            slot columns, and scrolls sideways when a row is longer than fits.
            Focusable so the keyboard can scroll it while cells aren't buttons */}
        <div
          ref={ref}
          role="region"
          aria-label={`${grid.name} cells`}
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--journal-ink)"
        >
          <div className="w-max min-w-full">
            <div
              aria-hidden="true"
              className="grid items-center text-center text-xs font-serif text-(--journal-ink) opacity-45"
              style={{ ...slotColumns, height: LABELS_HEIGHT }}
            >
              {Array.from({ length: columns }, (_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>

            {/* Empty slots draw nothing, so the paper shows through. Before the
                width is measured (always the case in server HTML) only the
                longest row plus one slot is drawn, and the paper already fills
                the rest */}
            <div
              className="graph-paper min-h-48"
              style={{ backgroundSize: `${SLOT_SIZE}px ${SLOT_SIZE}px` }}
            >
              {visibleRows.map((row) => (
                <div
                  key={row.pixel.id}
                  role="group"
                  aria-label={row.pixel.name}
                  className="grid"
                  style={{ ...slotColumns, height: SLOT_SIZE }}
                >
                  {Array.from({ length: columns }, (_, index) => {
                    const cell = row.cells.at(index)
                    return (
                      <div
                        key={cell?.id ?? `empty-${index}`}
                        data-testid="grid-slot"
                        data-filled={cell !== undefined}
                        className="flex items-center justify-center"
                      >
                        {cell && <FilledCell cell={cell} pixel={row.pixel} />}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
