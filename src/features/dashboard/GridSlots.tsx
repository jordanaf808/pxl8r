import { Timer } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Cell, Pixel } from '@/db/types'

// Centred in GridView's 64px slot, as in mockup 2b
const CELL_SIZE = 52

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
