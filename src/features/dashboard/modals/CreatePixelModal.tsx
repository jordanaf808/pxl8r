'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { SketchyDivider, DoodleStar } from '@/components/sketchy-elements'
import type {
  PixelUnitType,
  PixelTypeType,
  NewPixel,
  PixelColor,
} from '@/db/types'
import { PIXEL_TYPE_LABELS, PIXEL_COLORS } from '@/db/types'
import { pixels } from '@/db/schema'

interface CreatePixelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pixel: NewPixel) => void
}

export function CreatePixelModal({
  isOpen,
  onClose,
  onSubmit,
}: CreatePixelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<PixelTypeType>('skill')
  const [unit, setUnit] = useState<PixelUnitType>('minute')
  const [endGoal, setEndGoal] = useState(30)
  const [color, setColor] = useState<PixelColor>('sage')
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

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
      onSubmit({ name, description, type, endGoal, unit, color })
      setName('')
      setDescription('')
      setType('project')
      setEndGoal(100)
      setColor('sage')
      setErrors({})
      onClose()
    }
  }

  const pixelUnits = Object.entries(pixels.$inferSelect.unit) as [
    PixelUnitType,
    string,
  ][]
  const pixelTypes = Object.entries(pixels.$inferSelect.type) as [
    PixelTypeType,
    string,
  ][]
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
              New Pixel
            </h2>
          </div>
          <p className="text-[var(--journal-ink)] opacity-50 font-serif mb-4">
            sketch out a new goal or task
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
              <div className="flex flex-wrap gap-2">
                {pixelTypes.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`px-3 py-1 text-base font-serif transition-all cursor-pointer ${
                      type === key
                        ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                        : 'bg-[var(--journal-paper)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                    }`}
                    style={{ borderRadius: '2px 6px 3px 7px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-2 font-serif">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {pixelUnits.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setUnit(key)}
                    className={`px-3 py-1 text-base font-serif transition-all cursor-pointer ${
                      unit === key
                        ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                        : 'bg-[var(--journal-paper)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                    }`}
                    style={{ borderRadius: '2px 6px 3px 7px' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* End Goal */}
            <div>
              <label className="pixel text-lg text-[var(--journal-ink)] mb-1 font-serif">
                End Goal
              </label>
              <input
                type="number"
                value={endGoal}
                min={0}
                max={10000}
                onChange={(e) => setEndGoal(parseInt(e.target.value))}
                placeholder={'e.g. "Complete 100 reps"'}
                className="w-full bg-transparent border-b-2 border-[var(--journal-warm)] text-[var(--journal-ink)] text-xl py-2 px-1 placeholder:text-[var(--journal-warm)] focus:border-[var(--journal-ink)] outline-none transition-colors font-sans"
              />
              {errors.endGoal && (
                <p className="text-sm text-[var(--journal-rust)] mt-1 font-serif">
                  {errors.endGoal}
                </p>
              )}
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
              Add This Pixel
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
