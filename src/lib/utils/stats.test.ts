import { describe, expect, it } from 'vitest'
import { averageRating, computeGlobalStats } from './stats'
import { makeCell } from './grid.fixtures'

function cellRated(id: string, rating: number | null) {
  return { ...makeCell({ id, pixelId: 'pixel-a', position: 0 }), rating }
}

describe('averageRating', () => {
  it('is null when no cell is rated', () => {
    expect(averageRating([cellRated('a', null), cellRated('b', null)])).toBe(
      null,
    )
  })

  it('averages only the rated cells, to one decimal', () => {
    const cells = [
      cellRated('a', 4),
      cellRated('b', 5),
      cellRated('c', 4),
      cellRated('d', null),
    ]

    expect(averageRating(cells)).toBe(4.3)
  })
})

describe('computeGlobalStats', () => {
  it('measures completion time up to completedAt, not up to a later edit', () => {
    const cell = {
      ...makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 }),
      completedAt: new Date('2026-01-03T00:00:00Z'),
      updatedAt: new Date('2026-01-20T00:00:00Z'),
    }

    const { avgCompletionDays } = computeGlobalStats([], [cell], 1)

    expect(avgCompletionDays).toBe(2)
  })
})
