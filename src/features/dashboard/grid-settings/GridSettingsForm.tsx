import { useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import type { Grid, Pixel } from '@/db/types'
import type { GridRow } from '@/lib/utils/grid'
import {
  BUTTON_RADIUS,
  DANGER_COLOR,
  PRIMARY_BUTTON,
} from '../cell-editor/styles'
import { AddPixelsList } from './AddPixelsList'
import { GridFields } from './GridFields'
import { GridRowsList } from './GridRowsList'

const SAVE_FAILED =
  'That change wasn’t saved. Check your connection, then try again.'

type SavedField = 'name' | 'description'

export interface GridSettingsFormHandle {
  /** Saves a name or description that's typed but hasn't lost focus yet */
  saveTypedFields: () => void
}

interface GridSettingsFormProps {
  /** The grid as it's saved. It changes as this form's saves come back */
  grid: Grid
  /** The grid's rows with their cells, in row order */
  rows: GridRow[]
  /** The whole pixel library */
  pixels: Pixel[]
  /** Each rejects when its save fails */
  onSaveGrid: (grid: Grid) => Promise<unknown>
  onAddPixel: (pixelId: string) => Promise<unknown>
  onNewPixel: () => void
  onClose: () => void
  ref?: Ref<GridSettingsFormHandle>
}

/**
 * Every change here is saved as it's made, and there's no Cancel: the name
 * and the description when their field loses focus, a pixel when its Add
 * button is clicked.
 */
export function GridSettingsForm({
  grid,
  rows,
  pixels,
  onSaveGrid,
  onAddPixel,
  onNewPixel,
  onClose,
  ref,
}: GridSettingsFormProps) {
  const [name, setName] = useState(grid.name)
  const [description, setDescription] = useState(grid.description ?? '')
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingAddIds, setPendingAddIds] = useState<ReadonlySet<string>>(
    new Set(),
  )
  // What this form last asked to have saved. A save carries the whole grid,
  // and `grid` only changes once a save has come back. Built from `grid`, a
  // description save sent while a name save was still out would carry the old
  // name and write it back over the new one
  const requested = useRef({ name: grid.name, description })

  const availablePixels = pixels.filter(
    (pixel) => !rows.some((row) => row.pixel.id === pixel.id),
  )

  async function saveField(field: SavedField, value: string): Promise<void> {
    const lastRequested = requested.current[field]
    requested.current = { ...requested.current, [field]: value }
    setError(null)
    try {
      await onSaveGrid({
        ...grid,
        name: requested.current.name,
        description: requested.current.description || null,
      })
    } catch {
      // So the same text is sent again the next time the field loses focus
      requested.current = { ...requested.current, [field]: lastRequested }
      setError(SAVE_FAILED)
    }
  }

  function commitName(): void {
    const trimmedName = name.trim()
    if (trimmedName === '') {
      // updateGridSchema accepts an empty name, so it's refused here
      setName(requested.current.name)
      setNameMessage('A grid needs a name, so the last one was kept.')
      return
    }
    if (trimmedName !== name) setName(trimmedName)
    if (trimmedName !== requested.current.name) {
      void saveField('name', trimmedName)
    }
  }

  function commitDescription(): void {
    if (description !== requested.current.description) {
      void saveField('description', description)
    }
  }

  async function addPixel(pixel: Pixel): Promise<void> {
    setPendingAddIds((prev) => new Set(prev).add(pixel.id))
    setError(null)
    try {
      await onAddPixel(pixel.id)
    } catch {
      setError(
        `“${pixel.name}” wasn’t added. Check your connection, then try again.`,
      )
    } finally {
      setPendingAddIds((prev) => {
        const next = new Set(prev)
        next.delete(pixel.id)
        return next
      })
    }
  }

  // Escape and a click outside close the dialog without the field losing
  // focus first, so the host asks for what's typed to be saved
  useImperativeHandle(ref, () => ({
    saveTypedFields: () => {
      commitName()
      commitDescription()
    },
  }))

  return (
    <div className="flex flex-col gap-4.5 min-w-0">
      <GridFields
        name={name}
        description={description}
        onNameChange={(nextName) => {
          setName(nextName)
          setNameMessage(null)
        }}
        onDescriptionChange={setDescription}
        onNameCommit={commitName}
        onDescriptionCommit={commitDescription}
        nameMessage={nameMessage}
      />

      <AddPixelsList
        pixels={availablePixels}
        pendingIds={pendingAddIds}
        emptyText={
          pixels.length === 0
            ? 'Your library has no pixels yet. Make one with New pixel.'
            : 'Every pixel in your library is in this grid.'
        }
        onAdd={(pixel) => void addPixel(pixel)}
        onNewPixel={onNewPixel}
      />

      <GridRowsList
        rows={rows.map((row) => ({
          pixel: row.pixel,
          cellCount: row.cells.length,
        }))}
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
        type="button"
        onClick={onClose}
        className={`${PRIMARY_BUTTON} w-full`}
        style={{ borderRadius: BUTTON_RADIUS }}
      >
        Done
      </button>
    </div>
  )
}
