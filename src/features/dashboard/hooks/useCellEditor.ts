import { useRef, useState } from 'react'
import type { Cell } from '@/db/types'
import type { CellFields, TimerFields, ValueFields } from '../cell-editor/types'

interface UseCellEditorOptions {
  cell: Cell
  /** The length a newly added timer starts with */
  defaultTimerMinutes: number
  /** Resolves with the saved cell, or null when the cell no longer exists */
  onSave: (fields: CellFields) => Promise<Cell | null>
  onRemove: () => Promise<unknown>
  onClose: () => void
}

function fieldsOf(cell: Cell): CellFields {
  return {
    value: cell.value,
    note: cell.note,
    progress: cell.progress,
    colorOverride: cell.colorOverride,
    completedAt: cell.completedAt,
    timerMinutes: cell.timerMinutes,
    timerStartedAt: cell.timerStartedAt,
  }
}

function timerOf(fields: TimerFields): TimerFields {
  return {
    timerMinutes: fields.timerMinutes,
    timerStartedAt: fields.timerStartedAt,
  }
}

function isSameTime(a: Date | null, b: Date | null): boolean {
  return a?.getTime() === b?.getTime()
}

function isSameTimer(a: TimerFields, b: TimerFields): boolean {
  return (
    a.timerMinutes === b.timerMinutes &&
    isSameTime(a.timerStartedAt, b.timerStartedAt)
  )
}

// What a pause saves as the timer's new length: the time left, in whole minutes
function minutesLeft(
  timerMinutes: number,
  startedAt: Date,
  now: number,
): number {
  const elapsedSeconds = Math.floor((now - startedAt.getTime()) / 1000)
  const remainingSeconds = Math.max(0, timerMinutes * 60 - elapsedSeconds)
  return Math.max(1, Math.ceil(remainingSeconds / 60))
}

export function useCellEditor({
  cell,
  defaultTimerMinutes,
  onSave,
  onRemove,
  onClose,
}: UseCellEditorOptions) {
  // The cell as it was when the editor opened. Cancel writes its timer back
  const [opened] = useState(() => fieldsOf(cell))
  // What the database holds, counting timer saves that are still on their way
  const [saved, setSaved] = useState(opened)
  const [form, setForm] = useState(opened)
  const [popup, setPopup] = useState<'unsaved' | 'delete' | null>(null)
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGone, setIsGone] = useState(false)
  // The timer in the last cell the server sent back, for when a save fails
  const confirmedTimer = useRef(timerOf(opened))

  const isBusy = busyLabel !== null
  // A started or paused timer is already saved, so it doesn't count. A timer
  // added or removed waits for Save, so it does
  const hasUnsavedEdit =
    form.value !== saved.value ||
    form.progress !== saved.progress ||
    form.note !== saved.note ||
    !isSameTime(form.completedAt, saved.completedAt) ||
    (form.timerMinutes === null) !== (saved.timerMinutes === null)

  // Start, Pause and a change to the minutes are saved at once. The save
  // carries the timer as the form shows it and the last saved value of every
  // other field, so pressing Start doesn't save a half-typed note
  function saveTimer(timer: TimerFields) {
    const fields = { ...saved, ...timer }
    setForm((prev) => ({ ...prev, ...timer }))
    setSaved(fields)
    setError(null)

    onSave(fields).then(
      (savedCell) => {
        if (savedCell === null) setIsGone(true)
        else confirmedTimer.current = timerOf(savedCell)
      },
      () => {
        setError('The timer couldn’t be saved. Try again.')
        setSaved((prev) => ({ ...prev, ...confirmedTimer.current }))
        setForm((prev) => ({ ...prev, ...confirmedTimer.current }))
      },
    )
  }

  // Save, Cancel's write-back and Delete each close the editor once they're
  // through. The task resolves false when the cell turned out to be deleted
  async function runAndClose(
    task: () => Promise<boolean>,
    labels: { busy: string; failure: string },
  ): Promise<void> {
    setPopup(null)
    setError(null)
    setBusyLabel(labels.busy)
    try {
      const cellExists = await task()
      if (cellExists) onClose()
      else setIsGone(true)
    } catch {
      setError(labels.failure)
    } finally {
      setBusyLabel(null)
    }
  }

  function save() {
    void runAndClose(async () => (await onSave(form)) !== null, {
      busy: 'Saving…',
      failure: 'Your changes couldn’t be saved. Try again.',
    })
  }

  // Only a timer change needs undoing: the value, note and completion were
  // never saved. The timer goes back exactly as it was, start time included,
  // even when that restarts a timer that was paused since
  function cancel() {
    if (isSameTimer(saved, opened)) {
      onClose()
      return
    }
    void runAndClose(async () => (await onSave(opened)) !== null, {
      busy: 'Putting the timer back…',
      failure: 'The timer couldn’t be put back. Try again.',
    })
  }

  function confirmDelete() {
    void runAndClose(
      async () => {
        await onRemove()
        return true
      },
      {
        busy: 'Deleting…',
        failure: 'The cell couldn’t be deleted. Try again.',
      },
    )
  }

  function editValue(fields: ValueFields) {
    // Unticking and re-ticking a completed cell keeps the time it was
    // completed, instead of moving it to now
    const completedAt =
      fields.completedAt && saved.completedAt
        ? saved.completedAt
        : fields.completedAt
    setForm((prev) => ({ ...prev, ...fields, completedAt }))
  }

  function pauseTimer() {
    const { timerMinutes, timerStartedAt } = form
    if (timerMinutes === null || timerStartedAt === null) return
    saveTimer({
      timerMinutes: minutesLeft(timerMinutes, timerStartedAt, Date.now()),
      timerStartedAt: null,
    })
  }

  return {
    form,
    hasUnsavedEdit,
    isBusy,
    busyLabel,
    error,
    isGone,
    popup,
    editValue,
    editNote: (note: string) =>
      setForm((prev) => ({ ...prev, note: note || null })),
    addTimer: () =>
      setForm((prev) => ({
        ...prev,
        timerMinutes: defaultTimerMinutes,
        timerStartedAt: null,
      })),
    removeTimer: () =>
      setForm((prev) => ({
        ...prev,
        timerMinutes: null,
        timerStartedAt: null,
      })),
    startTimer: () =>
      saveTimer({
        timerMinutes: form.timerMinutes,
        timerStartedAt: new Date(),
      }),
    pauseTimer,
    editTimerMinutes: (minutes: number) =>
      saveTimer({ timerMinutes: minutes, timerStartedAt: null }),
    save,
    cancel,
    // Escape, a click outside and the close button all come through here
    requestClose: () => {
      if (isBusy) return
      if (hasUnsavedEdit) setPopup('unsaved')
      else onClose()
    },
    requestDelete: () => setPopup('delete'),
    confirmDelete,
    dismissPopup: () => setPopup(null),
  }
}
