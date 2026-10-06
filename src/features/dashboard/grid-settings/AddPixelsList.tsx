import { useRef } from 'react'
import { Plus } from 'lucide-react'
import { PIXEL_COLORS } from '@/db/types'
import type { Pixel } from '@/db/types'
import { BUTTON_RADIUS, FOCUS_RING } from '../cell-editor/styles'
import { useListFocus } from '../hooks/useListFocus'

const SMALL_BUTTON_RADIUS = '2px 6px 3px 7px'

interface AddPixelsListProps {
  /** The library's pixels that aren't in the grid */
  pixels: Pixel[]
  /** Pixels whose Add is still being saved. Their buttons wait */
  pendingIds?: ReadonlySet<string>
  /** Shown in place of the list when `pixels` is empty */
  emptyText: string
  onAdd: (pixel: Pixel) => void
  onNewPixel: () => void
}

export function AddPixelsList({
  pixels,
  pendingIds,
  emptyText,
  onAdd,
  onNewPixel,
}: AddPixelsListProps) {
  const newPixelRef = useRef<HTMLButtonElement>(null)
  const { listRef, noteLeavingRow } = useListFocus<HTMLUListElement>(
    pixels.map((pixel) => pixel.id),
    newPixelRef,
  )

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3 className="text-[15px] font-bold">Add pixels</h3>
        {pixels.length > 0 && (
          <span className="text-xs font-serif opacity-70">
            {pixels.length} not in this grid
          </span>
        )}
        <button
          ref={newPixelRef}
          type="button"
          onClick={onNewPixel}
          className={`flex items-center gap-1 h-8 ml-auto px-2.5 text-[13px] font-serif border-[1.5px] border-dashed border-(--journal-ink)/60 cursor-pointer hover:bg-(--journal-paper) ${FOCUS_RING}`}
          style={{ borderRadius: SMALL_BUTTON_RADIUS }}
        >
          <Plus size={13} aria-hidden="true" />
          New pixel
        </button>
      </div>

      {pixels.length === 0 ? (
        <p
          className="px-5 py-4 text-center text-[13px] font-serif leading-snug border-[1.5px] border-dashed border-(--journal-ink)/60"
          style={{ borderRadius: BUTTON_RADIUS }}
        >
          {emptyText}
        </p>
      ) : (
        // Safari drops a list's role when its markers are removed, so it's set by hand
        <ul
          ref={listRef}
          role="list"
          aria-label="Pixels you can add"
          className="max-h-53.5 overflow-y-auto bg-(--journal-paper) border-[1.5px] border-(--journal-ink)/60"
          style={{ borderRadius: BUTTON_RADIUS }}
        >
          {pixels.map((pixel) => {
            const isPending = pendingIds?.has(pixel.id) ?? false
            return (
              <li
                key={pixel.id}
                className="flex items-center gap-2.5 h-12 pl-3 pr-2 border-b border-(--journal-tan) last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="w-3 h-3 shrink-0"
                  style={{
                    backgroundColor: PIXEL_COLORS[pixel.color].bg,
                    borderRadius: '1px 3px 2px 4px',
                  }}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold leading-tight truncate">
                    {pixel.name}
                  </span>
                  <span className="text-xs font-serif leading-tight opacity-70 truncate">
                    <span className="capitalize">{pixel.unit}</span>
                    {pixel.endGoal != null && ` · goal ${pixel.endGoal}`}
                  </span>
                </div>
                {/* aria-disabled, not disabled: a disabled button can't hold
                    focus, and a keyboard user's focus is on this one while
                    the save is out */}
                <button
                  type="button"
                  data-row-control={pixel.id}
                  aria-label={`${isPending ? 'Adding' : 'Add'} ${pixel.name}`}
                  aria-disabled={isPending || undefined}
                  onClick={() => {
                    if (isPending) return
                    noteLeavingRow(pixel.id)
                    onAdd(pixel)
                  }}
                  className={`flex items-center gap-1 shrink-0 h-8.5 px-2.5 text-[13px] font-semibold font-serif border-[1.5px] border-(--journal-ink) cursor-pointer hover:bg-(--journal-tan) aria-disabled:opacity-50 aria-disabled:cursor-default ${FOCUS_RING}`}
                  style={{ borderRadius: SMALL_BUTTON_RADIUS }}
                >
                  <Plus size={13} aria-hidden="true" />
                  {isPending ? 'Adding…' : 'Add'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
