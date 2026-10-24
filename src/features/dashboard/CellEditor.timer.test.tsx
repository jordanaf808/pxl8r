// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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

    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    vi.setSystemTime(START.getTime() + 50_000)
    fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))

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

    fireEvent.click(screen.getByRole('button', { name: 'Resume timer' }))

    expect(screen.getByText('29:10')).toBeTruthy()
  })

  it('shows the input again on Reset and saves zero seconds run', () => {
    const onSave = renderEditor({ ...timerCell, timerElapsedSeconds: 50 })
    expect(screen.queryByRole('textbox', { name: 'Timer' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }))

    expect(screen.getByRole('textbox', { name: 'Timer' })).toBeTruthy()
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timerMinutes: 30,
        timerStartedAt: null,
        timerElapsedSeconds: 0,
      }),
    )
  })

  it('reads “time’s up” at 0:00, with nothing for play to do', () => {
    const onSave = renderEditor({
      ...timerCell,
      timerStartedAt: new Date(START.getTime() - 31 * 60_000),
    })

    expect(screen.getByText('0:00')).toBeTruthy()
    expect(screen.getByText('time’s up')).toBeTruthy()
    const play = screen.getByRole('button', { name: 'Start timer' })
    expect(play.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(play)
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('CellEditor timer removal', () => {
  function openRemovePopup() {
    fireEvent.click(screen.getByRole('button', { name: 'Remove timer' }))
    return screen.getByRole('alertdialog', { name: 'Remove this timer?' })
  }

  it('asks first, then saves the removal at once', () => {
    const onSave = renderEditor({ ...timerCell, timerElapsedSeconds: 50 })

    const popup = openRemovePopup()
    expect(onSave).not.toHaveBeenCalled()
    fireEvent.click(within(popup).getByRole('button', { name: 'Remove timer' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        timerMinutes: null,
        timerStartedAt: null,
        timerElapsedSeconds: 0,
      }),
    )
    // The bin that had focus is gone, so focus moves to its replacement
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Add timer' }),
    )
  })

  it('keeps the timer when the popup is answered “Keep it”', () => {
    const onSave = renderEditor(timerCell)

    fireEvent.click(
      within(openRemovePopup()).getByRole('button', { name: 'Keep it' }),
    )

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Remove timer' })).toBeTruthy()
  })

  it('removes a timer that was never saved without asking', () => {
    const onSave = renderEditor({ ...timerCell, timerMinutes: null })

    fireEvent.click(screen.getByRole('button', { name: 'Add timer' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove timer' }))

    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Add timer' })).toBeTruthy()
  })

  it('doesn’t bring a removed timer back on Cancel', async () => {
    const onClose = vi.fn()
    const onSave = vi.fn().mockResolvedValue(timerCell)
    render(
      <CellEditor
        cell={timerCell}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={onSave}
        onRemove={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(
      within(openRemovePopup()).getByRole('button', { name: 'Remove timer' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
