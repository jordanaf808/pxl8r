import {
  createRouter as createTanStackRouter,
  ErrorComponent,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import NotFoundComponent from './components/NotFoundComponent'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: ({ data }) => {
      return (
        <div className="flex items-start justify-center h-screen w-screen p-4">
          <div className="min-h-16 min-w-1/2">
            <NotFoundComponent data={new Error('default error', data!)} />
          </div>
        </div>
      )
    },
    defaultErrorComponent: PostError,
  })

  return router
}

function PostError({ error, reset }: ErrorComponentProps) {
  if (typeof window === 'undefined') {
    console.error('[SERVER ERROR] - ErrorComponent:', error)
  } else {
    console.error('[CLIENT ERROR] - ErrorComponent:', error)
  }
  return (
    <div className="flex items-start justify-center h-screen w-screen p-4">
      <div className="min-h-16 min-w-1/2">
        <ErrorComponent error={error} />
      </div>
    </div>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
