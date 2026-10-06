import type { Pixel, UpdateCellInput } from '@/db/types'

/** The seven fields updateCell writes. Every save sends all of them */
export type CellFields = Omit<UpdateCellInput, 'id' | 'gridId'>

export type TimerFields = Pick<CellFields, 'timerMinutes' | 'timerStartedAt'>

/** What a value editor changes */
export type ValueFields = Pick<CellFields, 'value' | 'progress' | 'completedAt'>

export interface ValueEditorProps {
  value: number | null
  completedAt: Date | null
  pixel: Pixel
  onChange: (fields: ValueFields) => void
}
