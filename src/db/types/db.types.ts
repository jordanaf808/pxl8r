import type * as schema from '@/db/schema'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres/session'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { ExtractTablesWithRelations } from 'drizzle-orm/relations'

// ---- Enum types extracted from schema ----

export type PixelTypeType = typeof schema.pixels.$inferSelect.type
export type PixelUnitType = typeof schema.pixels.$inferSelect.unit
export type PixelColor = 'rust' | 'sage' | 'gold' | 'slate' | 'warm'

// ---- Raw DB row types ----

export type User = typeof schema.users.$inferSelect
export type NewUser = typeof schema.users.$inferInsert
export type Session = typeof schema.session.$inferSelect
export type NewSession = typeof schema.session.$inferInsert
export type Account = typeof schema.account.$inferSelect
export type NewAccount = typeof schema.account.$inferInsert
export type Verification = typeof schema.verification.$inferSelect
export type NewVerification = typeof schema.verification.$inferInsert
export type Grid = typeof schema.grids.$inferSelect
export type NewGrid = typeof schema.grids.$inferInsert
export type Cell = typeof schema.cells.$inferSelect
export type NewCell = typeof schema.cells.$inferInsert
export type Pixel = typeof schema.pixels.$inferSelect
export type NewPixel = typeof schema.pixels.$inferInsert
export type Page = typeof schema.pages.$inferSelect
export type NewPage = typeof schema.pages.$inferInsert
export type Template = typeof schema.templates.$inferSelect
export type NewTemplate = typeof schema.templates.$inferInsert
export type ColorPalette = typeof schema.colorPalettes.$inferSelect
export type NewColorPalette = typeof schema.colorPalettes.$inferInsert

// ---- DB transaction type ----

export type DBTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

// ---- Legacy interfaces (retained for backward compatibility) ----

export interface Block {
  id: string
  name: string
  description: string
  type: string
  unit: typeof schema.unitTypeEnum
  endGoal: number
  color: string
  completed: boolean
  progress: number
  createdAt: string
  completedAt?: string
  groupId?: string
}

export interface BlockGroup {
  id: string
  name: string
  description: string
  color: PixelColor
  pixelIds: string[]
  createdAt: string
}
