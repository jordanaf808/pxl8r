import { useMemo, useRef, useState } from 'react'
import type { Cell, CreateCellInput, Grid, GridPixel, Pixel } from '@/db/types'
import { buildGridRows } from '@/lib/utils/grid'
import { DANGER_COLOR } from './cell-editor/styles'
import { AddCellButton, EmptySlot, FilledCell } from './GridSlots'
import { GridHeader } from './GridHeader'
import { useGridColumns } from './hooks/useGridColumns'
import { useListFocus } from './hooks/useListFocus'
import { PixelRowModal } from './modals/PixelRowModal'
import { PixelAxis } from './PixelAxis'

// Each slot is a 64px square with the 52px cell centred in it, as in mockup
// 2b. The graph paper's dots sit at the slot corners, so they fall every 64px
const SLOT_SIZE = 64

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
  onOpenSettings: () => void
  onDeleteGrid: () => void
  onEditCell: (editing: EditingCell) => void
  /** Settles once the new cell is in `cells` */
  onCreateCell: (input: CreateCellInput) => Promise<unknown>
}

/** What the cell editor needs to open on a cell */
export interface EditingCell {
  cell: Cell
  pixel: Pixel
  /** The cell's place in its row, counted from 1 */
  column: number
}

function matchesFilter(pixel: Pixel, filter: string): boolean {
  const term = filter.trim().toLowerCase()
  return [pixel.name, pixel.type, pixel.description ?? ''].some((text) =>
    text.toLowerCase().includes(term),
  )
}

export function GridView({
  grid,
  gridPixels,
  cells,
  orientation,
  onOpenSettings,
  onDeleteGrid,
  onEditCell,
  onCreateCell,
}: GridViewProps) {
  const [addFailed, setAddFailed] = useState(false)

  async function addCell(pixelId: string): Promise<void> {
    setAddFailed(false)
    try {
      await onCreateCell({ gridId: grid.id, pixelId })
    } catch (error) {
      console.error('Error adding a cell', error)
      setAddFailed(true)
    }
  }

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

  // The row whose modal is open, kept by id so the modal shows the row as it
  // is now. The index is where its label was, for focus once the modal closes
  const [openRowAt, setOpenRowAt] = useState<{ id: string; index: number }>()
  const openRow = rows.find((row) => row.pixel.id === openRowAt?.id)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { listRef, focusRow } = useListFocus<HTMLUListElement>(
    visibleRows.map((row) => row.pixel.id),
    headingRef,
  )

  function openRowModal(pixelId: string) {
    const index = visibleRows.findIndex((row) => row.pixel.id === pixelId)
    setOpenRowAt({ id: pixelId, index })
  }

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
        onOpenRow={openRowModal}
        listRef={listRef}
        headingRef={headingRef}
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
        <GridHeader
          grid={grid}
          cells={cells}
          height={STATS_HEIGHT}
          onOpenSettings={onOpenSettings}
          onDeleteGrid={onDeleteGrid}
        />

        {/* The cell area. It takes its width from the panel, holds only the
            slot columns, and scrolls sideways when a row is longer than fits.
            Focusable so the keyboard can scroll it while empty slots aren't
            buttons */}
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
              className="grid items-center text-center text-xs font-serif text-(--journal-ink) opacity-70"
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
                    // The first empty slot holds the "+". Its key stays the
                    // same when a new cell lands in front of it, so React
                    // keeps the button, and the keyboard's focus with it
                    const isAddSlot = index === row.cells.length
                    return (
                      <div
                        key={cell?.id ?? (isAddSlot ? 'add' : `empty-${index}`)}
                        data-testid="grid-slot"
                        data-filled={cell !== undefined}
                        className="flex items-center justify-center"
                      >
                        {cell && (
                          <FilledCell
                            cell={cell}
                            pixel={row.pixel}
                            column={index + 1}
                            onEdit={() =>
                              onEditCell({
                                cell,
                                pixel: row.pixel,
                                column: index + 1,
                              })
                            }
                          />
                        )}
                        {isAddSlot && (
                          <AddCellButton
                            pixelName={row.pixel.name}
                            onAdd={() => addCell(row.pixel.id)}
                          />
                        )}
                        {!cell && !isAddSlot && (
                          <EmptySlot
                            onOpenRow={() => openRowModal(row.pixel.id)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Under the cells, not in the header: the header's height is what
            keeps the axis rows level with the cell rows */}
        {addFailed && (
          <p
            role="alert"
            className="pt-3 text-sm font-serif"
            style={{ color: DANGER_COLOR }}
          >
            The cell couldn’t be added. Try again.
          </p>
        )}
      </div>

      {openRow && openRowAt && (
        <PixelRowModal
          key={openRow.pixel.id}
          row={openRow}
          rowNumber={rows.indexOf(openRow) + 1}
          gridName={grid.name}
          onClose={() => setOpenRowAt(undefined)}
          // Back to the row's label. With the row gone, focusRow picks the
          // label now in its place, or the one before it (#124)
          onClosed={() => focusRow(openRowAt)}
        />
      )}
    </div>
  )
}
