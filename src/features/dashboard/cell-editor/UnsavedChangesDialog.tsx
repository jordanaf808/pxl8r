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

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onKeepEditing: () => void
  /** Does what the editor's Cancel button does */
  onDiscard: () => void
  onSave: () => void
}

export function UnsavedChangesDialog({
  isOpen,
  onKeepEditing,
  onDiscard,
  onSave,
}: UnsavedChangesDialogProps) {
  const returnFocus = useReturnFocus()

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onKeepEditing()
      }}
    >
      <AlertDialogContent
        {...returnFocus}
        className="sm:max-w-sm bg-(--journal-cream) text-(--journal-ink) border-2 border-(--journal-ink)"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            Save your changes?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-serif text-(--journal-ink) opacity-75">
            You edited this cell and haven’t saved yet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-serif border-transparent bg-transparent shadow-none">
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="font-serif border bg-transparent hover:bg-transparent"
            style={{ color: DANGER_COLOR, borderColor: DANGER_COLOR }}
          >
            Discard
          </AlertDialogAction>
          <AlertDialogAction onClick={onSave} className="font-serif">
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
