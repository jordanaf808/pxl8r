// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { GridView } from './GridView'
import { makeCell, makeGrid, makeGridPixel } from '@/lib/utils/grid.fixtures'

// jsdom has no ResizeObserver. These tests set the width once and never
// resize, so it only has to exist
class StubResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does no layout, so clientWidth is always 0 unless a test sets it
function setCellAreaWidth(width: number) {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width)
}

function slotsOf(pixelName: string): string[] {
  const row = screen.getByRole('group', { name: pixelName })
  return within(row)
    .getAllByTestId('grid-slot')
    .map((slot) => (slot.dataset.filled === 'true' ? 'filled' : 'empty'))
}

const gridPixels = [
  makeGridPixel({ pixelId: 'pixel-a', position: 0, name: 'Morning run' }),
  makeGridPixel({ pixelId: 'pixel-b', position: 1, name: 'Read a book' }),
]
const cells = [
  makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 }),
  makeCell({ id: 'cell-b', pixelId: 'pixel-a', position: 1 }),
  makeCell({ id: 'cell-c', pixelId: 'pixel-a', position: 2 }),
  makeCell({ id: 'cell-d', pixelId: 'pixel-b', position: 0 }),
]

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('GridView', () => {
  it('draws as many slots per row as fit the cell area, filled cells first', () => {
    // Slots are 64px wide, so 640px fits ten
    setCellAreaWidth(640)

    render(
      <GridView
        grid={makeGrid()}
        gridPixels={gridPixels}
        cells={cells}
        orientation="horizontal"
        onOpenSettings={() => {}}
        onDeleteGrid={() => {}}
        onEditCell={() => {}}
      />,
    )

    expect(slotsOf('Morning run')).toEqual([
      'filled',
      'filled',
      'filled',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ])
    expect(slotsOf('Read a book')).toEqual([
      'filled',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ])
  })

  it('draws one slot past the longest row in server HTML, where nothing can be measured', () => {
    const html = renderToString(
      <GridView
        grid={makeGrid()}
        gridPixels={gridPixels}
        cells={cells}
        orientation="horizontal"
        onOpenSettings={() => {}}
        onDeleteGrid={() => {}}
        onEditCell={() => {}}
      />,
    )
    document.body.innerHTML = html

    // The longest row has three cells
    expect(slotsOf('Morning run')).toEqual([
      'filled',
      'filled',
      'filled',
      'empty',
    ])
    expect(slotsOf('Read a book')).toEqual([
      'filled',
      'empty',
      'empty',
      'empty',
    ])
  })

  it('hides a filtered-out row from both the axis and the cell area', () => {
    render(
      <GridView
        grid={makeGrid()}
        gridPixels={gridPixels}
        cells={cells}
        orientation="horizontal"
        onOpenSettings={() => {}}
        onDeleteGrid={() => {}}
        onEditCell={() => {}}
      />,
    )

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter pixels' }), {
      target: { value: 'read' },
    })

    const axisRows = within(
      screen.getByRole('list', { name: 'Pixels' }),
    ).getAllByRole('listitem')
    expect(axisRows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Read a book'),
    ])
    const cellRows = screen.getAllByRole('group')
    expect(cellRows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Read a book',
    ])
  })
})
