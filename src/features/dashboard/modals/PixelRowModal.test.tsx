// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { PixelRowModal } from './PixelRowModal'
import type { Cell, CreateCellInput } from '@/db/types'
import type { GridRow } from '@/lib/utils/grid'
import {
  GRID_ID,
  LATER,
  makeCell,
  makeGridPixel,
} from '@/lib/utils/grid.fixtures'

function cell(id: string, fields: Partial<Cell> = {}): Cell {
  return { ...makeCell({ id, pixelId: 'pixel-b', position: 0 }), ...fields }
}

const done = { completedAt: LATER, progress: 100, value: 100 }

const row: GridRow = {
  ...makeGridPixel({ pixelId: 'pixel-b', position: 1, name: 'Read a book' }),
  cells: [
    cell('cell-a', { ...done, rating: 4 }),
    cell('cell-b', { ...done, rating: 5 }),
    cell('cell-c', { ...done, rating: 4 }),
    cell('cell-d'),
  ],
}

// Renders the modal with its row held in state, as GridView holds it, and
// returns what the modal sent
function renderModal() {
  const sent = {
    created: [] as CreateCellInput[],
    removed: [] as unknown[],
    deletes: 0,
    closes: 0,
  }

  function WithRow() {
    const [current, setCurrent] = useState(row)
    return (
      <PixelRowModal
        row={current}
        rowNumber={2}
        gridName="Daily goals"
        onCreateCell={async (input) => {
          sent.created.push(input)
          const newCell = cell('cell-new', { position: 1 })
          setCurrent((prev) => ({ ...prev, cells: [...prev.cells, newCell] }))
          return newCell
        }}
        onSaveCell={async () => null}
        onRemoveCell={async (removal) => {
          sent.removed.push(removal)
        }}
        onUpdatePixel={async () => {}}
        onDeleteRow={() => {
          sent.deletes += 1
        }}
        onClose={() => {
          sent.closes += 1
        }}
        onClosed={() => {}}
      />
    )
  }

  render(<WithRow />)
  return sent
}

// Each stat is a term and its value, in that order
function stat(label: string): string | null | undefined {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling
    ?.textContent
}

afterEach(() => {
  cleanup()
})

describe('PixelRowModal', () => {
  it('shows the stats of the row’s own cells, with the average rating', () => {
    renderModal()

    expect(screen.getByText('Daily goals · row 2')).toBeTruthy()
    expect(stat('progress')).toBe('75%')
    expect(stat('completed')).toBe('3 / 4')
    expect(stat('average rating')).toBe('4.3')
  })

  it('saves a blank cell on Add cell, then opens the editor on it as "Column 5"', async () => {
    const sent = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add cell' }))

    expect(
      await screen.findByRole('heading', { name: 'Column 5' }),
    ).toBeTruthy()
    expect(sent.created).toEqual([{ gridId: GRID_ID, pixelId: 'pixel-b' }])
    expect(screen.queryByRole('button', { name: 'Add cell' })).toBe(null)
    expect(stat('completed')).toBe('3 / 5')
  })

  it('moves focus to "Column 5" when the editor takes Add cell’s place', async () => {
    renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add cell' }))

    const heading = await screen.findByRole('heading', { name: 'Column 5' })
    await waitFor(() => expect(document.activeElement).toBe(heading))
  })

  it('closes the modal on Cancel, and keeps the new cell', async () => {
    const sent = renderModal()

    fireEvent.click(screen.getByRole('button', { name: 'Add cell' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(sent.closes).toBe(1))
    expect(sent.removed).toEqual([])
  })
})
