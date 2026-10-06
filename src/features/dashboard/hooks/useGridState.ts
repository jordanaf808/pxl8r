import { useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  createGrid as createGridServerFn,
  updateGrid as updateGridServerFn,
  deleteGridById as deleteGridByIdServerFn,
  bulkUpsertGridPixels as bulkUpsertGridPixelsServerFn,
  deleteGridPixels as deleteGridPixelsServerFn,
  deleteManyCellsById as deleteManyCellsByIdServerFn,
} from '@/db/mutations.functions'
import type {
  Grid,
  Cell,
  Pixel,
  GridPixel,
  GridData,
  NewGridData,
  GridsByPixelIdMap,
} from '@/db/types'
import { buildGridsByPixelIdMap, flattenCellsByGridId } from '@/lib/utils/maps'
import { mergeGridPixels } from '@/lib/utils/grid'

function withoutGrid<T>(map: Map<string, T>, gridId: string): Map<string, T> {
  const next = new Map(map)
  next.delete(gridId)
  return next
}

export function useGridState(
  initialGrids: Grid[],
  initialCellsByGridId: Map<string, Cell[]>,
  initialPixelsByGridId: Map<string, GridPixel[]>,
  pixels: Pixel[],
  userId: string,
) {
  const createGrid = useServerFn(createGridServerFn)
  const updateGrid = useServerFn(updateGridServerFn)
  const deleteGrid = useServerFn(deleteGridByIdServerFn)
  const bulkUpsertGridPixels = useServerFn(bulkUpsertGridPixelsServerFn)
  const deleteGridPixels = useServerFn(deleteGridPixelsServerFn)
  const deleteManyCellsById = useServerFn(deleteManyCellsByIdServerFn)

  const [grids, setGrids] = useState<Grid[]>(initialGrids)
  const [cellsByGridId, setCellsByGridId] = useState(initialCellsByGridId)
  const [pixelsByGridId, setPixelsByGridId] = useState(initialPixelsByGridId)

  const allCells = useMemo(
    () => flattenCellsByGridId(cellsByGridId),
    [cellsByGridId],
  )

  const gridsByPixelId = useMemo<GridsByPixelIdMap>(
    () => buildGridsByPixelIdMap(pixelsByGridId, grids),
    [pixelsByGridId, grids],
  )

  // ---- Grid CRUD ----

  async function addGridPixels({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    if (gridOwnerId !== userId) throw new Error('You do not own this grid')
    const existingGridPixels = pixelsByGridId.get(gridId)

    const newPixels: Pixel[] = []

    pixelIds.forEach((pixelId) => {
      const foundPixel = pixels.find(
        (p) => p.id === pixelId && p.ownerId === userId,
      )
      if (!foundPixel) {
        console.warn('Pixel not found: ' + pixelId)
        return
      }
      const foundGridPixel = existingGridPixels?.find(
        (gp) => gp.pixel.id === pixelId,
      )
      if (foundGridPixel) return

      newPixels.push(foundPixel)
    })

    const results = await bulkUpsertGridPixels({
      data: {
        ownerId: userId,
        gridId,
        pixelData: newPixels.map((p) => ({
          gridId,
          pixelId: p.id,
          sortOrder: 'manual',
        })),
      },
    })

    // The server assigns position, so state updates after the save instead of before it.
    const newGridPixelsState: GridPixel[] = results.results.map((gp) => ({
      gridId: gp.gridId,
      sortOrder: gp.sortOrder,
      position: gp.position,
      pixel: newPixels.find((p) => p.id === gp.pixelId)!,
    }))

    setPixelsByGridId((oldPixelsByGridId) => {
      const newPixelsByGridId = new Map(oldPixelsByGridId)
      if (newGridPixelsState.length > 0) {
        newPixelsByGridId.set(gridId, [
          ...(oldPixelsByGridId.get(gridId) ?? []),
          ...newGridPixelsState,
        ])
      }
      return newPixelsByGridId
    })

    return results
  }

  // Resolves with the new grid's id
  async function createGridHandler(gridData: NewGridData): Promise<string> {
    // New grids start empty: the modal's cell matrix no longer saves.
    const { grid: newGrid, pixels: pixelsData } = gridData

    // One request creates the grid and links its pixels, in one transaction
    const created = await createGrid({
      data: {
        grid: newGrid,
        pixelIds: pixelsData.map((p) => p.id).filter(Boolean) as string[],
      },
    })
    if (created.success !== true)
      throw new Error('Error creating Grid: ', { cause: created.results })
    const createdGrid = created.results[0]

    // At the end, where getGridsByOwnerId's oldest-first order puts it
    setGrids((prev) => [...prev, createdGrid])
    setPixelsByGridId((prev) =>
      new Map(prev).set(
        createdGrid.id,
        created.gridPixels.map((gp) => ({
          gridId: gp.gridId,
          sortOrder: gp.sortOrder,
          position: gp.position,
          pixel: pixels.find((p) => p.id === gp.pixelId)!,
        })),
      ),
    )

    return createdGrid.id
  }

  async function updateGridHandler(gridData: GridData) {
    const gridId = gridData.grid.id

    const pixelData = gridData.pixels.map((p) => ({
      gridId,
      pixelId: p.id,
      sortOrder: 'alphabetic',
    }))

    // The modal's cell matrix no longer saves.
    const [updatedGrid, updatedGridPixels] = await Promise.all([
      updateGrid({ data: gridData.grid }),
      bulkUpsertGridPixels({
        data: { ownerId: gridData.grid.ownerId, gridId, pixelData },
      }),
    ])

    if (updatedGrid.success !== true)
      throw new Error('Error updating grid', { cause: updatedGrid.results })
    if (updatedGridPixels.success !== true)
      throw new Error('Error updating grid pixels', {
        cause: updatedGridPixels.results,
      })

    const updatedGridData = updatedGrid.results[0]
    setGrids((prev) => prev.map((g) => (g.id === gridId ? updatedGridData : g)))

    setPixelsByGridId((prev) => {
      const newMap = new Map(prev)
      const savedGridPixels = updatedGridPixels.results.map((gp) => ({
        gridId: gp.gridId,
        sortOrder: gp.sortOrder,
        position: gp.position,
        pixel: gridData.pixels.find((p) => p.id === gp.pixelId)!,
      }))
      // The modal leaves out rows that have no cells, and this save never
      // removes a link, so rows it didn't send are kept
      newMap.set(
        gridId,
        mergeGridPixels(prev.get(gridId) ?? [], savedGridPixels),
      )
      return newMap
    })
  }

  async function removeGrid(gridId: string) {
    const foundGrid = grids.find((g) => g.id === gridId)
    if (foundGrid?.ownerId !== userId)
      throw new Error('Unauthorized or Grid not found.')
    const snapshot = { grids, cellsByGridId, pixelsByGridId }

    // The database deletes the grid's cells and pixel links with it. Drop them
    // here too, or allCells would keep counting the deleted grid's cells
    setGrids((prev) => prev.filter((g) => g.id !== gridId))
    setCellsByGridId((prev) => withoutGrid(prev, gridId))
    setPixelsByGridId((prev) => withoutGrid(prev, gridId))

    const results = await deleteGrid({ data: { gridId } })

    if (!results.success) {
      console.error('Error deleting Grid: ', { cause: results })
      setGrids(snapshot.grids)
      setCellsByGridId(snapshot.cellsByGridId)
      setPixelsByGridId(snapshot.pixelsByGridId)
    }
  }

  async function removeGridPixels({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    if (gridOwnerId !== userId) throw new Error('You do not own this grid')
    let oldPixelsByGridId: Map<string, GridPixel[]>

    setPixelsByGridId((prev) => {
      oldPixelsByGridId = new Map(prev)
      const newPixelsByGridId = new Map(prev)
      const oldGridPixels = oldPixelsByGridId.get(gridId)
      if (!oldGridPixels) throw new Error('cant find GridPixels')

      newPixelsByGridId.set(
        gridId,
        oldGridPixels.filter((gp) => !pixelIds.includes(gp.pixel.id)),
      )
      return newPixelsByGridId
    })

    const results = await deleteGridPixels({ data: { gridId, pixelIds } })

    return results
  }

  async function removeGridCells({
    gridId,
    cellData,
  }: {
    gridId: string
    cellData: { cellId: string; pixelId: string }[]
  }) {
    const cellIds = cellData.map((c) => c.cellId)
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    if (gridOwnerId !== userId) throw new Error('You do not own this grid')

    const removedCells = (cellsByGridId.get(gridId) ?? []).filter((c) =>
      cellIds.includes(c.id),
    )

    setCellsByGridId((prev) => {
      const gridCells = prev.get(gridId)
      if (!gridCells || gridCells.length === 0) {
        console.error('no grid cells found')
        return prev
      }
      return new Map(prev).set(
        gridId,
        gridCells.filter((c) => !cellIds.includes(c.id)),
      )
    })

    try {
      return await deleteManyCellsById({
        data: { gridOwnerId, gridId, cellIds },
      })
    } catch (error) {
      // Only the removed cells go back. Restoring a copy of the whole map
      // would also undo a cell save that landed while the delete was out
      setCellsByGridId((prev) =>
        new Map(prev).set(gridId, [
          ...(prev.get(gridId) ?? []),
          ...removedCells,
        ]),
      )
      throw error
    }
  }

  return {
    grids,
    cellsByGridId,
    pixelsByGridId,
    setPixelsByGridId,
    gridsByPixelId,
    allCells,
    createGridHandler,
    updateGridHandler,
    removeGrid,
    addGridPixels,
    removeGridPixels,
    removeGridCells,
  }
}
