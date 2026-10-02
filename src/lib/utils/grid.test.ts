import { describe, expect, it } from 'vitest'
import { buildGridRows, computeColumnCount, mergeGridPixels } from './grid'
import { LATER, makeCell, makeGridPixel } from './grid.fixtures'

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

describe('mergeGridPixels', () => {
  it('keeps a row the save did not send back', () => {
    const existing = [
      makeGridPixel({ pixelId: 'pixel-a', position: 0 }),
      makeGridPixel({ pixelId: 'pixel-b', position: 1 }),
    ]
    const saved = [
      makeGridPixel({ pixelId: 'pixel-a', position: 0 }),
      makeGridPixel({ pixelId: 'pixel-c', position: 2 }),
    ]

    const merged = mergeGridPixels(existing, saved)

    expect(merged.map((gridPixel) => gridPixel.pixel.id)).toEqual([
      'pixel-a',
      'pixel-b',
      'pixel-c',
    ])
  })

  it('takes the saved copy of a row both lists hold', () => {
    const existing = [
      makeGridPixel({ pixelId: 'pixel-a', position: 0, sortOrder: 'manual' }),
    ]
    const saved = [
      makeGridPixel({
        pixelId: 'pixel-a',
        position: 0,
        sortOrder: 'alphabetic',
      }),
    ]

    const merged = mergeGridPixels(existing, saved)

    expect(merged.map((gridPixel) => gridPixel.sortOrder)).toEqual([
      'alphabetic',
    ])
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
