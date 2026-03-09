import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages, pixels, gridPixels } from './schema'
import { bulkUpsertSchema, updateUserSchema } from '@/lib/types'
import type { NewCell, NewPage, NewGrid, NewPixel } from './schema'
import type { CellUpdate, DBTransaction, UpdateUserInput } from '@/lib/types'
import { authMiddleware } from '@/lib/auth/auth-middleware'
import { updateUser } from 'better-auth/api'

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
    bulkUpsertCells: createServerFn({ method: 'POST' })
      .middleware([authMiddleware])
      .inputValidator(bulkUpsertSchema)
      .handler(async ({ data, context }) => {
        // check auth
        console.log('//// check auth - context: ', context, 'data: ', data)
        const { user } = context
        const { ownerId, gridId, cells: cellUpdates, matchStrategy } = data
        if (!user.id || user.id !== ownerId) throw new Error('Unauthorized')

        const results = await db.transaction(async (trx) => {
          const processed = []
          const errors = []

          // Group operations for efficiency
          const inserts: CellUpdate[] = []
          const updates: Array<{ id: string; data: Partial<CellUpdate> }> = []
          const positionMatches: Array<{
            col: number
            row: number
            cellData: CellUpdate
          }> = []

          // -----------------------------------------------------------------------
          // Phase 1: Determine insert vs update for each cell
          // -----------------------------------------------------------------------

          for (const cellData of cellUpdates) {
            if (cellData.id) {
              // Explicit ID = direct update
              const { id, col, row, ...updateData } = cellData
              updates.push({ id, data: updateData })
            } else if (matchStrategy === 'position') {
              // Match by position - need to check if exists
              positionMatches.push({
                col: cellData.col,
                row: cellData.row,
                cellData: cellData,
              })
            } else {
              errors.push({
                col: cellData.col,
                row: cellData.row,
                error: 'ID required when using id-only strategy',
              })
            }
          }

          // -----------------------------------------------------------------------
          // Phase 2: Resolve position-based matches (batch query for efficiency)
          // -----------------------------------------------------------------------

          if (positionMatches.length > 0) {
            const existingCells = await trx.query.cells.findMany({
              where: (cell) =>
                and(
                  eq(cell.gridId, gridId),
                  // Build OR conditions for all positions
                  sql`(${cell.col}, ${cell.row}) IN (${sql.join(
                    positionMatches.map((p) => sql`(${p.col}, ${p.row})`),
                  )})`,
                ),
              columns: { id: true, col: true, row: true },
            })

            // Map existing cells by position for O(1) lookup
            const existingByPosition = new Map(
              existingCells.map((c) => [`${c.col},${c.row}`, c.id]),
            )

            for (const { col, row, cellData } of positionMatches) {
              const key = `${col},${row}`
              const existingId = existingByPosition.get(key)

              if (existingId) {
                // Update existing
                const { col: _, row: __, ...updateData } = cellData
                updates.push({ id: existingId, data: updateData })
              } else {
                // Insert new
                inserts.push(cellData)
              }
            }
          }

          // -----------------------------------------------------------------------
          // Phase 3: Execute batch insert for new cells
          // -----------------------------------------------------------------------

          let insertedIds: string[] = []
          if (inserts.length > 0) {
            // Drizzle's insert().values() with onConflictDoUpdate for true upsert
            // But since we already resolved conflicts, we can do plain insert
            const insertValues = inserts.map((cell) => ({
              gridId,
              // ownerId: userId, // from auth
              col: cell.col,
              row: cell.row,
              value: cell.value ?? null,
              note: cell.note ?? null,
              colorOverride: cell.colorOverride ?? null,
              completedAt: cell.completedAt ?? null,
              pixelId: cell.pixelId ?? null,
            }))

            const result = await trx
              .insert(cells)
              .values(insertValues)
              .returning({
                id: cells.id,
                col: cells.col,
                row: cells.row,
              })

            insertedIds = result.map((r) => r.id)
            processed.push(
              ...result.map((r) => ({
                operation: 'insert',
                id: r.id,
                col: r.col,
                row: r.row,
              })),
            )
          }

          // -----------------------------------------------------------------------
          // Phase 4: Execute updates (batched by which fields are present)
          // -----------------------------------------------------------------------

          if (updates.length > 0) {
            // Group updates by which fields they contain for efficient batching
            // This handles your requirement: "columns being updated might change between rows"
            const updateGroups = groupUpdatesByFields(updates)

            for (const [fieldKey, group] of updateGroups) {
              // Build dynamic SQL for this group
              await executeDynamicUpdate(trx, group)
            }

            processed.push(
              ...updates.map((u) => ({
                operation: 'update',
                id: u.id,
              })),
            )
          }

          return {
            success: errors.length === 0,
            processed: processed.length,
            inserted: insertedIds.length,
            updated: updates.length,
            errors: errors.length > 0 ? errors : undefined,
          }
        })

        console.log('//// bulkUpsertCells results: ', results)
        return results
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
