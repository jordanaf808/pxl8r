import { useState } from 'react'
import { Plus, Search, Layers } from 'lucide-react'
import { PixelCard } from './PixelCard'
import { GridCard } from './GridCard'
import { CreatePixelModal } from './modals/CreatePixelModal'
import { CreateGridModal } from './modals/CreateGridModal'
import { StatsBar } from './StatsBar'
import { PixelSidebar } from './PixelSidebar'
import { usePixelState } from '@/features/dashboard/hooks/usePixelState'
import { useGridState } from '@/features/dashboard/hooks/useGridState'
import { useDashboardFilter } from '@/features/dashboard/hooks/useDashboardFilter'
import type {
  Pixel,
  NewUser,
  Grid,
  Page,
  GridPixel,
  GridData,
  PixelTypeType,
  DashboardGridDataReturn,
} from '@/db/types'
import { PIXEL_TYPE_LABELS } from '@/db/types'

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
  const {
    pixels,
    ungroupedPixels,
    setPixels,
    deletePixelFn,
    createPixelHandler,
    updatePixelHandler,
  } = usePixelState(userData.pixels, userData.gridsData.ungroupedPixels)

  const {
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
  } = useGridState(
    userData.grids,
    userData.gridsData.cellsByGridId,
    userData.gridsData.pixelsByGridId,
    pixels,
    user.id,
  )

  const { searchTerm, setSearchTerm, filterType, setFilterType, filteredUngroupedPixels, filteredGrids } =
    useDashboardFilter(ungroupedPixels, grids, pixelsByGridId)

  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [selectedGrid, setSelectedGrid] = useState<GridData | null>(null)
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null)

  // Composite handler: touches both pixel and grid state
  async function deletePixel(pixelId: string) {
    const oldPixel = pixels.find((p) => p.id === pixelId)
    const oldPixelsByGridId = new Map(pixelsByGridId)
    if (!oldPixel) throw new Error('Pixel not found')

    setPixels((prev) => prev.filter((p) => p.id !== pixelId))
    setPixelsByGridId((prev) => {
      const updated = new Map(prev)
      updated.forEach((value, key) => {
        updated.set(
          key,
          value.filter((gp: GridPixel) => gp.pixel.id !== pixelId),
        )
      })
      return updated
    })

    const response = await deletePixelFn({ data: { pixelId } })

    if (response.success !== true) {
      setPixels((prev) => [...prev, oldPixel])
      setPixelsByGridId(() => oldPixelsByGridId)
    }

    return response
  }

  const pixelTypes = Object.entries(PIXEL_TYPE_LABELS) as [PixelTypeType, string][]

  return (
    <div className="min-h-screen paper-dots">
      {/* <DashboardHeader user={user} /> */}

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Welcome — full width */}
        <div className="mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-(--journal-ink) leading-tight text-balance">
            {'Hey, '}
            {user.name}
          </h2>
          <p className="text-lg text-(--journal-ink) opacity-50 font-serif mt-1">
            {"Here's what you're building toward..."}
          </p>
        </div>

        {/* Stats — full width */}
        <div className="mb-8">
          <StatsBar pixels={pixels} cells={allCells} gridCount={grids.length} />
        </div>

        {/* Content row: sidebar left + grid right */}
        <div className="flex gap-6 items-start">
          {/* Pixel Sidebar */}
          <PixelSidebar
            pixels={pixels}
            onDeletePixel={deletePixel}
            onNewPixel={() => {
              setSelectedPixel(null)
              setIsPixelModalOpen(true)
            }}
            onSelectPixel={(pixel) => {
              setSelectedPixel(pixel)
              setIsPixelModalOpen(true)
            }}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div
                  className="flex items-center gap-2 bg-(--journal-cream) px-3 py-2 border-2 border-(--journal-warm) focus-within:border-(--journal-ink) transition-colors"
                  style={{ borderRadius: '3px 8px 5px 10px' }}
                >
                  <Search size={18} className="text-(--journal-ink) opacity-40" />
                  <input
                    type="text"
                    placeholder="Search pixels & grids..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent text-(--journal-ink) text-lg placeholder:text-(--journal-warm) outline-none w-40 md:w-48 font-sans"
                  />
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 text-sm font-serif transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-(--journal-ink) text-(--journal-paper)'
                        : 'bg-(--journal-cream) text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan)'
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
                          ? 'bg-(--journal-ink) text-(--journal-paper)'
                          : 'bg-(--journal-cream) text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan)'
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
                  className="flex items-center gap-2 bg-(--journal-cream) text-(--journal-ink) px-4 py-2.5 text-lg font-serif hover:bg-(--journal-tan) active:translate-y-px transition-all cursor-pointer"
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
                  className="flex items-center gap-2 bg-(--journal-ink) text-(--journal-paper) px-5 py-2.5 text-lg font-serif hover:bg-(--journal-ink)/90 active:translate-y-px transition-all cursor-pointer"
                  style={{ borderRadius: '3px 8px 5px 10px' }}
                >
                  <Plus size={20} />
                  New Pixel
                </button>
              </div>
            </div>

            {/* Mixed Grid: grids + ungrouped pixels */}
            {filteredGrids.length > 0 || filteredUngroupedPixels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-grid">
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

                {filteredUngroupedPixels.map((pixel) => {
                  const gridData = gridsByPixelId.get(pixel.id)?.values()
                  return (
                    <PixelCard
                      key={pixel.id}
                      pixel={pixel}
                      currentGrids={gridData && Array.from(gridData)}
                      onDelete={deletePixel}
                      availableGrids={grids}
                      onMoveToGrid={addGridPixels}
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
                  className="text-(--journal-warm) mb-4"
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
                <p className="text-2xl text-(--journal-ink) opacity-40 font-sans text-center text-balance">
                  {searchTerm || filterType !== 'all'
                    ? 'No pixels or grids match your search'
                    : 'Your journal is empty'}
                </p>
                <p className="text-base text-(--journal-ink) opacity-30 font-serif mt-1 text-center">
                  {searchTerm || filterType !== 'all'
                    ? 'Try a different search or filter'
                    : 'Add your first pixel to get started!'}
                </p>
              </div>
            )}

            {/* Bottom decoration */}
            <div className="mt-12 text-center">
              <p className="text-sm text-(--journal-ink) opacity-30 font-serif">
                {'~ stack your pixels, build your dreams ~'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Create / Edit Pixel Modal */}
      <CreatePixelModal
        key={selectedPixel?.id ?? 'new'}
        isOpen={isPixelModalOpen}
        onClose={() => {
          setIsPixelModalOpen(false)
          setSelectedPixel(null)
        }}
        onSubmit={createPixelHandler}
        pixelToEdit={selectedPixel ?? undefined}
        onUpdate={updatePixelHandler}
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
        userId={user.id}
        pixels={pixels}
        gridData={selectedGrid}
        onUpdate={updateGridHandler}
      />
    </div>
  )
}
