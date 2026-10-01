import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './auth-middleware'
import { getRequestHeaders } from '@tanstack/react-start/server'
import auth from './auth'

export const getUserId = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context.user.id
  })

// Server code reads the session with auth.api.getSession, which runs in this
// process. The browser client in auth-client.ts is for the browser (sign in,
// sign out, useSession). Called on the server, it sends an HTTP request to
// this app's own /api/auth/get-session.
// better-auth's guide (https://better-auth.com/docs/integrations/tanstack)
// recommends the browser client for signing in and up. To protect a route, it
// says to call a server function like this one from beforeLoad, so the session
// is checked on every navigation, including client-side ones through <Link>.
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers })
    // console.log('//// getSession - session: ', session)
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
