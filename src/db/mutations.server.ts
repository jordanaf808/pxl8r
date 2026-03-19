import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { authMiddleware } from '@/lib/auth/auth-middleware'
import { db } from '.'
import {
  users,
  grids,
  cells,
  pages,
  pixels,
  gridPixels,
  pageGrids,
} from './schema'
import {
  bulkUpsertCellsSchema,
  updateCellSchema,
  updateGridSchema,
  updatePageGridSchema,
  updatePageGridsSchema,
  updatePageSchema,
  updatePixelSchema,
  updateUserSchema,
} from '@/db/types'
import type { SQL } from 'drizzle-orm'
import type { NewPage, NewGrid, NewPixel } from './schema'
import type { CreateCellsInput, bulkGridPixelsInput } from '@/db/types'

/**
 * CREATE
 */

export const createPage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: NewPage) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const results = await db
      .insert(pages)
      .values({
        ownerId: user.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        theme: data.theme,
      })
      .returning()

    return {
      success: results.length > 0,
      results,
    }
  })

export const createPixel = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: NewPixel) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const values = {
      ownerId: user.id,
      ...data,
    }

    const results = await db.insert(pixels).values(values).returning()

    return {
      success: results.length > 0,
      results,
    }
  })

export const createGrid = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: NewGrid) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const results = await db
      .insert(grids)
      .values({
        ownerId: user.id,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        // Grid dimensions
        columns: data.columns,
        rows: data.rows,
        // Scale configuration
        scaleType: data.scaleType,
        scaleUnit: data.scaleUnit,
        scaleStart: data.scaleStart,
        scaleEnd: data.scaleEnd,
        scaleLabel: data.scaleLabel,
        // Theme
        theme: data.theme,
      })
      .returning()

    return {
      success: results.length > 0,
      results,
    }
  })

export const createCells = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: CreateCellsInput) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    const { ownerId, gridId, cells: cellsData } = data

    if (!user.id) throw new Error('Not Logged In')
    if (ownerId !== user.id) throw new Error('Not Grid Owner')

    const values = cellsData.map((cell) => ({
      ownerId: user.id,
      gridId: gridId,
      ...cell,
    }))

    const results = await db.insert(cells).values(values).returning()

    return {
      success: results.length > 0,
      results,
    }
  })

export const bulkUpsertCells = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(bulkUpsertCellsSchema)
  .handler(async ({ data, context }) => {
    console.log('//// check auth - context: ', context, 'data: ', data)
    const { user } = context
    const { ownerId, gridId, cells: cellUpserts } = data

    if (!user.id || user.id !== ownerId) throw new Error('Unauthorized')

    const values = cellUpserts.map((cell) => ({
      gridId,
      ownerId: user.id, // not needed in onConflictDoUpdate(), because we don't change that value
      pixelId: cell.pixelId ?? null,
      col: cell.col,
      row: cell.row,
      value: cell.value ?? null,
      note: cell.note ?? null,
      colorOverride: cell.colorOverride ?? null,
      completedAt: cell.completedAt ?? null,
    }))

    const results = await db
      .insert(cells)
      .values(values)
      .onConflictDoUpdate({
        target: [cells.gridId, cells.col, cells.row],
        set: {
          // COALESCE(excluded.column, table.column) means "use the new value if it's not null, otherwise keep the existing value."
          pixelId: sql`COALESCE(excluded.pixel_id, ${cells.pixelId})`,
          value: sql`COALESCE(excluded.value, ${cells.value})`,
          note: sql`COALESCE(excluded.note, ${cells.note})`,
          colorOverride: sql`COALESCE(excluded.color_override, ${cells.colorOverride})`,
          completedAt: sql`COALESCE(excluded.completed_at, ${cells.completedAt})`,
          updatedAt: sql`NOW()`,
        },
      })
      .returning({ id: cells.id, col: cells.col, row: cells.row })

    return {
      success: results.length > 0,
      results,
    }
  })

export const bulkUpsertGridPixels = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: bulkGridPixelsInput) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    const { ownerId, gridId, pixelData } = data

    if (!user.id) throw new Error('Unauthorized')
    if (ownerId !== user.id) throw new Error('Not Grid Owner')

    const values = pixelData.map((pixel) => ({
      gridId: gridId,
      pixelId: pixel.pixelId,
      sortOrder: pixel.sortOrder,
    }))

    const results = await db
      .insert(gridPixels)
      .values(values)
      .onConflictDoUpdate({
        target: [gridPixels.gridId, gridPixels.pixelId],
        set: {
          // COALESCE(excluded.column, table.column) means "use the new value if it's not null, otherwise keep the existing value."
          sortOrder: sql`COALESCE(excluded.sort_order, ${gridPixels.sortOrder})`,
        },
      })
      .returning({
        gridId: gridPixels.gridId,
        pixelId: gridPixels.pixelId,
        sortOrder: gridPixels.sortOrder,
      })

    return {
      success: results.length > 0,
      results,
    }
  })

export const bulkUpsertPageGrids = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePageGridsSchema)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const { pageId, ownerId, gridIds } = data
    if (ownerId !== user.id) throw new Error('Not Grid Owner')

    const values = gridIds.map((grid) => ({
      pageId: pageId,
      gridId: grid.id,
      sortOrder: grid.sortOrder,
    }))

    const results = await db
      .insert(pageGrids)
      .values(values)
      .onConflictDoUpdate({
        target: [pageGrids.gridId, pageGrids.pageId],
        set: {
          // COALESCE(excluded.column, table.column) means "use the new value if it's not null, otherwise keep the existing value."
          sortOrder: sql`COALESCE(excluded.sort_order, ${pageGrids.sortOrder})`,
        },
      })
      .returning({
        gridId: pageGrids.gridId,
        pageId: pageGrids.pageId,
        sortOrder: pageGrids.sortOrder,
      })

    return {
      success: results.length > 0,
      results: results,
    }
  })

/**
 * UPDATE
 */

export const updateUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateUserSchema)
  .handler(async ({ data: userData, context }) => {
    const { user } = context
    const userId = user.id
    if (!userId) throw new Error('Unauthorized')

    const { data, arrayOperations } = userData

    // Build base update object
    const updateData: Record<string, any> = {}

    // Handle simple fields
    if (data.name !== undefined) updateData.name = data.name
    if (data.image !== undefined) updateData.image = data.image
    if (data.theme !== undefined) updateData.theme = data.theme

    // Handle array fields with operations
    if (data.savedPixelIds !== undefined) {
      updateData.savedPixelIds = buildArrayUpdate(
        'saved_pixel_ids',
        data.savedPixelIds,
        arrayOperations?.savedPixelIds || 'add',
      )
    }

    if (data.savedGridIds !== undefined) {
      updateData.savedGridIds = buildArrayUpdate(
        'saved_grid_ids',
        data.savedGridIds,
        arrayOperations?.savedGridIds || 'add',
      )
    }

    if (data.savedTemplateIds !== undefined) {
      updateData.savedTemplateIds = buildArrayUpdate(
        'saved_template_ids',
        data.savedTemplateIds,
        arrayOperations?.savedTemplateIds || 'add',
      )
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields provided for update')
    }

    // Execute update
    const response = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        theme: users.theme,
        savedPixelIds: users.savedPixelIds,
        savedGridIds: users.savedGridIds,
        savedTemplateIds: users.savedTemplateIds,
        updatedAt: users.updatedAt,
      })

    return {
      success: response.length > 0,
      results: response,
    }
  })

export const updateGrid = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateGridSchema)
  .handler(async ({ data, context }) => {
    const { user } = context
    const { ownerId, id: gridId, ...gridData } = data
    if (!user.id) throw new Error('Unauthorized')
    if (ownerId !== user.id) throw new Error('Not Grid Owner')

    console.log('//// updateGrid - gridData: ', gridData)

    const results = await db
      .update(grids)
      .set(gridData)
      .where(
        and(
          eq(grids.id, gridId),
          eq(grids.ownerId, user.id), // ownership check
        ),
      )
      .returning({
        id: grids.id,
        name: grids.name,
        isPublic: grids.isPublic,
        scaleType: grids.scaleType,
      })

    return {
      success: results.length > 0,
      results: results,
    }
  })

export const updatePixel = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePixelSchema)
  .handler(async ({ data, context }) => {
    const { user } = context
    const { id: pixelId, ...pixelData } = data
    if (!user.id) throw new Error('Unauthorized')

    const results = await db
      .update(pixels)
      .set(pixelData)
      .where(
        and(
          eq(pixels.id, pixelId),
          eq(pixels.ownerId, user.id), // ownership check
        ),
      )
      .returning({
        id: pixels.id,
        name: pixels.name,
        type: pixels.type,
        unit: pixels.unit,
        endGoal: pixels.endGoal,
        completed: pixels.completed,
        progress: pixels.progress,
      })

    return {
      success: results.length > 0,
      results: results,
    }
  })

export const updatePage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePageSchema)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const { id: pageId, ownerId, ...pageData } = data

    const results = await db
      .update(pages)
      .set(pageData)
      .where(
        and(
          eq(pages.id, pageId),
          eq(pages.ownerId, user.id), // ownership check
        ),
      )
      .returning({
        id: pages.id,
        name: pages.name,
        description: pages.description,
        theme: pages.theme,
        isPublic: pages.isPublic,
      })

    return {
      success: results.length > 0,
      results: results,
    }
  })

export const updatePageGridSort = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updatePageGridSchema)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In.')

    const { pageId, ownerId, gridId, sortOrder } = data
    if (user.id !== ownerId) throw new Error('Unauthorized')

    const results = await db
      .update(pageGrids)
      .set({ sortOrder })
      .where(
        and(
          eq(pageGrids.pageId, pageId),
          eq(pageGrids.gridId, gridId),
          // Join to pages to verify ownership
          inArray(
            pageGrids.pageId,
            db
              .select({ id: pages.id })
              .from(pages)
              .where(eq(pages.ownerId, user.id)),
          ),
        ),
      )
      .returning({
        pageId: pageGrids.pageId,
        gridId: pageGrids.gridId,
        sortOrder: pageGrids.sortOrder,
      })

    return {
      success: results.length > 0,
      results: results,
    }
  })

export const updateCell = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateCellSchema)
  .handler(async ({ data, context }) => {
    console.log(
      '//// updateCell - check auth - context: ',
      context,
      'data: ',
      data,
    )
    const { user } = context
    const { id: cellId, ownerId, note, value, colorOverride } = data

    if (!cellId) throw new Error('missing Cell ID')
    if (!user.id) throw new Error('Not Logged In.')
    if (user.id !== ownerId) throw new Error('Unauthorized')

    // null = intentionally clear
    const values = {
      note,
      value,
      colorOverride,
      updatedAt: sql`NOW()`,
    }

    const results = await db
      .update(cells)
      .set(values)
      .where(
        and(
          eq(cells.id, cellId),
          eq(cells.ownerId, user.id), // ownership check
        ),
      )
      .returning({ id: cells.id, col: cells.col, row: cells.row })

    return {
      success: results.length > 0,
      processed: results.length,
    }
  })

/**
 * DELETE
 */

export const deletePageById = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { pageId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db
      .delete(pages)
      .where(and(eq(pages.id, data.pageId), eq(pages.ownerId, user.id)))
  })

export const deleteGridById = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { gridId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db
      .delete(grids)
      .where(and(eq(grids.id, data.gridId), eq(grids.ownerId, user.id)))
  })

export const deleteManyCellsById = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { cellIds: string[] }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db
      .delete(cells)
      .where(and(inArray(cells.id, data.cellIds), eq(cells.ownerId, user.id)))
  })

export const deletePixelById = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { pixelId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    const result = await db
      .delete(pixels)
      .where(and(eq(pixels.id, data.pixelId), eq(pixels.ownerId, user.id)))
      .returning()

    return {
      success: result.length > 0,
      result,
    }
  })

export const deleteGridsFromPage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { pageId: string; gridIds: string[] }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    const { pageId, gridIds } = data

    // Verify ownership
    const page = await db
      .select({ ownerId: pages.ownerId })
      .from(pages)
      .where(eq(pages.id, pageId))

    if (!page[0] || page[0].ownerId !== user.id) {
      throw new Error('Not Page Owner')
    }

    const results = await db
      .delete(pageGrids)
      .where(
        and(eq(pageGrids.pageId, pageId), inArray(pageGrids.gridId, gridIds)),
      )
      .returning()

    return {
      success: results.length > 0,
      results,
    }
  })

// ============================================================================
// Helper Functions
// ============================================================================

// 'add' or 'remove' groups of values from an array, or replace the entire array with a new set of values with 'set'
function buildArrayUpdate(
  column: 'saved_pixel_ids' | 'saved_grid_ids' | 'saved_template_ids',
  values: string[],
  operation: 'set' | 'add' | 'remove',
): string[] | SQL<unknown> {
  if (operation === 'set') {
    // Replace entire array
    return values
  }

  // ✅ Map to actual Drizzle column references
  const colMap = {
    saved_pixel_ids: users.savedPixelIds,
    saved_grid_ids: users.savedGridIds,
    saved_template_ids: users.savedTemplateIds,
  } as const
  const col = colMap[column]

  if (operation === 'add') {
    // Merge with existing (unique only)
    return sql`ARRAY(
      SELECT DISTINCT unnest(array_cat(${col}, ARRAY[${sql.join(values)}]))
    )`
  }

  // Remove specific values
  return sql`ARRAY(
    SELECT unnest(${col})
    EXCEPT SELECT unnest(ARRAY[${sql.join(values)}])
  )`
}

/**
 * Groups updates by which fields are present to minimize SQL statements
 * while handling dynamic columns per row
 */
// function groupUpdatesByFields(
//   updates: Array<{ id: string; data: Partial<CellUpdateInput> }>,
// ): Map<string, typeof updates> {
//   const groups = new Map<string, typeof updates>()

//   for (const update of updates) {
//     // Create a key based on which fields are present (sorted for consistency)
//     const fields = Object.keys(update.data).sort().join(',')

//     if (!groups.has(fields)) {
//       groups.set(fields, [])
//     }
//     groups.get(fields)!.push(update)
//   }

//   return groups
// }
