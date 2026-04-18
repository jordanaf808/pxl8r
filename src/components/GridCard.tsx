import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { DoodleCircle } from '@/components/sketchy-elements'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import type { Grid, Pixel } from '@/db/types'

interface GridCardProps {
  grid: Grid
  pixels: Pixel[] | []
  onEdit: (grid: Grid) => void
  onDelete: (gridId: string) => void
  onRemovePixel: ({
    gridId,
    pixelIds,
  }: {
    gridId: string
    pixelIds: string[]
  }) => Promise<{ success: boolean; result: any[] }>
}

/** Sketchy stack / folder doodle icon */
function StackDoodle({
  size = 20,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <rect
        x="3"
        y="13"
        width="18"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="5"
        y="8"
        width="14"
        height="5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect
        x="7"
        y="3"
        width="10"
        height="5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GridCard({
  grid,
  pixels,
  onEdit,
  onDelete,
  onRemovePixel,
}: GridCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const colorInfo = PIXEL_COLORS['sage']

  // TODO: totalProgress and completedCount should derive from cells data, not pixels.
  // pixels don't have progress/completedAt — those live on cells. Wire in cell data when building the grid detail view.
  // const totalProgress =
  //   pixels.length > 0
  //     ? Math.round(
  //         pixels.reduce((acc, p) => acc + p.progress, 0) / pixels.length,
  //       )
  //     : 0
  // const completedCount = pixels.filter((p) => !!p.completedAt).length
  const totalProgress = 0
  const completedCount = 0

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
        className="relative p-5 transition-all duration-200 hover:-translate-y-1"
        style={{
          backgroundColor: colorInfo.bg,
          color: colorInfo.text,
          borderRadius: '4px 12px 6px 14px',
          boxShadow: isHovered
            ? '4px 4px 0px var(--journal-warm), 6px 6px 0px rgba(0,0,0,0.07)'
            : '2px 3px 0px var(--journal-warm)',
          /* Double-line left border to distinguish from single pixels */
          borderLeft: `5px double rgba(255,255,255,0.35)`,
        }}
      >
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/card:opacity-70 transition-opacity">
          <button
            onClick={() => onEdit(grid)}
            className="hover:opacity-100 cursor-pointer"
            aria-label="Edit group"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(grid.id)}
            className="hover:opacity-100 cursor-pointer"
            aria-label="Delete group"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Group badge */}
        <div className="flex items-center gap-1.5 mb-2 opacity-80">
          <StackDoodle size={18} />
          <span className="text-sm font-serif uppercase tracking-wide">
            {'Group'}
          </span>
          <span
            className="text-xs ml-auto px-1.5 py-0.5 font-serif"
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px 5px 3px 6px',
            }}
          >
            {pixels.length}
            {' pixel'}
            {pixels.length !== 1 ? 's' : ''}
          </span>
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
        {pixels.length > 0 ? (
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
                  {/* Remove from group x */}
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

                  {/* TODO: tiny progress bar — needs cell data, not pixel data
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
                  </div> */}
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
        )}

        {/* Aggregate progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-serif opacity-70">
              {'Group Progress'}
            </span>
            <span className="text-sm font-bold">{totalProgress}%</span>
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
                width: `${totalProgress}%`,
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
            {pixels.length}
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
