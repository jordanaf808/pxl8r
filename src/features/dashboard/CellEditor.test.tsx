// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
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

const cell = makeCell({ id: 'cell-a', pixelId: 'pixel-a', position: 0 })
const pixel = makePixel('pixel-a', 'Morning run')

afterEach(() => {
  cleanup()
})

describe('CellEditor', () => {
  it('sends all seven fields on Save, the edited ones with their new values', async () => {
    const onSave = vi.fn().mockResolvedValue(cell)
    const onClose = vi.fn()
    render(
      <CellEditor
        cell={cell}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={onSave}
        onRemove={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Morning run completed' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), {
      target: { value: 'Felt slow at the start' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      value: 100,
      progress: 100,
      completedAt: expect.any(Date),
      note: 'Felt slow at the start',
      colorOverride: null,
      timerMinutes: null,
      timerStartedAt: null,
    })
  })

  it('removes the cell only once the delete is confirmed', async () => {
    const onRemove = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <CellEditor
        cell={cell}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={vi.fn()}
        onRemove={onRemove}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete cell' }))
    expect(onRemove).not.toHaveBeenCalled()

    const confirm = screen.getByRole('alertdialog', {
      name: 'Delete this cell?',
    })
    fireEvent.click(
      within(confirm).getByRole('button', { name: 'Delete cell' }),
    )

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
