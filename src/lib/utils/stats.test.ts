import { describe, expect, it } from 'vitest'
import { computeGlobalStats } from './stats'
import { makeCell } from './grid.fixtures'

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
