import { useState } from 'react'
import { X } from 'lucide-react'
import { SketchyDivider, DoodleStar } from '@/components/sketchy-elements'
import type {
  PixelUnitType,
  PixelTypeType,
  NewPixel,
  Pixel,
  PixelColor,
  UpdatePixelType,
} from '@/db/types'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS, PIXEL_UNIT_LABELS } from '@/db/types'
import { pixelTypeEnum, unitTypeEnum } from '@/db/schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const UNIT_SLIDER_MAX: Partial<Record<PixelUnitType, number>> = {
  minute: 240,
  hour: 72,
  day: 365,
}

interface CreatePixelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pixel: NewPixel) => void
  pixelToEdit?: Pixel
  onUpdate?: (pixel: UpdatePixelType) => void
}

export function CreatePixelModal({
  isOpen,
  onClose,
  onSubmit,
  pixelToEdit,
  onUpdate,
}: CreatePixelModalProps) {
  const isEditing = !!pixelToEdit
  const [name, setName] = useState(
    pixelToEdit?.name ?? 'Go for a morning run',
  )
  const [description, setDescription] = useState(pixelToEdit?.description ?? '')
  const [type, setType] = useState<PixelTypeType>(pixelToEdit?.type ?? 'skill')
  const [unit, setUnit] = useState<PixelUnitType>(pixelToEdit?.unit ?? 'minute')
  const [endGoal, setEndGoal] = useState(pixelToEdit?.endGoal ?? 30)
  const [color, setColor] = useState<PixelColor>(pixelToEdit?.color ?? 'sage')
  const [timerMinutes, setTimerMinutes] = useState<number | null>(
    pixelToEdit?.timerMinutes ?? null,
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const unitSuffix = (u: string) => {
    let suffix = ''
    const endsInS = u.indexOf('s', u.length - 1) !== -1
    if (endGoal !== 1 && !endsInS) {
      suffix = 's'
    }
    return suffix
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Give your pixel a name!'
    if (!description.trim()) newErrors.description = "What's this pixel about?"
    if (!endGoal) newErrors.endGoal = 'What are you aiming for?'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      if (isEditing && onUpdate) {
        onUpdate({
          id: pixelToEdit.id,
          name,
          description,
          type,
          endGoal,
          unit,
          color,
          timerMinutes: timerMinutes ?? undefined,
        })
      } else {
        onSubmit({ name, description, type, endGoal, unit, color, timerMinutes })
      }
      setErrors({})
      onClose()
    }
  }

  const pixelTypes = pixelTypeEnum.enumValues
  const pixelUnits = unitTypeEnum.enumValues
  const pixelColors = Object.entries(PIXEL_COLORS) as [
    PixelColor,
    { bg: string; text: string; label: string },
  ][]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--journal-ink)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[var(--journal-cream)] sketch-border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-float-in"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X size={22} />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <DoodleStar size={20} className="text-[var(--journal-gold)]" />
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--journal-ink)]">
              {isEditing ? 'Edit Pixel' : 'New Pixel'}
            </h2>
          </div>
          <p className="text-[var(--journal-ink)] opacity-50 font-serif mb-4">
            {isEditing
              ? 'update your pixel details'
              : 'sketch out a new goal or task'}
          </p>
          <SketchyDivider className="text-[var(--journal-warm)] mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-1 font-serif">
                Pixel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={'e.g. "Run a Marathon"'}
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
                placeholder="What does this pixel involve?"
                rows={3}
                className="w-full bg-[var(--journal-paper)] border-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-lg py-2 px-3 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans resize-none paper-lines"
                style={{ borderRadius: '3px 8px 5px 10px' }}
              />
              {errors.description && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Type
              </label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as PixelTypeType)}
              >
                <SelectTrigger className="w-full bg-[var(--journal-paper)] border-[var(--journal-warm)] text-[var(--journal-ink)] font-serif text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-[var(--journal-cream)] border-[var(--journal-warm)]">
                  {pixelTypes.map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-[var(--journal-ink)] font-serif"
                    >
                      {PIXEL_TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Unit
              </label>
              <Select
                value={unit}
                onValueChange={(value) => {
                  const newUnit = value as PixelUnitType
                  setUnit(newUnit)
                  const newMax = UNIT_SLIDER_MAX[newUnit] ?? 10000
                  setEndGoal((prev) => Math.min(prev, newMax))
                }}
              >
                <SelectTrigger className="w-full bg-[var(--journal-paper)] border-[var(--journal-warm)] text-[var(--journal-ink)] font-serif text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70] bg-[var(--journal-cream)] border-[var(--journal-warm)]">
                  {pixelUnits.map((key) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-[var(--journal-ink)] font-serif"
                    >
                      {PIXEL_UNIT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Goal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="pixel text-lg text-[var(--journal-ink)] font-serif">
                  End Goal
                </label>
                <span className="text-lg font-bold text-[var(--journal-ink)] font-serif">
                  {endGoal}
                </span>
              </div>
              <Slider
                value={[endGoal]}
                min={0}
                max={UNIT_SLIDER_MAX[unit] ?? 10000}
                step={1}
                onValueChange={([value]) => setEndGoal(value)}
                className="py-2"
              />
              {endGoal && !errors.endGoal && (
                <p className="text-sm text-[var(--journal-ink)] mt-1 font-serif">
                  {`${unit}${unitSuffix(unit)}`}
                </p>
              )}
              {errors.endGoal && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.endGoal}
                </p>
              )}
            </div>

            {/* Timer */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-1 font-serif">
                {'Timer (optional)'}
              </label>
              <input
                type="number"
                value={timerMinutes ?? ''}
                min={1}
                max={999}
                onChange={(e) =>
                  setTimerMinutes(
                    e.target.value === '' ? null : parseInt(e.target.value),
                  )
                }
                placeholder={'e.g. "20" minutes'}
                className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
              />
              <p className="text-sm text-[var(--journal-ink)] opacity-50 mt-1 font-serif">
                {'set a duration to start as a countdown later'}
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Pixel Color
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
            </div>

            <SketchyDivider className="text-[var(--journal-warm)]" />

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[var(--journal-ink)] text-[var(--journal-paper)] text-xl py-3 font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              {isEditing ? 'Save Changes' : 'Add This Pixel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
