import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getSession } from './auth-client'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const { headers } = getRequest()

  const { data: session } = await getSession({
    fetchOptions: {
      headers: headers as HeadersInit,
    },
  })

  console.log('//// AUTH-MIDDLEWARE - session: ', session)

  if (!session?.user.id)
    throw new Error('Auth-Middleware - Not Logged In', { cause: 401 })

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
