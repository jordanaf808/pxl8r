import { createServerFn } from '@tanstack/react-start'
import { eq, inArray, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages, pixels, gridPixels } from './schema'
import {
  bulkUpsertSchema,
  updatableCellFields,
  updateCellSchema,
  updateUserSchema,
} from '@/lib/types'
import type { NewCell, NewPage, NewGrid, NewPixel } from './schema'
import type { CellUpdate, DBTransaction } from '@/lib/types'
import { authMiddleware } from '@/lib/auth/auth-middleware'

export const MUTATIONS = {
  create: {
    createPage: createServerFn({ method: 'POST' })
      .inputValidator((data: NewPage) => data)
      .handler(async ({ data }) => {
        return await db.insert(pages).values({
          ownerId: data.ownerId,
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
          theme: data.theme,
        })
      }),
    createGrid: createServerFn({ method: 'POST' })
      .inputValidator((data: NewGrid) => data)
      .handler(async ({ data }) => {
        return await db.insert(grids).values({
          ownerId: data.ownerId,
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
      }),
    createGridCells: createServerFn({ method: 'POST' })
      .inputValidator((data: NewCell[]) => data)
      .handler(async ({ data }) => {
        return await db.insert(cells).values(data)
      }),
    createPixel: createServerFn({ method: 'POST' })
      .inputValidator((data: NewPixel) => data)
      .handler(async ({ data }) => {
        return await db.insert(pixels).values(data)
      }),
    addPixelToGrid: createServerFn({ method: 'POST' })
      .inputValidator((data: typeof gridPixels.$inferInsert) => data)
      .handler(async ({ data }) => {
        const { gridId, pixelId, sortOrder } = data
        await db.insert(gridPixels).values({
          gridId,
          pixelId,
          sortOrder,
        })
      }),
  },
  update: {
    updateUser: createServerFn({ method: 'POST' })
      .middleware([authMiddleware])
      .inputValidator(updateUserSchema)
      .handler(async ({ data: userData, context }) => {
        const { user } = context
        const userId = user.id
        if (!userId) throw new Error('Unauthorized')

        const { data, arrayOperations } = userData

        // Perform update in transaction
        const updatedUser = await db.transaction(async (trx) => {
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
              userId,
            )
          }

          if (data.savedGridIds !== undefined) {
            updateData.savedGridIds = buildArrayUpdate(
              'saved_grid_ids',
              data.savedGridIds,
              arrayOperations?.savedGridIds || 'add',
              userId,
            )
          }

          if (data.savedTemplateIds !== undefined) {
            updateData.savedTemplateIds = buildArrayUpdate(
              'saved_template_ids',
              data.savedTemplateIds,
              arrayOperations?.savedTemplateIds || 'add',
              userId,
            )
          }

          // Only update if there's something to update
          if (Object.keys(updateData).length === 0) {
            throw new Error('No fields provided for update')
          }

          // Execute update
          const response = await trx
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

          const [result] = response

          return result
        })

        return updatedUser
      }),
    updateGrid: createServerFn({ method: 'POST' })
      .inputValidator(bulkUpsertSchema)
      .handler(async ({ data }) => {}),
    updatePixel: createServerFn({ method: 'POST' })
      .inputValidator(bulkUpsertSchema)
      .handler(async ({ data }) => {}),
    updatePage: createServerFn({ method: 'POST' })
      .inputValidator(bulkUpsertSchema)
      .handler(async ({ data }) => {}),

    updateCell: createServerFn({ method: 'POST' })
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
        const { ownerId, gridId, cells: cellUpdates } = data

        if (!user.id || user.id !== ownerId) throw new Error('Unauthorized')

        const values = cellUpdates.map((cell) => ({
          gridId,
          ownerId: user.id,
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
              pixelId: sql`excluded.pixel_id`,
              value: sql`excluded.value`,
              note: sql`excluded.note`,
              colorOverride: sql`excluded.color_override`,
              completedAt: sql`excluded.completed_at`,
              updatedAt: sql`NOW()`,
            },
          })
          .returning({ id: cells.id, col: cells.col, row: cells.row })

        return {
          success: true,
          processed: results.length,
        }
      }),

    bulkUpsertCells: createServerFn({ method: 'POST' })
      .middleware([authMiddleware])
      .inputValidator(bulkUpsertSchema)
      .handler(async ({ data, context }) => {
        console.log('//// check auth - context: ', context, 'data: ', data)
        const { user } = context
        const { ownerId, gridId, cells: cellUpserts } = data

        if (!user.id || user.id !== ownerId) throw new Error('Unauthorized')

        const values = cellUpserts.map((cell) => ({
          gridId,
          ownerId: user.id, // not needed in onConflictDoUpdate, because we don't change that value
          pixelId: cell.pixelId ?? null,
          col: cell.col,
          row: cell.row,
          value: cell.value ?? null,
          note: cell.note ?? null,
          colorOverride: cell.colorOverride ?? null,
          completedAt: cell.completedAt ?? null,
          updatedAt: sql`NOW()`,
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
          success: true,
          processed: results.length,
          results,
        }
      }),
  },
  delete: {
    deletePagesById: createServerFn({ method: 'POST' })
      .inputValidator((data: { pageId: string[] }) => data)
      .handler(async ({ data }) => {
        return await db.delete(pages).where(inArray(pages.id, data.pageId))
      }),
    deleteGridsById: createServerFn({ method: 'POST' })
      .inputValidator((data: { gridId: string[] }) => data)
      .handler(async ({ data }) => {
        return await db.delete(grids).where(inArray(grids.id, data.gridId))
      }),
    deleteCellsById: createServerFn({ method: 'POST' })
      .inputValidator((data: { cellIds: string[] }) => data)
      .handler(async ({ data }) => {
        return await db.delete(cells).where(inArray(cells.id, data.cellIds))
      }),
    deletePixelsById: createServerFn({ method: 'POST' })
      .inputValidator((data: { pixelIds: string[] }) => data)
      .handler(async ({ data }) => {
        return await db
          .delete(pixels)
          .where(inArray(pixels.id, data.pixelIds))
          .returning()
      }),
  },
}
export const QUERIES = {
  getUserById: createServerFn({
    method: 'GET', // default
  })
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
      return await db.select().from(users).where(eq(users.id, data.userId))
    }),
  getGridsByOwnerId: createServerFn()
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
      return await db.select().from(grids).where(eq(grids.ownerId, data.userId))
    }),
  getGridById: createServerFn()
    .inputValidator((data: { gridId: string }) => data)
    .handler(async ({ data }) => {
      return await db.select().from(grids).where(eq(grids.id, data.gridId))
    }),
  getPixelsByGridId: createServerFn()
    .inputValidator((data: { gridId: string }) => data)
    .handler(async ({ data }) => {
      const { gridId } = data
      return await db
        .select()
        .from(gridPixels)
        .innerJoin(pixels, eq(gridPixels.pixelId, pixels.id))
        .where(eq(gridPixels.gridId, gridId))
        .orderBy(gridPixels.sortOrder)
    }),
}

// ============================================================================
// Helper Functions
// ============================================================================

// 'add' or 'remove' groups of values from an array, or replace the entire array with a new set of values with 'set'
function buildArrayUpdate(
  column: 'saved_pixel_ids' | 'saved_grid_ids' | 'saved_template_ids',
  values: string[],
  operation: 'set' | 'add' | 'remove',
  userId: string,
): string[] | SQL<unknown> {
  if (operation === 'set') {
    // Replace entire array
    return values
  }

  if (operation === 'add') {
    // Merge with existing (unique only)
    return sql`ARRAY(
      SELECT DISTINCT unnest(array_cat(${sql.raw(column)}, ARRAY[${sql.join(values)}]))
      FROM users 
      WHERE id = ${userId}
    )`
  }

  // Remove specific values
  return sql`ARRAY(
    SELECT unnest(${sql.raw(column)}) 
    FROM users 
    WHERE id = ${userId}
    EXCEPT SELECT unnest(ARRAY[${sql.join(values)}])
  )`
}

/**
 * Groups updates by which fields are present to minimize SQL statements
 * while handling dynamic columns per row
 */
function groupUpdatesByFields(
  updates: Array<{ id: string; data: Partial<CellUpdate> }>,
): Map<string, typeof updates> {
  const groups = new Map<string, typeof updates>()

  for (const update of updates) {
    // Create a key based on which fields are present (sorted for consistency)
    const fields = Object.keys(update.data).sort().join(',')

    if (!groups.has(fields)) {
      groups.set(fields, [])
    }
    groups.get(fields)!.push(update)
  }

  return groups
}

/**
 * Executes a dynamic update for a group of cells that share the same fields
 * Uses CASE statements for batch updating different rows with different values
 */
async function executeDynamicUpdate(
  trx: DBTransaction,
  group: Array<{ id: string; data: Partial<CellUpdate> }>,
) {
  if (group.length === 0) return

  const fields = Object.keys(group[0].data)
  if (fields.length === 0) return

  // Build a single UPDATE with CASE statements for each field
  // This is more efficient than N separate queries
  const setClauses: string[] = []
  const whereIds: string[] = []

  for (const field of fields) {
    const cases = group
      .map(({ id, data }) => {
        const value = data[field as keyof CellUpdate]
        // Proper SQL value formatting
        const sqlValue =
          value === null
            ? 'NULL'
            : typeof value === 'string'
              ? `'${value.replace(/'/g, "''")}'`
              : value instanceof Date
                ? `'${value.toISOString()}'`
                : String(value)

        return `WHEN id = '${id}' THEN ${sqlValue}`
      })
      .join(' ')

    setClauses.push(`${field} = CASE ${cases} ELSE ${field} END`)
    whereIds.push(...group.map((g) => `'${g.id}'`))
  }

  const sqlQuery = `
    UPDATE cells 
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id IN (${[...new Set(whereIds)].join(', ')})
  `

  await trx.execute(sql.raw(sqlQuery))
}
