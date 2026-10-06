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
import { DANGER_COLOR } from '../cell-editor/styles'

function cellsSentence(cellCount: number): string {
  if (cellCount === 0) return 'It has no cells yet.'
  if (cellCount === 1) return 'Its 1 cell is deleted with it.'
  return `Its ${cellCount} cells are deleted with it.`
}

interface RemoveRowDialogProps {
  isOpen: boolean
  pixelName: string
  cellCount: number
  onCancel: () => void
  onConfirm: () => void
  /** Called once the dialog has closed, either way. The host places focus */
  onClosed: () => void
}

export function RemoveRowDialog({
  isOpen,
  pixelName,
  cellCount,
  onCancel,
  onConfirm,
  onClosed,
}: RemoveRowDialogProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent
        // Radix would send focus to a Trigger, and this dialog has none
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onClosed()
        }}
        className="sm:max-w-sm bg-(--journal-cream) text-(--journal-ink) border-2 border-(--journal-ink)"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Remove “{pixelName}” from this grid?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-serif text-(--journal-ink) opacity-75">
            {cellsSentence(cellCount)} The pixel stays in your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="font-serif text-(--journal-paper)"
            style={{ backgroundColor: DANGER_COLOR }}
          >
            Remove row
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
