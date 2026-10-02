import type { Cell, GridPixel } from '@/db/types'

export interface GridRow extends GridPixel {
  cells: Cell[]
}

// Postgres orders uuids by their bytes. Lowercase hex uuids sort the same way
// under `<`; localeCompare follows language rules and isn't guaranteed to match
function compareIds(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

// Postgres puts NULLs last in an ascending sort
function compareNullableDates(a: Date | null, b: Date | null): number {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return a.getTime() - b.getTime()
}

function compareCells(a: Cell, b: Cell): number {
  return (
    a.position - b.position ||
    compareNullableDates(a.createdAt, b.createdAt) ||
    compareIds(a.id, b.id)
  )
}

// Must match getDashboardGridData's ORDER BY
export function buildGridRows(
  gridPixels: GridPixel[],
  cells: Cell[],
): GridRow[] {
  // Cells go in already sorted, so each pixel's list stays in order
  const cellsByPixelId = new Map<string, Cell[]>()
  for (const cell of [...cells].sort(compareCells)) {
    const pixelCells = cellsByPixelId.get(cell.pixelId)
    if (pixelCells) pixelCells.push(cell)
    else cellsByPixelId.set(cell.pixelId, [cell])
  }

  return [...gridPixels]
    .sort(
      (a, b) => a.position - b.position || compareIds(a.pixel.id, b.pixel.id),
    )
    .map((gridPixel) => ({
      ...gridPixel,
      cells: cellsByPixelId.get(gridPixel.pixel.id) ?? [],
    }))
}

// A grid's rows after a save that only inserts and updates links. A row the
// save didn't send back is still linked in the database, so it stays
export function mergeGridPixels(
  existing: GridPixel[],
  saved: GridPixel[],
): GridPixel[] {
  const savedPixelIds = new Set(saved.map((gridPixel) => gridPixel.pixel.id))
  const unsent = existing.filter(
    (gridPixel) => !savedPixelIds.has(gridPixel.pixel.id),
  )

  return [...unsent, ...saved].sort(
    (a, b) => a.position - b.position || compareIds(a.pixel.id, b.pixel.id),
  )
}

interface ColumnCountInput {
  perRowMax: number
  containerWidth: number
  cellWidth: number
  gap: number
}

export function computeColumnCount({
  perRowMax,
  containerWidth,
  cellWidth,
  gap,
}: ColumnCountInput): number {
  // n columns take n * cellWidth + (n - 1) * gap, so they fit when
  // n * (cellWidth + gap) <= containerWidth + gap
  const fitCount = Math.floor((containerWidth + gap) / (cellWidth + gap))

  // Never hide a filled cell, and keep one empty slot for the hover "+"
  return Math.max(perRowMax + 1, fitCount)
}

// Which tab to show once a grid is deleted: the next one, or the previous one
// if it was the last
export function gridIdAfterDelete(
  gridIds: string[],
  deletedId: string,
): string | null {
  const remaining = gridIds.filter((gridId) => gridId !== deletedId)
  const index = gridIds.indexOf(deletedId)

  // With the deleted id gone, the next grid has moved into its index
  return remaining.at(index) ?? remaining.at(-1) ?? null
}
