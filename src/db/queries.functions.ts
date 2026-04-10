import { createServerFn } from '@tanstack/react-start'
import { and, eq, notExists } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages, pixels, gridPixels } from './schema'
import { authMiddleware } from '@/lib/auth/auth-middleware'
import type { DashboardGridDataReturn } from '@/db/types'

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

export const getDashboardGridData = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DashboardGridDataReturn> => {
    const { user } = context
    if (!user.id) throw new Error('Not Logged In')

    // Fire both queries in parallel — neither depends on the other
    const [allCells, allGridPixels, ungroupedPixels] = await Promise.all([
      // All cells across all the user's grids
      db
        .select()
        .from(cells)
        .where(eq(cells.ownerId, user.id))
        .orderBy(cells.row, cells.col),

      // All gridPixel entries with their pixel data, for all the user's grids
      db
        .select({
          gridId: gridPixels.gridId,
          sortOrder: gridPixels.sortOrder,
          pixel: pixels,
        })
        .from(gridPixels)
        .innerJoin(pixels, eq(gridPixels.pixelId, pixels.id))
        .innerJoin(grids, eq(gridPixels.gridId, grids.id))
        .where(eq(grids.ownerId, user.id))
        .orderBy(gridPixels.sortOrder),

      // Pixels NOT in any grid
      db
        .select()
        .from(pixels)
        .where(
          and(
            eq(pixels.ownerId, user.id),
            notExists(
              db
                .select()
                .from(gridPixels)
                .where(eq(gridPixels.pixelId, pixels.id)),
            ),
          ),
        ),
    ])

    // Group both by gridId in one pass each
    // const cellsByGridId = Map.groupBy(allCells, (cell) => cell.gridId)
    // groupBy only available in Node21+
    // reduce cells into a Map using gridId as keys
    // Maps allow more efficient addition/deletion operations and are more secure than objects with user generated keys
    const cellsByGridId = allCells.reduce((map, cell) => {
      const data = map.get(cell.gridId) ?? []
      data.push(cell)
      map.set(cell.gridId, data)
      return map
    }, new Map<string, typeof allCells>())

    // const gridPixels = Map.groupBy(allGridPixels, (gp) => gp.gridId)

    const pixelsByGridId = allGridPixels.reduce((map, gridPixel) => {
      const data = map.get(gridPixel.gridId) ?? []
      data.push(gridPixel)
      map.set(gridPixel.gridId, data)
      return map
    }, new Map<string, typeof allGridPixels>())

    return { cellsByGridId, pixelsByGridId, ungroupedPixels }
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

    const results = await db
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

    return results
  })
