import { useMemo, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import {
  createGrid as createGridServerFn,
  updateGrid as updateGridServerFn,
  updateCell as updateCellServerFn,
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
  NewGridData,
  GridsByPixelIdMap,
  UpdateCellInput,
} from '@/db/types'
import { buildGridsByPixelIdMap, flattenCellsByGridId } from '@/lib/utils/maps'

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
  const updateCell = useServerFn(updateCellServerFn)

  const [grids, setGrids] = useState<Grid[]>(initialGrids)
  const [cellsByGridId, setCellsByGridId] = useState(initialCellsByGridId)
  const [pixelsByGridId, setPixelsByGridId] = useState(initialPixelsByGridId)
  // The last cell save sent. The next one waits for it
  const lastCellSave = useRef<Promise<unknown>>(Promise.resolve())
  // The same for a write to a grid's own fields or to its rows
  const lastGridWrite = useRef<Promise<unknown>>(Promise.resolve())

  const allCells = useMemo(
    () => flattenCellsByGridId(cellsByGridId),
    [cellsByGridId],
  )

  const gridsByPixelId = useMemo<GridsByPixelIdMap>(
    () => buildGridsByPixelIdMap(pixelsByGridId, grids),
    [pixelsByGridId, grids],
  )

  // ---- Grid CRUD ----

  // Grid settings saves each change as it's made, so two writes can be out at
  // once, and requests sent close together can arrive in either order. Each
  // is sent only after the one before it has come back, failed or not
  function afterLastGridWrite<T>(send: () => Promise<T>): Promise<T> {
    const request = lastGridWrite.current.then(send)
    lastGridWrite.current = request.catch(() => undefined)
    return request
  }

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

    // In order: the server gives a new row the grid's highest position plus
    // one, so two adds read at the same moment would get the same position
    const results = await afterLastGridWrite(() =>
      bulkUpsertGridPixels({
        data: {
          ownerId: userId,
          gridId,
          pixelData: newPixels.map((p) => ({
            gridId,
            pixelId: p.id,
            sortOrder: 'manual',
          })),
        },
      }),
    )

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

  // Saves the grid's own fields. Its rows are saved by addGridPixels and
  // removeGridPixels
  async function updateGridHandler(grid: Grid): Promise<void> {
    // In order: updateGrid writes every field it's sent, so of two saves the
    // one that reaches the database last wins on all of them
    const updated = await afterLastGridWrite(() => updateGrid({ data: grid }))
    if (updated.success !== true)
      throw new Error('Error updating grid', { cause: updated.results })

    const savedGrid = updated.results[0]
    setGrids((prev) => prev.map((g) => (g.id === savedGrid.id ? savedGrid : g)))
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

    const removedRows = (pixelsByGridId.get(gridId) ?? []).filter((gp) =>
      pixelIds.includes(gp.pixel.id),
    )
    // The database deletes a row's cells with it. Drop them here too, or
    // allCells and the grid's header would keep counting them until a reload
    const removedCells = (cellsByGridId.get(gridId) ?? []).filter((c) =>
      pixelIds.includes(c.pixelId),
    )

    setPixelsByGridId((prev) =>
      new Map(prev).set(
        gridId,
        (prev.get(gridId) ?? []).filter(
          (gp) => !pixelIds.includes(gp.pixel.id),
        ),
      ),
    )
    setCellsByGridId((prev) =>
      new Map(prev).set(
        gridId,
        (prev.get(gridId) ?? []).filter((c) => !pixelIds.includes(c.pixelId)),
      ),
    )

    try {
      // In order: a removed pixel is back in the list to add at once. If its
      // add reached the server before this delete, the delete would then take
      // the new row
      return await afterLastGridWrite(() =>
        deleteGridPixels({ data: { gridId, pixelIds } }),
      )
    } catch (error) {
      // Only what was removed goes back, as in removeGridCells
      setPixelsByGridId((prev) =>
        new Map(prev).set(gridId, [
          ...(prev.get(gridId) ?? []),
          ...removedRows,
        ]),
      )
      setCellsByGridId((prev) =>
        new Map(prev).set(gridId, [
          ...(prev.get(gridId) ?? []),
          ...removedCells,
        ]),
      )
      throw error
    }
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

  // Resolves with the saved cell, or null when the cell no longer exists
  async function updateCellHandler(
    update: UpdateCellInput,
  ): Promise<Cell | null> {
    // updateCell writes every field of the cell, so of two saves the one that
    // reaches the database last wins on all of them, and requests sent close
    // together can arrive in either order. Each save is sent only after the
    // one before it has come back, failed or not
    const request = lastCellSave.current.then(() =>
      updateCell({ data: update }),
    )
    lastCellSave.current = request.catch(() => undefined)

    const { results } = await request
    const savedCell = results.at(0) ?? null

    // No row came back, so the cell was deleted after the editor loaded it
    setCellsByGridId((prev) => {
      const gridCells = prev.get(update.gridId) ?? []
      return new Map(prev).set(
        update.gridId,
        savedCell
          ? gridCells.map((c) => (c.id === savedCell.id ? savedCell : c))
          : gridCells.filter((c) => c.id !== update.id),
      )
    })

    return savedCell
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
    updateCellHandler,
  }
}
