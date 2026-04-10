'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { SketchyDivider } from '@/components/sketchy-elements'
import type { PixelColor } from '@/db/types'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import type { Pixel, Grid, NewGrid } from '@/db/schema'

interface CreateGridModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (grid: NewGrid) => void
  ungridedBlocks: Pixel[]
  /** When set, the modal opens in edit mode pre-populated with the grid */
  editGrid?: Grid | null
  onUpdate?: (grid: Grid) => void
}

export function CreateGridModal({
  isOpen,
  onClose,
  onSubmit,
  ungridedBlocks,
  editGrid,
  onUpdate,
}: CreateGridModalProps) {
  const [name, setName] = useState(editGrid?.name ?? '')
  const [description, setDescription] = useState(editGrid?.description ?? '')
  // const [color, setColor] = useState<PixelColor>(editGrid?.color ?? 'warm')
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>(
    editGrid?.pixelIds ?? [],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset state when modal opens/closes or editGrid changes
  const isEdit = !!editGrid
  // Blocks available for selection: ungrided + already in this grid (if editing)
  const availableBlocks = isEdit
    ? [...ungridedBlocks, ...ungridedBlocks] // placeholder replaced below
    : ungridedBlocks

  if (!isOpen) return null

  const toggleBlock = (blockId: string) => {
    setSelectedBlockIds((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId],
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name your grid!'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (isEdit && onUpdate && editGrid) {
      onUpdate({
        ...editGrid,
        name,
        description,
        // color,
        pixelIds: selectedBlockIds,
      })
    } else {
      onSubmit({ name, description, pixelIds: selectedBlockIds })
    }

    setName('')
    setDescription('')
    // setColor('warm')
    setSelectedBlockIds([])
    setErrors({})
    onClose()
  }

  const blockColors = Object.entries(PIXEL_COLORS) as [
    PixelColor,
    { bg: string; text: string; label: string },
  ][]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--journal-ink)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[var(--journal-cream)] sketch-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-float-in"
        style={{ transform: 'rotate(0.4deg)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X size={22} />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {/* Stack doodle icon */}
            <svg
              viewBox="0 0 24 24"
              width={22}
              height={22}
              className="text-[var(--journal-gold)]"
            >
              <rect
                x="3"
                y="13"
                width="18"
                height="8"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect
                x="5"
                y="8"
                width="14"
                height="5"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect
                x="7"
                y="3"
                width="10"
                height="5"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--journal-ink)]">
              {isEdit ? 'Edit Grid' : 'New Grid'}
            </h2>
          </div>
          <p className="text-[var(--journal-ink)] opacity-50 font-serif mb-4">
            {isEdit ? 'update your block grid' : 'bundle blocks together'}
          </p>
          <SketchyDivider className="text-[var(--journal-warm)] mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Grid Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={'e.g. "Fitness Journey"'}
                className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
              />
              {errors.name && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What ties these blocks together?"
                rows={2}
                className="w-full bg-[var(--journal-paper)] border-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-lg py-2 px-3 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans resize-none paper-lines"
                style={{ borderRadius: '3px 8px 5px 10px' }}
              />
            </div>

            {/* Color */}
            {/* <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Grid Color
              </label>
              <div className="flex gap-3">
                {blockColors.map(([key, { bg, label }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    className={`w-10 h-10 transition-all cursor-pointer relative ${
                      color === key
                        ? 'scale-110 ring-2 ring-[var(--journal-ink)] ring-offset-2 ring-offset-[var(--journal-cream)]'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: bg,
                      borderRadius: '3px 8px 5px 10px',
                    }}
                    title={label}
                    aria-label={label}
                  >
                    {color === key && (
                      <svg
                        viewBox="0 0 20 20"
                        className="absolute inset-0 m-auto w-5 h-5"
                      >
                        <path
                          d="M4 10 L8 15 L16 4"
                          fill="none"
                          stroke="#faf6f0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div> */}

            {/* Block selection */}
            <div>
              <label className="block text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Include Blocks
              </label>
              {ungridedBlocks.length === 0 && !isEdit ? (
                <p className="text-base text-[var(--journal-ink)] opacity-40 font-serif py-3 text-center">
                  {'No ungrided blocks yet -- create some first!'}
                </p>
              ) : (
                <div
                  className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[var(--journal-paper)]"
                  style={{
                    borderRadius: '3px 8px 5px 10px',
                    border: '1.5px solid var(--journal-warm)',
                  }}
                >
                  {ungridedBlocks.map((block) => {
                    const isSelected = selectedBlockIds.includes(block.id)
                    const PixelColor = PIXEL_COLORS[block.color]
                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => toggleBlock(block.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--journal-tan)]'
                            : 'hover:bg-[var(--journal-cream)]'
                        }`}
                        style={{ borderRadius: '2px 6px 3px 7px' }}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[var(--journal-ink)]'
                              : 'border-2 border-[var(--journal-warm)]'
                          }`}
                          style={{ borderRadius: '2px 5px 3px 6px' }}
                        >
                          {isSelected && (
                            <Check
                              size={13}
                              className="text-[var(--journal-paper)]"
                            />
                          )}
                        </div>

                        {/* Color dot */}
                        <div
                          className="w-3 h-3 shrink-0"
                          style={{
                            backgroundColor: PixelColor.bg,
                            borderRadius: '1px 3px 2px 4px',
                          }}
                        />

                        {/* Name + type */}
                        <div className="flex-1 min-w-0">
                          <span className="text-base text-[var(--journal-ink)] truncate block font-sans">
                            {block.name}
                          </span>
                        </div>

                        {/* Type badge */}
                        <span
                          className="text-xs text-[var(--journal-ink)] opacity-50 font-serif shrink-0 px-1.5 py-0.5 bg-[var(--journal-paper)]"
                          style={{ borderRadius: '1px 4px 2px 5px' }}
                        >
                          {PIXEL_TYPE_LABELS[block.type]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedBlockIds.length > 0 && (
                <p className="text-sm text-[var(--journal-ink)] opacity-50 font-serif mt-1">
                  {selectedBlockIds.length}
                  {' block'}
                  {selectedBlockIds.length !== 1 ? 's' : ''}
                  {' selected'}
                </p>
              )}
            </div>

            <SketchyDivider className="text-[var(--journal-warm)]" />

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl py-3 font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              {isEdit ? 'Update Grid' : 'Create Grid'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
