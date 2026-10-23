import type { ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FOCUS_RING } from './styles'

// The tooltip's own default is 0, which flashes a label at every pointer
// that crosses the row
const HOVER_LABEL_DELAY_MS = 700

const VARIANTS = {
  filled:
    'bg-(--journal-ink) text-(--journal-paper) border-[1.5px] border-(--journal-ink)',
  outline:
    'bg-transparent text-(--journal-ink) border-[1.5px] border-(--journal-ink)',
  plain: 'bg-transparent text-(--journal-ink) hover:bg-(--journal-tan)',
}

interface TimerButtonProps {
  /** What a screen reader announces, such as "Reset timer" */
  name: string
  /** The word shown on hover and on keyboard focus, such as "Reset" */
  hoverLabel: string
  variant: keyof typeof VARIANTS
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

export function TimerButton({
  name,
  hoverLabel,
  variant,
  onClick,
  disabled = false,
  children,
}: TimerButtonProps) {
  return (
    <Tooltip delayDuration={HOVER_LABEL_DELAY_MS}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={name}
          onClick={onClick}
          disabled={disabled}
          className={`flex items-center justify-center w-9 h-9 cursor-pointer disabled:cursor-default disabled:opacity-35 ${VARIANTS[variant]} ${FOCUS_RING}`}
          style={{
            borderRadius: variant === 'plain' ? '4px' : '2px 6px 3px 7px',
          }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={6}
        className="bg-(--journal-ink) text-(--journal-paper) text-xs font-semibold px-2 py-1"
      >
        {hoverLabel}
      </TooltipContent>
    </Tooltip>
  )
}
