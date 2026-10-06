import { useRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Cell, Grid, GridPixel, NewGridData, Pixel } from '@/db/types'
import { buildGridRows } from '@/lib/utils/grid'
import { FOCUS_RING } from '../cell-editor/styles'
import { GridSettingsForm } from '../grid-settings/GridSettingsForm'
import type { GridSettingsFormHandle } from '../grid-settings/GridSettingsForm'
import { NewGridForm } from '../grid-settings/NewGridForm'
import { useReturnFocus } from '../hooks/useReturnFocus'

interface GridLink {
  gridId: string
  pixelIds: string[]
}

interface CreateGridModalProps {
  userId: string
  /** The whole pixel library */
  pixels: Pixel[]
  /** Set for Grid settings. Left out, the modal makes a new grid */
  settings?: { grid: Grid; gridPixels: GridPixel[]; cells: Cell[] } | null
  /** Each rejects when its save fails */
  onCreate: (gridData: NewGridData) => Promise<void>
  onSaveGrid: (grid: Grid) => Promise<unknown>
  onAddPixels: (link: GridLink) => Promise<unknown>
  onRemovePixels: (link: GridLink) => Promise<unknown>
  onNewPixel: () => void
  onClose: () => void
}

export function CreateGridModal({
  userId,
  pixels,
  settings,
  onCreate,
  onSaveGrid,
  onAddPixels,
  onRemovePixels,
  onNewPixel,
  onClose,
}: CreateGridModalProps) {
  const settingsRef = useRef<GridSettingsFormHandle>(null)
  // Focus goes back to whatever opened the dialog: the tab bar's + or the
  // grid's options button
  const returnFocus = useReturnFocus()

  // Escape, a click outside, the close button and Done all come through here
  function requestClose() {
    settingsRef.current?.saveTypedFields()
    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) requestClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        {...returnFocus}
        className="block sm:max-w-125 max-h-[90vh] overflow-y-auto px-6 pt-6 pb-5.5 bg-(--journal-cream) text-(--journal-ink) border-2 border-(--journal-ink)"
        style={{
          borderRadius: '2px 8px 4px 12px',
          boxShadow: '2px 2px 0 var(--journal-warm)',
        }}
      >
        <div className="flex items-start gap-2.5 mb-4.5">
          <div className="flex-1 min-w-0">
            {/* The bare Radix parts: the ones in ui/dialog add their own text
                size and color */}
            <DialogPrimitive.Title asChild>
              <h2 className="text-[26px] font-bold leading-tight">
                {settings ? 'Grid settings' : 'New grid'}
              </h2>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <p className="text-[13px] font-serif opacity-70">
                {settings ? 'Update your pixel grid' : 'Bundle pixels together'}
              </p>
            </DialogPrimitive.Description>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className={`flex items-center justify-center shrink-0 w-8 h-8 -mt-0.5 -mr-1.5 rounded-sm cursor-pointer hover:bg-(--journal-tan) ${FOCUS_RING}`}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {settings ? (
          <GridSettingsForm
            ref={settingsRef}
            grid={settings.grid}
            rows={buildGridRows(settings.gridPixels, settings.cells)}
            pixels={pixels}
            onSaveGrid={onSaveGrid}
            onAddPixel={(pixelId) =>
              onAddPixels({ gridId: settings.grid.id, pixelIds: [pixelId] })
            }
            onRemovePixel={(pixelId) =>
              onRemovePixels({ gridId: settings.grid.id, pixelIds: [pixelId] })
            }
            onNewPixel={onNewPixel}
            onClose={requestClose}
          />
        ) : (
          <NewGridForm
            userId={userId}
            pixels={pixels}
            onCreate={onCreate}
            onNewPixel={onNewPixel}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
