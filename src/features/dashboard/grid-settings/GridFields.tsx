import { useId } from 'react'
import { BUTTON_RADIUS, DANGER_COLOR, FOCUS_RING } from '../cell-editor/styles'

// createGridSchema and updateGridSchema reject anything longer
const NAME_MAX_LENGTH = 66
const DESCRIPTION_MAX_LENGTH = 333

interface GridFieldsProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  /**
   * Grid settings saves a field when it loses focus, and the name on Enter
   * too. New grid leaves these out: its form saves everything on Create
   */
  onNameCommit?: () => void
  onDescriptionCommit?: () => void
  /** Shown under the name field, and read out when it appears */
  nameMessage?: string | null
}

export function GridFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onNameCommit,
  onDescriptionCommit,
  nameMessage,
}: GridFieldsProps) {
  const nameId = useId()
  const nameMessageId = useId()
  const descriptionId = useId()

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-[13px] font-semibold">
          Grid name
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameCommit}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !onNameCommit) return
            e.preventDefault()
            onNameCommit()
          }}
          placeholder="e.g. Fitness Journey"
          aria-describedby={nameMessage ? nameMessageId : undefined}
          className={`w-full h-9 px-0.5 text-[17px] bg-transparent border-b-2 border-(--journal-ink)/60 placeholder:text-(--journal-ink)/70 ${FOCUS_RING}`}
        />
        {nameMessage && (
          <p
            id={nameMessageId}
            role="alert"
            className="text-sm font-serif"
            style={{ color: DANGER_COLOR }}
          >
            {nameMessage}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={descriptionId} className="text-[13px] font-semibold">
          Description
        </label>
        <textarea
          id={descriptionId}
          rows={2}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onDescriptionCommit}
          placeholder="What ties these pixels together?"
          className={`w-full px-2.5 py-2 text-sm leading-snug bg-(--journal-paper) border-[1.5px] border-(--journal-ink)/60 placeholder:text-(--journal-ink)/70 resize-none ${FOCUS_RING}`}
          style={{ borderRadius: BUTTON_RADIUS }}
        />
      </div>
    </>
  )
}
