import { useState, useMemo } from 'react'
import { Plus, X, Search, Trash2, Layers } from 'lucide-react'
import { SketchyDivider } from '@/components/sketchy-elements'
import type { Pixel } from '@/db/types'
import { PIXEL_COLORS, PIXEL_TYPE_LABELS } from '@/db/types'

interface PixelSidebarProps {
  pixels: Pixel[]
  onDeletePixel: (pixelId: string) => void
  onNewPixel: () => void
  onSelectPixel: (pixel: Pixel) => void
}

function PixelRow({
  pixel,
  isConfirmingDelete,
  onClick,
  onDeleteClick,
}: {
  pixel: Pixel
  isConfirmingDelete: boolean
  onClick: () => void
  onDeleteClick: (e: React.MouseEvent) => void
}) {
  const colorInfo = PIXEL_COLORS[pixel.color]

  return (
    <li
      onClick={onClick}
      className={`group flex items-start gap-2.5 px-3 py-2.5 transition-colors cursor-pointer hover:bg-(--journal-tan) ${
        isConfirmingDelete ? 'bg-(--journal-rust)/10' : ''
      }`}
      style={{ borderRadius: '2px 6px 3px 7px' }}
    >
      {/* Color dot */}
      <div
        className="w-2.5 h-2.5 mt-1 shrink-0"
        style={{
          backgroundColor: colorInfo.bg,
          borderRadius: '1px 3px 2px 4px',
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-bold text-(--journal-ink) truncate leading-tight flex-1 ${
              isConfirmingDelete ? 'opacity-60' : ''
            }`}
          >
            {pixel.name}
          </span>

          {isConfirmingDelete ? (
            <span className="text-[10px] font-serif text-(--journal-rust) shrink-0 whitespace-nowrap">
              tap again
            </span>
          ) : (
            <span
              className="text-[10px] font-serif px-1.5 py-0.5 bg-(--journal-tan) text-(--journal-ink) opacity-70 shrink-0 whitespace-nowrap"
              style={{ borderRadius: '1px 4px 2px 5px' }}
            >
              {PIXEL_TYPE_LABELS[pixel.type]}
            </span>
          )}

          <button
            onClick={onDeleteClick}
            className={`shrink-0 transition-opacity cursor-pointer ${
              isConfirmingDelete
                ? 'opacity-100 text-(--journal-rust)'
                : 'opacity-0 group-hover:opacity-40 hover:opacity-100! text-(--journal-ink)'
            }`}
            aria-label={isConfirmingDelete ? 'Confirm delete' : `Delete ${pixel.name}`}
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Description */}
        {pixel.description && (
          <p className="text-xs text-(--journal-ink) opacity-50 font-serif truncate mt-0.5 leading-snug">
            {pixel.description}
          </p>
        )}

        {/* Meta: unit · end goal */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] font-serif text-(--journal-ink) opacity-40 capitalize">
            {pixel.unit}
          </span>
          {pixel.endGoal != null && (
            <>
              <span className="text-[10px] text-(--journal-ink) opacity-20">·</span>
              <span className="text-[10px] font-serif text-(--journal-ink) opacity-40">
                goal: {pixel.endGoal}
              </span>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

export function PixelSidebar({ pixels, onDeletePixel, onNewPixel, onSelectPixel }: PixelSidebarProps) {
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      pixels.filter(
        (p) =>
          p.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          p.type.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(sidebarSearch.toLowerCase()),
      ),
    [pixels, sidebarSearch],
  )

  return (
    <aside
      className="w-64 shrink-0 sticky top-6 self-start flex flex-col bg-(--journal-cream)"
      style={{
        border: '2px solid var(--journal-ink)',
        borderRadius: '3px 10px 5px 12px',
        boxShadow: '3px 3px 0px var(--journal-warm)',
        maxHeight: 'calc(100vh - 6rem)',
      }}
      onClick={() => setConfirmDeleteId(null)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 shrink-0 border-b-2 border-(--journal-warm)">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-(--journal-ink) opacity-60" />
          <h3 className="text-base font-bold text-(--journal-ink)">Pixels</h3>
          <span
            className="text-[10px] font-serif px-1.5 py-0.5 bg-(--journal-tan) text-(--journal-ink) opacity-70"
            style={{ borderRadius: '2px 5px 3px 6px' }}
          >
            {pixels.length}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNewPixel()
          }}
          className="flex items-center gap-1 bg-(--journal-ink) text-(--journal-paper) px-2.5 py-1 text-xs font-serif hover:bg-(--journal-ink)/90 active:translate-y-px transition-all cursor-pointer"
          style={{ borderRadius: '2px 6px 3px 7px' }}
        >
          <Plus size={12} />
          New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0 border-b border-(--journal-warm)">
        <div
          className="flex items-center gap-1.5 bg-(--journal-paper) px-2.5 py-1.5 border border-(--journal-warm) focus-within:border-(--journal-ink) transition-colors"
          style={{ borderRadius: '2px 7px 4px 9px' }}
        >
          <Search size={12} className="text-(--journal-ink) opacity-40 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent text-(--journal-ink) text-xs placeholder:text-(--journal-warm) outline-none w-full font-serif"
          />
          {sidebarSearch && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSidebarSearch('')
              }}
              className="text-(--journal-ink) opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Pixel list */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-3">
            <p className="text-xs text-(--journal-ink) opacity-40 font-serif">
              {sidebarSearch ? 'No pixels match' : 'No pixels yet'}
            </p>
            {!sidebarSearch && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNewPixel()
                }}
                className="mt-2 text-[10px] font-serif text-(--journal-ink) opacity-50 hover:opacity-100 underline underline-offset-2 cursor-pointer transition-opacity"
              >
                Create your first pixel
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((pixel) => (
              <PixelRow
                key={pixel.id}
                pixel={pixel}
                isConfirmingDelete={confirmDeleteId === pixel.id}
                onClick={() => onSelectPixel(pixel)}
                onDeleteClick={(e) => {
                  e.stopPropagation()
                  if (confirmDeleteId === pixel.id) {
                    onDeletePixel(pixel.id)
                    setConfirmDeleteId(null)
                  } else {
                    setConfirmDeleteId(pixel.id)
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 shrink-0 border-t border-(--journal-warm)">
        <SketchyDivider className="text-(--journal-warm)" />
        <p className="text-[10px] text-(--journal-ink) opacity-30 font-serif text-center mt-1">
          {pixels.length} pixel{pixels.length !== 1 ? 's' : ''}
        </p>
      </div>
    </aside>
  )
}
