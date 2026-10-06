// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { GridSettingsForm } from './GridSettingsForm'
import { makeGrid, makeGridPixel, makePixel } from '@/lib/utils/grid.fixtures'

const grid = makeGrid()
const rows = [
  {
    ...makeGridPixel({ pixelId: 'pixel-a', position: 0, name: 'Morning run' }),
    cells: [],
  },
]
const library = [
  makePixel('pixel-a', 'Morning run'),
  makePixel('pixel-b', 'Stretch'),
]

function renderForm() {
  const handlers = {
    onSaveGrid: vi.fn().mockResolvedValue(undefined),
    onAddPixel: vi.fn().mockResolvedValue(undefined),
  }
  render(
    <GridSettingsForm
      grid={grid}
      rows={rows}
      pixels={library}
      onNewPixel={vi.fn()}
      onClose={vi.fn()}
      {...handlers}
    />,
  )
  return handlers
}

afterEach(() => {
  cleanup()
})

describe('GridSettingsForm', () => {
  it('saves the grid with its new name when the name field loses focus', () => {
    const { onSaveGrid } = renderForm()
    const nameField = screen.getByRole('textbox', { name: 'Grid name' })

    fireEvent.change(nameField, { target: { value: 'Evening goals' } })
    expect(onSaveGrid).not.toHaveBeenCalled()
    fireEvent.blur(nameField)

    expect(onSaveGrid).toHaveBeenCalledTimes(1)
    expect(onSaveGrid).toHaveBeenCalledWith({ ...grid, name: 'Evening goals' })
  })

  it('sends the new name with a description save made before the name save is back', () => {
    const { onSaveGrid } = renderForm()
    // Never comes back, so `grid` still holds the old name for the second save
    onSaveGrid.mockReturnValue(new Promise(() => {}))

    const nameField = screen.getByRole('textbox', { name: 'Grid name' })
    fireEvent.change(nameField, { target: { value: 'Evening goals' } })
    fireEvent.blur(nameField)
    const descriptionField = screen.getByRole('textbox', {
      name: 'Description',
    })
    fireEvent.change(descriptionField, { target: { value: 'Before bed' } })
    fireEvent.blur(descriptionField)

    expect(onSaveGrid).toHaveBeenCalledTimes(2)
    expect(onSaveGrid).toHaveBeenLastCalledWith({
      ...grid,
      name: 'Evening goals',
      description: 'Before bed',
    })
  })

  it('puts the last name back instead of saving an empty one', () => {
    const { onSaveGrid } = renderForm()
    const nameField = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Grid name',
    })

    fireEvent.change(nameField, { target: { value: '   ' } })
    fireEvent.blur(nameField)

    expect(onSaveGrid).not.toHaveBeenCalled()
    expect(nameField.value).toBe('Daily goals')
  })

  it('adds a pixel as soon as its Add button is clicked', async () => {
    const { onAddPixel } = renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Add Stretch' }))

    expect(onAddPixel).toHaveBeenCalledTimes(1)
    expect(onAddPixel).toHaveBeenCalledWith('pixel-b')
    // The button waits while the save is out, then takes clicks again
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add Stretch' })).toBeTruthy(),
    )
  })
})
