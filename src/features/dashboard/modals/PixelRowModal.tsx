import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PIXEL_UNIT_LABELS } from '@/db/types'
import type {
  Cell,
  CreateCellInput,
  UpdateCellInput,
  UpdatePixelType,
} from '@/db/types'
import type { GridRow } from '@/lib/utils/grid'
import { CellEditor } from '../CellEditor'
import type { CellEditorHandle } from '../CellEditor'
import { DANGER_COLOR, FOCUS_RING } from '../cell-editor/styles'
import { RemoveRowDialog } from '../grid-settings/RemoveRowDialog'
import { PixelHeader } from '../PixelHeader'
import { RowMenu } from '../pixel-row/RowMenu'
import { RowStats } from '../pixel-row/RowStats'
import { CreatePixelModal } from './CreatePixelModal'

interface PixelRowModalProps {
  /** The row as it is now, so the stats follow each save */
  row: GridRow
  /** The row's place in the grid, counted from 1 */
  rowNumber: number
  gridName: string
  /** Resolves with the new cell once it's in the row */
  onCreateCell: (input: CreateCellInput) => Promise<Cell>
  /** Resolves with the saved cell, or null when the cell no longer exists */
  onSaveCell: (update: UpdateCellInput) => Promise<Cell | null>
  onRemoveCell: (removal: {
    gridId: string
    cellData: { cellId: string; pixelId: string }[]
  }) => Promise<unknown>
  onUpdatePixel: (pixel: UpdatePixelType) => Promise<void>
  /** Takes the row out of the grid. The host closes the modal */
  onDeleteRow: () => void
  onClose: () => void
  /** Called once the modal has closed. The host places focus */
  onClosed: () => void
}

export function PixelRowModal({
  row,
  rowNumber,
  gridName,
  onCreateCell,
  onSaveCell,
  onRemoveCell,
  onUpdatePixel,
  onDeleteRow,
  onClose,
  onClosed,
}: PixelRowModalProps) {
  const { pixel } = row
  // The cell Add cell made. The editor shows on it until the modal closes
  const [newCell, setNewCell] = useState<Cell | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addFailed, setAddFailed] = useState(false)
  const [isEditingPixel, setIsEditingPixel] = useState(false)
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false)
  const editorRef = useRef<CellEditorHandle>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // With the editor open, closing could lose an edit, so the editor decides
  function requestClose() {
    if (editorRef.current) editorRef.current.requestClose()
    else onClose()
  }

  // The cell is saved before the editor opens on it: the editor's timer saves
  // at once, and a save needs the id the server makes (#117)
  async function addCell(): Promise<void> {
    setIsAdding(true)
    setAddFailed(false)
    try {
      setNewCell(await onCreateCell({ gridId: row.gridId, pixelId: pixel.id }))
    } catch (error) {
      console.error('Error adding a cell', error)
      setAddFailed(true)
    }
    setIsAdding(false)
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
        aria-describedby={undefined}
        // Radix would send focus to a Trigger, and this dialog has none
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onClosed()
        }}
        className="block sm:max-w-110 max-h-[90vh] overflow-y-auto px-6 pt-5.5 pb-5 bg-(--journal-cream) border-2 border-(--journal-ink)"
        style={{
          borderRadius: '2px 8px 4px 12px',
          boxShadow: '2px 2px 0 var(--journal-warm)',
        }}
      >
        {/* The header shows the pixel's name as its own heading. This is only
            the dialog's accessible name, so it isn't a second heading */}
        <DialogTitle asChild>
          <span className="sr-only">Row: {pixel.name}</span>
        </DialogTitle>
        <div className="flex flex-col gap-4.5 min-w-0 text-(--journal-ink)">
          <PixelHeader
            pixel={pixel}
            subtitle={`${gridName} · row ${rowNumber}`}
            onClose={requestClose}
            actions={
              <RowMenu
                triggerRef={menuButtonRef}
                onEditPixel={() => setIsEditingPixel(true)}
                onDeleteRow={() => setIsDeleteWarningOpen(true)}
              />
            }
          />

          {(pixel.description || pixel.endGoal !== null) && (
            <div className="flex flex-col gap-1 -mt-1 font-serif">
              {pixel.description && (
                <p className="text-sm leading-snug opacity-75">
                  {pixel.description}
                </p>
              )}
              {pixel.endGoal !== null && (
                <p className="text-[13px] opacity-75">
                  Goal: {pixel.endGoal}{' '}
                  {PIXEL_UNIT_LABELS[pixel.unit].toLowerCase()}
                </p>
              )}
            </div>
          )}

          <RowStats cells={row.cells} />

          {newCell ? (
            // Save, Cancel and Delete cell close the whole modal (#123).
            // Cancel keeps the new cell, blank (#117)
            <div className="pt-4 border-t border-(--journal-tan)">
              <CellEditor
                ref={editorRef}
                cell={newCell}
                pixel={pixel}
                gridName={gridName}
                column={row.cells.findIndex((c) => c.id === newCell.id) + 1}
                inline
                onSave={(fields) =>
                  onSaveCell({
                    id: newCell.id,
                    gridId: newCell.gridId,
                    ...fields,
                  })
                }
                onRemove={() =>
                  onRemoveCell({
                    gridId: newCell.gridId,
                    cellData: [
                      { cellId: newCell.id, pixelId: newCell.pixelId },
                    ],
                  })
                }
                onClose={onClose}
              />
            </div>
          ) : (
            <>
              {/* aria-disabled, not disabled, while the add is out: the
                  browser drops focus from a disabled button onto the page */}
              <button
                type="button"
                aria-disabled={isAdding || undefined}
                onClick={isAdding ? undefined : addCell}
                className={`flex items-center justify-center gap-1.5 w-full h-12 text-[15px] font-semibold border-[1.5px] border-dashed border-(--journal-ink)/60 cursor-pointer hover:bg-(--journal-paper) aria-disabled:cursor-default aria-disabled:opacity-50 ${FOCUS_RING}`}
                style={{ borderRadius: '2px 6px 3px 7px' }}
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                Add cell
              </button>
              {addFailed && (
                <p
                  role="alert"
                  className="-mt-2 text-sm font-serif"
                  style={{ color: DANGER_COLOR }}
                >
                  The cell couldn’t be added. Try again.
                </p>
              )}
            </>
          )}
        </div>

        {/* A Radix dialog too, so it stacks on this one. It changes the pixel
            in every grid that has it */}
        {isEditingPixel && (
          <CreatePixelModal
            isOpen
            pixelToEdit={pixel}
            onUpdate={onUpdatePixel}
            // Only used for a new pixel
            onSubmit={() => {}}
            onClose={() => setIsEditingPixel(false)}
          />
        )}

        {/* The same warning as Grid settings' (#125) */}
        <RemoveRowDialog
          isOpen={isDeleteWarningOpen}
          pixelName={pixel.name}
          cellCount={row.cells.length}
          onCancel={() => setIsDeleteWarningOpen(false)}
          onConfirm={onDeleteRow}
          // After Cancel, back to the ⋯ button. After Delete row the modal
          // has gone with the button, and GridView places focus
          onClosed={() => menuButtonRef.current?.focus()}
        />
      </DialogContent>
    </Dialog>
  )
}
