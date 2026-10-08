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

describe.each([
  { type: 'numeric', unit: 'miles', goalText: '/ 3 miles' },
  { type: 'time', unit: 'minute', goalText: '/ 3 minutes' },
] as const)('CellEditor with a $type cell', ({ type, unit, goalText }) => {
  it('shows the goal with its unit', () => {
    render(
      <CellEditor
        cell={{ ...cell, type }}
        pixel={{ ...pixel, unit, endGoal: 3 }}
        gridName="Daily goals"
        column={1}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(goalText)).toBeTruthy()
  })

  it.each([
    { amount: 1, goal: 3, progress: 33, isCompleted: false },
    { amount: 3, goal: 3, progress: 100, isCompleted: true },
    // (29 / 100) * 100 is 28.999999999999996, which rounds down to 28
    { amount: 29, goal: 100, progress: 29, isCompleted: false },
  ])(
    'saves $amount of $goal as progress $progress',
    async ({ amount, goal, progress, isCompleted }) => {
      const onSave = vi.fn().mockResolvedValue(cell)
      const onClose = vi.fn()
      render(
        <CellEditor
          cell={{ ...cell, type }}
          pixel={{ ...pixel, unit, endGoal: goal }}
          gridName="Daily goals"
          column={1}
          onSave={onSave}
          onRemove={vi.fn()}
          onClose={onClose}
        />,
      )

      fireEvent.change(screen.getByRole('slider'), {
        target: { value: String(amount) },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          value: amount,
          progress,
          completedAt: isCompleted ? expect.any(Date) : null,
        }),
      )
    },
  )
})
