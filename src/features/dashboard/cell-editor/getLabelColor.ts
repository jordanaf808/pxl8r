// The light theme's paper and ink. A pixel's color is the same in both
// themes, so a label on it can't use the theme tokens, which swap
const PAPER = '#faf6f0'
const INK = '#3d3229'

// WCAG's relative luminance of a #rrggbb color
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Paper or ink, whichever stands out more against a background color */
export function getLabelColor(background: string): string {
  return contrastRatio(PAPER, background) >= contrastRatio(INK, background)
    ? PAPER
    : INK
}
