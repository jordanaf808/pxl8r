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

export function flattenCellsByGridId(
  cellsByGridId: Map<string, Cell[]>,
): Cell[] {
  const result: Cell[] = []
  cellsByGridId.forEach((cells) => result.push(...cells))
  return result
}
