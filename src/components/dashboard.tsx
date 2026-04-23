import { useEffect, useState } from 'react'
import { Plus, Search, Layers } from 'lucide-react'
import DashboardHeader from '@/components/dashboardHeader'
import { PixelCard } from '@/components/block-card'
import { GridCard } from '@/components/GridCard'
import { CreatePixelModal } from '@/components/create-block-modal'
import { CreateGridModal } from '@/components/CreateGridModal'
import { StatsBar } from '@/components/stats-bar'
import type {
  Pixel,
  NewPixel,
  NewUser,
  Grid,
  Page,
  NewCell,
  GridPixel,
  GridData,
  PixelTypeType,
  DashboardGridDataReturn,
  GridByGridIdMap,
  GridsByPixelIdMap,
  Cell,
  NewGridData,
} from '@/db/types'
import { PIXEL_TYPE_LABELS } from '@/db/types'
import {
  createPixel as createPixelServerFn,
  updatePixel as updatePixelServerFn,
  deletePixelById as deletePixelByIdServerFn,
  createGrid as createGridServerFn,
  updateGrid as updateGridServerFn,
  bulkUpsertCells as bulkUpsertCellsServerFn,
  bulkUpsertGridPixels as bulkUpsertGridPixelsServerFn,
  deleteGridPixels as deleteGridPixelsServerFn,
  deleteManyCellsById as deleteManyCellsByIdServerFn,
  deleteGridById as deleteGridByIdServerFn,
} from '@/db/mutations.functions'
import { useServerFn } from '@tanstack/react-start'

interface DashboardProps {
  user: NewUser
  userData: {
    pixels: Pixel[]
    grids: Grid[]
    pages: Page[]
    gridsData: DashboardGridDataReturn
  }
}

export function Dashboard({ user, userData }: DashboardProps) {
  const createPixel = useServerFn(createPixelServerFn)
  const updatePixel = useServerFn(updatePixelServerFn)
  const createGrid = useServerFn(createGridServerFn)
  const updateGrid = useServerFn(updateGridServerFn)
  const deleteGrid = useServerFn(deleteGridByIdServerFn)
  const bulkUpsertCells = useServerFn(bulkUpsertCellsServerFn)
  const bulkUpsertGridPixels = useServerFn(bulkUpsertGridPixelsServerFn)
  const deleteGridPixels = useServerFn(deleteGridPixelsServerFn)
  const deleteManyCellsById = useServerFn(deleteManyCellsByIdServerFn)
  const deletePixelById = useServerFn(deletePixelByIdServerFn)
  const [pixels, setPixels] = useState<Pixel[]>(userData.pixels)
  const [pixelsMap, setPixelsMap] = useState<Map<string, Pixel>>(new Map())
  // groups are grids
  const [grids, setGrids] = useState<Grid[]>(userData.grids)
  const [cellsByGridId, setCellsByGridId] = useState(
    userData.gridsData.cellsByGridId,
  )
  const [pixelsByGridId, setPixelsByGridId] = useState(
    userData.gridsData.pixelsByGridId,
  )
  const [ungroupedPixels, setUngroupedPixels] = useState(
    userData.gridsData.ungroupedPixels,
  )
  const [gridsByPixelId, setGridsByPixelId] = useState<GridsByPixelIdMap>(
    new Map(),
  )
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [selectedGrid, setSelectedGrid] = useState<GridData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PixelTypeType | 'all'>('all')
  const [allCells, setAllCells] = useState<Cell[]>([])

  useEffect(() => {
    const newAllCells: Cell[] = []
    cellsByGridId.forEach((cells) => allCells.push(...cells))
    setAllCells(newAllCells)
  }, [cellsByGridId])

  useEffect(() => {
    const newPixelsMap = new Map()
    pixels.forEach((p) => {
      newPixelsMap.get(p.id) ? null : newPixelsMap.set(p.id, p)
    })
    if (newPixelsMap.size > 0) setPixelsMap(newPixelsMap)
  }, [pixels])

  useEffect(() => {
    setGridsByPixelId((prev) => {
      const newGridsByPixelId = new Map(prev)
      pixelsByGridId.forEach((value, key) => {
        value.forEach((gp: GridPixel) => {
          // if Map of grids for pixelID exists and grid is not found in it add grid data to map.
          const existingGrids: GridByGridIdMap | undefined =
            newGridsByPixelId.get(gp.pixel.id)

          if (existingGrids && !existingGrids.get(gp.gridId)) {
            const gridData = grids.find((g) => g.id === gp.gridId)
            if (gridData) {
              existingGrids.set(gp.gridId, gridData)
              newGridsByPixelId.set(gp.pixel.id, existingGrids)
            } else {
              console.error('no grid with that ID found.')
            }
          } else {
            // create a new Map of grids for pixelID.
            const newGridMap = new Map()
            const gridData = grids.find((g) => g.id === gp.gridId)
            if (gridData) {
              newGridMap.set(gp.gridId, gridData)
              newGridsByPixelId.set(gp.pixel.id, newGridMap)
            }
          }
        })
      })
      return newGridsByPixelId
    })
  }, [pixelsByGridId, grids])

  // ---- Pixel CRUD ----
  async function createPixelHandler(pixelData: NewPixel) {
    // could maybe have some loading animation that shows building the pixel in, like 3 stages.
    const createdPixel = await createPixel({ data: pixelData })
    console.log('//// createPixel response: ', createdPixel)
    if (createdPixel.success !== true)
      throw new Error('Error creating pixel: ', { cause: createdPixel.results })

    setPixels((prev) => [...createdPixel.results, ...prev])
    setUngroupedPixels((prev) => [...createdPixel.results, ...prev])
    console.log('//// createPixel - pixels set')
  }

  async function deletePixel(pixelId: string) {
    // Capture old state BEFORE modifying
    const oldPixel = pixels.find((p) => p.id === pixelId)
    const oldPixelsByGridId = new Map(pixelsByGridId)

    if (!oldPixel) throw new Error('Pixel not found')

    // Update pixels state
    setPixels((prev) => prev.filter((p) => p.id !== pixelId))

    // Update pixelsByGridId state
    setPixelsByGridId((prev) => {
      const updated = new Map(prev)
      updated.forEach((value, key) => {
        const filtered = value.filter(
          (gridPixel) => gridPixel.pixel.id !== pixelId,
        )
        updated.set(key, filtered)
      })
      return updated
    })

    // Perform DB operation
    const response = await deletePixelById({ data: { pixelId } })

    if (response.success !== true) {
      console.log('//// ERROR - deletePixelById: ', response)
      // Rollback using captured state
      setPixels((prev) => [...prev, oldPixel])
      setPixelsByGridId(() => oldPixelsByGridId)
    }

    return response
  }

  // ---- Grid CRUD ----
  async function createGridHandler(gridData: NewGridData) {
    const gridOwnerId = user.id
    const { grid: newGrid, cells: cellsData, pixels: pixelsData } = gridData

    const createdGrid = await createGrid({ data: newGrid })

    console.log('//// createGrid response: ', createdGrid)
    if (createdGrid.success !== true)
      throw new Error('Error creating Grid: ', { cause: createdGrid.results })
    setGrids((prev) => [...createdGrid.results, ...prev])

    const [createdCells, createdGridPixels] = await Promise.all([
      bulkUpsertCells({
        data: {
          ownerId: gridOwnerId,
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

  async function updateGridHandler(gridData: GridData) {
    const gridId = gridData.grid.id

    // Update GridPixels
    const pixelData = gridData.pixels.map((p) => ({
      gridId,
      pixelId: p.id,
      sortOrder: 'alphabetic',
    }))

    const [updatedGrid, updatedGridCells, updatedGridPixels] =
      await Promise.all([
        updateGrid({ data: gridData.grid }),
        upsertGridCells({
          gridId,
          cellData: gridData.cells,
        }),
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
  }

  async function removeGrid(gridId: string) {
    const foundGrid = grids.find((g) => g.id === gridId)
    if (foundGrid?.ownerId !== user.id)
      throw new Error('Unauthorized or Grid not found.')
    let oldGridsState: Grid[]

    setGrids((prev) => {
      oldGridsState = prev
      return prev.filter((g) => g.id !== gridId)
    })

    const results = await deleteGrid({ data: { gridId } })

    if (!results.success) {
      console.error('Error deleting Grid: ', { cause: results })
      // revert grids state
      setGrids(() => oldGridsState)
    }
  }

  async function addGridPixels({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    // right now only the current user's grids are shown, but maybe there's a point where grids are shared...
    if (gridOwnerId !== user.id) throw new Error('You do not own this grid')
    const existingGridPixels = pixelsByGridId.get(gridId)

    // build new gridPixels array
    const newGridPixelsState: GridPixel[] = []
    const newGridPixelsDB: {
      gridId: string
      pixelId: string
      sortOrder: string
    }[] = []

    pixelIds.forEach((pixelId) => {
      // check pixel ownership
      const foundPixel = pixels.find(
        (p) => p.id === pixelId && p.ownerId === user.id,
      )
      if (!foundPixel) {
        console.warn('Pixel not found: ' + pixelId)
        return
      }

      // check if it does not exist already
      const foundGridPixel = existingGridPixels?.find(
        (gp) => gp.pixel.id === pixelId,
      )
      if (foundGridPixel) return

      // format data for state
      newGridPixelsState.push({
        gridId,
        pixel: foundPixel,
        sortOrder: 'manual',
      })
      // and for db
      newGridPixelsDB.push({
        gridId,
        pixelId: foundPixel.id,
        sortOrder: 'manual',
      })
    })

    // update gridData state with new cells and existingGridPixels
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
      data: {
        ownerId: user.id,
        gridId,
        pixelData: newGridPixelsDB,
      },
    })
    console.log(
      '//// addPixelsToGridCells - bulkUpsertGridPixels results: ',
      results,
    )

    return results
  }

  async function removeGridPixels({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    if (gridOwnerId !== user.id) throw new Error('You do not own this grid')
    let oldPixelsByGridId: Map<string, GridPixel[]>
    // const usersPixels = pixels.filter((p) => {
    //   if (pixelIds.includes(p.id)) {
    //     if (p.ownerId === user.id) return p
    //   }
    // })
    // if (usersPixels.length < 1) throw new Error('you dont own these pixels')

    // update gridData state without removed gridPixels
    setPixelsByGridId((prev) => {
      // use if operation goes wrong
      oldPixelsByGridId = new Map(prev)
      const newPixelsByGridId = new Map(prev)
      const oldGridPixels = oldPixelsByGridId.get(gridId)
      let filteredGridPixels: GridPixel[] = []
      if (!oldGridPixels) throw new Error('cant find GridPixels')

      filteredGridPixels = oldGridPixels.filter(
        (gp) => !pixelIds.includes(gp.pixel.id),
      )

      newPixelsByGridId.set(gridId, filteredGridPixels)

      return newPixelsByGridId
    })

    const results = await deleteGridPixels({
      data: {
        gridId,
        pixelIds,
      },
    })
    console.log('//// removeGridPixels - deleteGridPixels results: ', results)

    return results
  }

  async function upsertGridCells({
    gridId,
    cellData,
  }: {
    gridId: string
    cellData: NewCell[]
  }) {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    // right now only the current user's grids are shown, but maybe there's a point where grids are shared...
    if (gridOwnerId !== user.id) throw new Error('You do not own this grid')

    // update db
    const upsertCellsResponse = await bulkUpsertCells({
      data: {
        ownerId: gridOwnerId,
        gridId: gridId,
        cells: cellData,
      },
    })

    if (upsertCellsResponse.success !== true)
      throw new Error('Error upserting cells: ', {
        cause: upsertCellsResponse.results,
      })

    // Merge updated cells into state, replacing any existing cell at the same col+row position
    setCellsByGridId((oldCellsByGridId) => {
      const newCellsByGridMap = new Map(oldCellsByGridId)
      const existing = oldCellsByGridId.get(gridId) ?? []
      const updated = upsertCellsResponse.results
      const merged = [
        ...existing.filter(
          (c) => !updated.some((u) => u.col === c.col && u.row === c.row),
        ),
        ...updated,
      ]
      newCellsByGridMap.set(gridId, merged)
      return newCellsByGridMap
    })

    return upsertCellsResponse
  }

  const removeGridCells = async ({
    gridId,
    cellData,
  }: {
    gridId: string
    cellData: { cellId: string; pixelId: string }[]
  }) => {
    const cellIds = cellData.map((c) => c.cellId)
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    // right now only the current user's grids are shown, but maybe there's a point where grids are shared...
    if (gridOwnerId !== user.id) throw new Error('You do not own this grid')

    setCellsByGridId((prev) => {
      const newCellsByGridMap = new Map(prev)
      const gridCells = newCellsByGridMap.get(gridId)

      if (!gridCells || gridCells.length === 0) {
        console.error('no grid cells found')
        return prev
      }
      cellData.forEach(({ cellId }) => {
        // remove from cellsByGridId
        newCellsByGridMap.set(
          gridId,
          gridCells.filter((c) => c.id !== cellId),
        )
      })

      return newCellsByGridMap
    })

    // update db
    const deleteCellsResponse = await deleteManyCellsById({
      data: {
        gridOwnerId: gridOwnerId,
        gridId: gridId,
        cellIds: cellIds,
      },
    })

    console.log(
      '//// removeGridCells - deleteCellsResponse: ',
      deleteCellsResponse,
    )

    return deleteCellsResponse
  }

  const toggleCellComplete = async (gridId: string, cellId: string) => {
    // Capture the cell to update BEFORE setState
    const oldCellsByGridId = new Map(cellsByGridId)
    const gridCells = oldCellsByGridId.get(gridId)
    const cellToUpdate = gridCells?.find((c) => c.id === cellId)
    if (!gridCells || !cellToUpdate) throw new Error('Grid or Cell not found')

    console.log('//// is cell completed? ', !!cellToUpdate.completedAt)
    const completed = !!cellToUpdate.completedAt

    // Build update object outside of setState
    const updatedCell: Cell = {
      ...cellToUpdate,
      completedAt: completed ? null : new Date(),
      progress: !completed ? 100 : cellToUpdate.progress,
    }
    // const updatedCell: UpdateCellType = {
    //   completedAt: completed ? null : new Date(),
    //   progress: !completed ? 100 : cellToUpdate.progress,
    // }
    const updatedCells = gridCells.map((c) =>
      c.id === cellId ? updatedCell : c,
    )

    // Update state with computed values
    setCellsByGridId((prev) => {
      const newCellsByGridId = new Map(prev)
      newCellsByGridId.set(gridId, updatedCells)
      return newCellsByGridId
    })

    // Use captured data for DB update
    const response = await bulkUpsertCells({
      data: {
        ownerId: user.id,
        gridId,
        cells: [updatedCell],
      },
    })
    console.log('//// updateGridCells - response: ', response)

    if (response.success !== true) {
      // Rollback with the captured old cell
      setCellsByGridId(() => oldCellsByGridId)
    }

    return response
  }

  const updateCellProgress = async (
    gridId: string,
    cellId: string,
    progress: number,
  ) => {
    // Capture the Cell to update BEFORE setState
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

    // Update state with computed values
    const oldCellsByGridId = new Map(cellsByGridId)
    setCellsByGridId(() => newCellsByGridId)

    // Use captured data for DB update
    const response = await bulkUpsertCells({
      data: {
        ownerId: user.id,
        gridId: gridId,
        cells: [updatedCell],
      },
    })
    console.log('//// updateCellProgress- updatePixel - response: ', response)

    if (response.success !== true) {
      // Rollback with the captured old pixel
      setCellsByGridId(() => oldCellsByGridId)
    }

    return response
  }

  // ---- Derived data ----
  const filteredUngroupedPixels = ungroupedPixels.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || p.type === filterType
    return matchesSearch && matchesType
  })

  const filteredGrids = grids.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description
        ? g.description.toLowerCase().includes(searchTerm.toLowerCase())
        : '')

    // If type filter is active, show grid only if it contains a pixel of that type
    const gridPixels = pixelsByGridId.get(g.id)
    const matchesType =
      filterType === 'all' ||
      gridPixels?.some((gp) => {
        return gp.pixel.type === filterType
      })
    return matchesSearch && matchesType
  })

  const pixelTypes = Object.entries(PIXEL_TYPE_LABELS) as [
    PixelTypeType,
    string,
  ][]

  // For the grid modal: pixels available to add (ungrouped ones, or if editing, also already-in-grid ones)
  // All pixels should be available to add to a grid, there's no limit...
  // const pixelsAvailableForGridModal = selectedGrid?.grid.id
  //   ? pixelsByGridId
  //       .get(selectedGrid.grid.id)
  //       ?.filter((gp) => gp.gridId === selectedGrid.grid.id)
  //   : ungroupedPixels

  const gridNameMap = new Map(grids.map((g) => [g.id, g.name]))

  return (
    <div className="min-h-screen paper-dots">
      {/* Header */}
      {/* <DashboardHeader user={user} /> */}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--journal-ink)] leading-tight text-balance">
            {'Hey, '}
            {user.name}
          </h2>
          <p className="text-lg text-[var(--journal-ink)] opacity-50 font-serif mt-1">
            {"Here's what you're building toward..."}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsBar pixels={pixels} cells={allCells} gridCount={grids.length} />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div
              className="flex items-center gap-2 bg-[var(--journal-cream)] px-3 py-2 border-2 border-[var(--journal-warm)] focus-within:border-[var(--journal-ink)] transition-colors"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              <Search
                size={18}
                className="text-[var(--journal-ink)] opacity-40"
              />
              <input
                type="text"
                placeholder="Search pixels & grids..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-[var(--journal-ink)] text-lg placeholder:text-[var(--journal-warm)] outline-none w-40 md:w-56 font-sans"
              />
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm font-serif transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                    : 'bg-[var(--journal-cream)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                }`}
                style={{ borderRadius: '2px 6px 3px 7px' }}
              >
                All
              </button>
              {pixelTypes.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1 text-sm font-serif transition-all cursor-pointer ${
                    filterType === key
                      ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                      : 'bg-[var(--journal-cream)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                  }`}
                  style={{ borderRadius: '2px 6px 3px 7px' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedGrid(null)
                setIsGroupModalOpen(true)
              }}
              className="flex items-center gap-2 bg-[var(--journal-cream)] text-[var(--journal-ink)] px-4 py-2.5 text-lg font-serif hover:bg-[var(--journal-tan)] active:translate-y-px transition-all cursor-pointer"
              style={{
                borderRadius: '3px 8px 5px 10px',
                border: '2px dashed var(--journal-warm)',
              }}
            >
              <Layers size={18} />
              New Group
            </button>
            <button
              onClick={() => setIsPixelModalOpen(true)}
              className="flex items-center gap-2 bg-[var(--journal-ink)] text-[var(--journal-paper)] px-5 py-2.5 text-lg font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              <Plus size={20} />
              New Pixel
            </button>
          </div>
        </div>

        {/* Mixed Grid: grids + ungrouped pixels */}
        {filteredGrids.length > 0 || filteredUngroupedPixels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
            {/* Groups first */}
            {filteredGrids.map((grid) => {
              const gridPixels = pixelsByGridId.get(grid.id)
              const pixelsData = gridPixels?.map((gp) => gp.pixel) ?? []
              const cellsData = cellsByGridId.get(grid.id) ?? []
              return (
                <GridCard
                  key={grid.id}
                  grid={grid}
                  cellsData={cellsData}
                  pixels={pixelsData}
                  onEdit={(g) => {
                    setSelectedGrid({
                      grid: g,
                      pixels: pixelsData,
                      cells: cellsData,
                    })
                    setIsGroupModalOpen(true)
                  }}
                  onDelete={removeGrid}
                  onRemovePixel={removeGridPixels}
                />
              )
            })}

            {/* Ungrouped pixels */}
            {filteredUngroupedPixels.map((pixel) => {
              const gridData = gridsByPixelId.get(pixel.id)?.values()
              return (
                <PixelCard
                  key={pixel.id}
                  pixel={pixel}
                  currentGrids={gridData && Array.from(gridData)}
                  // onToggleComplete={toggleCellComplete}
                  // onUpdateProgress={updateCellProgress}
                  onDelete={deletePixel}
                  availableGrids={grids}
                  onMoveToGrid={addGridPixels}
                  // groupName={
                  //   pixel.groupId ? gridNameMap.get(pixel.groupId) : undefined
                  // }
                />
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              viewBox="0 0 80 80"
              width={80}
              height={80}
              className="text-[var(--journal-warm)] mb-4"
            >
              <rect
                x="10"
                y="10"
                width="60"
                height="60"
                rx="4"
                ry="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M30 40h20 M40 30v20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-2xl text-[var(--journal-ink)] opacity-40 font-sans text-center text-balance">
              {searchTerm || filterType !== 'all'
                ? 'No pixels or grids match your search'
                : 'Your journal is empty'}
            </p>
            <p className="text-base text-[var(--journal-ink)] opacity-30 font-serif mt-1 text-center">
              {searchTerm || filterType !== 'all'
                ? 'Try a different search or filter'
                : 'Add your first pixel to get started!'}
            </p>
          </div>
        )}

        {/* Bottom decoration */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--journal-ink)] opacity-30 font-serif">
            {'~ stack your pixels, build your dreams ~'}
          </p>
        </div>
      </main>

      {/* Create Pixel Modal */}
      <CreatePixelModal
        isOpen={isPixelModalOpen}
        onClose={() => setIsPixelModalOpen(false)}
        onSubmit={createPixelHandler}
      />

      {/* Create / Edit Group Modal */}
      <CreateGridModal
        key={selectedGrid?.grid.id ?? 'new'}
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false)
          setSelectedGrid(null)
        }}
        onSubmit={createGridHandler}
        pixels={pixels}
        gridData={selectedGrid}
        onUpdate={updateGridHandler}
      />
    </div>
  )
}
