// @vitest-environment jsdom
import { useState } from 'react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { GridView } from './GridView'
import type { Cell, CreateCellInput } from '@/db/types'
import {
  GRID_ID,
  makeCell,
  makeGrid,
  makeGridPixel,
} from '@/lib/utils/grid.fixtures'

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

// For the tests that never press a "+"
function createNothing(): Promise<Cell> {
  return new Promise(() => {})
}

const baseProps: ComponentProps<typeof GridView> = {
  grid: makeGrid(),
  gridPixels,
  cells,
  orientation: 'horizontal',
  onOpenSettings: () => {},
  onDeleteGrid: () => {},
  onEditCell: () => {},
  onCreateCell: createNothing,
  onSaveCell: async () => null,
  onRemoveCell: async () => {},
  onUpdatePixel: async () => {},
  onDeleteRow: async () => {},
}

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

    render(<GridView {...baseProps} />)

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
    const html = renderToString(<GridView {...baseProps} />)
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
    render(<GridView {...baseProps} />)

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

  it('has a "+" in the first empty slot of each row, and nowhere else', () => {
    setCellAreaWidth(640)
    render(<GridView {...baseProps} />)

    for (const [name, cellCount] of [
      ['Morning run', 3],
      ['Read a book', 1],
    ] as const) {
      const row = screen.getByRole('group', { name })
      const [addButton, ...others] = within(row).getAllByRole('button', {
        name: `Add a cell to ${name}`,
      })
      expect(others).toEqual([])
      const slots = within(row).getAllByTestId('grid-slot')
      expect(slots[cellCount].contains(addButton)).toBe(true)
    }
  })

  it('adds a cell with the "+", and keeps focus on that row\'s "+"', async () => {
    setCellAreaWidth(640)
    const sent: CreateCellInput[] = []

    // GridView gets its cells from its parent, as it does from Dashboard
    function WithCells() {
      const [gridCells, setGridCells] = useState(cells)
      return (
        <GridView
          {...baseProps}
          cells={gridCells}
          onCreateCell={async (input) => {
            sent.push(input)
            const newCell = makeCell({
              id: 'cell-new',
              pixelId: input.pixelId,
              position: 1,
            })
            setGridCells((prev) => [...prev, newCell])
            return newCell
          }}
        />
      )
    }
    render(<WithCells />)

    const addButton = screen.getByRole('button', {
      name: 'Add a cell to Read a book',
    })
    addButton.focus()
    fireEvent.click(addButton)

    await waitFor(() =>
      expect(slotsOf('Read a book').slice(0, 3)).toEqual([
        'filled',
        'filled',
        'empty',
      ]),
    )
    expect(sent).toEqual([{ gridId: GRID_ID, pixelId: 'pixel-b' }])
    expect(document.activeElement).toBe(addButton)
    const slots = within(
      screen.getByRole('group', { name: 'Read a book' }),
    ).getAllByTestId('grid-slot')
    expect(slots[2].contains(addButton)).toBe(true)
  })

  it('opens the row modal from a row label', () => {
    render(<GridView {...baseProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Read a book' }))

    expect(
      screen.getByRole('dialog', { name: 'Row: Read a book' }),
    ).toBeTruthy()
  })

  it('opens the row modal from an empty slot, which is not a Tab stop', () => {
    setCellAreaWidth(640)
    render(<GridView {...baseProps} />)

    // Slot 2 holds the "+"; slot 6 is an ordinary empty slot
    const slot = within(
      screen.getByRole('group', { name: 'Read a book' }),
    ).getAllByTestId('grid-slot')[5]
    expect(slot.querySelector('button, a, input, [tabindex]')).toBe(null)

    const target = slot.firstElementChild
    if (!target) throw new Error('The empty slot draws nothing to click')
    fireEvent.click(target)

    expect(
      screen.getByRole('dialog', { name: 'Row: Read a book' }),
    ).toBeTruthy()
  })

  it('deletes a row from its modal, after a warning that counts its cells', async () => {
    const deleted: unknown[] = []
    render(
      <GridView
        {...baseProps}
        onDeleteRow={async (removal) => {
          deleted.push(removal)
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Morning run' }))
    // Radix opens its menu on a pointer press or a key, not on a click
    fireEvent.keyDown(screen.getByRole('button', { name: 'Row options' }), {
      key: 'Enter',
    })
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete row…' }),
    )

    const warning = await screen.findByRole('alertdialog')
    expect(warning.textContent).toContain('Its 3 cells are deleted with it.')
    fireEvent.click(within(warning).getByRole('button', { name: 'Remove row' }))

    expect(deleted).toEqual([{ gridId: GRID_ID, pixelIds: ['pixel-a'] }])
  })
})
