import { useState } from 'react'
import { Plus, Timer } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PIXEL_COLORS } from '@/db/types'
import type { Cell, Pixel } from '@/db/types'
import { FOCUS_RING } from './cell-editor/styles'

// Centred in GridView's 64px slot, as in mockup 2b
const CELL_SIZE = 52

// As on the timer's buttons: a label at once would flash at every pointer
// that crosses the grid
const HOVER_LABEL_DELAY_MS = 700

interface FilledCellProps {
  cell: Cell
  pixel: Pixel
  /** The cell's place in its row, counted from 1 */
  column: number
  onEdit: () => void
}

export function FilledCell({ cell, pixel, column, onEdit }: FilledCellProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`${pixel.name}, column ${column}${cell.completedAt ? ', completed' : ''}`}
      className="relative overflow-hidden transition-all cursor-pointer hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--journal-ink)"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: PIXEL_COLORS[pixel.color].bg + 'ee',
        border: '1px solid var(--journal-warm)',
        borderRadius: '4px',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.20)',
      }}
      title={pixel.name}
    >
      {cell.timerStartedAt && (
        <Timer
          size={12}
          className="absolute top-0.5 right-0.5 text-(--journal-ink) opacity-70"
        />
      )}

      {cell.progress > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${cell.progress}%`,
              backgroundColor: 'rgba(255,255,255,0.45)',
              borderRadius: '0 1px 1px 0',
            }}
          />
        </div>
      )}
    </button>
  )
}

interface AddCellButtonProps {
  pixelName: string
  /** Settles once the new cell is in the grid, or the add has failed */
  onAdd: () => Promise<void>
}

// Faint at rest, so a phone, which has no hover, still shows it (#118)
export function AddCellButton({ pixelName, onAdd }: AddCellButtonProps) {
  const [isAdding, setIsAdding] = useState(false)

  async function add(): Promise<void> {
    setIsAdding(true)
    await onAdd()
    setIsAdding(false)
  }

  return (
    <Tooltip delayDuration={HOVER_LABEL_DELAY_MS}>
      <TooltipTrigger asChild>
        {/* aria-disabled, not disabled, while its add is out: the browser
            drops focus from a disabled button onto the page */}
        <button
          type="button"
          aria-label={`Add a cell to ${pixelName}`}
          aria-disabled={isAdding || undefined}
          onClick={isAdding ? undefined : add}
          className={`flex items-center justify-center border-[1.5px] border-dashed border-(--journal-ink)/60 text-(--journal-ink)/60 cursor-pointer hover:border-solid hover:border-(--journal-ink) hover:text-(--journal-ink) hover:bg-(--journal-paper) focus-visible:border-solid focus-visible:border-(--journal-ink) focus-visible:text-(--journal-ink) focus-visible:bg-(--journal-paper) aria-disabled:cursor-default aria-disabled:opacity-50 ${FOCUS_RING}`}
          style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: '4px' }}
        >
          <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="bg-(--journal-ink) text-(--journal-paper) text-xs font-semibold px-2 py-1"
      >
        Add cell
      </TooltipContent>
    </Tooltip>
  )
}
