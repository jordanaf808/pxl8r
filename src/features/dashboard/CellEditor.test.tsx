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
  it('sends all nine fields on Save, the edited ones with their new values', async () => {
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
      screen.getByRole('button', { name: 'Complete', pressed: false }),
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
      timerElapsedSeconds: 0,
      rating: null,
    })
  })

  it.each([
    {
      action: 'keeps the rating of a completed cell',
      untick: false,
      rating: 4,
    },
    {
      action: 'saves no rating once the cell is un-completed',
      untick: true,
      rating: null,
    },
  ])('$action', async ({ untick, rating }) => {
    const ratedCell = {
      ...cell,
      value: 100,
      progress: 100,
      completedAt: new Date('2026-01-03T00:00:00Z'),
      rating: 4,
    }
    const onSave = vi.fn().mockResolvedValue(ratedCell)
    const onClose = vi.fn()
    render(
      <CellEditor
        cell={ratedCell}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={onSave}
        onRemove={vi.fn()}
        onClose={onClose}
      />,
    )

    // Opened on a completed cell, the button is already pressed
    const complete = screen.getByRole('button', {
      name: 'Completed',
      pressed: true,
    })
    if (untick) fireEvent.click(complete)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ rating }))
  })

  it('plays the sweep only on the press that completes the cell', () => {
    const { container } = render(
      <CellEditor
        cell={{ ...cell, completedAt: new Date('2026-01-03T00:00:00Z') }}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={vi.fn()}
        onRemove={vi.fn()}
        onClose={vi.fn()}
      />,
    )
    const sweepBands = () => container.querySelectorAll('.complete-sweep')

    // Opened on a completed cell, the button is filled with no sweep
    expect(sweepBands()).toHaveLength(0)
    const button = screen.getByRole('button', { name: 'Completed' })
    fireEvent.click(button)
    expect(sweepBands()).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))
    // Three bands, then the pixel's color
    expect(sweepBands()).toHaveLength(4)
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
  { type: 'numeric', unit: 'miles', unitText: 'miles', sliderName: 'value' },
  { type: 'time', unit: 'minute', unitText: 'minutes', sliderName: 'duration' },
] as const)(
  'CellEditor with a $type cell',
  ({ type, unit, unitText, sliderName }) => {
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

      expect(screen.getByText(`/ 3 ${unitText}`)).toBeTruthy()
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

        // Found by its name, so this fails if the slider loses its label
        const slider = screen.getByRole('slider', { name: sliderName })
        fireEvent.change(slider, { target: { value: String(amount) } })
        expect(slider.getAttribute('aria-valuetext')).toBe(
          `${amount} of ${goal} ${unitText}`,
        )
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
  },
)

describe('CellEditor rating', () => {
  const ratedCell = {
    ...cell,
    value: 100,
    progress: 100,
    completedAt: new Date('2026-01-03T00:00:00Z'),
    rating: 4,
  }

  function renderEditor(editedCell = cell) {
    const onSave = vi.fn().mockResolvedValue(editedCell)
    const onClose = vi.fn()
    render(
      <CellEditor
        cell={editedCell}
        pixel={pixel}
        gridName="Daily goals"
        column={1}
        onSave={onSave}
        onRemove={vi.fn()}
        onClose={onClose}
      />,
    )
    return { onSave, onClose }
  }

  async function saveAndGetRating({
    onSave,
    onClose,
  }: ReturnType<typeof renderEditor>) {
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    return onSave.mock.calls[0][0].rating
  }

  it('keeps the stars out of reach until the cell is completed', () => {
    renderEditor()
    // Testing Library doesn't treat inert as hidden, so the row's attribute
    // is what shows that Tab skips the stars
    const rating = screen.getByRole('group', { name: 'Rating' })
    expect(rating.closest('[inert]')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))
    expect(rating.closest('[inert]')).toBeNull()
  })

  it('saves the stars chosen once the cell is completed', async () => {
    const editor = renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))
    fireEvent.click(screen.getByRole('button', { name: '4 stars' }))
    expect(screen.getByText('4 of 5')).toBeTruthy()

    expect(await saveAndGetRating(editor)).toBe(4)
  })

  it('clears the rating when the chosen star is pressed again', async () => {
    const editor = renderEditor(ratedCell)
    fireEvent.click(
      screen.getByRole('button', { name: '4 stars', pressed: true }),
    )
    expect(screen.getByText('Not rated')).toBeTruthy()

    expect(await saveAndGetRating(editor)).toBeNull()
  })

  it('shows the same stars when a cell is un-completed and completed again', () => {
    renderEditor(ratedCell)
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))

    expect(
      screen
        .getByRole('button', { name: '4 stars' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
