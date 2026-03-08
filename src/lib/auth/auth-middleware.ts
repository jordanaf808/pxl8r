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

  return next({
    context: {
      user: {
        id: session?.user.id,
        name: session?.user.name,
        image: session?.user.image,
      },
    },
  })
})
