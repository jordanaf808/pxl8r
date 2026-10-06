import { useState } from 'react'
import type { FormEvent } from 'react'
import type { NewGridData, Pixel } from '@/db/types'
import {
  BUTTON_RADIUS,
  DANGER_COLOR,
  PRIMARY_BUTTON,
} from '../cell-editor/styles'
import { AddPixelsList } from './AddPixelsList'
import { GridFields } from './GridFields'
import { GridRowsList } from './GridRowsList'

interface NewGridFormProps {
  userId: string
  /** The whole pixel library */
  pixels: Pixel[]
  /** Rejects when the grid can't be created */
  onCreate: (gridData: NewGridData) => Promise<void>
  onNewPixel: () => void
  onClose: () => void
}

/**
 * Nothing here is saved until Create: a pixel can't be linked to a grid that
 * doesn't exist yet. So picks are held in the form and can be taken back out.
 */
export function NewGridForm({
  userId,
  pixels,
  onCreate,
  onNewPixel,
  onClose,
}: NewGridFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // In the order picked, which becomes the grid's row order
  const [pickedIds, setPickedIds] = useState<string[]>([])
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const pickedPixels = pickedIds.flatMap(
    (id) => pixels.find((pixel) => pixel.id === id) ?? [],
  )
  const availablePixels = pixels.filter(
    (pixel) => !pickedIds.includes(pixel.id),
  )

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (isCreating) return

    const trimmedName = name.trim()
    if (trimmedName === '') {
      setNameMessage('Name your grid!')
      return
    }

    setIsCreating(true)
    setError(null)
    try {
      await onCreate({
        grid: {
          ownerId: userId,
          name: trimmedName,
          description: description || null,
          theme: 'journal',
          isPublic: false,
          columns: 7,
          rows: 4,
          scaleUnit: 'percent',
          scaleLabel: '%',
        },
        pixels: pickedPixels,
        cells: [],
      })
      onClose()
    } catch {
      setError(
        'The grid couldn’t be created. Check your connection, then try again.',
      )
      setIsCreating(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isCreating}
      className="flex flex-col gap-4.5 min-w-0"
    >
      <GridFields
        name={name}
        description={description}
        onNameChange={(nextName) => {
          setName(nextName)
          setNameMessage(null)
        }}
        onDescriptionChange={setDescription}
        nameMessage={nameMessage}
      />

      <AddPixelsList
        pixels={availablePixels}
        emptyText={
          pixels.length === 0
            ? 'Your library has no pixels yet. Make one with New pixel.'
            : 'Every pixel in your library is in this grid.'
        }
        onAdd={(pixel) => setPickedIds((prev) => [...prev, pixel.id])}
        onNewPixel={onNewPixel}
      />

      <GridRowsList
        rows={pickedPixels.map((pixel) => ({ pixel }))}
        onRemove={(pixel) =>
          setPickedIds((prev) => prev.filter((id) => id !== pixel.id))
        }
      />

      {error && (
        <p
          role="alert"
          className="text-sm font-serif"
          style={{ color: DANGER_COLOR }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isCreating}
        className={`${PRIMARY_BUTTON} w-full`}
        style={{ borderRadius: BUTTON_RADIUS }}
      >
        {isCreating ? 'Creating…' : 'Create grid'}
      </button>
    </form>
  )
}
