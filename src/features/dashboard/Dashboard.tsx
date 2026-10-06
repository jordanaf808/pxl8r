import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreatePixelModal } from './modals/CreatePixelModal'
import { CreateGridModal } from './modals/CreateGridModal'
import { CellEditorModal } from './modals/CellEditorModal'
import { StatsBar } from './StatsBar'
import { GridTabs } from './GridTabs'
import { GridView } from './GridView'
import type { EditingCell } from './GridView'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { usePixelState } from '@/features/dashboard/hooks/usePixelState'
import { useGridState } from '@/features/dashboard/hooks/useGridState'
import { countLabel } from '@/lib/utils/format'
import { gridIdAfterDelete } from '@/lib/utils/grid'
import type {
  Pixel,
  NewUser,
  Grid,
  Page,
  NewGridData,
  DashboardGridDataReturn,
} from '@/db/types'

interface DashboardProps {
  user: NewUser
  userData: {
    pixels: Pixel[]
    grids: Grid[]
    pages: Page[]
    gridsData: DashboardGridDataReturn
  }
  /** The `?grid=` value the page loaded with */
  initialGridId: string | undefined
  /** Called on every tab change, so the route can copy it into `?grid=` */
  onActiveGridChange: (gridId: string | null) => void
}

export function Dashboard({
  user,
  userData,
  initialGridId,
  onActiveGridChange,
}: DashboardProps) {
  const { pixels, createPixelHandler } = usePixelState(
    userData.pixels,
    userData.gridsData.ungroupedPixels,
  )

  const {
    grids,
    cellsByGridId,
    pixelsByGridId,
    allCells,
    createGridHandler,
    updateGridHandler,
    removeGrid,
    addGridPixels,
    removeGridCells,
    updateCellHandler,
  } = useGridState(
    userData.grids,
    userData.gridsData.cellsByGridId,
    userData.gridsData.pixelsByGridId,
    pixels,
    user.id,
  )

  // React state picks the tab, and `?grid=` is a saved copy of it. Reading the
  // tab from the URL instead would make each click wait for a navigation.
  // An id that matches no grid (unknown or deleted) falls back to the first tab
  const [activeGridId, setActiveGridId] = useState<string | null>(
    () =>
      grids.find((g) => g.id === initialGridId)?.id ?? grids.at(0)?.id ?? null,
  )
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false)
  // 'settings' is always for the active grid: its options menu opens it
  const [gridModal, setGridModal] = useState<'new' | 'settings' | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const activeGrid = grids.find((g) => g.id === activeGridId)
  const activeGridPixels = pixelsByGridId.get(activeGridId ?? '') ?? []
  const activeCells = cellsByGridId.get(activeGridId ?? '') ?? []

  function selectGrid(gridId: string | null) {
    setActiveGridId(gridId)
    onActiveGridChange(gridId)
  }

  async function handleCreateGrid(gridData: NewGridData) {
    const gridId = await createGridHandler(gridData)
    selectGrid(gridId)
  }

  function handleDeleteGrid() {
    if (!activeGrid) return
    selectGrid(
      gridIdAfterDelete(
        grids.map((g) => g.id),
        activeGrid.id,
      ),
    )
    void removeGrid(activeGrid.id)
  }

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

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsPixelModalOpen(true)}
            className="flex items-center gap-2 bg-(--journal-ink) text-(--journal-paper) px-5 py-2.5 text-lg font-serif hover:bg-(--journal-ink)/90 active:translate-y-px transition-all cursor-pointer"
            style={{ borderRadius: '3px 8px 5px 10px' }}
          >
            <Plus size={20} />
            New Pixel
          </button>
        </div>

        <GridTabs
          grids={grids}
          activeGridId={activeGridId}
          onSelectGrid={selectGrid}
          onNewGrid={() => setGridModal('new')}
        >
          {/* The key mounts a new GridView per tab, so the row filter and the
              sideways scroll start fresh, and the new cell area is measured
              before it's painted */}
          {activeGrid && (
            <GridView
              key={activeGrid.id}
              grid={activeGrid}
              gridPixels={activeGridPixels}
              cells={activeCells}
              orientation="horizontal"
              onOpenSettings={() => setGridModal('settings')}
              onDeleteGrid={() => setIsDeleteDialogOpen(true)}
              onEditCell={setEditingCell}
            />
          )}
        </GridTabs>

        {grids.length === 0 && (
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
              Your journal is empty
            </p>
            <p className="text-base text-(--journal-ink) opacity-30 font-serif mt-1 text-center">
              Add your first grid with the + tab to get started!
            </p>
          </div>
        )}

        {/* Bottom decoration */}
        <div className="mt-12 text-center">
          <p className="text-sm text-(--journal-ink) opacity-30 font-serif">
            {'~ stack your pixels, build your dreams ~'}
          </p>
        </div>
      </main>

      {/* Create Pixel Modal */}
      <CreatePixelModal
        key={`new-${isPixelModalOpen}`}
        isOpen={isPixelModalOpen}
        onClose={() => setIsPixelModalOpen(false)}
        onSubmit={createPixelHandler}
      />

      {/* New grid, or Grid settings for the active grid. It gets the grid as
          it is now, not a copy from when it opened: each change is saved as
          it's made, and the lists show what the server sent back */}
      {gridModal !== null && (
        <CreateGridModal
          userId={user.id}
          pixels={pixels}
          settings={
            gridModal === 'settings' && activeGrid
              ? {
                  grid: activeGrid,
                  gridPixels: activeGridPixels,
                  cells: activeCells,
                }
              : null
          }
          onCreate={handleCreateGrid}
          onSaveGrid={updateGridHandler}
          onAddPixels={addGridPixels}
          onNewPixel={() => setIsPixelModalOpen(true)}
          onClose={() => setGridModal(null)}
        />
      )}

      {editingCell && activeGrid && (
        <CellEditorModal
          key={editingCell.cell.id}
          {...editingCell}
          gridName={activeGrid.name}
          onSave={updateCellHandler}
          onRemove={removeGridCells}
          onClose={() => setEditingCell(null)}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-(--journal-cream) text-(--journal-ink) border-2 border-(--journal-ink)">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              Delete “{activeGrid?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-serif text-(--journal-ink) opacity-70">
              This deletes the grid with its{' '}
              {countLabel(activeGridPixels.length, 'row')} and{' '}
              {countLabel(activeCells.length, 'cell')}. The pixels stay in your
              library. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGrid}
              className={`${buttonVariants({ variant: 'destructive' })} font-serif`}
            >
              Delete grid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
