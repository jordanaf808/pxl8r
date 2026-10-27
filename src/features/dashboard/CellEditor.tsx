import { useEffect, useId, useImperativeHandle, useRef } from 'react'
import type { ReactNode, Ref } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Cell, Pixel } from '@/db/types'
import { CompleteButton } from './cell-editor/CompleteButton'
import { DeleteCellDialog } from './cell-editor/DeleteCellDialog'
import { NumberEditor } from './cell-editor/NumberEditor'
import { RatingInput } from './cell-editor/RatingInput'
import { RemoveTimerDialog } from './cell-editor/RemoveTimerDialog'
import { TimeEditor } from './cell-editor/TimeEditor'
import { UnsavedChangesDialog } from './cell-editor/UnsavedChangesDialog'
import {
  BUTTON_RADIUS,
  DANGER_COLOR,
  EDITOR_SAVE_BUTTON,
  FOCUS_RING,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from './cell-editor/styles'
import type { CellFields, ValueEditorProps } from './cell-editor/types'
import { CountdownTimer } from './CountdownTimer'
import { useCellEditor } from './hooks/useCellEditor'
import { PixelHeader } from './PixelHeader'

// updateCellSchema rejects a longer note
const NOTE_MAX_LENGTH = 500

const VALUE_EDITORS: Record<
  Cell['type'],
  (props: ValueEditorProps) => ReactNode
> = {
  boolean: CompleteButton,
  numeric: NumberEditor,
  // Every cell has a rating, so this type has no editor of its own. No cell
  // has it; it leaves the database's list of cell types in Phase 3
  rating: CompleteButton,
  time: TimeEditor,
}

function getDefaultTimerMinutes(pixel: Pixel): number {
  const goal = pixel.endGoal ?? 20
  let minutes = 20
  if (pixel.unit === 'minute') minutes = goal
  else if (pixel.unit === 'hour') minutes = goal * 60
  else if (pixel.unit === 'day') minutes = goal * 1440
  return Math.min(120, Math.max(1, minutes))
}

export interface CellEditorHandle {
  /** Closes the editor, or asks first when an edit isn't saved */
  requestClose: () => void
}

interface CellEditorProps {
  /** The cell as it is when the editor opens. Later changes to it are ignored */
  cell: Cell
  pixel: Pixel
  gridName: string
  /** The cell's place in its row, counted from 1 */
  column: number
  /** Resolves with the saved cell, or null when the cell no longer exists */
  onSave: (fields: CellFields) => Promise<Cell | null>
  onRemove: () => Promise<unknown>
  onClose: () => void
  /**
   * Shown inside the row modal, under its own header, so it shows only
   * "Column n" in place of the pixel's header (#122)
   */
  inline?: boolean
  ref?: Ref<CellEditorHandle>
}

export function CellEditor({
  cell,
  pixel,
  gridName,
  column,
  onSave,
  onRemove,
  onClose,
  inline = false,
  ref,
}: CellEditorProps) {
  const editor = useCellEditor({
    cell,
    defaultTimerMinutes: getDefaultTimerMinutes(pixel),
    onSave,
    onRemove,
    onClose,
  })
  const noteId = useId()
  const noteCountId = useId()
  const { form } = editor
  const ValueEditor = VALUE_EDITORS[cell.type]

  // The host can't see the form, so it can't tell whether closing would lose
  // an edit. It asks, and the editor decides
  useImperativeHandle(ref, () => ({ requestClose: editor.requestClose }))

  // Removing the timer takes away the bin button that had focus, which would
  // drop focus on the page. Add timer takes its place, so focus goes there
  const addTimerRef = useRef<HTMLButtonElement>(null)
  const hadTimer = useRef(form.timerMinutes !== null)
  useEffect(() => {
    const hasTimer = form.timerMinutes !== null
    if (hadTimer.current && !hasTimer) addTimerRef.current?.focus()
    hadTimer.current = hasTimer
  }, [form.timerMinutes])

  if (editor.isGone) {
    return (
      <div role="alert" className="flex flex-col gap-3 text-(--journal-ink)">
        <h2 className="text-xl font-bold">This cell was deleted</h2>
        <p className="text-sm font-serif opacity-75">
          It was deleted somewhere else, so there was nothing to save.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className={PRIMARY_BUTTON}
            style={{ borderRadius: BUTTON_RADIUS }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <fieldset
      disabled={editor.isBusy}
      aria-busy={editor.isBusy}
      className="flex flex-col gap-4.5 min-w-0 text-(--journal-ink)"
    >
      {inline ? (
        <h3 className="text-base font-bold">Column {column}</h3>
      ) : (
        <PixelHeader
          pixel={pixel}
          subtitle={`${gridName} · column ${column}`}
          onClose={editor.requestClose}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={noteId} className="text-[13px] font-semibold">
            Note
          </label>
          <span id={noteCountId} className="text-xs font-serif opacity-70">
            {(form.note ?? '').length} / {NOTE_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id={noteId}
          aria-describedby={noteCountId}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          value={form.note ?? ''}
          onChange={(e) => editor.editNote(e.target.value)}
          placeholder="Add a note…"
          className={`w-full px-2.5 py-2 text-sm leading-snug bg-(--journal-paper) border-[1.5px] border-(--journal-ink)/60 placeholder:text-(--journal-ink)/70 resize-none ${FOCUS_RING}`}
          style={{ borderRadius: BUTTON_RADIUS }}
        />
      </div>

      {form.timerMinutes !== null ? (
        <CountdownTimer
          timerMinutes={form.timerMinutes}
          timerStartedAt={form.timerStartedAt}
          timerElapsedSeconds={form.timerElapsedSeconds}
          onStart={editor.startTimer}
          onPause={editor.pauseTimer}
          onReset={editor.resetTimer}
          onRemove={editor.requestRemoveTimer}
          onEditMinutes={editor.editTimerMinutes}
        />
      ) : (
        <button
          ref={addTimerRef}
          type="button"
          onClick={editor.addTimer}
          className={`flex items-center justify-center gap-1.5 w-full h-10.5 text-sm font-serif border-[1.5px] border-dashed border-(--journal-ink)/60 cursor-pointer hover:bg-(--journal-paper) disabled:cursor-default ${FOCUS_RING}`}
          style={{ borderRadius: '2px 6px 3px 7px' }}
        >
          <Plus size={16} aria-hidden="true" />
          Add timer
        </button>
      )}

      <ValueEditor
        value={form.value}
        completedAt={form.completedAt}
        pixel={pixel}
        onChange={editor.editValue}
      />
      <RatingInput
        isOpen={form.completedAt !== null}
        rating={form.rating}
        onChange={editor.editRating}
      />

      {editor.error && (
        <p
          role="alert"
          className="text-sm font-serif"
          style={{ color: DANGER_COLOR }}
        >
          {editor.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-(--journal-tan)">
        <button
          type="button"
          onClick={editor.requestDelete}
          className={`flex items-center gap-1.5 h-10.5 px-1.5 -ml-1.5 text-sm font-serif cursor-pointer disabled:cursor-default disabled:opacity-50 ${FOCUS_RING}`}
          style={{ color: DANGER_COLOR }}
        >
          <Trash2 size={16} aria-hidden="true" />
          Delete cell
        </button>
        {/* One group, so on a narrow screen it wraps to its own row together
            instead of leaving Save alone on the next one */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Always in the page, so a screen reader hears the text when it changes */}
          <span
            role="status"
            className="flex items-center gap-1.5 text-[13px] font-semibold"
          >
            {editor.busyLabel}
            {!editor.isBusy && editor.hasUnsavedEdit && (
              <>
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-(--journal-gold)"
                />
                Unsaved
              </>
            )}
          </span>
          <button
            type="button"
            onClick={editor.cancel}
            className={OUTLINE_BUTTON}
            style={{ borderRadius: BUTTON_RADIUS }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={editor.save}
            className={EDITOR_SAVE_BUTTON}
            style={{ borderRadius: BUTTON_RADIUS }}
          >
            Save
          </button>
        </div>
      </div>

      <UnsavedChangesDialog
        isOpen={editor.popup === 'unsaved'}
        onKeepEditing={editor.dismissPopup}
        onDiscard={editor.cancel}
        onSave={editor.save}
      />
      <DeleteCellDialog
        isOpen={editor.popup === 'delete'}
        onCancel={editor.dismissPopup}
        onConfirm={editor.confirmDelete}
      />
      <RemoveTimerDialog
        isOpen={editor.popup === 'removeTimer'}
        onCancel={editor.dismissPopup}
        onConfirm={editor.confirmRemoveTimer}
      />
    </fieldset>
  )
}
