import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages, pixels } from './schema'
import type { NewCell, NewPage, NewGrid, NewPixel } from './schema'

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
          gridIds: data.gridIds,
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
  },
  update: {},
  delete: {
    deletePageById: createServerFn({ method: 'POST' })
      .inputValidator((data: { pageId: string }) => data)
      .handler(async ({ data }) => {
        return await db.delete(pages).where(eq(pages.id, data.pageId))
      }),
    deleteGridById: createServerFn({ method: 'POST' })
      .inputValidator((data: { gridId: string }) => data)
      .handler(async ({ data }) => {
        return await db.delete(grids).where(eq(grids.id, data.gridId))
      }),
    deleteCellById: createServerFn({ method: 'POST' })
      .inputValidator((data: { cellId: string }) => data)
      .handler(async ({ data }) => {
        return await db.delete(cells).where(eq(cells.id, data.cellId))
      }),
    deletePixelById: createServerFn({ method: 'POST' })
      .inputValidator((data: { pixelId: string }) => data)
      .handler(async ({ data }) => {
        return await db.delete(pixels).where(eq(pixels.id, data.pixelId))
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
}
