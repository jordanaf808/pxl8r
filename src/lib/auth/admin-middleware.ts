import { createMiddleware } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { account } from '@/db/schema'
import { authMiddleware } from './auth-middleware'

// auth.ts lets anyone sign up with an email and password, so a session doesn't
// show who someone is. This is the number GitHub gives the site owner's
// account. It's public, and better-auth saves it as account.accountId in every
// database, where users.id is different in each one.
const ADMIN_GITHUB_ACCOUNT_ID = '69128716'

export const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const adminAccounts = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, context.user.id),
          eq(account.providerId, 'github'),
          eq(account.accountId, ADMIN_GITHUB_ACCOUNT_ID),
        ),
      )
      .limit(1)

    if (adminAccounts.length === 0) {
      throw redirect({ to: '/' })
    }

    return next()
  })
