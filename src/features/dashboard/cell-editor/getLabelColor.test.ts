import { describe, expect, it } from 'vitest'
import { PIXEL_COLORS } from '@/db/types'
import { contrastRatio, getLabelColor } from './getLabelColor'

describe('getLabelColor', () => {
  it.each([
    { color: 'rust', label: '#faf6f0' },
    { color: 'sage', label: '#faf6f0' },
    { color: 'gold', label: '#3d3229' },
    { color: 'slate', label: '#faf6f0' },
    { color: 'warm', label: '#faf6f0' },
  ] as const)('puts $label on $color', ({ color, label }) => {
    const background = PIXEL_COLORS[color].bg
    expect(getLabelColor(background)).toBe(label)
    // The label is 19px bold, where large text needs 3:1
    expect(contrastRatio(label, background)).toBeGreaterThanOrEqual(3)
  })
})
