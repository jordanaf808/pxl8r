import type { Cell, Pixel } from '@/db/types'
import { PIXEL_COLORS } from '@/db/types'

interface PixelGridProps {
  cells: Map<string, Cell>
  columns: number
  rows: number
  pixels: Pixel[]
  selectedCell: { col: number; row: number } | null
  onCellClick: (col: number, row: number) => void
}

export function PixelGrid({
  cells,
  columns,
  rows,
  pixels,
  selectedCell,
  onCellClick,
}: PixelGridProps) {
  return (
    <div
      className="grid gap-0.5 p-2 bg-(--journal-paper)"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        border: '1.5px solid var(--journal-warm)',
        borderRadius: '3px 8px 5px 10px',
      }}
    >
      {Array.from({ length: rows * columns }, (_, i) => {
        const col = i % columns
        const row = Math.floor(i / columns)
        const key = `${col}-${row}`
        const pixelId = cells.get(key)?.pixelId
        const pixel = pixelId ? pixels.find((p) => p.id === pixelId) : null
        const color = pixel ? PIXEL_COLORS[pixel.color] : null
        const isSelected =
          !!selectedCell && selectedCell.col === col && selectedCell.row === row
        return (
          <button
            key={key}
            type="button"
            onClick={() => onCellClick(col, row)}
            className="aspect-square transition-all cursor-pointer hover:opacity-70 min-w-0"
            style={{
              backgroundColor: color?.bg ?? 'transparent',
              border: isSelected
                ? '2px solid var(--journal-ink)'
                : '1px solid var(--journal-warm)',
              borderRadius: '2px 3px 2px 3px',
            }}
            title={pixel?.name}
          />
        )
      })}
    </div>
  )
}
