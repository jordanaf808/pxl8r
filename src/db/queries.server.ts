import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
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
