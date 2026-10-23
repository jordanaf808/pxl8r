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

interface RemoveTimerDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveTimerDialog({
  isOpen,
  onCancel,
  onConfirm,
}: RemoveTimerDialogProps) {
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
            Remove this timer?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-serif text-(--journal-ink) opacity-75">
            The time it has run so far is lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-serif">Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="font-serif text-(--journal-paper)"
            style={{ backgroundColor: 'var(--journal-ink)' }}
          >
            Remove timer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
