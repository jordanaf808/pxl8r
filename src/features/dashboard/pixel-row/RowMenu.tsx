import type { Ref } from 'react'
import { Ellipsis } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FOCUS_RING } from '../cell-editor/styles'

interface RowMenuProps {
  onEditPixel: () => void
  onDeleteRow: () => void
  /** Takes focus back when the Delete row popup is cancelled */
  triggerRef: Ref<HTMLButtonElement>
}

// Horizontal, unlike the grid's options (#54). The line splits what changes
// the pixel in every grid from what changes this grid only
export function RowMenu({
  onEditPixel,
  onDeleteRow,
  triggerRef,
}: RowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        ref={triggerRef}
        aria-label="Row options"
        className={`flex items-center justify-center shrink-0 w-8 h-8 -mt-0.5 rounded-sm cursor-pointer hover:bg-(--journal-tan) data-[state=open]:bg-(--journal-tan) ${FOCUS_RING}`}
      >
        <Ellipsis size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-(--journal-cream) text-(--journal-ink) border-(--journal-warm) font-serif"
      >
        <DropdownMenuItem onSelect={onEditPixel}>Edit pixel…</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-(--journal-warm)" />
        <DropdownMenuItem variant="destructive" onSelect={onDeleteRow}>
          Delete row…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
