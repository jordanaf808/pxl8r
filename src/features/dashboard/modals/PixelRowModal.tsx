import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PIXEL_UNIT_LABELS } from '@/db/types'
import type { GridRow } from '@/lib/utils/grid'
import { PixelHeader } from '../PixelHeader'
import { RowStats } from '../pixel-row/RowStats'

interface PixelRowModalProps {
  /** The row as it is now, so the stats follow each save */
  row: GridRow
  /** The row's place in the grid, counted from 1 */
  rowNumber: number
  gridName: string
  onClose: () => void
  /** Called once the modal has closed. The host places focus */
  onClosed: () => void
}

export function PixelRowModal({
  row,
  rowNumber,
  gridName,
  onClose,
  onClosed,
}: PixelRowModalProps) {
  const { pixel } = row

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
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
            onClose={onClose}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
