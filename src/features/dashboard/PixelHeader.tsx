import { X } from 'lucide-react'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import type { Pixel } from '@/db/types'
import { FOCUS_RING } from './cell-editor/styles'

interface PixelHeaderProps {
  pixel: Pixel
  /** The line under the name */
  subtitle: string
  onClose: () => void
}

export function PixelHeader({ pixel, subtitle, onClose }: PixelHeaderProps) {
  return (
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
        <p className="text-[13px] font-serif opacity-70">{subtitle}</p>
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
        onClick={onClose}
        className={`flex items-center justify-center shrink-0 w-8 h-8 -mt-0.5 -mr-1.5 rounded-sm cursor-pointer hover:bg-(--journal-tan) ${FOCUS_RING}`}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
