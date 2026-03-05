import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { db } from '.'
import { users as usersSchema } from './schema'

export const QUERIES = {
  getUserById: createServerFn({
    method: 'GET', // default
  })
    .inputValidator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
      return await db
        .select()
        .from(usersSchema)
        .where(eq(usersSchema.id, data.userId))
    }),
}
