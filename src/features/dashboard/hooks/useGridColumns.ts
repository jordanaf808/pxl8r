import { useLayoutEffect, useState } from 'react'
import { computeColumnCount } from '@/lib/utils/grid'

/**
 * Measures the cell area and returns how many column slots fit. Attach `ref`
 * to an element that takes its width from its parent, holds only the cell
 * columns, and has no horizontal padding, or the count will be wrong.
 *
 * `ref` is a state setter rather than a ref object: setting a ref object's
 * `current` doesn't re-render, so an element that mounts late or gets
 * replaced would never be measured.
 *
 * Until an element is measured (always the case in server HTML),
 * `isMeasured` is false and `columns` covers only the longest row plus one.
 */
export function useGridColumns({
  perRowMax,
  cellWidth,
  gap,
}: {
  perRowMax: number
  cellWidth: number
  gap: number
}) {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    // Keeps the last width when the element is removed. A new element is
    // measured below before the browser paints, so a stale width never shows
    if (!element) return

    // Read directly so React re-renders with this width before the first paint
    setWidth(element.clientWidth)

    // Re-read clientWidth rather than the entry's contentRect, which leaves out
    // padding and keeps fractions. Mixing the two could change the count on
    // the observer's first report, one frame after the first paint
    const observer = new ResizeObserver(() => setWidth(element.clientWidth))
    observer.observe(element)

    return () => observer.disconnect()
  }, [element])

  return {
    ref: setElement,
    columns:
      width === null
        ? perRowMax + 1
        : computeColumnCount({
            perRowMax,
            containerWidth: width,
            cellWidth,
            gap,
          }),
    isMeasured: width !== null,
  }
}
