import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_AUTH_ID as string,
      clientSecret: process.env.GITHUB_AUTH_SECRET as string,
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
      savedTableIds: {
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
