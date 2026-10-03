import type { ReactNode } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Plus } from 'lucide-react'
import type { Grid } from '@/db/types'

interface GridTabsProps {
  grids: Grid[]
  activeGridId: string | null
  onSelectGrid: (gridId: string) => void
  onNewGrid: () => void
  /** The active grid's panel */
  children: ReactNode
}

const TAB_SHAPE =
  'relative -mr-2 border-2 border-b-0 border-(--journal-ink) text-(--journal-ink) font-bold leading-tight cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--journal-ink)'
const TAB_STYLE = {
  borderRadius: '10px 14px 0 0',
  boxShadow: '2px -2px 0 var(--journal-warm)',
}

export function GridTabs({
  grids,
  activeGridId,
  onSelectGrid,
  onNewGrid,
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
              <TabsPrimitive.Trigger
                key={grid.id}
                value={grid.id}
                className={
                  isActive
                    ? `${TAB_SHAPE} max-w-48 truncate px-5 pt-2 pb-2.5 bg-(--journal-cream) text-xl after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-(--journal-cream)`
                    : `${TAB_SHAPE} max-w-48 truncate px-4 pt-1.5 pb-2 bg-(--journal-tan) text-lg opacity-75 hover:opacity-100 transition-opacity`
                }
                style={{
                  ...TAB_STYLE,
                  zIndex: isActive ? grids.length + 1 : grids.length - index,
                }}
              >
                {grid.name}
              </TabsPrimitive.Trigger>
            )
          })}
        </TabsPrimitive.List>

        <button
          type="button"
          onClick={onNewGrid}
          aria-label="New grid"
          className={`${TAB_SHAPE} flex items-center px-3 py-2 bg-(--journal-tan) opacity-75 hover:opacity-100 transition-opacity`}
          style={TAB_STYLE}
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
