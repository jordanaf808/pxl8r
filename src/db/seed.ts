import { db } from '.'
import { pixels, grids, gridPixels, cells } from './schema'

/**
 * Creates a starter pixel + grid for a brand-new user so the dashboard
 * isn't empty on first login. Called from BetterAuth's
 * `databaseHooks.user.create.after` hook.
 */
export async function seedSampleDataForUser(userId: string) {
  const [pixel] = await db
    .insert(pixels)
    .values({
      ownerId: userId,
      name: 'Go for a morning run',
      description: 'Lace up and get moving before the day gets busy.',
      type: 'workout',
      unit: 'minute',
      endGoal: 30,
      color: 'sage',
    })
    .returning()

  const [grid] = await db
    .insert(grids)
    .values({
      ownerId: userId,
      name: 'My First Grid',
      description: 'A sample grid to show how filling in pixels works.',
    })
    .returning()

  await db.insert(gridPixels).values({
    gridId: grid.id,
    pixelId: pixel.id,
  })

  await db.insert(cells).values([
    {
      ownerId: userId,
      gridId: grid.id,
      pixelId: pixel.id,
      type: 'boolean',
      col: 0,
      row: 0,
      progress: 100,
      completedAt: new Date(),
    },
    {
      ownerId: userId,
      gridId: grid.id,
      pixelId: pixel.id,
      type: 'boolean',
      col: 1,
      row: 0,
      progress: 100,
      completedAt: new Date(),
    },
    {
      ownerId: userId,
      gridId: grid.id,
      pixelId: pixel.id,
      type: 'boolean',
      col: 2,
      row: 0,
      progress: 0,
    },
  ])
}
