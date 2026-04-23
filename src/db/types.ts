import {
  cellTypeEnum,
  pixelTypeEnum,
  ColorTypeEnum,
  scaleTypeEnum,
  themeTypeEnum,
  unitTypeEnum,
} from '@/db/schema'
import type * as schema from './schema'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres/session'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { ExtractTablesWithRelations } from 'drizzle-orm/relations'
import z from 'zod'

export type PixelTypeType = typeof schema.pixels.$inferSelect.type
export type PixelUnitType = typeof schema.pixels.$inferSelect.unit

export type PixelColor = 'rust' | 'sage' | 'gold' | 'slate' | 'warm'

export interface Block {
  id: string
  name: string
  description: string
  type: string
  unit: typeof schema.unitTypeEnum
  endGoal: number
  color: string
  completed: boolean
  progress: number
  createdAt: string
  completedAt?: string
  groupId?: string
}

export interface BlockGroup {
  id: string
  name: string
  description: string
  color: PixelColor
  pixelIds: string[]
  createdAt: string
}

export const PIXEL_TYPE_LABELS: Record<PixelTypeType, string> = {
  workout: 'Workout',
  project: 'Project',
  finance: 'Finance',
  mood: 'Mood',
  skill: 'Skill',
  habit: 'Habit',
  reading: 'Reading',
  social: 'social',
  personal: 'personal',
  journal: 'journal',
  scale: 'scale',
  custom: 'Custom',
}

export const PIXEL_TYPE_ICONS: Record<PixelTypeType, string> = {
  workout: 'dumbbell',
  project: 'folder',
  finance: 'coins',
  mood: 'heart',
  skill: 'lightbulb',
  habit: 'repeat',
  reading: 'book',
  social: 'social',
  personal: 'personal',
  journal: 'journal',
  scale: 'scale',
  custom: 'star',
}

export const PIXEL_COLORS: Record<
  PixelColor,
  { bg: string; text: string; label: string }
> = {
  rust: { bg: '#c75c4a', text: '#faf6f0', label: 'Rust Red' },
  sage: { bg: '#5b8a72', text: '#faf6f0', label: 'Sage Green' },
  gold: { bg: '#c9963a', text: '#faf6f0', label: 'Warm Gold' },
  slate: { bg: '#6b83a6', text: '#faf6f0', label: 'Slate Blue' },
  warm: { bg: '#a67c5b', text: '#faf6f0', label: 'Earthy Brown' },
}

/**
 * Database Types
 */

export type User = typeof schema.users.$inferSelect
export type NewUser = typeof schema.users.$inferInsert
export type Session = typeof schema.session.$inferSelect
export type NewSession = typeof schema.session.$inferInsert
export type Account = typeof schema.account.$inferSelect
export type NewAccount = typeof schema.account.$inferInsert
export type Verification = typeof schema.verification.$inferSelect
export type NewVerification = typeof schema.verification.$inferInsert
export type Grid = typeof schema.grids.$inferSelect
export type NewGrid = typeof schema.grids.$inferInsert
export type Cell = typeof schema.cells.$inferSelect
export type NewCell = typeof schema.cells.$inferInsert
export type Pixel = typeof schema.pixels.$inferSelect
export type NewPixel = typeof schema.pixels.$inferInsert
export type Page = typeof schema.pages.$inferSelect
export type NewPage = typeof schema.pages.$inferInsert
export type Template = typeof schema.templates.$inferSelect
export type NewTemplate = typeof schema.templates.$inferInsert
export type ColorPalette = typeof schema.colorPalettes.$inferSelect
export type NewColorPalette = typeof schema.colorPalettes.$inferInsert

/**
 * CREATE
 */
// Schema for a single cell in the bulk operation
export const createCellSchema = z.object({
  pixelId: z.uuid(),
  col: z.int().min(0).max(1000),
  row: z.int().min(0).max(1000),
  type: z.enum(cellTypeEnum.enumValues),
  value: z.number(),
  note: z.string().max(500).optional(),
  colorOverride: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(), // hex color
  updatedAt: z.nullish(z.coerce.date()),
  completedAt: z.nullish(z.coerce.date()),
})

export const createManyCellsSchema = z.object({
  ownerId: z.string(), // grid owner ID (Better Auth text ID)
  gridId: z.uuid(),
  cells: z.array(createCellSchema).min(1).max(365), // reasonable batch limit
})

export type CreateCellInput = z.infer<typeof createCellSchema>
export type CreateCellsInput = z.infer<typeof createManyCellsSchema>

export const gridPixelSchema = z.object({
  gridId: z.uuid(),
  pixelId: z.uuid(),
  sortOrder: z
    .string()
    .regex(
      /^(alphabetic|reverse|type|\d{1,4})$/,
      'Must be "alphabetic", "reverse", "type", or a number 0-9999',
    ),
})
export const bulkGridPixelsSchema = z.object({
  ownerId: z.string(), // grid owner ID (Better Auth text ID)
  gridId: z.uuid(),
  pixelData: z.array(gridPixelSchema).min(1).max(365),
})

export type gridPixelInput = z.infer<typeof gridPixelSchema>
export type bulkGridPixelsInput = z.infer<typeof bulkGridPixelsSchema>

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export type GridPixel = {
  gridId: string
  sortOrder: string
  pixel: Pixel
}

export type GridData = {
  grid: Grid
  pixels: Pixel[]
  cells: Cell[]
}
export type NewGridData = {
  grid: NewGrid
  pixels: NewPixel[]
  cells: NewCell[]
}

export type DashboardGridDataReturn = {
  cellsByGridId: Map<string, Cell[]>
  pixelsByGridId: Map<string, GridPixel[]>
  ungroupedPixels: Pixel[]
}

/**
 * UPDATES
 */
export const updatableUserFields = z.object({
  name: z.string().max(66).optional(),
  image: z.url().max(500).nullable().optional(), // avatar
  theme: z.enum(themeTypeEnum.enumValues).optional(),

  // Array operations - we'll handle these separately
  savedPixelIds: z.array(z.uuid()).optional(),
  savedGridIds: z.array(z.uuid()).optional(),
  savedTemplateIds: z.array(z.uuid()).optional(),
})

// Main update schema with array operation types
export const updateUserSchema = z
  .object({
    // Allow partial updates
    data: updatableUserFields,

    // Array operations (set, add, remove)
    arrayOperations: z
      .object({
        savedPixelIds: z.enum(['set', 'add', 'remove']).optional(),
        savedGridIds: z.enum(['set', 'add', 'remove']).optional(),
        savedTemplateIds: z.enum(['set', 'add', 'remove']).optional(),
      })
      .optional(),
  })
  .strict() // Prevent extra fields

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const updatePageSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  name: z.string().max(66).optional(),
  description: z.string().max(666).optional(),
  theme: z.enum(themeTypeEnum.enumValues).optional(),
  isPublic: z.boolean().optional(),
  // gridIds: z.array(z.uuid()).optional(),
})

export const updateGridSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  name: z.string().max(66).optional(),
  description: z.string().max(333).nullable(),
  isPublic: z.boolean().nullable(),
  columns: z.int().min(0).max(1000).optional(),
  rows: z.int().min(0).max(1000).optional(),
  scaleType: z.enum(scaleTypeEnum.enumValues).nullable(),
  scaleUnit: z.enum(unitTypeEnum.enumValues).nullable(),
  scaleStart: z.int().max(10000).nullable(),
  scaleEnd: z.int().max(10000).nullable(),
  scaleLabel: z.string().max(66).nullable(),
  theme: z.enum(themeTypeEnum.enumValues).nullable(),
})

export const updatePageGridSchema = z.object({
  pageId: z.uuid(),
  ownerId: z.string(),
  gridId: z.uuid(),
  sortOrder: z
    .string()
    .regex(
      /^(alphabetic|reverse|type|\d{1,4})$/,
      'Must be "alphabetic", "reverse", "type", or a number 0-9999',
    ),
})
export const bulkPageGridSchema = z.object({
  id: z.uuid(),
  sortOrder: z
    .string()
    .regex(
      /^(alphabetic|reverse|type|\d{1,4})$/,
      'Must be "alphabetic", "reverse", "type", or a number 0-9999',
    ),
})
export const updatePageGridsSchema = z.object({
  pageId: z.uuid(),
  ownerId: z.string(),
  gridIds: z.array(bulkPageGridSchema).min(1).max(365),
})

export const updatePixelSchema = z.object({
  id: z.uuid(),
  name: z.string().max(66).optional(),
  description: z.string().max(333).optional(),
  type: z.enum(pixelTypeEnum.enumValues).optional(),
  unit: z.enum(unitTypeEnum.enumValues).optional(),
  endGoal: z.number().max(10000).optional(),
  color: z.enum(ColorTypeEnum.enumValues).optional(), // hex color string
})

// extract the inferred type
export type UpdatePixelType = z.infer<typeof updatePixelSchema>

// BulkUpsert Cells Types
// Define which columns can be bulk-updated
export const updatableCellFields = z.object({
  pixelId: z.uuid().nullish(),
  value: z.number().nullish(),
  note: z.string().max(500).nullish(),
  progress: z.int().max(100).optional(),
  colorOverride: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullish(), // hex color
  updatedAt: z.nullish(z.coerce.date()),
  completedAt: z.nullish(z.coerce.date()),
})

export type UpdateCellType = z.infer<typeof updatableCellFields>

// Schema for a single cell in the bulk operation
export const updateCellSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  type: z.enum(cellTypeEnum.enumValues),
  // Position identifiers (used for matching existing cells when id not provided)
  col: z.int().min(0).max(1000),
  row: z.int().min(0).max(1000),
  // The actual data to upsert
  ...updatableCellFields.shape,
})

// Schema for a single cell in the bulk operation
export const bulkCellSchema = z.object({
  // For upsert: if id provided, update; otherwise insert (or match by position)
  id: z.uuid().optional(),
  type: z.enum(cellTypeEnum.enumValues),
  // Position identifiers (used for matching existing cells when id not provided)
  col: z.int().min(0).max(1000),
  row: z.int().min(0).max(1000),
  // The actual data to upsert
  ...updatableCellFields.shape,
})

export const bulkUpsertCellsSchema = z.object({
  ownerId: z.string(),
  gridId: z.uuid(),
  cells: z.array(bulkCellSchema).min(1).max(365), // reasonable batch limit
  // Strategy: 'position' = match by col/row if no id, 'id-only' = require id for updates
  matchStrategy: z.enum(['position', 'id-only']).default('position'),
})

export type BulkUpsertCellsInput = z.infer<typeof bulkUpsertCellsSchema>
export type CellUpdateInput = z.infer<typeof bulkCellSchema>

/**
 * misc.
 */
type pixelId = string
type gridId = string
export type GridByGridIdMap = Map<gridId, Grid>
export type GridsByPixelIdMap = Map<pixelId, Map<gridId, Grid>>

export type DBTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>
