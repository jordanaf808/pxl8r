import type { Cell, Pixel } from '@/db/types'

export function computeGridStats(cells: Cell[]) {
  const completedCount = cells.filter((c) => c.completedAt !== null).length
  const totalCells = cells.length
  const avgProgress =
    totalCells > 0
      ? Math.round(cells.reduce((sum, c) => sum + c.progress, 0) / totalCells)
      : 0

  return { totalCells, completedCount, avgProgress }
}

export function computeGlobalStats(
  pixels: Pixel[],
  cells: Cell[],
  gridCount: number,
) {
  const totalCells = cells.length > 0 ? cells.length : pixels.length
  const completedCount = cells.filter((c) => c.completedAt).length
  const remainingCells = totalCells - completedCount
  const avgProgress =
    totalCells > 0
      ? Math.round(cells.reduce((sum, c) => sum + c.progress, 0) / totalCells)
      : 0

  const completedWithTime = cells.filter((c) => c.completedAt)
  const avgCompletionDays =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum, c) => {
            const created = new Date(c.createdAt!).getTime()
            const completed = new Date(c.updatedAt!).getTime()
            return sum + (completed - created) / (1000 * 60 * 60 * 24)
          }, 0) / completedWithTime.length,
        )
      : 0

  return {
    totalCells,
    completedCount,
    remainingCells,
    avgProgress,
    avgCompletionDays,
    completedWithTime,
    gridCount,
  }
}
