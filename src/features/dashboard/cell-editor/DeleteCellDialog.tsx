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
import { useReturnFocus } from '../hooks/useReturnFocus'
import { DANGER_COLOR } from './styles'

interface DeleteCellDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteCellDialog({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteCellDialogProps) {
  const returnFocus = useReturnFocus()

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent
        {...returnFocus}
        className="sm:max-w-sm bg-(--journal-cream) text-(--journal-ink) border-2 border-(--journal-ink)"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Delete this cell?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-serif text-(--journal-ink) opacity-75">
            Its note and timer go with it. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="font-serif text-(--journal-paper)"
            style={{ backgroundColor: DANGER_COLOR }}
          >
            Delete cell
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
