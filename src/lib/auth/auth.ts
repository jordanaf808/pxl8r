import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
// import { customSession } from 'better-auth/plugins'
import { users, account, session, verification } from '@/db/schema'

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      users,
      account,
      session,
      verification,
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5min
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_AUTH_ID!,
      clientSecret: process.env.GITHUB_AUTH_SECRET!,
    },
  },
  plugins: [tanstackStartCookies()],
  user: {
    modelName: 'users',
    additionalFields: {
      theme: {
        type: ['journal', 'matrix', 'knightrider', 'synthwave', 'blueprint'],
        required: false,
        defaultValue: 'journal',
        input: true,
      },
      savedPixelIds: {
        type: 'string[]',
        required: false,
        defaultValue: [],
        input: false,
      },
      savedGridIds: {
        type: 'string[]',
        required: false,
        defaultValue: [],
        input: false,
      },
      savedTemplateIds: {
        type: 'string[]',
        required: false,
        defaultValue: [],
        input: false,
      },
    },
  },
  experimental: { joins: true },
})

export default auth
