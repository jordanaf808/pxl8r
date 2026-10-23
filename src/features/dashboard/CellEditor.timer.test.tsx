// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CellEditor } from './CellEditor'
import { makeCell, makePixel } from '@/lib/utils/grid.fixtures'
import type { Cell } from '@/db/types'

const START = new Date('2026-01-03T09:00:00Z')

const pixel = makePixel('pixel-a', 'Morning run')
const timerCell = {
  ...makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 }),
  timerMinutes: 30,
}

function renderEditor(cell: Cell) {
  const onSave = vi.fn().mockResolvedValue(cell)
  render(
    <CellEditor
      cell={cell}
      pixel={pixel}
      gridName="Daily goals"
      column={1}
      onSave={onSave}
      onRemove={vi.fn()}
      onClose={vi.fn()}
    />,
  )
  return onSave
}

beforeEach(() => {
  // Only the clock is faked, so the countdown's interval and waitFor still run
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(START)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('CellEditor timer', () => {
  it('keeps the length on pause and saves the seconds run', () => {
    const onSave = renderEditor(timerCell)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    vi.setSystemTime(START.getTime() + 50_000)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timerMinutes: 30,
        timerStartedAt: null,
        timerElapsedSeconds: 50,
      }),
    )
  })

  it('counts on from the seconds already run', () => {
    renderEditor({ ...timerCell, timerElapsedSeconds: 50 })

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(screen.getByText('29:10')).toBeTruthy()
  })
})
