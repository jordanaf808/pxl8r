import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type auth from './auth'

export const { useSession, signIn, signOut, signUp, getSession } =
  createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: 'http://localhost:3000',
    plugins: [inferAdditionalFields<typeof auth>()],
  })

export const GitHubSignIn = async () => {
  const data = await signIn.social({
    provider: 'github',
  })
  console.log('//// GITHUB SIGNIN: ', data)
}
