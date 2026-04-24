import { useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  createGrid as createGridServerFn,
  updateGrid as updateGridServerFn,
  deleteGridById as deleteGridByIdServerFn,
  bulkUpsertCells as bulkUpsertCellsServerFn,
  bulkUpsertGridPixels as bulkUpsertGridPixelsServerFn,
  deleteGridPixels as deleteGridPixelsServerFn,
  deleteManyCellsById as deleteManyCellsByIdServerFn,
} from '@/db/mutations.functions'
import type {
  Grid,
  Cell,
  NewCell,
  Pixel,
  GridPixel,
  GridData,
  NewGridData,
  GridsByPixelIdMap,
} from '@/db/types'
import { buildGridsByPixelIdMap, flattenCellsByGridId } from '@/lib/utils/maps'

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
  const bulkUpsertCells = useServerFn(bulkUpsertCellsServerFn)
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

    const newGridPixelsState: GridPixel[] = []
    const newGridPixelsDB: { gridId: string; pixelId: string; sortOrder: string }[] = []

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

      newGridPixelsState.push({ gridId, pixel: foundPixel, sortOrder: 'manual' })
      newGridPixelsDB.push({ gridId, pixelId: foundPixel.id, sortOrder: 'manual' })
    })

    setPixelsByGridId((oldPixelsByGridId) => {
      const newPixelsByGridId = new Map(oldPixelsByGridId)
      if (newGridPixelsState.length > 0) {
        newPixelsByGridId.set(gridId, [
          ...(existingGridPixels ?? []),
          ...newGridPixelsState,
        ])
      }
      return newPixelsByGridId
    })

    const results = await bulkUpsertGridPixels({
      data: { ownerId: userId, gridId, pixelData: newGridPixelsDB },
    })

    return results
  }

  async function createGridHandler(gridData: NewGridData) {
    const { grid: newGrid, cells: cellsData, pixels: pixelsData } = gridData

    const createdGrid = await createGrid({ data: newGrid })
    if (createdGrid.success !== true)
      throw new Error('Error creating Grid: ', { cause: createdGrid.results })
    setGrids((prev) => [...createdGrid.results, ...prev])

    const [createdCells, createdGridPixels] = await Promise.all([
      bulkUpsertCells({
        data: {
          ownerId: userId,
          gridId: createdGrid.results[0].id,
          cells: cellsData,
        },
      }),
      addGridPixels({
        gridId: createdGrid.results[0].id,
        pixelIds: pixelsData.map((p) => p.id).filter(Boolean) as string[],
      }),
    ])

    if (createdCells.success !== true)
      throw new Error('Error creating Cells for Grid', {
        cause: createdCells.results,
      })
    if (createdGridPixels.success !== true)
      throw new Error('Error creating GridPixels for Grid', {
        cause: createdGridPixels.results,
      })
  }

  async function upsertGridCells({
    gridId,
    cellData,
  }: {
    gridId: string
    cellData: NewCell[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    if (gridOwnerId !== userId) throw new Error('You do not own this grid')

    const upsertCellsResponse = await bulkUpsertCells({
      data: { ownerId: gridOwnerId, gridId, cells: cellData },
    })

    if (upsertCellsResponse.success !== true)
      throw new Error('Error upserting cells: ', {
        cause: upsertCellsResponse.results,
      })

    setCellsByGridId((oldCellsByGridId) => {
      const newCellsByGridMap = new Map(oldCellsByGridId)
      newCellsByGridMap.set(gridId, upsertCellsResponse.results)
      return newCellsByGridMap
    })

    return upsertCellsResponse
  }

  async function updateGridHandler(gridData: GridData) {
    const gridId = gridData.grid.id

    const pixelData = gridData.pixels.map((p) => ({
      gridId,
      pixelId: p.id,
      sortOrder: 'alphabetic',
    }))

    const [updatedGrid, updatedGridCells, updatedGridPixels] = await Promise.all([
      updateGrid({ data: gridData.grid }),
      upsertGridCells({ gridId, cellData: gridData.cells }),
      bulkUpsertGridPixels({
        data: { ownerId: gridData.grid.ownerId, gridId, pixelData },
      }),
    ])

    if (updatedGrid.success !== true)
      throw new Error('Error updating grid', { cause: updatedGrid.results })
    if (updatedGridCells.success !== true)
      throw new Error('Error updating grid cells', {
        cause: updatedGridCells.results,
      })
    if (updatedGridPixels.success !== true)
      throw new Error('Error updating grid pixels', {
        cause: updatedGridPixels.results,
      })

    const updatedGridData = updatedGrid.results[0]
    setGrids((prev) => prev.map((g) => (g.id === gridId ? updatedGridData : g)))

    setPixelsByGridId((prev) => {
      const newMap = new Map(prev)
      const newGridPixels = updatedGridPixels.results.map((gp) => ({
        gridId: gp.gridId,
        sortOrder: gp.sortOrder,
        pixel: gridData.pixels.find((p) => p.id === gp.pixelId)!,
      }))
      newMap.set(gridId, newGridPixels)
      return newMap
    })
  }

  async function removeGrid(gridId: string) {
    const foundGrid = grids.find((g) => g.id === gridId)
    if (foundGrid?.ownerId !== userId)
      throw new Error('Unauthorized or Grid not found.')
    let oldGridsState: Grid[]

    setGrids((prev) => {
      oldGridsState = prev
      return prev.filter((g) => g.id !== gridId)
    })

    const results = await deleteGrid({ data: { gridId } })

    if (!results.success) {
      console.error('Error deleting Grid: ', { cause: results })
      setGrids(() => oldGridsState)
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

    setCellsByGridId((prev) => {
      const newCellsByGridMap = new Map(prev)
      const gridCells = newCellsByGridMap.get(gridId)
      if (!gridCells || gridCells.length === 0) {
        console.error('no grid cells found')
        return prev
      }
      cellData.forEach(({ cellId }) => {
        newCellsByGridMap.set(
          gridId,
          gridCells.filter((c) => c.id !== cellId),
        )
      })
      return newCellsByGridMap
    })

    const deleteCellsResponse = await deleteManyCellsById({
      data: { gridOwnerId, gridId, cellIds },
    })

    return deleteCellsResponse
  }

  async function toggleCellComplete(gridId: string, cellId: string) {
    const oldCellsByGridId = new Map(cellsByGridId)
    const gridCells = oldCellsByGridId.get(gridId)
    const cellToUpdate = gridCells?.find((c) => c.id === cellId)
    if (!gridCells || !cellToUpdate) throw new Error('Grid or Cell not found')

    const completed = !!cellToUpdate.completedAt
    const updatedCell: Cell = {
      ...cellToUpdate,
      completedAt: completed ? null : new Date(),
      progress: !completed ? 100 : cellToUpdate.progress,
    }
    const updatedCells = gridCells.map((c) =>
      c.id === cellId ? updatedCell : c,
    )

    setCellsByGridId((prev) => {
      const newCellsByGridId = new Map(prev)
      newCellsByGridId.set(gridId, updatedCells)
      return newCellsByGridId
    })

    const response = await bulkUpsertCells({
      data: { ownerId: userId, gridId, cells: [updatedCell] },
    })

    if (response.success !== true) {
      setCellsByGridId(() => oldCellsByGridId)
    }

    return response
  }

  async function updateCellProgress(
    gridId: string,
    cellId: string,
    progress: number,
  ) {
    let updatedCell: Cell | undefined
    const newCellsByGridId = new Map(cellsByGridId)
    const cells = newCellsByGridId.get(gridId)
    const updatedCells = cells?.map((c) => {
      if (c.id !== cellId) return c
      updatedCell = {
        ...c,
        progress,
        completedAt: progress === 100 ? new Date() : null,
      }
      return updatedCell
    })
    if (!updatedCells || !updatedCell) throw new Error('Cell not found')
    newCellsByGridId.set(gridId, updatedCells)

    const oldCellsByGridId = new Map(cellsByGridId)
    setCellsByGridId(() => newCellsByGridId)

    const response = await bulkUpsertCells({
      data: { ownerId: userId, gridId, cells: [updatedCell] },
    })

    if (response.success !== true) {
      setCellsByGridId(() => oldCellsByGridId)
    }

    return response
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
    upsertGridCells,
    removeGridCells,
    toggleCellComplete,
    updateCellProgress,
  }
}
