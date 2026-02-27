// schema.ts — Pixel Tracker App
// Drizzle ORM + PostgreSQL

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const unitTypeEnum = pgEnum('unit_type', [
  'percent',
  'dollar',
  'hour',
  'minute',
  'day',
  'gram',
  'lbs',
  'cups',
  'gallon',
  'reps',
  'steps',
  'miles',
  'custom',
])

export const scaleTypeEnum = pgEnum('scale_type', [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
])

export const themeEnum = pgEnum('theme', [
  'journal', // default paper/bullet journal
  'matrix', // terminal green on black
  'knightrider', // red on black, retro 80s
  'synthwave', // neon purple/pink
  'blueprint', // engineering notebook
])

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'), // avatar
  theme: themeEnum('theme').default('journal'),

  // Arrays of owned/saved IDs — lightweight references
  savedPixelIds: uuid('saved_pixel_ids').array().default([]),
  savedTableIds: uuid('saved_table_ids').array().default([]),
  savedTemplateIds: uuid('saved_template_ids').array().default([]),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_userId_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index('account_userId_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

// ─────────────────────────────────────────────
// COLOR PALETTES
// ─────────────────────────────────────────────

export const colorPalettes = pgTable(
  'color_palettes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // e.g. "Matrix Green", "Fire Scale"
    ownerId: uuid('owner_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    isPublic: boolean('is_public').default(false), // future: community palettes

    // Array of hex strings, ordered: [ "#1a1a1a", "#00ff41", "#00cc33" ]
    colors: text('colors').array().notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index('color_palettes_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// PIXELS (reusable pixel definitions / legend entries)
// ─────────────────────────────────────────────

export const pixels = pgTable(
  'pixels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // e.g. "Completed", "Skipped", "PR"
    description: text('description'),
    label: text('label'), // short label shown in key
    color: text('color').notNull(), // hex color string
    unit: unitTypeEnum('unit'),
    ownerId: uuid('owner_id').references(() => user.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index('pixels_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// TABLES (the pixel grid itself)
// ─────────────────────────────────────────────

export const tables = pgTable(
  'tables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false),

    // Grid dimensions
    columns: integer('columns').notNull().default(7),
    rows: integer('rows').notNull().default(52), // 7x52 = year tracker

    // Scale configuration
    scaleType: scaleTypeEnum('scale_type').default('daily'),
    scaleUnit: unitTypeEnum('scale_unit'),
    scaleStart: integer('scale_start'), // e.g. 0 (start value)
    scaleEnd: integer('scale_end'), // e.g. 100 (goal value)
    scaleLabel: text('scale_label'), // e.g. "lbs", "miles", "%"

    // Theme override (inherits user theme if null)
    theme: themeEnum('theme'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index('tables_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// TABLE_PIXELS — which pixel types belong to a table (the legend/key)
// Junction table: tables ↔ pixels
// ─────────────────────────────────────────────

export const tablePixels = pgTable(
  'table_pixels',
  {
    tableId: uuid('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    pixelId: uuid('pixel_id')
      .notNull()
      .references(() => pixels.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0), // display order in the legend
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tableId, t.pixelId] }),
  }),
)

// ─────────────────────────────────────────────
// CELLS — individual filled cells in a grid
// This is the core data entry — one row per filled cell
// ─────────────────────────────────────────────

export const cells = pgTable(
  'cells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tableId: uuid('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    pixelId: uuid('pixel_id').references(() => pixels.id, {
      onDelete: 'set null',
    }),

    // Grid position — col/row index (0-based)
    col: integer('col').notNull(),
    row: integer('row').notNull(),

    // Optional metadata per cell
    value: integer('value'), // numeric value if tracking amounts
    note: text('note'), // optional text annotation
    colorOverride: text('color_override'), // if user overrides the pixel color for this cell
    filledAt: timestamp('filled_at'), // when the user marked this cell
    ownerId: uuid('owner_id').references(() => user.id, {
      onDelete: 'cascade',
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    // Critical: fast lookup of all cells in a table
    tableIdx: index('cells_table_idx').on(t.tableId),
    // Unique constraint: only one cell per grid position per table
    positionIdx: index('cells_position_idx').on(t.tableId, t.col, t.row),
  }),
)

// ─────────────────────────────────────────────
// PAGES — dashboard views that group multiple tables
// ─────────────────────────────────────────────

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false),
    theme: themeEnum('theme'),

    // Ordered array of tableIds shown on this page
    tableIds: uuid('table_ids').array().default([]),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index('pages_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// TEMPLATES — saveable table configurations (no cell data)
// ─────────────────────────────────────────────

export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: uuid('owner_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    isPublic: boolean('is_public').default(false),

    // Snapshot of table config + pixel definitions (no cell data)
    config: jsonb('config').notNull(), // { columns, rows, scaleType, scaleUnit, pixels[] }
    tags: text('tags').array().default([]), // e.g. ["fitness", "work", "gaming"]
    theme: themeEnum('theme'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index('templates_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  tables: many(tables),
  pages: many(pages),
  pixels: many(pixels),
  colorPalettes: many(colorPalettes),
  cells: many(cells),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const tablesRelations = relations(tables, ({ one, many }) => ({
  owner: one(user, { fields: [tables.ownerId], references: [user.id] }),
  tablePixels: many(tablePixels),
  cells: many(cells),
}))

export const cellsRelations = relations(cells, ({ one }) => ({
  table: one(tables, { fields: [cells.tableId], references: [tables.id] }),
  pixel: one(pixels, { fields: [cells.pixelId], references: [pixels.id] }),
  owner: one(user, { fields: [cells.ownerId], references: [user.id] }),
}))

export const tablePixelsRelations = relations(tablePixels, ({ one }) => ({
  table: one(tables, {
    fields: [tablePixels.tableId],
    references: [tables.id],
  }),
  pixel: one(pixels, {
    fields: [tablePixels.pixelId],
    references: [pixels.id],
  }),
}))

export const pixelsRelations = relations(pixels, ({ one }) => ({
  owner: one(user, { fields: [pixels.ownerId], references: [user.id] }),
}))

export const colorPalettesRelations = relations(colorPalettes, ({ one }) => ({
  owner: one(user, {
    fields: [colorPalettes.ownerId],
    references: [user.id],
  }),
}))

export const pagesRelations = relations(pages, ({ one }) => ({
  owner: one(user, { fields: [pages.ownerId], references: [user.id] }),
}))

export const templatesRelations = relations(templates, ({ one }) => ({
  owner: one(user, { fields: [templates.ownerId], references: [user.id] }),
}))

// ─────────────────────────────────────────────
// TYPE EXPORTS (inferred from schema)
// ─────────────────────────────────────────────

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert
export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert
export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
export type Cell = typeof cells.$inferSelect
export type NewCell = typeof cells.$inferInsert
export type Pixel = typeof pixels.$inferSelect
export type NewPixel = typeof pixels.$inferInsert
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert
export type ColorPalette = typeof colorPalettes.$inferSelect
export type NewColorPalette = typeof colorPalettes.$inferInsert
