// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useGridColumns } from './useGridColumns'

// cellWidth 32 + gap 4: each column takes 36px
const SIZES = { cellWidth: 32, gap: 4 }
const PADDING = 16

// jsdom has no ResizeObserver. Like the browser's, this one only reports
// elements it's observing, and reports nothing after disconnect()
let observers: FakeResizeObserver[] = []

class FakeResizeObserver implements ResizeObserver {
  callback: ResizeObserverCallback
  observed = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    observers.push(this)
  }

  observe(element: Element) {
    this.observed.add(element)
  }

  unobserve(element: Element) {
    this.observed.delete(element)
  }

  disconnect() {
    this.observed.clear()
  }
}

// jsdom does no layout, so clientWidth is always 0 unless a test sets it
function setClientWidth(element: HTMLElement, width: number) {
  Object.defineProperty(element, 'clientWidth', {
    configurable: true,
    value: width,
  })
}

function makeElement(width: number): HTMLElement {
  const element = document.createElement('div')
  setClientWidth(element, width)
  return element
}

// Sets the new width, then reports it the way a browser does. A real
// contentRect leaves out padding while clientWidth includes it, so the
// report's contentRect is deliberately narrower than clientWidth
function resize(element: HTMLElement, width: number) {
  setClientWidth(element, width)
  const contentWidth = width - 2 * PADDING
  const entry: ResizeObserverEntry = {
    target: element,
    contentRect: {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: contentWidth,
      width: contentWidth,
      height: 0,
      toJSON: () => ({}),
    },
    borderBoxSize: [],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  }

  for (const observer of observers) {
    if (observer.observed.has(element)) observer.callback([entry], observer)
  }
}

beforeEach(() => {
  observers = []
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('useGridColumns', () => {
  it('is unmeasured, with one slot past the longest row, before an element is attached', () => {
    const { result } = renderHook(() =>
      useGridColumns({ perRowMax: 3, ...SIZES }),
    )

    expect(result.current).toMatchObject({ isMeasured: false, columns: 4 })
  })

  it('measures an attached element straight away, before any resize report', () => {
    const { result } = renderHook(() =>
      useGridColumns({ perRowMax: 3, ...SIZES }),
    )

    act(() => result.current.ref(makeElement(580)))

    expect(result.current).toMatchObject({ isMeasured: true, columns: 16 })
  })

  it('re-reads clientWidth, not the report, when the element resizes', () => {
    const { result } = renderHook(() =>
      useGridColumns({ perRowMax: 3, ...SIZES }),
    )
    const element = makeElement(580)
    act(() => result.current.ref(element))

    act(() => resize(element, 400))

    // clientWidth 400 fits 11; the report's contentRect (368) would fit 10
    expect(result.current.columns).toBe(11)
  })

  it('follows a newly attached element and ignores the old one', () => {
    const { result } = renderHook(() =>
      useGridColumns({ perRowMax: 3, ...SIZES }),
    )
    const oldElement = makeElement(580)
    const newElement = makeElement(400)
    act(() => result.current.ref(oldElement))
    act(() => result.current.ref(newElement))

    act(() => resize(newElement, 580))
    act(() => resize(oldElement, 1000))

    // 580 fits 16. Still following the old element would give 27 (1000px);
    // not following the new one would leave 11 (its 400px at attach)
    expect(result.current.columns).toBe(16)
  })

  it('stops observing the element on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useGridColumns({ perRowMax: 3, ...SIZES }),
    )
    const element = makeElement(580)
    act(() => result.current.ref(element))

    unmount()

    expect(observers.some((observer) => observer.observed.has(element))).toBe(
      false,
    )
  })
})
