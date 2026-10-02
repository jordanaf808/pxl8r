import type { Cell, Grid, GridPixel, Pixel } from '@/db/types'

export const GRID_ID = 'grid-1'
export const CREATED_AT = new Date('2026-01-01T00:00:00Z')
export const LATER = new Date('2026-01-02T00:00:00Z')

export function makeGrid(): Grid {
  return {
    id: GRID_ID,
    ownerId: 'user-1',
    name: 'Daily goals',
    description: null,
    isPublic: false,
    columns: 7,
    rows: 4,
    scaleType: 'daily',
    scaleUnit: 'percent',
    scaleStart: 0,
    scaleEnd: 100,
    scaleLabel: '%',
    theme: 'journal',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }
}

export function makePixel(id: string, name = id): Pixel {
  return {
    id,
    ownerId: 'user-1',
    name,
    description: null,
    type: 'habit',
    unit: 'count',
    endGoal: null,
    color: 'sage',
    isActive: false,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }
}

export function makeGridPixel({
  pixelId,
  position,
  sortOrder = 'manual',
  name,
}: {
  pixelId: string
  position: number
  sortOrder?: string
  name?: string
}): GridPixel {
  return {
    gridId: GRID_ID,
    sortOrder,
    position,
    pixel: makePixel(pixelId, name),
  }
}

export function makeCell({
  id,
  pixelId,
  position,
  createdAt = CREATED_AT,
}: {
  id: string
  pixelId: string
  position: number
  createdAt?: Date | null
}): Cell {
  return {
    id,
    ownerId: 'user-1',
    gridId: GRID_ID,
    pixelId,
    type: 'boolean',
    position,
    value: null,
    note: null,
    progress: 0,
    completedAt: null,
    timerMinutes: null,
    timerStartedAt: null,
    colorOverride: null,
    createdAt,
    updatedAt: createdAt,
  }
}
