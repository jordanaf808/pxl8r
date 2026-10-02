import type { ReactNode } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { EllipsisVertical, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Grid } from '@/db/types'

interface GridTabsProps {
  grids: Grid[]
  activeGridId: string | null
  onSelectGrid: (gridId: string) => void
  onNewGrid: () => void
  onOpenSettings: () => void
  onDeleteGrid: () => void
  /** The active grid's panel */
  children: ReactNode
}

const TAB_SHAPE =
  'relative flex -mr-2 border-2 border-b-0 border-(--journal-ink) text-(--journal-ink) font-bold leading-tight'
const TAB_RADIUS = { borderRadius: '10px 14px 0 0' }
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--journal-ink)'

export function GridTabs({
  grids,
  activeGridId,
  onSelectGrid,
  onNewGrid,
  onOpenSettings,
  onDeleteGrid,
  children,
}: GridTabsProps) {
  return (
    <TabsPrimitive.Root value={activeGridId ?? ''} onValueChange={onSelectGrid}>
      {/* Above the panel in the stacking order, so the active tab's ::after
          can cover the panel's top border and the two read as one sheet */}
      <div className="relative z-10 flex items-end justify-end pr-7">
        <TabsPrimitive.List aria-label="Grids" className="flex items-end">
          {grids.map((grid, index) => {
            const isActive = grid.id === activeGridId
            return (
              // The shape is drawn on this wrapper, not on the tab, so the
              // active tab's menu button can sit inside the shape. Radix
              // renders each tab as a <button>, and a button can't hold another
              <div
                key={grid.id}
                className={
                  isActive
                    ? `${TAB_SHAPE} bg-(--journal-cream) text-xl after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-(--journal-cream)`
                    : `${TAB_SHAPE} bg-(--journal-tan) text-lg opacity-75 hover:opacity-100 transition-opacity`
                }
                style={{
                  ...TAB_RADIUS,
                  zIndex: isActive ? grids.length + 1 : grids.length - index,
                  boxShadow: '2px -2px 0 var(--journal-warm)',
                }}
              >
                <TabsPrimitive.Trigger
                  value={grid.id}
                  className={`${FOCUS_RING} max-w-48 truncate cursor-pointer ${
                    isActive ? 'pl-5 pr-1 pt-2 pb-2.5' : 'px-4 pt-1.5 pb-2'
                  }`}
                  style={TAB_RADIUS}
                >
                  {grid.name}
                </TabsPrimitive.Trigger>

                {isActive && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`${grid.name} options`}
                      className={`${FOCUS_RING} px-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer`}
                    >
                      <EllipsisVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-(--journal-cream) text-(--journal-ink) border-(--journal-warm) font-serif"
                    >
                      <DropdownMenuItem onSelect={onOpenSettings}>
                        Grid settings…
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-(--journal-warm)" />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={onDeleteGrid}
                      >
                        Delete grid…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}
        </TabsPrimitive.List>

        <button
          type="button"
          onClick={onNewGrid}
          aria-label="New grid"
          className={`${TAB_SHAPE} ${FOCUS_RING} items-center px-3 py-2 bg-(--journal-tan) opacity-75 hover:opacity-100 transition-opacity cursor-pointer`}
          style={{ ...TAB_RADIUS, boxShadow: '2px -2px 0 var(--journal-warm)' }}
        >
          <Plus size={16} />
        </button>
      </div>

      {activeGridId !== null && (
        <TabsPrimitive.Content
          value={activeGridId}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--journal-ink)"
        >
          {children}
        </TabsPrimitive.Content>
      )}
    </TabsPrimitive.Root>
  )
}
