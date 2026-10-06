import { useId, useImperativeHandle } from 'react'
import type { ReactNode, Ref } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import type { Cell, Pixel } from '@/db/types'
import { CheckboxEditor } from './cell-editor/CheckboxEditor'
import { DeleteCellDialog } from './cell-editor/DeleteCellDialog'
import { NumberEditor } from './cell-editor/NumberEditor'
import { RatingEditor } from './cell-editor/RatingEditor'
import { TimeEditor } from './cell-editor/TimeEditor'
import { UnsavedChangesDialog } from './cell-editor/UnsavedChangesDialog'
import {
  BUTTON_RADIUS,
  DANGER_COLOR,
  FOCUS_RING,
  OUTLINE_BUTTON,
  PRIMARY_BUTTON,
} from './cell-editor/styles'
import type { CellFields, ValueEditorProps } from './cell-editor/types'
import { CountdownTimer } from './CountdownTimer'
import { useCellEditor } from './hooks/useCellEditor'

// updateCellSchema rejects a longer note
const NOTE_MAX_LENGTH = 500

const VALUE_EDITORS: Record<
  Cell['type'],
  (props: ValueEditorProps) => ReactNode
> = {
  boolean: CheckboxEditor,
  numeric: NumberEditor,
  rating: RatingEditor,
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
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 mt-2 shrink-0"
          style={{
            backgroundColor: PIXEL_COLORS[pixel.color].bg,
            borderRadius: '1px 3px 2px 4px',
          }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-[22px] font-bold leading-tight">{pixel.name}</h2>
          <p className="text-[13px] font-serif opacity-70">
            {gridName} · column {column}
          </p>
        </div>
        <span
          className="shrink-0 mt-1 text-[11px] font-serif px-1.5 py-0.5 bg-(--journal-tan)"
          style={{ borderRadius: '1px 4px 2px 5px' }}
        >
          {PIXEL_TYPE_LABELS[pixel.type]}
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={editor.requestClose}
          className={`flex items-center justify-center shrink-0 w-8 h-8 -mt-0.5 -mr-1.5 rounded-sm cursor-pointer hover:bg-(--journal-tan) ${FOCUS_RING}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <ValueEditor
        value={form.value}
        completedAt={form.completedAt}
        pixel={pixel}
        onChange={editor.editValue}
      />

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
          onStart={editor.startTimer}
          onPause={editor.pauseTimer}
          onDisable={editor.removeTimer}
          onEditMinutes={editor.editTimerMinutes}
        />
      ) : (
        <button
          type="button"
          onClick={editor.addTimer}
          className={`flex items-center justify-center gap-1.5 w-full h-10.5 text-sm font-serif border-[1.5px] border-dashed border-(--journal-ink)/60 cursor-pointer hover:bg-(--journal-paper) disabled:cursor-default ${FOCUS_RING}`}
          style={{ borderRadius: '2px 6px 3px 7px' }}
        >
          <Plus size={16} aria-hidden="true" />
          Add timer
        </button>
      )}

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
            className={PRIMARY_BUTTON}
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
    </fieldset>
  )
}
