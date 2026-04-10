import { useState } from 'react'
import { Plus, Search, Layers } from 'lucide-react'
import { SketchyDivider } from '@/components/sketchy-elements'
import DashboardHeader from '@/components/dashboardHeader'
import { PixelCard } from '@/components/block-card'
import { GridCard } from '@/components/GridCard'
import { CreateBlockModal } from '@/components/create-block-modal'
import { CreateGridModal } from '@/components/create-group-modal'
import { StatsBar } from '@/components/stats-bar'
import type {
  Pixel,
  NewPixel,
  NewUser,
  Grid,
  Page,
  NewGrid,
  NewCell,
  GridPixel,
  PixelTypeType,
  UpdatePixelType,
  DashboardGridDataReturn,
} from '@/db/types'
import { PIXEL_TYPE_LABELS } from '@/db/types'
import {
  createPixel as createPixelServerFn,
  updatePixel as updatePixelServerFn,
  deletePixelById as deletePixelByIdServerFn,
  createGrid as createGridServerFn,
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
    gridData: DashboardGridDataReturn
  }
}

export function Dashboard({ user, userData }: DashboardProps) {
  const createPixel = useServerFn(createPixelServerFn)
  const updatePixel = useServerFn(updatePixelServerFn)
  const createGrid = useServerFn(createGridServerFn)
  const deleteGrid = useServerFn(deleteGridByIdServerFn)
  const bulkUpsertCells = useServerFn(bulkUpsertCellsServerFn)
  const bulkUpsertGridPixels = useServerFn(bulkUpsertGridPixelsServerFn)
  const deleteGridPixels = useServerFn(deleteGridPixelsServerFn)
  const deleteManyCellsById = useServerFn(deleteManyCellsByIdServerFn)
  const deletePixelById = useServerFn(deletePixelByIdServerFn)
  const [pixels, setPixels] = useState<Pixel[]>(userData.pixels)
  // groups are grids
  const [grids, setGrids] = useState<Grid[]>(userData.grids)
  const [cellsByGridId, setCellsByGridId] = useState(
    userData.gridData.cellsByGridId,
  )
  const [pixelsByGridId, setPixelsByGridId] = useState(
    userData.gridData.pixelsByGridId,
  )
  const [ungroupedPixels, setUngroupedPixels] = useState(
    userData.gridData.ungroupedPixels,
  )
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGrid, setEditingGrid] = useState<NewGrid | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PixelTypeType | 'all'>('all')

  // ---- Block CRUD ----
  const createPixelHandler = async (pixelData: NewPixel) => {
    // could maybe have some loading animation that shows building the pixel in, like 3 stages.
    const createdPixel = await createPixel({ data: pixelData })
    console.log('//// createPixel response: ', createdPixel)
    if (createdPixel.success !== true)
      throw new Error('Error creating pixel: ', { cause: createdPixel.results })

    setPixels((prev) => [...createdPixel.results, ...prev])
    console.log('//// createPixel - pixels set')
  }

  const toggleComplete = async (id: string) => {
    let oldPixel: Pixel | undefined
    let updatedPixel: UpdatePixelType | undefined

    // update state
    setPixels((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p

        console.log('//// is pixel completed? ', !!p.completedAt)
        const completed = !!p.completedAt
        // build db update object
        updatedPixel = {
          id: p.id,
          // toggle values
          completedAt: completed ? null : new Date(),
          progress: !completed ? 100 : p.progress,
        } as UpdatePixelType
        // backup
        oldPixel = p

        // return pixel state
        return {
          ...p,
          completedAt: completed ? null : new Date(),
          progress: !completed ? 100 : p.progress,
        }
      }),
    )

    if (updatedPixel) {
      // update db
      const response = await updatePixel({ data: updatedPixel })
      console.log('//// updatePixel - response: ', response)

      // undo state changes if update is unsuccessful
      if (response.success === true) return response

      // return oldPixel (only specific changes) because prev state is probably the state changes we just did above.
      if (oldPixel) {
        setPixels((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p
            return {
              ...p,
              completedAt: oldPixel!.completedAt,
              progress: oldPixel!.progress,
            }
          }),
        )
      }
    }
  }

  const updateProgress = async (id: string, progress: number) => {
    let oldPixel: Pixel | undefined
    let updatedPixel: UpdatePixelType | undefined

    // update state
    setPixels((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p

        oldPixel = p
        updatedPixel = {
          id: p.id,
          progress,
          completedAt: progress === 100 ? new Date() : null,
        } as UpdatePixelType

        return {
          ...p,
          progress,
          completedAt: progress === 100 ? new Date() : null,
        }
      }),
    )

    if (updatedPixel) {
      // update db
      const response = await updatePixel({ data: updatedPixel })
      console.log('//// updateProgress- updatePixel - response: ', response)

      if (response.success === true) return response

      // undo state changes if update is unsuccessful
      setPixels((prev) =>
        prev.map((p) => {
          if (p.id === id) return p

          if (oldPixel)
            return {
              ...p,
              completed: oldPixel.completedAt,
              progress: oldPixel.progress,
              // completedAt: !p.completedAt ? new Date().toISOString() : undefined,
            }

          return {
            ...p,
            completed: !p.completedAt,
            progress: !p.completedAt ? 100 : p.progress,
            // completedAt: !p.completedAt ? new Date().toISOString() : undefined,
          }
        }),
      )
    }
  }

  const deletePixel = async (pixelId: string) => {
    let oldPixel: Pixel | undefined
    let oldPixelsByGridId: Map<string, GridPixel[]> | undefined

    // remove from pixels state
    setPixels((prev) => {
      oldPixel = prev.find((p) => p.id === pixelId)
      return prev.filter((p) => p.id !== pixelId)
    })

    // remove from pixelsByGridId state
    setPixelsByGridId((prev) => {
      oldPixelsByGridId = new Map(prev)
      const updatedPixelsByGridId = new Map(prev)

      updatedPixelsByGridId.forEach((value, key, map) => {
        const updatedGridPixels: GridPixel[] = value.filter(
          (gridPixel) => gridPixel.pixel.id !== pixelId,
        )
        map.set(key, updatedGridPixels)
      })

      return updatedPixelsByGridId
    })

    const response = await deletePixelById({ data: { pixelId } })
    if (response.success === true) return response

    console.log('//// ERROR - deletePixelById: ', response)

    // undo state changes if update is unsuccessful
    if (!oldPixel) throw new Error("Can't find oldPixel to put back...")
    setPixels((prev) => [...prev, oldPixel!])
    if (!oldPixelsByGridId)
      throw new Error("Can't find oldGridData to put back...")
    setPixelsByGridId(() => oldPixelsByGridId!)
  }

  // ---- Grid CRUD ----
  // const addGroup = (groupData: Omit<BlockGroup, 'id' | 'createdAt'>) => {
  //   const newGroup: BlockGroup = {
  //     ...groupData,
  //     id: 'g' + Date.now().toString(),
  //     createdAt: new Date().toISOString(),
  //   }
  //   setGrids((prev) => [newGroup, ...prev])
  //   // Mark pixels as belonging to this grid
  //   setPixels((prev) =>
  //     prev.map((p) =>
  //       groupData.pixelIds.includes(p.id) ? { ...p, groupId: newGroup.id } : p,
  //     ),
  //   )
  // }

  const createGridHandler = async (newGrid: NewGrid) => {
    const createdGrid = await createGrid({ data: newGrid })
    console.log('//// createPixel response: ', createdGrid)
    if (createdGrid.success !== true)
      throw new Error('Error creating pixel: ', { cause: createdGrid.results })
    // const newPixel: NewPixel = {
    //   ...pixelData,
    // }

    setGrids((prev) => [...createdGrid.results, ...prev])
  }

  // const updateGrid = (updated: BlockGroup) => {
  //   const oldGroup = grids.find((g) => g.id === updated.id)
  //   setGrids((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))

  //   // Unassign pixels that were removed
  //   const removedIds = (oldGroup?.pixelIds ?? []).filter(
  //     (id) => !updated.pixelIds.includes(id),
  //   )
  //   // Assign pixels that were added
  //   setPixels((prev) =>
  //     prev.map((p) => {
  //       if (updated.pixelIds.includes(p.id))
  //         return { ...p, groupId: updated.id }
  //       if (removedIds.includes(p.id)) return { ...p, groupId: undefined }
  //       return p
  //     }),
  //   )
  // }

  const removeGrid = async (gridId: string) => {
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

  // const deleteGroup = (groupId: string) => {
  //   const grid = grids.find((g) => g.id === groupId)
  //   setGrids((prev) => prev.filter((g) => g.id !== groupId))
  //   // Unassign pixels
  //   if (grid) {
  //     setPixels((prev) =>
  //       prev.map((p) =>
  //         grid.pixelIds.includes(p.id) ? { ...p, groupId: undefined } : p,
  //       ),
  //     )
  //   }
  // }

  const addPixelsToGridPixels = async ({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) => {
    const gridOwnerId = grids.find((g) => g.id === gridId)?.ownerId
    // right now only the current user's grids are shown, but maybe there's a point where grids are shared...
    if (gridOwnerId !== user.id) throw new Error('You do not own this grid')

    // build new gridPixels array
    const gridPixels = pixelsByGridId.get(gridId)
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
        console.log('Pixel not found: ' + pixelId)
        return false
      }

      // check if it does not exist already
      const foundGridPixel = gridPixels?.find((p) => p.pixel.id === pixelId)
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

    // update gridData state with new cells and gridPixels
    setPixelsByGridId((oldPixelsByGridId) => {
      const newPixelsByGridId = new Map(oldPixelsByGridId)

      if (newGridPixelsState.length > 0) {
        newPixelsByGridId.set(gridId, [
          ...(gridPixels ?? []),
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

  const removeGridPixels = async ({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) => {
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

      pixelIds.forEach((pixelId) => {
        filteredGridPixels = oldGridPixels.filter(
          (gp) => gp.pixel.id !== pixelId && gp.gridId === gridId,
        )
      })

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

  const updateGridCells = async ({
    gridId,
    cellData,
  }: {
    gridId: string
    cellData: NewCell[]
  }) => {
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

    // update gridData state with new cells and gridPixels
    setCellsByGridId((oldCellsByGridId) => {
      const newCellsByGridMap = new Map(oldCellsByGridId)

      newCellsByGridMap.set(gridId, [
        ...(oldCellsByGridId.get(gridId) ?? []),
        ...upsertCellsResponse.results,
      ])

      return newCellsByGridMap
    })

    return upsertCellsResponse
  }

  // const moveBlockToGroup = (blockId: string, groupId: string | null) => {
  //   // Remove from old grid
  //   setGrids((prev) =>
  //     prev.map((g) => ({
  //       ...g,
  //       pixelIds: g.pixelIds.filter((id) => id !== blockId),
  //     })),
  //   )
  //   if (groupId) {
  //     // Add to new grid
  //     setGrids((prev) =>
  //       prev.map((g) =>
  //         g.id === groupId ? { ...g, pixelIds: [...g.pixelIds, blockId] } : g,
  //       ),
  //     )
  //   }
  //   setPixels((prev) =>
  //     prev.map((p) =>
  //       p.id === blockId ? { ...p, groupId: groupId ?? undefined } : p,
  //     ),
  //   )
  // }

  // const removeBlockFromGroup = (blockId: string, groupId: string) => {
  //   moveBlockToGroup(blockId, null)
  // }

  const removeCellsFromGrid = async ({
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
      const gridCells = prev.get(gridId)

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

      return {
        ...prev,
        cellsByGridId: newCellsByGridMap,
      }
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
      '//// removeCellsFromGrid - deleteCellsResponse: ',
      deleteCellsResponse,
    )

    return deleteCellsResponse
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
    const gridPixels = pixelsByGridId.get(g.id)
    if (!gridPixels || gridPixels.length < 1) {
      console.error('No gridPixels found')
      return false
    }
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.description
        ? g.description.toLowerCase().includes(searchTerm.toLowerCase())
        : '')

    // If type filter is active, show grid only if it contains a pixel of that type
    const matchesType =
      filterType === 'all' ||
      gridPixels.some((gp) => {
        return gp.pixel.type === filterType
      })
    return matchesSearch && matchesType
  })

  const blockTypes = Object.entries(PIXEL_TYPE_LABELS) as [
    PixelTypeType,
    string,
  ][]

  // For the grid modal: pixels available to add (ungrouped ones, or if editing, also already-in-grid ones)
  const pixelsAvailableForGridModal = editingGrid?.id
    ? pixelsByGridId
        .get(editingGrid.id)
        ?.filter((gp) => gp.gridId === editingGrid.id)
    : ungroupedPixels

  const gridNameMap = new Map(grids.map((g) => [g.id, g.name]))

  return (
    <div className="min-h-screen paper-dots">
      {/* Header */}
      <DashboardHeader user={user} />

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
          <StatsBar blocks={pixels} groupCount={grids.length} />
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
              {blockTypes.map(([key, label]) => (
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
                setEditingGrid(null)
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
              onClick={() => setIsBlockModalOpen(true)}
              className="flex items-center gap-2 bg-[var(--journal-ink)] text-[var(--journal-paper)] px-5 py-2.5 text-lg font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              <Plus size={20} />
              New Block
            </button>
          </div>
        </div>

        <SketchyDivider className="text-[var(--journal-warm)] mb-6" />

        {/* Mixed Grid: grids + ungrouped pixels */}
        {filteredGrids.length > 0 || filteredUngroupedPixels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
            {/* Groups first */}
            {filteredGrids.map((grid) => {
              const gridPixels = pixelsByGridId.get(grid.id)
              const pixels = gridPixels?.map((gp) => gp.pixel)
              return (
                <GridCard
                  key={grid.id}
                  grid={grid}
                  pixels={pixels || []}
                  onEdit={(g) => {
                    setEditingGrid(g)
                    setIsGroupModalOpen(true)
                  }}
                  onDelete={removeGrid}
                  onRemovePixel={removeGridPixels}
                />
              )
            })}

            {/* Ungrouped pixels */}
            {filteredUngroupedPixels.map((pixel) => (
              <PixelCard
                key={pixel.id}
                pixel={pixel}
                currentGrids={grids.filter((gp) => gp.pixelId === pixel.id)}
                onToggleComplete={toggleComplete}
                onUpdateProgress={updateProgress}
                onDelete={deletePixel}
                availableGrids={grids}
                onMoveToGrid={addPixelsToGridPixels}
                // groupName={
                //   pixel.groupId ? gridNameMap.get(pixel.groupId) : undefined
                // }
              />
            ))}
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
          <SketchyDivider className="text-[var(--journal-warm)] mb-3" />
          <p className="text-sm text-[var(--journal-ink)] opacity-30 font-serif">
            {'~ stack your pixels, build your dreams ~'}
          </p>
        </div>
      </main>

      {/* Create Block Modal */}
      <CreateBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSubmit={createPixelHandler}
      />

      {/* Create / Edit Group Modal */}
      <CreateGridModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false)
          setEditingGrid(null)
        }}
        onSubmit={createGridHandler}
        ungroupedBlocks={pixelsAvailableForGridModal}
        editGroup={editingGrid}
        onUpdate={updateGrid}
      />
    </div>
  )
}
