import { EllipsisVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Cell, Grid } from '@/db/types'
import { computeGridStats } from '@/lib/utils/stats'

interface GridHeaderProps {
  grid: Grid
  cells: Cell[]
  /** Fixed, so the axis header can match it and the first rows line up */
  height: number
  onOpenSettings: () => void
  onDeleteGrid: () => void
}

export function GridHeader({
  grid,
  cells,
  height,
  onOpenSettings,
  onDeleteGrid,
}: GridHeaderProps) {
  const { avgProgress, completedCount, totalCells } = computeGridStats(cells)

  return (
    // The description takes the room the stats leave. On a phone that's
    // almost none, and stats that couldn't shrink would stick out past
    // the panel and widen the whole page
    <div className="flex items-start gap-5 pt-5" style={{ height }}>
      <p className="flex-1 min-w-0 text-base font-serif text-(--journal-ink) opacity-75 truncate">
        {grid.description}
      </p>
      <div className="flex items-baseline gap-2.5 min-w-0 text-(--journal-ink)">
        <span className="shrink-0 text-xl font-bold leading-tight">
          {avgProgress}%
        </span>
        <span className="text-sm font-serif opacity-70 truncate">
          {completedCount} / {totalCells}
          <span className="max-sm:sr-only"> completed</span>
        </span>

        {/* Here, not on the active tab: a tab list may only hold tabs, and
            a button inside one fails the accessibility check for it */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`${grid.name} options`}
            className="self-center shrink-0 -mr-2 p-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-(--journal-ink)"
          >
            <EllipsisVertical size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-(--journal-cream) text-(--journal-ink) border-(--journal-warm) font-serif"
          >
            <DropdownMenuItem onSelect={onOpenSettings}>
              Grid settings…
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-(--journal-warm)" />
            <DropdownMenuItem variant="destructive" onSelect={onDeleteGrid}>
              Delete grid…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
