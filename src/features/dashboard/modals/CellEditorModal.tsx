import { useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Cell, UpdateCellInput } from '@/db/types'
import { CellEditor } from '../CellEditor'
import type { CellEditorHandle } from '../CellEditor'
import type { EditingCell } from '../GridView'

interface CellEditorModalProps extends EditingCell {
  gridName: string
  /** Resolves with the saved cell, or null when the cell no longer exists */
  onSave: (update: UpdateCellInput) => Promise<Cell | null>
  onRemove: (removal: {
    gridId: string
    cellData: { cellId: string; pixelId: string }[]
  }) => Promise<unknown>
  onClose: () => void
}

export function CellEditorModal({
  cell,
  pixel,
  column,
  gridName,
  onSave,
  onRemove,
  onClose,
}: CellEditorModalProps) {
  const editorRef = useRef<CellEditorHandle>(null)

  return (
    // Escape, a click outside and the close button all ask the dialog to
    // close. The editor gets the last word, so an unsaved edit isn't lost
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) editorRef.current?.requestClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="block sm:max-w-110 max-h-[90vh] overflow-y-auto px-6 pt-5.5 pb-5 bg-(--journal-cream) border-2 border-(--journal-ink)"
        style={{
          borderRadius: '2px 8px 4px 12px',
          boxShadow: '2px 2px 0 var(--journal-warm)',
        }}
      >
        {/* The editor shows the pixel's name as its own heading, so this one
            is only for the dialog's accessible name */}
        <DialogTitle className="sr-only">Edit cell: {pixel.name}</DialogTitle>
        <CellEditor
          ref={editorRef}
          cell={cell}
          pixel={pixel}
          gridName={gridName}
          column={column}
          onSave={(fields) =>
            onSave({ id: cell.id, gridId: cell.gridId, ...fields })
          }
          onRemove={() =>
            onRemove({
              gridId: cell.gridId,
              cellData: [{ cellId: cell.id, pixelId: cell.pixelId }],
            })
          }
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
