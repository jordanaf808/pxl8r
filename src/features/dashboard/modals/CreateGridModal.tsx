import { useState } from 'react'
import { X, Check, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react'
import type { Pixel, PixelColor, GridData, Cell, NewGridData } from '@/db/types'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'
import { useSession } from '@/lib/auth/auth-client'
import { keyCellsByPixelRow } from '@/lib/utils/maps'
import { PixelGrid } from '../PixelGrid'
import { CountdownTimer } from '../CountdownTimer'

function getDefaultTimerMinutes(pixel: Pixel): number {
  const goal = pixel.endGoal ?? 20
  let minutes = 20
  if (pixel.unit === 'minute') minutes = goal
  else if (pixel.unit === 'hour') minutes = goal * 60
  else if (pixel.unit === 'day') minutes = goal * 1440
  return Math.min(120, Math.max(1, minutes))
}

interface CreateGridModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (gridData: NewGridData) => void
  userId: string
  pixels: Pixel[]
  /** When set, the modal opens in edit mode pre-populated with the grid */
  gridData?: GridData | null
  /** When set, the cell editor opens pre-selected to this position */
  initialSelectedCell?: { col: number; row: number } | null
  onUpdate?: (gridData: GridData) => void
  onCreatePixel?: () => void
}

export function CreateGridModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
  pixels,
  gridData,
  initialSelectedCell,
  onUpdate,
  onCreatePixel,
}: CreateGridModalProps) {
  const [gridId, setGridId] = useState(gridData?.grid.id ?? crypto.randomUUID())
  const [name, setName] = useState(gridData?.grid.name ?? '')
  const [description, setDescription] = useState(
    gridData?.grid.description ?? '',
  )
  // const [color, setColor] = useState<PixelColor>(gridData?.color ?? 'warm')
  const [selectedPixelIds, setSelectedPixelIds] = useState<string[]>(
    gridData?.pixels.map((p) => p.id) ?? [],
  )
  const [isPrivate] = useState(gridData?.grid.isPublic ? false : true)
  const [columns, setColumns] = useState(gridData?.grid.columns ?? 7)
  const [rows, setRows] = useState(gridData?.grid.rows ?? 4)
  const [cells, setCells] = useState<Map<string, Cell>>(
    keyCellsByPixelRow(gridData?.cells ?? [], gridData?.pixels ?? []),
  )
  const [selectedCell, setSelectedCell] = useState<{
    col: number
    row: number
  } | null>(initialSelectedCell ?? null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function updateCell(key: string, updates: Partial<Cell>) {
    setCells((prev) => {
      const next = new Map(prev)
      const existing = next.get(key)
      const updatedCell = { ...existing, ...updates } as Cell
      if (existing) next.set(key, updatedCell)
      return next
    })
  }

  const assignPixelToCell = (pixelId: string, col: number, row: number) => {
    const key = `${col}-${row}`
    setCells((prev) => {
      const newCellsMap = new Map(prev)
      const cellData = newCellsMap.get(key)
      const isAssigned = cellData?.pixelId === pixelId

      if (cellData && !isAssigned) {
        newCellsMap.set(key, {
          ...cellData,
          pixelId,
          note: null,
          value: null,
          progress: 0,
          completedAt: null,
          updatedAt: new Date(),
        })
      } else if (cellData && isAssigned) {
        newCellsMap.delete(key)
      } else {
        newCellsMap.set(key, {
          id: crypto.randomUUID(),
          pixelId,
          position: col,
          gridId,
          type: 'boolean',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: userId,
          colorOverride: null,
          value: null,
          note: null,
          progress: 0,
          completedAt: null,
          timerMinutes: null,
          timerStartedAt: null,
        } as Cell)
      }

      updateSelectedPixels(newCellsMap)
      return newCellsMap
    })
  }

  function updateSelectedPixels(updatedCells: Map<string, Cell> | null) {
    const cellsData = updatedCells ?? cells
    const newSelectedPixels: string[] = []
    cellsData.forEach((c) => {
      if (c.pixelId && !newSelectedPixels.includes(c.pixelId))
        newSelectedPixels.push(c.pixelId)
    })
    setSelectedPixelIds(newSelectedPixels)
    return newSelectedPixels
  }

  // Reset state when modal opens/closes or gridData changes
  const isEdit = !!gridData

  if (!isOpen) return null

  // function togglePixel(pixelId: string) {
  //   setSelectedPixelIds((prev) =>
  //     prev.includes(pixelId)
  //       ? prev.filter((id) => id !== pixelId)
  //       : [...prev, pixelId],
  //   )
  // }

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name your grid!'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    if (isEdit && onUpdate && gridId) {
      const updatedGridData = {
        grid: {
          ...gridData.grid,
          name,
          description,
          isPublic: !isPrivate,
          columns,
          rows,
        },
        pixels: pixels.filter((p) => selectedPixelIds.includes(p.id)),
        cells: Array.from(cells.values()),
      }

      onUpdate(updatedGridData)
    } else {
      const newGridData = {
        grid: {
          ownerId: userId,
          name,
          description,
          theme: 'journal',
          isPublic: !isPrivate,
          columns,
          rows,
          scaleUnit: 'percent',
          scaleLabel: '%',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        pixels: pixels.filter((p) => selectedPixelIds.includes(p.id)),
        cells: Array.from(cells.values()),
      } as NewGridData
      onSubmit(newGridData)
    }

    setName('')
    setDescription('')
    // setColor('warm')
    setSelectedPixelIds([])
    setErrors({})
    onClose()
  }

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

            {/* Interactive Grid */}
            <div>
              <label className="pixel text-lg text-(--journal-ink) mb-2 font-serif block">
                Grid
              </label>

              {/* Column controls — top edge */}
              <div className="flex items-center justify-end gap-1.5 pr-1 mb-1">
                <button
                  type="button"
                  onClick={() => setColumns((v) => Math.max(1, v - 1))}
                  className="w-6 h-6 flex items-center justify-center text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                  style={{ borderRadius: '2px 5px 3px 6px' }}
                  aria-label="Remove column"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-serif text-(--journal-ink) opacity-60 w-14 text-center">
                  {columns} cols
                </span>
                <button
                  type="button"
                  onClick={() => setColumns((v) => Math.min(52, v + 1))}
                  className="w-6 h-6 flex items-center justify-center text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                  style={{ borderRadius: '2px 5px 3px 6px' }}
                  aria-label="Add column"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex gap-1.5">
                <div className="flex-1 min-w-0">
                  <PixelGrid
                    cells={cells}
                    columns={columns}
                    rows={rows}
                    pixels={pixels}
                    selectedCell={selectedCell}
                    onCellClick={(col, row) =>
                      setSelectedCell(
                        selectedCell !== null &&
                          selectedCell.col === col &&
                          selectedCell.row === row
                          ? null
                          : { col, row },
                      )
                    }
                  />
                </div>

                {/* Row controls — side edge */}
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRows((v) => Math.max(1, v - 1))}
                    className="w-6 h-6 flex items-center justify-center text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                    style={{ borderRadius: '2px 5px 3px 6px' }}
                    aria-label="Remove row"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="text-xs font-serif text-(--journal-ink) opacity-60">
                    {rows}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRows((v) => Math.min(52, v + 1))}
                    className="w-6 h-6 flex items-center justify-center text-(--journal-ink) border border-(--journal-warm) hover:bg-(--journal-tan) transition-all cursor-pointer"
                    style={{ borderRadius: '2px 5px 3px 6px' }}
                    aria-label="Add row"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>

              {/* Cell editor */}
              {selectedCell &&
                (() => {
                  const key = `${selectedCell.col}-${selectedCell.row}`
                  const cellData = cells.get(key)
                  const cellPixel = cellData?.pixelId
                    ? pixels.find((p) => p.id === cellData.pixelId)
                    : null
                  const endGoal = cellPixel?.endGoal ?? 100
                  const unit = cellPixel?.unit ?? ''
                  const fillPct = cellData
                    ? Math.min(100, ((cellData.value ?? 0) / endGoal) * 100)
                    : 0

                  return (
                    <div
                      className="mt-2 p-3"
                      style={{
                        backgroundColor: 'var(--journal-paper)',
                        border: '1.5px solid var(--journal-warm)',
                        borderRadius: '3px 8px 5px 10px',
                      }}
                    >
                      {cellData && (
                        <div className="flex items-center justify-end mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCells((prev) => {
                                const next = new Map(prev)
                                next.delete(key)
                                return next
                              })
                            }}
                            className="text-xs font-serif text-(--journal-ink) opacity-40 hover:opacity-80 cursor-pointer transition-opacity"
                          >
                            clear
                          </button>
                        </div>
                      )}

                      {!cellPixel ? (
                        <>
                          {pixels.length === 0 && (
                            <p className="text-sm font-serif text-(--journal-ink) opacity-40 text-center py-2">
                              No pixels available — create one below!
                            </p>
                          )}
                          {onCreatePixel && (
                            <button
                              type="button"
                              onClick={onCreatePixel}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-serif text-(--journal-ink) opacity-60 hover:opacity-100 border border-dashed border-(--journal-warm) transition-all cursor-pointer mb-1"
                              style={{ borderRadius: '2px 6px 3px 7px' }}
                            >
                              {'+ New Pixel'}
                            </button>
                          )}
                          {pixels.length > 0 && (
                            <div className="flex flex-wrap">
                              {pixels.map((pixel) => {
                                const PixelColor = PIXEL_COLORS[pixel.color]
                                return (
                                  <button
                                    key={pixel.id}
                                    type="button"
                                    onClick={() =>
                                      assignPixelToCell(
                                        pixel.id,
                                        selectedCell.col,
                                        selectedCell.row,
                                      )
                                    }
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all cursor-pointer hover:bg-(--journal-cream)"
                                    style={{ borderRadius: '2px 6px 3px 7px' }}
                                  >
                                    {/* Color dot */}
                                    <div
                                      className="w-3 h-3 shrink-0"
                                      style={{
                                        backgroundColor: PixelColor.bg,
                                        borderRadius: '1px 3px 2px 4px',
                                      }}
                                    />

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-base text-(--journal-ink) truncate pixel font-sans">
                                        {pixel.name}
                                      </span>
                                    </div>

                                    {/* Goal badge */}
                                    <span
                                      className="text-xs text-(--journal-ink) opacity-50 font-serif shrink-0 px-1.5 py-0.5 bg-(--journal-paper)"
                                      style={{ borderRadius: '1px 4px 2px 5px' }}
                                    >
                                      {pixel.endGoal} {pixel.unit}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-3">
                          {/* Assigned pixel summary */}
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 shrink-0"
                              style={{
                                backgroundColor: PIXEL_COLORS[cellPixel.color].bg,
                                borderRadius: '1px 3px 2px 4px',
                              }}
                            />
                            <span className="text-base font-bold text-(--journal-ink) flex-1 truncate">
                              {cellPixel.name}
                            </span>
                            <span className="text-xs text-(--journal-ink) opacity-50 font-serif shrink-0">
                              {PIXEL_TYPE_LABELS[cellPixel.type]}
                            </span>
                          </div>

                          {/* Value input based on type */}
                          {cellData!.type === 'boolean' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCell(key, {
                                    // flip completedAt state
                                    value: cellData!.completedAt ? null : 100,
                                    progress: cellData!.completedAt ? 0 : 100,
                                    updatedAt: new Date(),
                                    completedAt: cellData!.completedAt
                                      ? null
                                      : new Date(),
                                  })
                                }
                                className={`w-6 h-6 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                  cellData!.completedAt
                                    ? 'bg-(--journal-ink)'
                                    : 'border-2 border-(--journal-warm)'
                                }`}
                                style={{ borderRadius: '2px 5px 3px 6px' }}
                              >
                                {cellData!.completedAt && (
                                  <Check
                                    size={14}
                                    className="text-(--journal-paper)"
                                  />
                                )}
                              </button>
                              <span className="text-sm font-serif text-(--journal-ink) opacity-60">
                                {cellData!.completedAt ? 'completed' : 'not done'}
                              </span>
                            </div>
                          )}

                          {cellData!.type === 'numeric' && (
                            <div>
                              <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-serif text-(--journal-ink) opacity-50">
                                  value
                                </span>
                                <span className="text-sm font-sans text-(--journal-ink)">
                                  <span className="font-bold">
                                    {cellData!.value ?? 0}
                                  </span>
                                  <span className="opacity-40">
                                    {' '}
                                    / {endGoal} {unit}s
                                  </span>
                                </span>
                              </div>
                              <div
                                className="relative h-2 w-full rounded-full overflow-hidden"
                                style={{
                                  background: 'var(--journal-warm)',
                                  opacity: 1,
                                }}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 transition-all"
                                  style={{
                                    width: `${fillPct}%`,
                                    background: 'var(--journal-ink)',
                                    borderRadius: 'inherit',
                                  }}
                                />
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={endGoal}
                                value={cellData!.value ?? 0}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value)
                                  const newDate = new Date()
                                  return updateCell(key, {
                                    value: newValue,
                                    progress: (newValue / endGoal) * 100,
                                    updatedAt: newDate,
                                    completedAt:
                                      newValue === endGoal ? null : newDate,
                                  })
                                }}
                                className="w-full mt-1 cursor-pointer accent-(--journal-ink)"
                              />
                            </div>
                          )}

                          {cellData!.type === 'rating' && (
                            <div>
                              <span className="text-xs font-serif text-(--journal-ink) opacity-50 block mb-1.5">
                                rating
                              </span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => {
                                      const newDate = new Date()
                                      // flip if selected star is clicked again, else set to star value
                                      return updateCell(key, {
                                        value:
                                          cellData!.value === star
                                            ? null
                                            : star,
                                        progress:
                                          cellData!.value === star
                                            ? 0
                                            : (star / endGoal) * 100,
                                        updatedAt: newDate,
                                        completedAt:
                                          cellData!.value === star
                                            ? null
                                            : star === endGoal // if star value matches endGoal, set to completed
                                              ? newDate
                                              : null,
                                      })
                                    }}
                                    className="cursor-pointer transition-all hover:scale-110"
                                  >
                                    <Star
                                      size={22}
                                      className={
                                        (cellData!.value ?? 0) >= star
                                          ? 'text-(--journal-gold) fill-(--journal-gold)'
                                          : 'text-(--journal-warm)'
                                      }
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {cellData!.type === 'time' && (
                            <div>
                              <div className="flex items-baseline justify-between mb-2">
                                <span className="text-xs font-serif text-(--journal-ink) opacity-50">
                                  duration
                                </span>
                                <span className="text-sm font-sans text-(--journal-ink)">
                                  <span className="font-bold">
                                    {cellData!.value ?? 0}
                                  </span>
                                  <span className="opacity-40">
                                    {' '}
                                    / {endGoal} {unit}
                                  </span>
                                </span>
                              </div>
                              <div
                                className="relative h-2 w-full rounded-full overflow-hidden"
                                style={{ background: 'var(--journal-warm)' }}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 transition-all"
                                  style={{
                                    width: `${fillPct}%`,
                                    background: 'var(--journal-ink)',
                                    borderRadius: 'inherit',
                                  }}
                                />
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={endGoal}
                                value={cellData!.value ?? 0}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value)
                                  const newDate = new Date()
                                  return updateCell(key, {
                                    value: newValue,
                                    progress: (newValue / endGoal) * 100,
                                    updatedAt: newDate,
                                    completedAt:
                                      newValue === endGoal ? null : newDate,
                                  })
                                }}
                                className="w-full mt-1 cursor-pointer accent-(--journal-ink)"
                              />
                            </div>
                          )}

                          {/* Note */}
                          <div>
                            <span className="text-xs font-serif text-(--journal-ink) opacity-50 block mb-1">
                              note
                            </span>
                            <textarea
                              value={cellData!.note ?? ''}
                              onChange={(e) =>
                                updateCell(key, {
                                  note: e.target.value || null,
                                })
                              }
                              placeholder="add a note…"
                              rows={2}
                              className="w-full bg-transparent border-b-2 border-(--journal-warm) text-(--journal-ink) text-sm py-1 px-1 placeholder:text-(--journal-warm) focus:border-(--journal-ink) outline-none transition-colors font-sans resize-none"
                            />
                          </div>

                          {/* Timer */}
                          <div>
                            {cellData!.timerMinutes != null ? (
                              <CountdownTimer
                                timerMinutes={cellData!.timerMinutes}
                                timerStartedAt={cellData!.timerStartedAt ?? null}
                                onStart={() =>
                                  updateCell(key, { timerStartedAt: new Date() })
                                }
                                onPause={() => {
                                  const startedAt = cellData!.timerStartedAt
                                  const elapsed = startedAt
                                    ? Math.floor(
                                        (Date.now() -
                                          new Date(startedAt).getTime()) /
                                          1000,
                                      )
                                    : 0
                                  const remainingSeconds = Math.max(
                                    0,
                                    cellData!.timerMinutes! * 60 - elapsed,
                                  )
                                  updateCell(key, {
                                    timerMinutes: Math.max(
                                      1,
                                      Math.ceil(remainingSeconds / 60),
                                    ),
                                    timerStartedAt: null,
                                  })
                                }}
                                onDisable={() =>
                                  updateCell(key, {
                                    timerMinutes: null,
                                    timerStartedAt: null,
                                  })
                                }
                                onEditMinutes={(value) =>
                                  updateCell(key, { timerMinutes: value })
                                }
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  updateCell(key, {
                                    timerMinutes:
                                      getDefaultTimerMinutes(cellPixel),
                                    timerStartedAt: null,
                                  })
                                }
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-serif text-(--journal-ink) opacity-60 hover:opacity-100 border border-dashed border-(--journal-warm) transition-all cursor-pointer"
                                style={{ borderRadius: '2px 6px 3px 7px' }}
                              >
                                {'+ Enable Timer'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
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
