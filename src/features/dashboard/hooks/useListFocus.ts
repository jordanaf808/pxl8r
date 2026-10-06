import { useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface ListRow {
  id: string
  /** Where the row was in the list */
  index: number
}

/**
 * For a list whose rows each hold a button that takes the row out of the
 * list. A keyboard user's focus is on that button, and it's dropped when the
 * row goes. This moves it to the row that took its place.
 *
 * Mark each row's button with `data-row-control={id}`.
 */
export function useListFocus<TList extends HTMLElement>(
  ids: string[],
  /** Gets focus when no row is left */
  fallbackRef: RefObject<HTMLElement | null>,
) {
  const listRef = useRef<TList>(null)
  const leavingRow = useRef<ListRow | null>(null)

  /** Focuses the row's button, or the button of the row now in its place */
  function focusRow({ id, index }: ListRow) {
    const controls = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-row-control]') ??
        [],
    )
    const target =
      controls.find((control) => control.dataset.rowControl === id) ??
      controls.at(Math.min(index, controls.length - 1)) ??
      fallbackRef.current
    target?.focus()
  }

  // After every render, before the browser paints
  useLayoutEffect(() => {
    const row = leavingRow.current
    if (!row || ids.includes(row.id)) return
    leavingRow.current = null
    // Focus is on the body only when the element that had it was removed.
    // Anywhere else, the user has moved on, so they're left there
    if (document.activeElement === document.body) focusRow(row)
  })

  return {
    listRef,
    focusRow,
    /** Call when a row's button is pressed, before the row can leave */
    noteLeavingRow: (id: string) => {
      leavingRow.current = { id, index: ids.indexOf(id) }
    },
  }
}
