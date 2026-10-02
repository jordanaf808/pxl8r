import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Dashboard } from '@/features/dashboard/Dashboard'
import {
  getGridsByOwnerId,
  getPagesByOwnerId,
  getPixelsByOwnerId,
  getDashboardGridData,
} from '@/db/queries.functions'

// A `?grid=` value that isn't a string becomes undefined instead of an error
// page, and Dashboard then opens the first tab
const dashboardSearchSchema = z.object({
  grid: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  validateSearch: dashboardSearchSchema,
  loader: async () => {
    const [pixels, pages, grids, gridsData] = await Promise.all([
      getPixelsByOwnerId(),
      getPagesByOwnerId(),
      getGridsByOwnerId(),
      getDashboardGridData(),
    ])
    // if (pixels.length < 1) throw new Error('No pixels found')
    console.log('//// /dashboard - loader - getPixels: ', pixels.length)
    // if (pages.length < 1) throw new Error('No pages found')
    // console.log('//// /dashboard - loader - pages: ', pages)
    // if (grids.length < 1) throw new Error('No grids found')
    return { pages, grids, pixels, gridsData }
  },
  // A tab click writes `?grid=`, which is a navigation to this same route.
  // Without this, the loader's four queries would re-run on every click, and
  // Dashboard would ignore the results: it copies loader data into state once
  shouldReload: false,
  // Drop the data when the route is left. Kept data would count as already
  // loaded on the way back, and shouldReload: false would then skip the loader
  gcTime: 0,
  pendingMs: 300,
  pendingMinMs: 300,
  pendingComponent: () => (
    <div className="flex text-center justify-center item-center">
      <h1>Loading pages...</h1>
    </div>
  ),
})

function RouteComponent() {
  const { session } = Route.useRouteContext()
  const userData = Route.useLoaderData()
  const { grid } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const user = session?.user
  console.log('//// Dashboard - user id: ', user?.id)

  return (
    <>
      {user && (
        <Dashboard
          user={user}
          userData={userData}
          initialGridId={grid}
          onActiveGridChange={(gridId) =>
            // replace: Back leaves the dashboard instead of stepping through
            // tabs. resetScroll: a navigation scrolls to the top by default
            void navigate({
              search: { grid: gridId ?? undefined },
              replace: true,
              resetScroll: false,
            })
          }
        />
      )}
    </>
  )
}
