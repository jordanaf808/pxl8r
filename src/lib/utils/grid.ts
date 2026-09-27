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
  const sortedCells = [...cells].sort(compareCells)

  return [...gridPixels]
    .sort(
      (a, b) => a.position - b.position || compareIds(a.pixel.id, b.pixel.id),
    )
    .map((gridPixel) => ({
      ...gridPixel,
      cells: sortedCells.filter((cell) => cell.pixelId === gridPixel.pixel.id),
    }))
}
