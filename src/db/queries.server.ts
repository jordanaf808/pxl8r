import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages, pixels, gridPixels } from './schema'
import { authMiddleware } from '@/lib/auth/auth-middleware'

export const getUserById = createServerFn({ method: 'GET' }) // fyi - GET is default
  .middleware([authMiddleware])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    const { userId } = data
    if (!user.id) throw new Error('Not Logged In')

    let returnValues = null
    const publicValues = {
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
    }
    const privateValues = {
      id: users.id,
      name: users.name,
      image: users.image,
      email: users.email,
      emailVerified: users.emailVerified,
      theme: users.theme,
      savedPixelIds: users.savedPixelIds,
      savedGridIds: users.savedGridIds,
      savedTemplateIds: users.savedTemplateIds,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }

    if (user.id !== userId) {
      returnValues = publicValues
    } else {
      returnValues = privateValues
    }

    return await db.select(returnValues).from(users).where(eq(users.id, userId))
  })
export const getPagesByOwnerId = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db.select().from(pages).where(eq(pages.ownerId, user.id))
  })
export const getGridsByOwnerId = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db.select().from(grids).where(eq(grids.ownerId, user.id))
  })
export const getGridById = createServerFn()
  .middleware([authMiddleware])
  .inputValidator((data: { gridId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db
      .select()
      .from(grids)
      .where(and(eq(grids.id, data.gridId), eq(grids.ownerId, user.id)))
  })
export const getCellsByGrid = createServerFn()
  .middleware([authMiddleware])
  .inputValidator((data: { gridId: string }) => data)
  .handler(async ({ data, context }) => {
    const { gridId } = data
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db
      .select()
      .from(cells)
      .where(and(eq(cells.gridId, gridId), eq(cells.ownerId, user.id)))
      .orderBy(cells.updatedAt)
  })
export const getPixelsByOwnerId = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    return await db.select().from(pixels).where(eq(pixels.ownerId, user.id))
  })
export const getPixelsByGridId = createServerFn()
  .middleware([authMiddleware])
  .inputValidator((data: { gridId: string }) => data)
  .handler(async ({ data, context }) => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')
    const { gridId } = data

    return await db
      .select()
      .from(gridPixels)
      .innerJoin(pixels, eq(gridPixels.pixelId, pixels.id))
      .innerJoin(grids, eq(gridPixels.gridId, grids.id))
      .where(
        and(
          eq(gridPixels.gridId, gridId),
          eq(grids.ownerId, user.id), // Ownership check
        ),
      )
      .orderBy(gridPixels.sortOrder)
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
