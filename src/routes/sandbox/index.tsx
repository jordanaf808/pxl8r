import { pages, pixels, grids } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { SAMPLE_BLOCKS, SAMPLE_Grid, SAMPLE_USER_PAGE } from '@/db/mock-data'

export const Route = createFileRoute('/sandbox/')({
  component: RouteComponent,
})

const seedGrids = createServerFn({
  method: 'POST', // default
}).handler(async () => {
  return await db.insert(grids).values(SAMPLE_Grid).returning({
    insertedId: grids.id,
    insertedName: grids.name,
    ownerId: grids.ownerId,
  })
})
const seedPage = createServerFn({
  method: 'POST', // default
}).handler(async () => {
  return await db.insert(pages).values(SAMPLE_USER_PAGE).returning({
    insertedId: pages.id,
    insertedName: pages.name,
    ownerId: pages.ownerId,
  })
})
const seedPixels = createServerFn({
  method: 'POST', // default
}).handler(async () => {
  const formattedPixels = SAMPLE_BLOCKS.map((block) => {
    return {
      ownerId: 'BYk0o5v4s2BF72DL6eQnDw0XwPRDiAQj',
      name: block.name,
      description: block.description,
      type: block.type,
      unit: block.unit, // unit to measure by
      endGoal: block.endGoal, // goal in units
      color: block.color,
      completed: block.completed,
      progress: block.progress,
    }
  })
  return await db.insert(pixels).values(formattedPixels).returning({
    insertedId: pixels.id,
    insertedName: pixels.name,
    ownerId: pixels.ownerId,
  })
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      Seed Function
      <form
        action={async () => {
          const seedGridsResponse = await seedGrids()
          console.log('//// seedGridsResponse: ', seedGridsResponse)
        }}
      >
        <button type="submit">seedGrids</button>
      </form>
    </div>
  )
}
