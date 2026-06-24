import { db } from '@/db'
import { seedSampleDataForUser } from '@/db/seed'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import {
  users,
  account,
  session,
  verification,
  usersRelations,
  accountRelations,
  sessionRelations,
} from '@/db/schema'

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      users,
      account,
      session,
      verification,
      usersRelations,
      accountRelations,
      sessionRelations,
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await seedSampleDataForUser(user.id)
        },
      },
    },
  },
  user: {
    modelName: 'users',
    additionalFields: {
      theme: {
        type: ['journal', 'matrix', 'knightrider', 'synthwave', 'blueprint'],
        required: false,
        defaultValue: 'journal',
        input: true,
      },
      darkMode: {
        type: 'boolean',
        required: false,
        defaultValue: false,
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
