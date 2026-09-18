<!-- markdownlint-disable MD024 -->

# Changelog

Changes to PXL8, newest first. There are no tagged releases, so entries are grouped by when the work happened. Dates are commit author dates (local time); short hashes point at the commits in `git log`.

Work merged via PRs #1-#3 on 2026-09-18 was authored between 2026-06-26 and 2026-09-17 and landed on `main` as cherry-picked copies, so the hashes on `main` differ from the originals.

---

## Unreleased

### Known issues

- **Paused timers round up to a whole minute.** `onPause` in `CreateGridModal.tsx` stores `Math.ceil(remainingSeconds / 60)` into the integer `timerMinutes`, so the seconds are lost.
- **Timer icon disappears when a timer is paused.** `GridCard.tsx` only shows it while `timerStartedAt` is set.
- **`bulkUpsertCells` cannot clear nullable fields.** Its `COALESCE(excluded.x, cells.x)` upsert keeps the old value when the new one is `null`, so `pixelId`, `value`, `note` and `completedAt` cannot be reset to null through it. The timer columns are excluded from this (assigned directly).

---

## 2026-09-18 - PRs #1-#4 merged

### Changed

- **Grid card styles** updated from the latest v0 mockup (`cff5977`, authored 2026-09-17).
- **pnpm v12**: ran the config codemod on `pnpm-workspace.yaml` (`0afef11`, 2026-09-17).
- **`PixelColor`** type is now derived from the schema instead of maintained by hand (`8ec8285`, 2026-07-02).
- **README** gained Netlify deployment status (`f6f8330`, 2026-09-18).

### Added

- **`cells_owner_idx`** index on `db_pxl8r_cells.owner_id` (migration `0007`, `8ec8285`, 2026-07-02). Dashboard loads filter `cells` by owner alone, and every other owner-scoped table already had this index. The index was added to `schema.ts` on 2026-06-24 (`5eacf5e`); the migration was generated later.
- **Homepage SVG animation** (`1400e41`, 2026-07-01).

### Fixed

- **Hero animation** for the isometric pixel grid (`29903d8`, 2026-09-17).
- **Theme flash for guests**: the page now respects the OS colour scheme and avoids a flash of the wrong theme before hydration. An inline script reads `localStorage['pxl8-theme']`, and `<html>` gets `data-theme-init` when a session exists so the script does not override the server-rendered theme. `theme-provider.tsx` was deleted (`d972170`, 2026-07-01).
- **Theme flash on login**: `isDarkMode` now comes from router context (`session.user.darkMode`) instead of component state, and the effect that re-synced it after the session loaded was removed. Includes a `Dashboard.tsx` cleanup (`a8ad7ca`, 2026-07-01).

### Removed

- `SketchyDivider` from the homepage (`1400e41`) and assorted unused code (`5fe8ce1`, 2026-06-26).

---

## 2026-06-19 to 2026-06-24 - Timers, dark mode, dashboard UX

### Added

- **Per-cell timers**: each grid cell can have its own countdown (1-120 minutes, seeded from the pixel's goal). Start, pause and disable persist to `cells.timerMinutes` / `timerStartedAt`, so a running timer survives a reload. `CreatePixelModal` has no timer field. First version was a pixel-level countdown (`b56c606`, 2026-06-22), reworked to per-cell in `a21dd59` and `4dba48b`.
- **Pixels are opt-in on the dashboard**: a new pixel only appears in the sidebar library until "Add to Dashboard" sets `pixels.is_active` (`ea65aa3`).
- **Dark mode persists** per user in `users.dark_mode` (`ea65aa3`, `914ec06`).
- **Filter popover** for pixel type, behind a Filter icon next to the search box (`0ba0809`).
- Seed data script `src/db/seed.ts` (`b56c606`).

### Changed

- **Grid editor**: selected-cell panel has separate empty and filled states; clicking a cell on a dashboard grid opens the editor with that cell selected; row/column steppers became chevrons at the grid edges (`4dba48b`, `0ba0809`).
- **Pixel form**: "End Goal" renamed "Goal"; slider max and step are set per unit; "Pixel Name" and "Description" labels replaced by placeholders (`a21dd59`).
- **Delete buttons removed** from pixel cards, grid cards and the sidebar; clicking a card opens it for editing (`0ba0809`).
- Global corner radius 0.25rem to 0.625rem (`f627fbb`).
- Replaced the TanStack Start boilerplate README with project documentation (`e73c9ab`).
- Hamburger menu commented out: its links were testing-only routes (`914ec06`).

### Fixed

- Login page now allows signup (`eca8db3`, 2026-06-19); signup flow fixed (`b56c606`, 2026-06-22).
- Grid card mini-grid did not update after edits in the grid editor because it copied props into state once; it now reads the live prop.
- Efficiency pass (`5eacf5e`): removed 8 leftover debug `console.log` calls; `updatePageGridSort` now checks ownership with a single-row lookup instead of a subquery over all pages; sidebar "add to dashboard" button is visible on keyboard focus; session cookie cache raised from 1 to 5 minutes.
- Playwright MCP debug artifacts added to `.gitignore` (`106855a`).

---

## 2026-04-09 to 2026-04-24 - Blocks and groups become pixels and grids

- **Renames** from the V0 scaffold vocabulary: block to pixel, group to grid, `BlockCard` to `PixelCard`, `block-group-card` to `GridCard`; pixel colour became a schema enum (2026-04-09 to 04-10).
- **Dashboard data** consolidated into one `getDashboardGridData` server function using `Promise.all`; `createGrid` replaced `addGroup`; `deleteGridPixels` added (2026-04-09).
- **Progress and completion moved from pixels to cells**: `toggleComplete` and `updateProgress` now write cells (2026-04-18).
- **Header** brought over from the V0 version with dark-mode toggle and logout; BetterAuth user IDs handled as strings, not UUIDs; grid modal cell editing (pixel, note, value, progress, `completedAt`) (2026-04-23).
- **Refactor to feature folders** (`0df8025`, 2026-04-23): `usePixelState`, `useGridState`, `useDashboardFilter` hooks; `db/types.ts` split by concern; stats and map helpers moved to `lib/utils`; `useEffect`-derived state replaced with `useMemo`.
- **Pixel sidebar** for managing pixels, unit suffix helper, and the V0 homepage (2026-04-24).

---

## 2026-03-26 to 2026-04-06 - Neon and Netlify

- `completedAt` replaced the boolean `completed` on cells (2026-03-26/27).
- Netlify config and deploy helper added (2026-03-26).
- Database moved from local Postgres to Neon; enums renamed `cellTypeEnum` and `pixelTypeEnum`; `auth.server` renamed `auth.functions` so it can be imported client-side (2026-03-27).
- Sign-in `ERR_NAME_NOT_RESOLVED` on the Netlify site: `baseURL` handling in the auth client changed several times (2026-04-03); the journal records the final fix as correcting the `baseURL` environment variable in Netlify.
- `ssl: true` added to the Drizzle config (2026-04-09).

---

## 2026-02-26 to 2026-03-19 - Foundation

- **Scaffold** (2026-02-26): TanStack Start via the TanStack CLI with Tailwind, ESLint/Prettier, Drizzle, BetterAuth and t3env; Neon connected.
- **Auth and schema** (02-27 to 03-03): auth schema merged into the app schema; GitHub OAuth; local Postgres in Docker (`639844a`); `modelName: 'users'` did not take effect in BetterAuth, so tables are referenced directly in the Drizzle adapter; `auth:generate` script.
- **V0 UI and seed data** (03-04): V0-generated components, seed functions, tables renamed to grids.
- **Server functions** (03-05 to 03-14): auth middleware with session in context; ownership checks on mutations; `bulkUpsertCells` rewritten with `onConflictDoUpdate` to remove SQL built by string interpolation; `updateCell` split out; saved-ID arrays on `users` replaced by junction tables; `.server` file suffix so database code stays out of the client bundle.
- **Auth fixes** (03-15 to 03-18): `referencedTable` errors traced to relation names in the auth schema.
- **Pixels** (03-18 to 03-19): started the block-to-pixel rename; logout and unauthorized redirects; server functions return a `success` field.
