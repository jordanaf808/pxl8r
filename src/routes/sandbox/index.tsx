import { pages, pixels, grids } from '@/db/schema'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { SAMPLE_BLOCKS, SAMPLE_Grid, SAMPLE_USER_PAGE } from '@/db/mock-data'
import { adminMiddleware } from '@/lib/auth/admin-middleware'

// The page has no loader, so beforeLoad calls this to keep the page from
// showing. Each seed function below is guarded as well, because a server
// function has its own address and can be called without the page.
const ensureAdmin = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(() => true)

export const Route = createFileRoute('/sandbox/')({
  beforeLoad: async () => {
    await ensureAdmin()
  },
  component: RouteComponent,
})

const seedGrids = createServerFn({
  method: 'POST', // default
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await db.insert(grids).values(SAMPLE_Grid).returning({
      insertedId: grids.id,
      insertedName: grids.name,
      ownerId: grids.ownerId,
    })
  })
const seedPage = createServerFn({
  method: 'POST', // default
})
  .middleware([adminMiddleware])
  .handler(async () => {
    return await db.insert(pages).values(SAMPLE_USER_PAGE).returning({
      insertedId: pages.id,
      insertedName: pages.name,
      ownerId: pages.ownerId,
    })
  })
const seedPixels = createServerFn({
  method: 'POST', // default
})
  .middleware([adminMiddleware])
  .handler(async () => {
    const formattedPixels = SAMPLE_BLOCKS.map((block) => {
      return {
        ownerId: 'hzwnjuReifl163FzsP1TkxQLo6mOv6cp',
        name: block.name,
        description: block.description,
        type: block.type,
        unit: block.unit, // unit to measure by
        endGoal: block.endGoal, // goal in units
        color: block.color,
        completedAt: block.completedAt,
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
          const seedPageResponse = await seedPage()
          console.log('//// seedPageResponse: ', seedPageResponse)
        }}
      >
        <button type="submit">seedPage</button>
      </form>
    </div>
  )
}
