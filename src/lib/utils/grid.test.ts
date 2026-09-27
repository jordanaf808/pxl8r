import { describe, expect, it } from 'vitest'
import type { Cell, GridPixel, Pixel } from '@/db/types'
import { buildGridRows, computeColumnCount } from './grid'

const GRID_ID = 'grid-1'
const CREATED_AT = new Date('2026-01-01T00:00:00Z')
const LATER = new Date('2026-01-02T00:00:00Z')

function makePixel(id: string): Pixel {
  return {
    id,
    ownerId: 'user-1',
    name: id,
    description: null,
    type: 'habit',
    unit: 'count',
    endGoal: null,
    color: 'sage',
    isActive: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }
}

function makeGridPixel({
  pixelId,
  position,
}: {
  pixelId: string
  position: number
}): GridPixel {
  return {
    gridId: GRID_ID,
    sortOrder: 'manual',
    position,
    pixel: makePixel(pixelId),
  }
}

function makeCell({
  id,
  pixelId,
  position,
  createdAt = CREATED_AT,
}: {
  id: string
  pixelId: string
  position: number
  createdAt?: Date | null
}): Cell {
  return {
    id,
    ownerId: 'user-1',
    gridId: GRID_ID,
    pixelId,
    type: 'boolean',
    position,
    value: null,
    note: null,
    progress: 0,
    completedAt: null,
    timerMinutes: null,
    timerStartedAt: null,
    colorOverride: null,
    createdAt,
    updatedAt: createdAt,
  }
}

describe('buildGridRows', () => {
  it('sorts rows by position, breaking ties by pixel id', () => {
    const gridPixels = [
      makeGridPixel({ pixelId: 'pixel-c', position: 1 }),
      makeGridPixel({ pixelId: 'pixel-b', position: 0 }),
      makeGridPixel({ pixelId: 'pixel-a', position: 1 }),
    ]

    const rows = buildGridRows(gridPixels, [])

    expect(rows.map((row) => row.pixel.id)).toEqual([
      'pixel-b',
      'pixel-a',
      'pixel-c',
    ])
  })

  it('groups cells into their pixel row, sorted by position, then createdAt, then id, with no slot for a position gap', () => {
    const gridPixels = [
      makeGridPixel({ pixelId: 'pixel-a', position: 0 }),
      makeGridPixel({ pixelId: 'pixel-b', position: 1 }),
    ]
    const cells = [
      makeCell({ id: 'cell-e', pixelId: 'pixel-a', position: 5 }),
      makeCell({ id: 'cell-f', pixelId: 'pixel-b', position: 3 }),
      makeCell({ id: 'cell-b', pixelId: 'pixel-a', position: 0 }),
      makeCell({
        id: 'cell-d',
        pixelId: 'pixel-a',
        position: 2,
        createdAt: LATER,
      }),
      makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 }),
      makeCell({ id: 'cell-c', pixelId: 'pixel-a', position: 2 }),
    ]

    const rows = buildGridRows(gridPixels, cells)

    expect(
      rows.map((row) => ({
        pixelId: row.pixel.id,
        cellIds: row.cells.map((cell) => cell.id),
      })),
    ).toEqual([
      {
        pixelId: 'pixel-a',
        cellIds: ['cell-a', 'cell-b', 'cell-c', 'cell-d', 'cell-e'],
      },
      { pixelId: 'pixel-b', cellIds: ['cell-f'] },
    ])
  })

  it('sorts a cell with no createdAt after dated cells at the same position, like Postgres', () => {
    const gridPixels = [makeGridPixel({ pixelId: 'pixel-a', position: 0 })]
    const cells = [
      makeCell({
        id: 'cell-a',
        pixelId: 'pixel-a',
        position: 0,
        createdAt: null,
      }),
      makeCell({ id: 'cell-b', pixelId: 'pixel-a', position: 0 }),
    ]

    const [row] = buildGridRows(gridPixels, cells)

    expect(row.cells.map((cell) => cell.id)).toEqual(['cell-b', 'cell-a'])
  })

  it('drops a cell whose pixel has no row in the grid', () => {
    const gridPixels = [makeGridPixel({ pixelId: 'pixel-a', position: 0 })]
    const cells = [
      makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 }),
      makeCell({ id: 'cell-x', pixelId: 'pixel-unlinked', position: 0 }),
    ]

    const rows = buildGridRows(gridPixels, cells)

    expect(rows.flatMap((row) => row.cells.map((cell) => cell.id))).toEqual([
      'cell-a',
    ])
  })

  it('returns an empty cells array for a row with no cells', () => {
    const gridPixels = [
      makeGridPixel({ pixelId: 'pixel-a', position: 0 }),
      makeGridPixel({ pixelId: 'pixel-b', position: 1 }),
    ]
    const cells = [makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 })]

    const rows = buildGridRows(gridPixels, cells)

    expect(rows[1].cells).toEqual([])
  })
})

// cellWidth 32 + gap 4: each column takes 36px, and the last one needs no gap
describe('computeColumnCount', () => {
  it('shows every filled cell plus one empty slot when the row is longer than what fits', () => {
    expect(
      computeColumnCount({
        perRowMax: 8,
        containerWidth: 200,
        cellWidth: 32,
        gap: 4,
      }),
    ).toBe(9)
  })

  it('fills the container with empty slots when the grid has no cells', () => {
    expect(
      computeColumnCount({
        perRowMax: 0,
        containerWidth: 580,
        cellWidth: 32,
        gap: 4,
      }),
    ).toBe(16)
  })

  it('fills the container with empty slots when the filled cells fit', () => {
    expect(
      computeColumnCount({
        perRowMax: 3,
        containerWidth: 580,
        cellWidth: 32,
        gap: 4,
      }),
    ).toBe(16)
  })
})
