import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getSession } from './auth-client'
import { redirect } from '@tanstack/react-router'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const { headers } = getRequest()

  const { data: session } = await getSession({
    fetchOptions: {
      headers: headers as HeadersInit,
    },
  })

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
