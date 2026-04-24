import type { Grid, Cell, Pixel, NewCell, NewGrid, NewPixel } from './db.types'

// ---- Junction / composite types ----

export type GridPixel = {
  gridId: string
  sortOrder: string
  pixel: Pixel
}

export type GridData = {
  grid: Grid
  pixels: Pixel[]
  cells: Cell[]
}

export type NewGridData = {
  grid: NewGrid
  pixels: NewPixel[]
  cells: NewCell[]
}

export type DashboardGridDataReturn = {
  cellsByGridId: Map<string, Cell[]>
  pixelsByGridId: Map<string, GridPixel[]>
  ungroupedPixels: Pixel[]
}

// ---- Map alias types ----

type PixelId = string
type GridId = string
export type GridByGridIdMap = Map<GridId, Grid>
export type GridsByPixelIdMap = Map<PixelId, Map<GridId, Grid>>
