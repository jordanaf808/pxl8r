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
      return <NotFoundComponent data={new Error('default error', data!)} />
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
  return <ErrorComponent error={error} />
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
