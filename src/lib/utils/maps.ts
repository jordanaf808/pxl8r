import type { Cell, Grid, GridPixel, Pixel, GridByGridIdMap, GridsByPixelIdMap } from '@/db/types'

export function buildPixelsMap(pixels: Pixel[]): Map<string, Pixel> {
  const map = new Map<string, Pixel>()
  pixels.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p)
  })
  return map
}

export function buildGridsByPixelIdMap(
  pixelsByGridId: Map<string, GridPixel[]>,
  grids: Grid[],
): GridsByPixelIdMap {
  const result = new Map<string, GridByGridIdMap>()
  pixelsByGridId.forEach((gridPixels) => {
    gridPixels.forEach((gp) => {
      const existingGrids = result.get(gp.pixel.id)
      if (existingGrids) {
        if (!existingGrids.get(gp.gridId)) {
          const gridData = grids.find((g) => g.id === gp.gridId)
          if (gridData) existingGrids.set(gp.gridId, gridData)
        }
      } else {
        const gridData = grids.find((g) => g.id === gp.gridId)
        if (gridData) {
          result.set(gp.pixel.id, new Map([[gp.gridId, gridData]]))
        }
      }
    })
  })
  return result
}

// Keys cells as `${col}-${row}` for the old GridCard / CreateGridModal canvas.
// row = the pixel's index in rowPixels; col = the cell's rank among that pixel's cells.
// Expects cells sorted by (position, createdAt, id), the order getDashboardGridData returns.
export function keyCellsByPixelRow(
  cells: Cell[],
  rowPixels: Pixel[],
): Map<string, Cell> {
  const map = new Map<string, Cell>()
  const nextColByPixelId = new Map<string, number>()
  cells.forEach((cell) => {
    const row = rowPixels.findIndex((p) => p.id === cell.pixelId)
    if (row === -1) return
    const col = nextColByPixelId.get(cell.pixelId) ?? 0
    nextColByPixelId.set(cell.pixelId, col + 1)
    map.set(`${col}-${row}`, cell)
  })
  return map
}

export function flattenCellsByGridId(
  cellsByGridId: Map<string, Cell[]>,
): Cell[] {
  const result: Cell[] = []
  cellsByGridId.forEach((cells) => result.push(...cells))
  return result
}
