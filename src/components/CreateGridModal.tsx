import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { Pixel, PixelColor, GridData } from '@/db/types'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'

interface CreateGridModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (gridData: GridData) => void
  ungridedPixels: Pixel[]
  /** When set, the modal opens in edit mode pre-populated with the grid */
  selectedGrid?: GridData | null
  onUpdate?: (gridData: GridData) => void
}

export function CreateGridModal({
  isOpen,
  onClose,
  onSubmit,
  ungridedPixels,
  selectedGrid,
  onUpdate,
}: CreateGridModalProps) {
  const [name, setName] = useState(selectedGrid?.grid.name ?? '')
  const [description, setDescription] = useState(
    selectedGrid?.grid.description ?? '',
  )
  // const [color, setColor] = useState<PixelColor>(selectedGrid?.color ?? 'warm')
  const [selectedPixelIds, setSelectedPixelIds] = useState<string[]>(
    selectedGrid?.pixels.map((p) => p.id) ?? [],
  )
  const [isPrivate, setIsPrivate] = useState(false)
  const [columns, setColumns] = useState(selectedGrid?.grid.columns ?? 7)
  const [rows, setRows] = useState(selectedGrid?.grid.rows ?? 4)
  const [localCells, setLocalCells] = useState<Record<string, string>>(
    selectedGrid
      ? Object.fromEntries(
          selectedGrid.cells
            .filter((c) => c.pixelId)
            .map((c) => [`${c.col}-${c.row}`, c.pixelId!]),
        )
      : {},
  )
  const [selectedCell, setSelectedCell] = useState<{
    col: number
    row: number
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset state when modal opens/closes or selectedGrid changes
  const isEdit = !!selectedGrid
  // Pixels available for selection: ungrided + already in this grid (if editing)
  const availablePixels = isEdit
    ? [...ungridedPixels, ...ungridedPixels] // placeholder replaced below
    : ungridedPixels

  const selectedPixels = ungridedPixels.filter((p) =>
    selectedPixelIds.includes(p.id),
  )

  if (!isOpen) return null

  const togglePixel = (pixelId: string) => {
    setSelectedPixelIds((prev) =>
      prev.includes(pixelId)
        ? prev.filter((id) => id !== pixelId)
        : [...prev, pixelId],
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

    if (isEdit && onUpdate && selectedGrid) {
      onUpdate(selectedGrid)
    } else if (selectedGrid) {
      onSubmit(selectedGrid)
    }

    setName('')
    setDescription('')
    // setColor('warm')
    setSelectedPixelIds([])
    setErrors({})
    onClose()
  }

  const pixelColors = Object.entries(PIXEL_COLORS) as [
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className={`w-5 h-5 flex items-center justify-center shrink-0 transition-all ${
                  isPrivate
                    ? 'bg-(--journal-ink)'
                    : 'border-2 border-(--journal-warm)'
                }`}
                style={{ borderRadius: '2px 5px 3px 6px' }}
              >
                {isPrivate && (
                  <Check size={13} className="text-(--journal-paper)" />
                )}
              </div>
              <span className="text-sm text-(--journal-ink) opacity-60 font-serif">
                private
              </span>
            </button>
          </div>
          <p className="text-[var(--journal-ink)] opacity-50 font-serif mb-4">
            {isEdit ? 'update your pixel grid' : 'bundle pixels together'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-1 font-serif">
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
              <label className="pixel text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What ties these pixels together?"
                rows={2}
                className="w-full bg-[var(--journal-paper)] border-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-lg py-2 px-3 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans resize-none paper-lines"
                style={{ borderRadius: '3px 8px 5px 10px' }}
              />
            </div>

            {/* Color */}
            {/* <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Grid Color
              </label>
              <div className="flex gap-3">
                {pixelColors.map(([key, { bg, label }]) => (
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

            {/* Grid Size */}
            <div>
              <label className="pixel text-lg text-(--journal-ink) mb-2 font-serif block">
                Grid Size
              </label>
              <div className="flex gap-6">
                {(
                  [
                    ['Columns', columns, setColumns],
                    ['Rows', rows, setRows],
                  ] as const
                ).map(([label, value, set]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-sm font-serif text-(--journal-ink) opacity-60 w-16">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => set((v) => Math.max(1, v - 1))}
                      className="w-7 h-7 flex items-center justify-center text-base text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                      style={{ borderRadius: '2px 5px 3px 6px' }}
                    >
                      {'−'}
                    </button>
                    <span className="w-6 text-center font-bold text-(--journal-ink)">
                      {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => set((v) => Math.min(52, v + 1))}
                      className="w-7 h-7 flex items-center justify-center text-base text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                      style={{ borderRadius: '2px 5px 3px 6px' }}
                    >
                      {'+'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pixel selection */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Include Pixels
              </label>
              {ungridedPixels.length === 0 && !isEdit ? (
                <p className="text-base text-[var(--journal-ink)] opacity-40 font-serif py-3 text-center">
                  {'No ungrided pixels yet -- create some first!'}
                </p>
              ) : (
                <div
                  className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[var(--journal-paper)]"
                  style={{
                    borderRadius: '3px 8px 5px 10px',
                    border: '1.5px solid var(--journal-warm)',
                  }}
                >
                  {ungridedPixels.map((pixel) => {
                    const isSelected = selectedPixelIds.includes(pixel.id)
                    const PixelColor = PIXEL_COLORS[pixel.color]
                    return (
                      <button
                        key={pixel.id}
                        type="button"
                        onClick={() => togglePixel(pixel.id)}
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
                          <span className="text-base text-[var(--journal-ink)] truncate pixel font-sans">
                            {pixel.name}
                          </span>
                        </div>

                        {/* Type badge */}
                        <span
                          className="text-xs text-[var(--journal-ink)] opacity-50 font-serif shrink-0 px-1.5 py-0.5 bg-[var(--journal-paper)]"
                          style={{ borderRadius: '1px 4px 2px 5px' }}
                        >
                          {PIXEL_TYPE_LABELS[pixel.type]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedPixelIds.length > 0 && (
                <p className="text-sm text-[var(--journal-ink)] opacity-50 font-serif mt-1">
                  {selectedPixelIds.length}
                  {' pixel'}
                  {selectedPixelIds.length !== 1 ? 's' : ''}
                  {' selected'}
                </p>
              )}
            </div>

            {/* Interactive Grid */}
            <div>
              <label className="pixel text-lg text-(--journal-ink) mb-2 font-serif block">
                Grid
              </label>
              <div
                className="grid gap-0.5 p-2 bg-(--journal-paper)"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  border: '1.5px solid var(--journal-warm)',
                  borderRadius: '3px 8px 5px 10px',
                }}
              >
                {Array.from({ length: rows * columns }, (_, i) => {
                  const col = i % columns
                  const row = Math.floor(i / columns)
                  const key = `${col}-${row}`
                  const pixelId = localCells[key]
                  const pixel = pixelId
                    ? ungridedPixels.find((p) => p.id === pixelId)
                    : null
                  const color = pixel ? PIXEL_COLORS[pixel.color] : null
                  const isSelected =
                    !!selectedCell &&
                    selectedCell.col === col &&
                    selectedCell.row === row
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedCell(isSelected ? null : { col, row })
                      }
                      className="aspect-square transition-all cursor-pointer hover:opacity-70 min-w-0"
                      style={{
                        backgroundColor: color?.bg ?? 'transparent',
                        border: isSelected
                          ? '2px solid var(--journal-ink)'
                          : '1px solid var(--journal-warm)',
                        borderRadius: '2px 3px 2px 3px',
                      }}
                      title={pixel?.name}
                    />
                  )
                })}
              </div>

              {/* Cell editor */}
              {selectedCell && (
                <div
                  className="mt-2 p-3"
                  style={{
                    backgroundColor: 'var(--journal-paper)',
                    border: '1.5px solid var(--journal-warm)',
                    borderRadius: '3px 8px 5px 10px',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-serif text-(--journal-ink) opacity-60">
                      {`col ${selectedCell.col + 1}, row ${selectedCell.row + 1}`}
                    </span>
                    {localCells[`${selectedCell.col}-${selectedCell.row}`] && (
                      <button
                        type="button"
                        onClick={() => {
                          const key = `${selectedCell.col}-${selectedCell.row}`
                          setLocalCells((prev) => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                          })
                        }}
                        className="text-xs font-serif text-(--journal-ink) opacity-40 hover:opacity-80 cursor-pointer transition-opacity"
                      >
                        clear
                      </button>
                    )}
                  </div>
                  {ungridedPixels.length === 0 ? (
                    <p className="text-sm font-serif text-(--journal-ink) opacity-40 text-center py-2">
                      No pixels available — create some first!
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ungridedPixels.map((pixel) => {
                        const color = PIXEL_COLORS[pixel.color]
                        const key = `${selectedCell.col}-${selectedCell.row}`
                        const isAssigned = localCells[key] === pixel.id
                        return (
                          <button
                            key={pixel.id}
                            type="button"
                            onClick={() => {
                              setLocalCells((prev) => ({
                                ...prev,
                                [key]: pixel.id,
                              }))
                              if (!selectedPixelIds.includes(pixel.id)) {
                                setSelectedPixelIds((prev) => [
                                  ...prev,
                                  pixel.id,
                                ])
                              }
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-sans transition-all cursor-pointer"
                            style={{
                              backgroundColor: color.bg,
                              color: color.text,
                              borderRadius: '2px 5px 3px 6px',
                              outline: isAssigned
                                ? '2px solid var(--journal-ink)'
                                : 'none',
                              outlineOffset: '2px',
                            }}
                          >
                            {pixel.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

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
