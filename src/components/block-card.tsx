"use client"

import { useState, useRef, useEffect } from "react"
import { Trash2, FolderInput } from "lucide-react"
import { DoodleCheckmark, DoodleStar, DoodleCircle } from "@/components/sketchy-elements"
import type { Block, BlockGroup } from "@/lib/types"
import { BLOCK_TYPE_LABELS, BLOCK_COLORS } from "@/lib/types"

const TYPE_DOODLES: Record<string, React.ReactNode> = {
  workout: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M4 12h16M7 8v8M17 8v8M2 10v4M22 10v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  project: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M3 7h18v12H3z M3 7l4-3h10l4 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v10M9 9.5c0-1 1.3-2 3-2s3 .8 3 2-1.3 2-3 2-3 .8-3 2 1.3 2 3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  mood: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M12 3 C6 3, 3 8, 3 12 C3 18, 8 21, 12 21 C16 21, 21 18, 21 12 C21 8, 18 3, 12 3 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      <path d="M8 15 Q12 18, 16 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  skill: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M12 3 L14 9 L20 10 L15 14 L17 20 L12 16 L7 20 L9 14 L4 10 L10 9 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  habit: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M17 2 L21 6 L17 10 M21 6 H7 M7 22 L3 18 L7 14 M3 18 H17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reading: (
    <svg viewBox="0 0 24 24" width={18} height={18} className="inline-block">
      <path d="M2 4h8c2 0 2 1 2 2v14s-1-1-2-1H2V4z M22 4h-8c-2 0-2 1-2 2v14s1-1 2-1h8V4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  custom: (
    <DoodleStar size={18} />
  ),
}

interface BlockCardProps {
  block: Block
  onToggleComplete: (id: string) => void
  onUpdateProgress: (id: string, progress: number) => void
  onDelete: (id: string) => void
  groups?: BlockGroup[]
  onMoveToGroup?: (blockId: string, groupId: string | null) => void
  /** The name of the group this block currently belongs to */
  groupName?: string
}

export function BlockCard({
  block,
  onToggleComplete,
  onUpdateProgress,
  onDelete,
  groups = [],
  onMoveToGroup,
  groupName,
}: BlockCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const colorInfo = BLOCK_COLORS[block.color]

  // Close menu on outside click
  useEffect(() => {
    if (!showGroupMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowGroupMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showGroupMenu])

  // Generate slight rotation for hand-drawn feel
  const rotation = ((block.id.charCodeAt(0) % 5) - 2) * 0.5

  return (
    <div
      className="relative animate-float-in group"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card */}
      <div
        className="relative p-5 transition-all duration-200 hover:-translate-y-1"
        style={{
          backgroundColor: colorInfo.bg,
          color: colorInfo.text,
          borderRadius: "4px 12px 6px 14px",
          boxShadow: isHovered
            ? "4px 4px 0px var(--journal-warm), 6px 6px 0px rgba(0,0,0,0.05)"
            : "2px 2px 0px var(--journal-warm)",
        }}
      >
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-70 transition-opacity">
          {/* Move to group */}
          {onMoveToGroup && groups.length > 0 && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowGroupMenu((v) => !v)}
                className="hover:opacity-100 cursor-pointer"
                aria-label="Move to group"
              >
                <FolderInput size={16} />
              </button>

              {showGroupMenu && (
                <div
                  className="absolute right-0 top-7 z-20 bg-[var(--journal-cream)] w-44 py-1 shadow-lg animate-float-in"
                  style={{
                    border: "1.5px solid var(--journal-warm)",
                    borderRadius: "3px 8px 5px 10px",
                  }}
                >
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onMoveToGroup(block.id, g.id)
                        setShowGroupMenu(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm font-serif text-[var(--journal-ink)] hover:bg-[var(--journal-tan)] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <div
                        className="w-2.5 h-2.5 shrink-0"
                        style={{
                          backgroundColor: BLOCK_COLORS[g.color].bg,
                          borderRadius: "1px 3px 2px 4px",
                        }}
                      />
                      <span className="truncate">{g.name}</span>
                    </button>
                  ))}
                  {block.groupId && (
                    <button
                      onClick={() => {
                        onMoveToGroup(block.id, null)
                        setShowGroupMenu(false)
                      }}
                      className="w-full text-left px-3 py-1.5 text-sm font-serif text-[var(--journal-rust)] hover:bg-[var(--journal-tan)] transition-colors cursor-pointer border-t border-[var(--journal-warm)]"
                    >
                      Remove from group
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onDelete(block.id)}
            className="hover:opacity-100 cursor-pointer"
            aria-label="Delete block"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Group name badge (if block belongs to a group) */}
        {groupName && (
          <div
            className="inline-flex items-center gap-1 text-xs font-serif px-2 py-0.5 mb-2 opacity-70"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "1px 4px 2px 5px",
            }}
          >
            <svg viewBox="0 0 12 12" width={10} height={10}>
              <rect x="1" y="6" width="10" height="5" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <rect x="2" y="3.5" width="8" height="3" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            {groupName}
          </div>
        )}

        {/* Type badge */}
        <div className="flex items-center gap-1.5 mb-2 opacity-80">
          {TYPE_DOODLES[block.type]}
          <span className="text-sm font-serif uppercase tracking-wide">
            {BLOCK_TYPE_LABELS[block.type]}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold mb-1 leading-tight pr-6">
          {block.name}
        </h3>

        {/* Description */}
        <p className="text-sm opacity-80 mb-3 font-serif leading-relaxed line-clamp-2">
          {block.description}
        </p>

        {/* End goal */}
        <div
          className="text-sm font-serif px-2 py-1 mb-3 inline-block"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "2px 5px 3px 6px",
          }}
        >
          {"Goal: "}{block.endGoal}
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-serif opacity-70">Progress</span>
            <span className="text-sm font-bold">{block.progress}%</span>
          </div>
          <div
            className="w-full h-3 relative overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "2px 4px 3px 5px",
            }}
          >
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${block.progress}%`,
                backgroundColor: "rgba(255,255,255,0.5)",
                borderRadius: "2px 4px 3px 5px",
              }}
            />
            {/* Sketch marks on the bar */}
            {[25, 50, 75].map((mark) => (
              <div
                key={mark}
                className="absolute top-0 h-full w-px opacity-30"
                style={{ left: `${mark}%`, backgroundColor: colorInfo.text }}
              />
            ))}
          </div>
          {/* Progress slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={block.progress}
            onChange={(e) => onUpdateProgress(block.id, Number(e.target.value))}
            className="w-full mt-1 accent-white opacity-60 hover:opacity-100 transition-opacity cursor-pointer h-1"
            aria-label={`Progress for ${block.name}`}
          />
        </div>

        {/* Complete toggle */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
          <button
            onClick={() => onToggleComplete(block.id)}
            className="flex items-center gap-2 cursor-pointer group/check"
          >
            <div
              className={`w-5 h-5 flex items-center justify-center transition-all ${
                block.completed
                  ? "bg-white/30"
                  : "border-2 border-white/40"
              }`}
              style={{ borderRadius: "2px 5px 3px 6px" }}
            >
              {block.completed && <DoodleCheckmark size={14} />}
            </div>
            <span className="text-sm font-serif group-hover/check:opacity-100 opacity-70 transition-opacity">
              {block.completed ? "Completed!" : "Mark complete"}
            </span>
          </button>

          {block.completed && (
            <DoodleCircle size={16} className="opacity-50" />
          )}
        </div>
      </div>
    </div>
  )
}
