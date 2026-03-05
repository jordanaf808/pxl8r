import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '.'
import { users, grids, cells, pages } from './schema'
import type { NewCell, NewPage, NewGrid } from './schema'

export const MUTATIONS = {
  createPage: createServerFn({ method: 'POST' })
    .inputValidator((data: NewPage) => data)
    .handler(async ({ data }) => {
      return await db.insert(pages).values({
        ownerId: data.ownerId,
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        theme: data.theme,
        tableIds: data.tableIds,
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

  addPixelToGridCell: createServerFn({ method: 'POST' })
    .inputValidator((data: NewCell) => data)
    .handler(async ({ data }) => {
      return await db.insert(cells).values({
        ownerId: data.ownerId,
        tableId: data.tableId,
        pixelId: data.pixelId,
        col: data.col,
        row: data.row,
        value: data.value,
        note: data.note,
      })
    }),
}
export const QUERIES = {
  getUserById: createServerFn({
    method: 'GET', // default
  })
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
      return await db.select().from(users).where(eq(users.id, data.userId))
    }),
  getgridsByUserId: createServerFn()
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
      return await db.select().from(grids).where(eq(grids.ownerId, data.userId))
    }),
}
