import { describe, expect, it } from 'vitest'
import { withCurrentPixels } from './maps'
import { GRID_ID, makeGridPixel, makePixel } from './grid.fixtures'
import type { Pixel } from '@/db/types'

describe('withCurrentPixels', () => {
  it('gives each row its pixel as the pixel list has it now', () => {
    const pixelsByGridId = new Map([
      [GRID_ID, [makeGridPixel({ pixelId: 'pixel-a', position: 0 })]],
    ])
    const edited: Pixel = {
      ...makePixel('pixel-a', 'Read a book'),
      color: 'slate',
    }

    const [row] = withCurrentPixels(pixelsByGridId, [edited]).get(GRID_ID) ?? []

    expect(row.pixel).toBe(edited)
    expect(row.position).toBe(0)
  })
})
