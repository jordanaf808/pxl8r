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
  updateCellSchema,
  updateGridSchema,
  updatePageGridSchema,
  updatePageGridsSchema,
  updatePageSchema,
  updatePixelSchema,
  updateUserSchema,
} from '@/db/types'
import type { SQL } from 'drizzle-orm'
import type {
  NewPage,
  NewGrid,
  CreatePixelInput,
  bulkGridPixelsInput,
} from '@/db/types'

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
  .inputValidator((data: CreatePixelInput) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')

    // Spread first: the validator is type-only, so data can carry its own ownerId.
    const values = {
      ...data,
      ownerId: user.id,
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
    if (!user.id || data.ownerId !== user.id) throw new Error('Unauthorized')

    const results = await db
      .insert(grids)
      .values({
        ...data,
        ownerId: user.id,
      })
      .returning()

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
    await assertGridOwner(gridId, user.id)

    // Drizzle throws on an empty insert. Nothing to link is still a successful save, e.g. a grid with no pixels.
    if (pixelData.length === 0) return { success: true, results: [] }

    await assertPixelOwner(
      pixelData.map(({ pixelId }) => pixelId),
      user.id,
    )

    // Read the max once: a subquery inside a multi-row insert would give every new row the same position.
    const [{ maxPosition }] = await db
      .select({
        maxPosition: sql`COALESCE(MAX(${gridPixels.position}), -1)`.mapWith(
          Number,
        ),
      })
      .from(gridPixels)
      .where(eq(gridPixels.gridId, gridId))

    // Each item carries its own gridId, but only the top-level one was verified — ignore theirs.
    // position only applies to new rows: the conflict update below never touches it, so re-sent rows keep their order.
    const values = pixelData.map(({ pixelId, sortOrder }, i) => ({
      gridId,
      pixelId,
      sortOrder,
      position: maxPosition + 1 + i,
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
        position: gridPixels.position,
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

    const page = await db
      .select({ ownerId: pages.ownerId })
      .from(pages)
      .where(eq(pages.id, pageId))

    if (!page[0] || page[0].ownerId !== user.id) {
      throw new Error('Not Page Owner')
    }

    const requestedGridIds = new Set(gridIds.map((grid) => grid.id))
    const ownedGrids = await db
      .select({ id: grids.id })
      .from(grids)
      .where(
        and(
          inArray(grids.id, [...requestedGridIds]),
          eq(grids.ownerId, user.id),
        ),
      )

    if (ownedGrids.length !== requestedGridIds.size) {
      throw new Error('Not Grid Owner')
    }

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
    if (data.darkMode !== undefined) updateData.darkMode = data.darkMode

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
        darkMode: users.darkMode,
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

    const results = await db
      .update(grids)
      .set(gridData)
      .where(
        and(
          eq(grids.id, gridId),
          eq(grids.ownerId, user.id), // ownership check
        ),
      )
      .returning()

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
        color: pixels.color,
        isActive: pixels.isActive,
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

    // Verify ownership
    const page = await db
      .select({ ownerId: pages.ownerId })
      .from(pages)
      .where(eq(pages.id, pageId))

    if (!page[0] || page[0].ownerId !== user.id) {
      throw new Error('Not Page Owner')
    }

    const results = await db
      .update(pageGrids)
      .set({ sortOrder })
      .where(and(eq(pageGrids.pageId, pageId), eq(pageGrids.gridId, gridId)))
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
    const { user } = context
    const {
      id: cellId,
      gridId,
      value,
      note,
      progress,
      colorOverride,
      completedAt,
      timerMinutes,
      timerStartedAt,
    } = data

    if (!user.id) throw new Error('Not Logged In.')

    // null = intentionally clear
    const values = {
      value,
      note,
      progress,
      colorOverride,
      completedAt,
      timerMinutes,
      timerStartedAt,
      updatedAt: sql`NOW()`,
    }

    // A plain UPDATE, not an upsert: if the cell was deleted after the editor loaded it, no row matches and nothing is written.
    // An upsert would re-insert it at its old position. Empty results means the cell no longer exists.
    const results = await db
      .update(cells)
      .set(values)
      .where(
        and(
          eq(cells.id, cellId),
          eq(cells.gridId, gridId),
          eq(cells.ownerId, user.id), // ownership check
        ),
      )
      .returning()

    return {
      success: results.length > 0,
      results,
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

    let success = false
    const response = await db
      .delete(grids)
      .where(and(eq(grids.id, data.gridId), eq(grids.ownerId, user.id)))
      .returning({ deletedGridId: grids.id })

    if (response.length > 0) {
      success = true
    }
    return {
      success,
      response,
    }
  })

export const deleteManyCellsById = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(
    (data: { gridId: string; gridOwnerId: string; cellIds: string[] }) => data,
  )
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

export const deleteGridPixels = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { gridId: string; pixelIds: string[] }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Unauthorized')
    await assertGridOwner(data.gridId, user.id)

    const result = await db
      .delete(gridPixels)
      .where(
        and(
          inArray(gridPixels.pixelId, data.pixelIds),
          eq(gridPixels.gridId, data.gridId),
        ),
      )
      .returning()

    return {
      success: result.length > 0,
      result,
    }
  })

// ============================================================================
// Helper Functions
// ============================================================================

// A missing grid and someone else's grid throw the same error, so callers can't probe which grid ids exist.
async function assertGridOwner(gridId: string, userId: string): Promise<void> {
  const results = await db
    .select({ id: grids.id })
    .from(grids)
    .where(and(eq(grids.id, gridId), eq(grids.ownerId, userId)))

  if (results.length === 0) throw new Error('Not Grid Owner')
}

async function assertPixelOwner(
  pixelIds: string[],
  userId: string,
): Promise<void> {
  // A repeated id would be counted twice here but found once.
  const uniquePixelIds = [...new Set(pixelIds)]
  const results = await db
    .select({ id: pixels.id })
    .from(pixels)
    .where(and(inArray(pixels.id, uniquePixelIds), eq(pixels.ownerId, userId)))

  if (results.length !== uniquePixelIds.length)
    throw new Error('Not Pixel Owner')
}

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
