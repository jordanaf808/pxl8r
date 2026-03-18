'use client'

import { useEffect, useState } from 'react'
import { Plus, LogOut, Search, Layers } from 'lucide-react'
import { SketchyDivider, DoodleStar } from '@/components/sketchy-elements'
import { BlockCard } from '@/components/block-card'
import { BlockGroupCard } from '@/components/block-group-card'
import { CreateBlockModal } from '@/components/create-block-modal'
import { CreateGroupModal } from '@/components/create-group-modal'
import { StatsBar } from '@/components/stats-bar'
import type { Block, BlockType, BlockGroup } from '@/db/types'
import { BLOCK_TYPE_LABELS } from '@/db/types'
import type { NewPixel, Pixel, NewUser, User, Grid, Page } from '@/db/schema'
import { SAMPLE_BLOCKS, SAMPLE_GROUPS } from '@/db/mock-data'
import {
  createPixel as createPixelServerFn,
  updatePixel as updatePixelServerFn,
} from '@/db/mutations.server'
import { useServerFn } from '@tanstack/react-start'

interface DashboardProps {
  user: NewUser
  userData: {
    pixels: Pixel[]
    grids: Grid[]
    pages: Page[]
  }
  onLogout: () => void
}

export function Dashboard({ user, userData, onLogout }: DashboardProps) {
  const createPixel = useServerFn(createPixelServerFn)
  const updatePixel = useServerFn(updatePixelServerFn)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [groups, setGroups] = useState<BlockGroup[]>(SAMPLE_GROUPS)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<BlockGroup | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<BlockType | 'all'>('all')

  useEffect(() => {
    setPixels(userData.pixels)
  }, [])

  // ---- Block CRUD ----
  const createPixelHandler = async (
    // pixelData: Omit<NewPixel, 'id' | 'ownerId' | 'completed' | 'progress' | 'createdAt' | 'updatedAt'>,
    pixelData: NewPixel,
  ) => {
    // could maybe have some loading animation that shows building the pixel in, like 3 stages.
    const createdPixel = await createPixel({ data: pixelData })
    console.log('//// createPixel response: ', createdPixel)
    if (createdPixel.length < 1)
      throw new Error('Error creating pixel: ', { cause: createdPixel })
    // const newPixel: NewPixel = {
    //   ...pixelData,
    // }
    setPixels((prev) => [...createdPixel, ...prev])

    console.log('//// createPixel - pixels set')
  }

  const toggleComplete = async (id: string) => {
    let updatedPixel
    setPixels((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedPixel = {
            ...p,
            completed: !p.completed,
            progress: !p.completed ? 100 : p.progress,
            // completedAt: !p.completed ? new Date().toISOString() : undefined,
          }
          return updatedPixel
        } else {
          return p
        }
      }),
    )
    if (updatedPixel) {
      const response = await updatePixel(updatedPixel)
    }
  }

  const updateProgress = (id: string, progress: number) => {
    setPixels((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              progress,
              completed: progress === 100,
              completedAt:
                progress === 100 ? new Date().toISOString() : p.completed,
            }
          : p,
      ),
    )
  }

  const deletePixel = (id: string) => {
    setPixels((prev) => prev.filter((p) => p.id !== id))
    // Also remove from any groups
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pixelIds: g.pixelIds.filter((bid) => bid !== id),
      })),
    )
  }

  // ---- Group CRUD ----
  const addGroup = (groupData: Omit<BlockGroup, 'id' | 'createdAt'>) => {
    const newGroup: BlockGroup = {
      ...groupData,
      id: 'g' + Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setGroups((prev) => [newGroup, ...prev])
    // Mark pixels as belonging to this group
    setPixels((prev) =>
      prev.map((p) =>
        groupData.pixelIds.includes(p.id) ? { ...p, groupId: newGroup.id } : p,
      ),
    )
  }

  const updateGroup = (updated: BlockGroup) => {
    const oldGroup = groups.find((g) => g.id === updated.id)
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))

    // Unassign pixels that were removed
    const removedIds = (oldGroup?.pixelIds ?? []).filter(
      (id) => !updated.pixelIds.includes(id),
    )
    // Assign pixels that were added
    setPixels((prev) =>
      prev.map((p) => {
        if (updated.pixelIds.includes(p.id))
          return { ...p, groupId: updated.id }
        if (removedIds.includes(p.id)) return { ...p, groupId: undefined }
        return p
      }),
    )
  }

  const deleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    // Unassign pixels
    if (group) {
      setPixels((prev) =>
        prev.map((p) =>
          group.pixelIds.includes(p.id) ? { ...p, groupId: undefined } : p,
        ),
      )
    }
  }

  const moveBlockToGroup = (blockId: string, groupId: string | null) => {
    // Remove from old group
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        pixelIds: g.pixelIds.filter((id) => id !== blockId),
      })),
    )
    if (groupId) {
      // Add to new group
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, pixelIds: [...g.pixelIds, blockId] } : g,
        ),
      )
    }
    setPixels((prev) =>
      prev.map((p) =>
        p.id === blockId ? { ...p, groupId: groupId ?? undefined } : p,
      ),
    )
  }

  const removeBlockFromGroup = (blockId: string, groupId: string) => {
    moveBlockToGroup(blockId, null)
  }

  // ---- Derived data ----
  const ungroupedBlocks = pixels.filter((p) => !p.groupId)

  const filteredUngroupedBlocks = ungroupedBlocks.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || p.type === filterType
    return matchesSearch && matchesType
  })

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description.toLowerCase().includes(searchTerm.toLowerCase())
    // If type filter is active, show group only if it contains a block of that type
    const matchesType =
      filterType === 'all' ||
      g.pixelIds.some((bid) => {
        const block = pixels.find((p) => p.id === bid)
        return block && block.type === filterType
      })
    return matchesSearch && matchesType
  })

  const blockTypes = Object.entries(BLOCK_TYPE_LABELS) as [BlockType, string][]

  // For the group modal: pixels available to add (ungrouped ones, or if editing, also already-in-group ones)
  const blocksAvailableForGroupModal = editingGroup
    ? pixels.filter((p) => !p.groupId || p.groupId === editingGroup.id)
    : ungroupedBlocks

  const groupNameMap = new Map(groups.map((g) => [g.id, g.name]))

  return (
    <div className="min-h-screen paper-dots">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--journal-cream)]/95 backdrop-blur-sm border-p-2 border-[var(--journal-warm)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DoodleStar size={24} className="text-[var(--journal-gold)]" />
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--journal-ink)]">
              BlockJournal
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-base font-serif text-[var(--journal-ink)] opacity-60 hidden sm:inline">
              {user.name}
              {"'s journal"}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-[var(--journal-ink)] opacity-50 hover:opacity-100 transition-opacity font-serif cursor-pointer"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Close Journal</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--journal-ink)] leading-tight text-balance">
            {'Hey, '}
            {user.name}
          </h2>
          <p className="text-lg text-[var(--journal-ink)] opacity-50 font-serif mt-1">
            {"Here's what you're building toward..."}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsBar blocks={pixels} groupCount={groups.length} />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div
              className="flex items-center gap-2 bg-[var(--journal-cream)] px-3 py-2 border-2 border-[var(--journal-warm)] focus-within:border-[var(--journal-ink)] transition-colors"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              <Search
                size={18}
                className="text-[var(--journal-ink)] opacity-40"
              />
              <input
                type="text"
                placeholder="Search pixels & groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-[var(--journal-ink)] text-lg placeholder:text-[var(--journal-warm)] outline-none w-40 md:w-56 font-sans"
              />
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-sm font-serif transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                    : 'bg-[var(--journal-cream)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                }`}
                style={{ borderRadius: '2px 6px 3px 7px' }}
              >
                All
              </button>
              {blockTypes.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`px-3 py-1 text-sm font-serif transition-all cursor-pointer ${
                    filterType === key
                      ? 'bg-[var(--journal-ink)] text-[var(--journal-paper)]'
                      : 'bg-[var(--journal-cream)] text-[var(--journal-ink)] border border-[var(--journal-warm)] hover:bg-[var(--journal-tan)]'
                  }`}
                  style={{ borderRadius: '2px 6px 3px 7px' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setEditingGroup(null)
                setIsGroupModalOpen(true)
              }}
              className="flex items-center gap-2 bg-[var(--journal-cream)] text-[var(--journal-ink)] px-4 py-2.5 text-lg font-serif hover:bg-[var(--journal-tan)] active:translate-y-px transition-all cursor-pointer"
              style={{
                borderRadius: '3px 8px 5px 10px',
                border: '2px dashed var(--journal-warm)',
              }}
            >
              <Layers size={18} />
              New Group
            </button>
            <button
              onClick={() => setIsBlockModalOpen(true)}
              className="flex items-center gap-2 bg-[var(--journal-ink)] text-[var(--journal-paper)] px-5 py-2.5 text-lg font-serif hover:bg-[var(--journal-ink)]/90 active:translate-y-px transition-all cursor-pointer"
              style={{ borderRadius: '3px 8px 5px 10px' }}
            >
              <Plus size={20} />
              New Block
            </button>
          </div>
        </div>

        <SketchyDivider className="text-[var(--journal-warm)] mb-6" />

        {/* Mixed Grid: groups + ungrouped pixels */}
        {filteredGroups.length > 0 || filteredUngroupedBlocks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-grid">
            {/* Groups first */}
            {filteredGroups.map((group) => (
              <BlockGroupCard
                key={group.id}
                group={group}
                blocks={pixels}
                onEdit={(g) => {
                  setEditingGroup(g)
                  setIsGroupModalOpen(true)
                }}
                onDelete={deleteGroup}
                onRemoveBlock={removeBlockFromGroup}
              />
            ))}

            {/* Ungrouped pixels */}
            {filteredUngroupedBlocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onToggleComplete={toggleComplete}
                onUpdateProgress={updateProgress}
                onDelete={deletePixel}
                groups={groups}
                onMoveToGroup={moveBlockToGroup}
                groupName={
                  block.groupId ? groupNameMap.get(block.groupId) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              viewBox="0 0 80 80"
              width={80}
              height={80}
              className="text-[var(--journal-warm)] mb-4"
            >
              <rect
                x="10"
                y="10"
                width="60"
                height="60"
                rx="4"
                ry="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M30 40h20 M40 30v20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-2xl text-[var(--journal-ink)] opacity-40 font-sans text-center text-balance">
              {searchTerm || filterType !== 'all'
                ? 'No pixels or groups match your search'
                : 'Your journal is empty'}
            </p>
            <p className="text-base text-[var(--journal-ink)] opacity-30 font-serif mt-1 text-center">
              {searchTerm || filterType !== 'all'
                ? 'Try a different search or filter'
                : 'Add your first block to get started!'}
            </p>
          </div>
        )}

        {/* Bottom decoration */}
        <div className="mt-12 text-center">
          <SketchyDivider className="text-[var(--journal-warm)] mb-3" />
          <p className="text-sm text-[var(--journal-ink)] opacity-30 font-serif">
            {'~ stack your pixels, build your dreams ~'}
          </p>
        </div>
      </main>

      {/* Create Block Modal */}
      <CreateBlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSubmit={createPixelHandler}
      />

      {/* Create / Edit Group Modal */}
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false)
          setEditingGroup(null)
        }}
        onSubmit={addGroup}
        ungroupedBlocks={blocksAvailableForGroupModal}
        editGroup={editingGroup}
        onUpdate={updateGroup}
      />
    </div>
  )
}
