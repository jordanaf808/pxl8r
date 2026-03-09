// schema.ts — Pixel Tracker App
// Drizzle ORM + PostgreSQL

import {
  // pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
  uuid,
  uniqueIndex,
  check,
  smallint,
  pgTableCreator,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

const pgTable = pgTableCreator((name) => `db_pxl8r_${name}`)

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────
export const pixelTypeEnum = pgEnum('pixel_type', [
  'boolean', // done/not done
  'numeric', // track a value
  'rating', // 1-5 stars etc
  'time', // duration based
])

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
  'kilometers',
  'pages',
  'books',
  'rating',
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

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'), // avatar
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  theme: text('theme').default('journal'),
  savedPixelIds: text('saved_pixel_ids')
    .array()
    .default(sql`ARRAY[]::text[]`),
  savedGridIds: text('saved_grid_ids')
    .array()
    .default(sql`ARRAY[]::text[]`),
  savedTemplateIds: text('saved_template_ids')
    .array()
    .default(sql`ARRAY[]::text[]`),
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
      .references(() => users.id, { onDelete: 'cascade' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
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
    ownerId: text('owner_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    isPublic: boolean('is_public').default(false), // future: community palettes

    // Array of hex strings, ordered: [ "#1a1a1a", "#00ff41", "#00cc33" ]
    colors: text('colors').array().notNull(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
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
    ownerId: text('owner_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    name: text('name').notNull(),
    description: text('description'),
    type: pixelTypeEnum('type'),
    unit: unitTypeEnum('unit'), // unit to measure by
    endGoal: integer('end_goal'), // short label shown in key
    color: text('color').notNull(), // hex color string
    completed: boolean().default(false),
    progress: smallint().default(0),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => ({
    ownerIdx: index('pixels_owner_idx').on(t.ownerId),
    // Add check constraint for 0-100 range
    progressRange: check(
      'progress_range',
      sql`${t.progress} >= 0 AND ${t.progress} <= 100`,
    ),
  }),
)

// ─────────────────────────────────────────────
// Grids (the pixel grid itself)
// ─────────────────────────────────────────────

export const grids = pgTable(
  'grids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false),

    // Grid dimensions
    columns: smallint('columns').notNull().default(7),
    rows: smallint('rows').notNull().default(52), // 7x52 = year tracker

    // Scale configuration
    scaleType: scaleTypeEnum('scale_type').default('daily'),
    scaleUnit: unitTypeEnum('scale_unit'),
    scaleStart: smallint('scale_start'), // e.g. 0 (start value)
    scaleEnd: smallint('scale_end'), // e.g. 100 (goal value)
    scaleLabel: text('scale_label'), // e.g. "lbs", "miles", "%"

    // Theme override (inherits user theme if null)
    theme: themeEnum('theme'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => ({
    ownerIdx: index('grids_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// GRID_PIXELS — which pixel types belong to a grid (the legend/key)
// Junction table: grids ↔ pixels
// ─────────────────────────────────────────────

export const gridPixels = pgTable(
  'grid_pixels',
  {
    gridId: uuid('grid_id')
      .notNull()
      .references(() => grids.id, { onDelete: 'cascade' }),
    pixelId: uuid('pixel_id')
      .notNull()
      .references(() => pixels.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0), // display order in the legend
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gridId, t.pixelId] }),
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
    ownerId: text('owner_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    gridId: uuid('grid_id')
      .notNull()
      .references(() => grids.id, { onDelete: 'cascade' }),
    pixelId: uuid('pixel_id').references(() => pixels.id, {
      onDelete: 'set null',
    }),

    // Grid position — col/row index (0-based)
    col: smallint('col').notNull(),
    row: smallint('row').notNull(),

    // Optional metadata per cell
    value: integer('value'), // numeric value if tracking amounts
    note: text('note'), // optional text annotation
    colorOverride: text('color_override'), // if user overrides the pixel color for this cell
    completedAt: timestamp('completed_at'), // when the user marked this cell

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => ({
    // Critical: fast lookup of all cells in a grid
    gridIdx: index('cells_grid_idx').on(t.gridId),
    // Unique constraint: only one cell per grid position per grid
    positionIdx: uniqueIndex('cells_position_idx').on(t.gridId, t.col, t.row),
  }),
)

// ─────────────────────────────────────────────
// PAGES — dashboard views that group multiple grids
// ─────────────────────────────────────────────

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false),
    theme: themeEnum('theme'),

    // This is already being tracked in pageGrids junction-table
    // gridIds: uuid('grid_ids').array().default([]),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => ({
    ownerIdx: index('pages_owner_idx').on(t.ownerId),
  }),
)

export const pageGrids = pgTable(
  'page_grids',
  {
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    gridId: uuid('grid_id')
      .notNull()
      .references(() => grids.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0), // preserves display order
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pageId, t.gridId] }),
  }),
)

// ─────────────────────────────────────────────
// TEMPLATES — saveable grid configurations (no cell data)
// ─────────────────────────────────────────────

export const templates = pgTable(
  'templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    isPublic: boolean('is_public').default(false),

    // Snapshot of grid config + pixel definitions (no cell data)
    config: jsonb('config').notNull(), // { columns, rows, scaleType, scaleUnit, pixels[] }
    tags: text('tags').array().default([]), // e.g. ["fitness", "work", "gaming"]
    theme: themeEnum('theme'),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => ({
    ownerIdx: index('templates_owner_idx').on(t.ownerId),
  }),
)

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  grids: many(grids),
  pages: many(pages),
  pixels: many(pixels),
  colorPalettes: many(colorPalettes),
  cells: many(cells),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}))

export const gridsRelations = relations(grids, ({ one, many }) => ({
  owner: one(users, { fields: [grids.ownerId], references: [users.id] }),
  gridPixels: many(gridPixels),
  cells: many(cells),
  pageGrids: many(pageGrids),
}))

export const cellsRelations = relations(cells, ({ one }) => ({
  grid: one(grids, { fields: [cells.gridId], references: [grids.id] }),
  pixel: one(pixels, { fields: [cells.pixelId], references: [pixels.id] }),
  owner: one(users, { fields: [cells.ownerId], references: [users.id] }),
}))

export const gridPixelsRelations = relations(gridPixels, ({ one }) => ({
  grid: one(grids, {
    fields: [gridPixels.gridId],
    references: [grids.id],
  }),
  pixel: one(pixels, {
    fields: [gridPixels.pixelId],
    references: [pixels.id],
  }),
}))

export const pixelsRelations = relations(pixels, ({ one, many }) => ({
  owner: one(users, { fields: [pixels.ownerId], references: [users.id] }),
  gridPixels: many(gridPixels),
}))

export const colorPalettesRelations = relations(colorPalettes, ({ one }) => ({
  owner: one(users, {
    fields: [colorPalettes.ownerId],
    references: [users.id],
  }),
}))

export const pagesRelations = relations(pages, ({ one, many }) => ({
  owner: one(users, { fields: [pages.ownerId], references: [users.id] }),
  pageGrids: many(pageGrids),
}))

export const pageGridsRelations = relations(pageGrids, ({ one }) => ({
  page: one(pages, { fields: [pageGrids.pageId], references: [pages.id] }),
  grid: one(grids, { fields: [pageGrids.gridId], references: [grids.id] }),
}))

export const templatesRelations = relations(templates, ({ one }) => ({
  owner: one(users, { fields: [templates.ownerId], references: [users.id] }),
}))

// ─────────────────────────────────────────────
// TYPE EXPORTS (inferred from schema)
// ─────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert
export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert
export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert
export type Grid = typeof grids.$inferSelect
export type NewGrid = typeof grids.$inferInsert
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
