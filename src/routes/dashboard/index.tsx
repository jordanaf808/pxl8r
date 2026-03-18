import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '@/components/dashboard'
import {
  getGridsByOwnerId,
  getPagesByOwnerId,
  getPixelsByOwnerId,
} from '@/db/queries.server'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  loader: async () => {
    const [pixels, pages, grids] = await Promise.all([
      getPixelsByOwnerId(),
      getPagesByOwnerId(),
      getGridsByOwnerId(),
    ])
    if (pixels.length < 1) throw new Error('No pixels found')
    console.log('//// /dashboard - loader - getPixels: ', pixels)
    if (pages.length < 1) throw new Error('No pages found')
    // console.log('//// /dashboard - loader - pages: ', pages)
    if (grids.length < 1) throw new Error('No grids found')
    // console.log('//// /dashboard - loader - grids: ', grids)
    return { pages, grids, pixels }
  },
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
  const user = session?.user
  console.log('//// Dashboard - user id: ', user?.id)
  console.log('//// Dashboard - pixels count: ', userData.pixels.length)
  console.log('//// Dashboard - pages count: ', userData.pages.length)
  console.log('//// Dashboard - grids count: ', userData.grids.length)

  return (
    <>
      {user && (
        <Dashboard
          user={user}
          userData={userData}
          onLogout={() => {
            throw redirect({ to: '/' })
          }}
        />
      )}
    </>
  )
}
