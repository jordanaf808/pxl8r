// import { drizzle } from 'drizzle-orm/node-postgres'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './auth-schema.ts'

const sql = neon(process.env.NEON_DATABASE_URL!)
export const db = drizzle({ client: sql, schema: schema })

// export const db = drizzle(
//   process.env.DATABASE_URL!,
//   {
//     schema
//   }
// )
