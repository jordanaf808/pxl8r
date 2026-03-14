import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './auth-middleware'
import { getRequestHeaders } from '@tanstack/react-start/server'
import auth from './auth'

export const getUserId = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.user.id
  })

// We recommend using the client SDK or authClient to handle authentication, rather than server actions with auth.api.
// To protect resources that require authentication, use beforeLoad with a server function. This ensures authentication is checked on every navigation, including client-side navigation via <Link> components.
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    return session
  },
)
export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    if (!session) {
      throw new Error('Unauthorized')
    }
    return session
  },
)
