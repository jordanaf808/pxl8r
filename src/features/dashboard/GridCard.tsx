import { useMemo, useState } from 'react'
import { Pencil, LayoutGrid, Timer } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Cell, Grid, Pixel } from '@/db/types'
import { computeGridStats } from '@/lib/utils/stats'
import { keyCellsByPixelRow } from '@/lib/utils/maps'

interface GridCardProps {
  grid: Grid
  cellsData: Cell[] | null
  pixels: Pixel[] | []
  onEdit: (grid: Grid) => void
  onCellClick: (grid: Grid, col: number, row: number) => void
  onRemovePixel: ({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) => Promise<{ success: boolean; result: any[] }>
}

export function GridCard({
  grid,
  cellsData,
  pixels,
  onEdit,
  onCellClick,
  onRemovePixel,
}: GridCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const cells = useMemo<Map<string, Cell>>(
    () => keyCellsByPixelRow(cellsData ?? [], pixels),
    [cellsData, pixels],
  )

  const columns = grid.columns
  const rows = grid.rows
  const colorInfo = PIXEL_COLORS['sage']

  const { avgProgress, completedCount } = computeGridStats(cellsData ?? [])

  // Slight random rotation for hand-placed feel
  const rotation = ((grid.id.charCodeAt(0) % 5) - 2) * 0.4

  return (
    <div
      className="relative animate-float-in group/card"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="glass-pixel-card relative p-4 pt-3 pb-3 transition-all duration-200 hover:-translate-y-1 cursor-pointer"
        onClick={() => onEdit(grid)}
        style={{
          backgroundColor: colorInfo.bg + 'cc',
          color: colorInfo.text,
          borderRadius: '4px 12px 6px 14px',
          border: '1px solid rgba(255,255,255,0.25)',
          borderLeft: '4px solid rgba(255,255,255,0.40)',
          boxShadow: isHovered
            ? `-4px 12px 28px 0 ${colorInfo.bg}55, inset 0px 0px 4px 2px rgba(255,255,255,0.40)`
            : `-2px 8px 20px 0 ${colorInfo.bg}44, inset 0px 0px 4px 1px rgba(255,255,255,0.30)`,
        }}
      >
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/card:opacity-70 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(grid)
            }}
            className="hover:opacity-100 cursor-pointer"
            aria-label="Edit group"
          >
            <Pencil size={15} />
          </button>
        </div>

        {/* Group badge */}
        <div className="flex items-center gap-1.5 mb-2 opacity-80">
          <LayoutGrid size={18} />
          <span className="text-sm font-serif uppercase tracking-wide">
            {'Grid'}
          </span>
          {/* <span
            className="text-xs ml-auto px-1.5 py-0.5 font-serif"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px 5px 3px 6px',
            }}
          >
            {pixels.length}
            {' pixel'}
            {pixels.length !== 1 ? 's' : ''}
          </span> */}
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold mb-1 leading-tight pr-8">
          {grid.name}
        </h3>

        {/* Description */}
        {grid.description && (
          <p className="text-sm opacity-80 mb-3 font-serif leading-relaxed line-clamp-2">
            {grid.description}
          </p>
        )}

        {/* ---- Mini-grid of child pixels ---- */}
        <div
          className="grid gap-px p-1 mb-3 bg-(--journal-paper)"
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
            const cell = cells.get(key)
            const pixelId = cell?.pixelId
            const pixel = pixelId ? pixels.find((p) => p.id === pixelId) : null
            const color = pixel ? PIXEL_COLORS[pixel.color] : null
            const isTimerRunning = !!cell?.timerStartedAt
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCellClick(grid, col, row)
                }}
                className="relative aspect-square transition-all cursor-pointer hover:opacity-70 min-w-0"
                style={{
                  border: '1px solid var(--journal-warm)',

                  backgroundColor: color?.bg + 'ee',
                  color: color?.text,
                  borderRadius: '4px',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.20)',
                  overflow: 'hidden',
                }}
                title={pixel?.name}
              >
                {isTimerRunning && (
                  <Timer
                    size={9}
                    className="absolute top-0.5 right-0.5 text-(--journal-ink) opacity-70"
                  />
                )}

                {/* Progress fill at bottom */}
                {cell && cell.progress > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
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
          })}
        </div>
        {/* pixels.length > 0 ? (
          <div
            className="grid gap-1.5 mb-3 p-2"
            style={{
              gridTemplateColumns:
                pixels.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '3px 7px 4px 9px',
            }}
          >
            {pixels.map((pixel) => {
              const childColor: { bg: string; text: string; label: string } =
                PIXEL_COLORS[pixel.color]
              return (
                <div
                  key={pixel.id}
                  className="relative flex flex-col items-start p-1.5 transition-transform hover:scale-105 group/mini"
                  style={{
                    backgroundColor: childColor.bg,
                    color: childColor.text,
                    borderRadius: '2px 5px 3px 6px',
                    minHeight: '48px',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePixel({ gridId: grid.id, pixelIds: [pixel.id] })
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover/mini:opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label={`Remove ${pixel.name} from group`}
                  >
                    <svg viewBox="0 0 10 10" width={8} height={8}>
                      <path
                        d="M2 2L8 8M8 2L2 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  <span className="text-xs font-bold leading-tight truncate w-full pr-3">
                    {pixel.name}
                  </span>
                  <span className="text-[10px] opacity-70 font-serif mt-auto">
                    {PIXEL_TYPE_LABELS[pixel.type]}
                  </span>

                  TODO: tiny progress bar — needs cell data, not pixel data
                  <div
                    className="w-full h-1 mt-1"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '1px 2px 1px 2px',
                    }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${cell.progress}%`,
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        borderRadius: '1px 2px 1px 2px',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-4 mb-3 font-serif text-sm opacity-50"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: '3px 7px 4px 9px',
              border: '1.5px dashed rgba(255,255,255,0.25)',
            }}
          >
            {'no pixels yet -- edit to add some!'}
          </div>
        ) */}

        {/* Aggregate progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-serif opacity-70">
              {'Grid Progress'}
            </span>
            <span className="text-sm font-bold">{avgProgress}%</span>
          </div>
          <div
            className="w-full h-3 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px 4px 3px 5px',
            }}
          >
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${avgProgress}%`,
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderRadius: '2px 4px 3px 5px',
              }}
            />
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 h-full w-px opacity-30"
                style={{ left: `${mark}%`, backgroundColor: colorInfo.text }}
              />
            ))}
          </div>
        </div>

        {/* Completion summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
          <span className="text-sm font-serif opacity-70">
            {completedCount}
            {' / '}
            {cells.size}
            {' completed'}
          </span>
          {/* TODO: re-enable once completedCount derives from cell data
          {completedCount === pixels.length && pixels.length > 0 && (
            <DoodleCircle size={16} className="opacity-50" />
          )} */}
        </div>
      </div>
    </div>
  )
}
