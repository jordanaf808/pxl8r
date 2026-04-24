import {
  cellTypeEnum,
  pixelTypeEnum,
  ColorTypeEnum,
  scaleTypeEnum,
  themeTypeEnum,
  unitTypeEnum,
} from '@/db/schema'
import z from 'zod'

// ---- Create schemas ----

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
    .optional(),
  updatedAt: z.nullish(z.coerce.date()),
  completedAt: z.nullish(z.coerce.date()),
})

export const createManyCellsSchema = z.object({
  ownerId: z.string(),
  gridId: z.uuid(),
  cells: z.array(createCellSchema).min(1).max(365),
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
  ownerId: z.string(),
  gridId: z.uuid(),
  pixelData: z.array(gridPixelSchema).min(1).max(365),
})

export type gridPixelInput = z.infer<typeof gridPixelSchema>
export type bulkGridPixelsInput = z.infer<typeof bulkGridPixelsSchema>

// ---- Update schemas ----

export const updatableUserFields = z.object({
  name: z.string().max(66).optional(),
  image: z.url().max(500).nullable().optional(),
  theme: z.enum(themeTypeEnum.enumValues).optional(),
  savedPixelIds: z.array(z.uuid()).optional(),
  savedGridIds: z.array(z.uuid()).optional(),
  savedTemplateIds: z.array(z.uuid()).optional(),
})

export const updateUserSchema = z
  .object({
    data: updatableUserFields,
    arrayOperations: z
      .object({
        savedPixelIds: z.enum(['set', 'add', 'remove']).optional(),
        savedGridIds: z.enum(['set', 'add', 'remove']).optional(),
        savedTemplateIds: z.enum(['set', 'add', 'remove']).optional(),
      })
      .optional(),
  })
  .strict()

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const updatePageSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  name: z.string().max(66).optional(),
  description: z.string().max(666).optional(),
  theme: z.enum(themeTypeEnum.enumValues).optional(),
  isPublic: z.boolean().optional(),
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
  color: z.enum(ColorTypeEnum.enumValues).optional(),
})

export type UpdatePixelType = z.infer<typeof updatePixelSchema>

export const updatableCellFields = z.object({
  pixelId: z.uuid().nullish(),
  value: z.number().nullish(),
  note: z.string().max(500).nullish(),
  progress: z.int().max(100).optional(),
  colorOverride: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullish(),
  updatedAt: z.nullish(z.coerce.date()),
  completedAt: z.nullish(z.coerce.date()),
})

export type UpdateCellType = z.infer<typeof updatableCellFields>

export const updateCellSchema = z.object({
  id: z.uuid(),
  ownerId: z.string(),
  type: z.enum(cellTypeEnum.enumValues),
  col: z.int().min(0).max(1000),
  row: z.int().min(0).max(1000),
  ...updatableCellFields.shape,
})

export const bulkCellSchema = z.object({
  id: z.uuid().optional(),
  type: z.enum(cellTypeEnum.enumValues),
  col: z.int().min(0).max(1000),
  row: z.int().min(0).max(1000),
  ...updatableCellFields.shape,
})

export const bulkUpsertCellsSchema = z.object({
  ownerId: z.string(),
  gridId: z.uuid(),
  cells: z.array(bulkCellSchema).min(1).max(365),
  matchStrategy: z.enum(['position', 'id-only']).default('position'),
})

export type BulkUpsertCellsInput = z.infer<typeof bulkUpsertCellsSchema>
export type CellUpdateInput = z.infer<typeof bulkCellSchema>
