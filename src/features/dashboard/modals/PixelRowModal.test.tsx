// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PixelRowModal } from './PixelRowModal'
import type { Cell } from '@/db/types'
import type { GridRow } from '@/lib/utils/grid'
import { LATER, makeCell, makeGridPixel } from '@/lib/utils/grid.fixtures'

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
    render(
      <PixelRowModal
        row={row}
        rowNumber={2}
        gridName="Daily goals"
        onClose={() => {}}
        onClosed={() => {}}
      />,
    )

    expect(screen.getByText('Daily goals · row 2')).toBeTruthy()
    expect(stat('progress')).toBe('75%')
    expect(stat('completed')).toBe('3 / 4')
    expect(stat('average rating')).toBe('4.3')
  })
})
