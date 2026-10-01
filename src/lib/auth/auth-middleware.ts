import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import auth from './auth'
import { redirect } from '@tanstack/react-router'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()

  // auth.api runs in this process. The browser client in auth-client.ts would
  // send an HTTP request to this server's own /api/auth/get-session instead
  const session = await auth.api.getSession({ headers })

  // console.log('//// AUTH-MIDDLEWARE - session: ', session)

  if (!session?.user.id) {
    console.log('Auth-Middleware - Not Logged In')
    throw redirect({ to: '/' })
  }

  return next({
    context: {
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
    },
  })
})
