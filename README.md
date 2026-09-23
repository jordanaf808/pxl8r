# PXL8

[![Netlify Status](https://api.netlify.com/api/v1/badges/26113811-0a84-4b23-ade2-e48fa52a2069/deploy-status)](https://app.netlify.com/projects/pxl8r/deploys)

A visual goal tracker that feels like your favorite bullet journal. Define goals, stack them into a grid, and watch your progress unfold — one block at a time.

PXL8 is a pixel-tracking web app where you create **pixels** to represent goals or tasks you want to complete, add them to **grids** that keep track of active or completed pixels, and fill **cells** over time as you make progress. Perfect for habit tracking, projects, fitness, finance, learning — anything that benefits from a visual, habit-tracker aesthetic.

---

## Features

- **Authentication**: Email/password sign-up and login, with GitHub OAuth support
- **Dashboard**: Overview of all your grids with quick-access pixel sidebar
- **Grid builder**: Create custom grids with configurable dimensions, scale type (daily/weekly/monthly/yearly), and progress ranges
- **Pixel editor**: Define reusable legend entries (pixels) with color, type, and unit — use them across multiple grids
- **Cell filling**: Click cells to fill them with a selected pixel; bulk upsert handles rapid updates efficiently
- **Grid pages**: Group related grids together on pages for better organization
- **Stats & progress**: View completion stats, progress percentages, and visual breakdowns by pixel type
- **Data persistence**: Full CRUD for all entities, with server-side ownership validation

---

## Tech Stack

| Layer          | Choice                     | Version    |
| -------------- | -------------------------- | ---------- |
| Framework      | TanStack Start             | 1.132.0    |
| Build tool     | Vite                       | 7.3.1      |
| Language       | TypeScript                 | 5.9.3      |
| ORM            | Drizzle ORM                | 0.45.0     |
| Database       | PostgreSQL (Neon or local) | —          |
| Auth           | BetterAuth                 | 1.4.12     |
| UI Components  | Shadcn/ui (Radix)          | Latest     |
| Styling        | Tailwind CSS               | 4.2.1      |
| Forms          | React Hook Form + Zod      | 7.71 / 4.3 |
| Charts         | Recharts                   | 2.15.0     |
| Testing        | Vitest                     | 3.2.4      |
| Hosting        | Netlify                    | —          |
| Client Routing | React Router               | TBD        |

---

## Getting Started

### Prerequisites

- **Node.js**: v20+ (check `NODE_VERSION` in `.env`)
- **pnpm**: [Install here](https://pnpm.io/installation)
- **Docker** (optional): For local Postgres; or use [Neon](https://neon.tech/) for a hosted serverless database
- **GitHub OAuth app** (optional): For GitHub login support

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <repo>
   cd pxl8
   pnpm install
   ```

2. **Set up environment variables**

   Copy `.env` (or create one) and populate these values:

   | Variable             | Purpose                                                    |
   | -------------------- | ---------------------------------------------------------- |
   | `DATABASE_URL`       | PostgreSQL connection string (Neon or local)               |
   | `DB_HOST`            | Local Postgres hostname (e.g., `localhost`)                |
   | `DB_PORT`            | Local Postgres port (e.g., `5432`)                         |
   | `DB_USER`            | Local Postgres username                                    |
   | `DB_PASSWORD`        | Local Postgres password                                    |
   | `DB_NAME`            | Local Postgres database name                               |
   | `NEON_DB_URL`        | Neon serverless connection (alternative to local)          |
   | `BETTER_AUTH_SECRET` | Auth signing key (generate via `pnpm auth:generate`)       |
   | `BETTER_AUTH_URL`    | Auth callback URL (e.g., `http://localhost:3000/api/auth`) |
   | `GITHUB_AUTH_ID`     | GitHub OAuth app client ID                                 |
   | `GITHUB_AUTH_SECRET` | GitHub OAuth app client secret                             |
   | `VITE_NEON_AUTH_URL` | Neon auth endpoint (if using Neon Auth)                    |

3. **Set up the database**

   **Option A: Local Postgres (Docker)**

   ```bash
   docker compose up -d
   pnpm db:push
   ```

   **Option B: Neon serverless**

   ```bash
   # Set DATABASE_URL and NEON_DB_URL in .env
   pnpm db:push
   ```

   View and inspect data:

   ```bash
   pnpm db:studio
   ```

4. **Generate auth secret**

   ```bash
   pnpm auth:generate
   ```

   Copy the generated secret into `BETTER_AUTH_SECRET` in `.env`.

5. **Set up GitHub OAuth (optional)**
   - Create a GitHub OAuth app at [github.com/settings/developers](https://github.com/settings/developers)
   - Set the callback URL to `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and Client Secret into `GITHUB_AUTH_ID` and `GITHUB_AUTH_SECRET`

6. **Run the dev server**

   ```bash
   pnpm dev
   ```

   Navigate to `http://localhost:3000`

---

## Available Scripts

| Command              | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `pnpm dev`           | Start dev server on port 3000                       |
| `pnpm build`         | Build for production                                |
| `pnpm preview`       | Preview production build locally                    |
| `pnpm test`          | Run Vitest test suite                               |
| `pnpm db:generate`   | Generate Drizzle migrations from schema changes     |
| `pnpm db:migrate`    | Apply pending migrations to the database            |
| `pnpm db:push`       | Push schema changes directly (useful for early dev) |
| `pnpm db:pull`       | Introspect existing database and update schema      |
| `pnpm db:studio`     | Open Drizzle Studio to inspect and edit data        |
| `pnpm lint`          | Run ESLint                                          |
| `pnpm format`        | Check formatting with Prettier                      |
| `pnpm check`         | Format and lint in fix mode                         |
| `pnpm auth:generate` | Generate BetterAuth schema and secret               |

---

## Project Structure

```
src/
├── components/
│   ├── layout/              # App shell (Header, layout, NotFound)
│   ├── ui/                  # Shadcn/Radix UI library components (~60 components)
│   └── sketchy-elements.tsx # Shared design primitives (dividers, etc.)
│
├── db/
│   ├── schema.ts            # Drizzle schema (users, grids, pixels, cells, pages, etc.)
│   ├── queries.functions.ts # Server functions for reads
│   ├── mutations.functions.ts # Server functions for writes
│   ├── index.ts             # DB client export
│   ├── mock-data.ts         # Seed data for local development
│   └── types/
│       ├── db.types.ts      # $inferSelect/$inferInsert types
│       ├── ui.types.ts      # Composite view types
│       ├── schemas.ts       # Zod validators
│       └── constants.ts     # Display constants (colors, labels)
│
├── features/
│   ├── dashboard/           # Dashboard and grid UI
│   │   ├── Dashboard.tsx
│   │   ├── GridCard.tsx
│   │   ├── PixelCard.tsx
│   │   ├── PixelSidebar.tsx
│   │   ├── PixelGrid.tsx
│   │   ├── StatsBar.tsx
│   │   └── DashboardHeader.tsx
│   └── homepage/            # Landing page
│       └── Homepage.tsx
│
├── integrations/
│   └── better-auth/         # BetterAuth client setup
│
├── lib/
│   ├── auth/                # Auth server instance and middleware
│   └── utils/               # Shared utilities
│
├── routes/
│   ├── __root.tsx           # Root layout, session injection
│   ├── index.tsx            # Homepage
│   ├── (auth)/login.tsx     # Login/signup page
│   ├── dashboard/           # Dashboard route
│   ├── api/auth/$.ts        # Auth API routes
│   └── demo/, sandbox/      # Development-only demo routes (can delete)
│
├── env.ts                   # T3Env type-safe environment variables
└── styles.css               # Global styles, Tailwind, theme variables
```

---

## Data Model

The core entities are:

- **users**: Account holders with auth data, theme preference, and saved-item IDs
- **grids**: The main tracker entity that keeps track of active or completed pixels — configurable layouts with dimensions (cols × rows), scale type (daily/weekly/monthly/yearly), and progress range
- **pixels**: Goals or tasks you want to track (e.g., "Morning Run", "Learning", "Meditation") with color, type (boolean/numeric/rating), and unit
- **cells**: Individual filled positions on a grid — one row per cell, with a unique constraint on `(gridId, col, row)` enabling efficient upserts
- **gridPixels**: Junction table linking which pixels belong to which grid and their display order
- **pages**: Groupings of grids (e.g., "Fitness Tracker" might contain 3 grids)
- **pageGrids**: Junction table linking grids to pages
- **colorPalettes**: Named color schemes (unused in UI currently)
- **templates**: Snapshot of a grid configuration (no cell data) for "create from template" workflows
- **savedPixels**, **savedGrids**, **savedTemplates**: Junction tables for bookmarking/marking items as favorites

All table names are prefixed with `db_pxl8r_` to safely allow sharing a Postgres instance with other projects.

---

## Status

- User authentication (email/password, GitHub OAuth)
- Session management with server-side validation
- Dashboard with grid visualization and pixel sidebar
- Full CRUD for grids, pixels, cells, and pages
- Bulk cell upsert (optimized for rapid click-to-fill interactions)
- Grid statistics (completion %, progress tracking)
- Netlify deployment

---

## Deployment

### Netlify

Production builds are deployed to Netlify via the `@netlify/vite-plugin-tanstack-start` integration.

**Configuration**: See `netlify.toml` for build settings.

**Database**: Use Neon (serverless PostgreSQL) in production. Set `DATABASE_URL` to your Neon connection string in Netlify environment variables.

**Environment variables**: Add all required `.env` variables to Netlify project settings under _Environment_.

---

## Development Notes

- **Local database**: `docker compose` is included for quick local Postgres setup. Remove the container and volume with `docker compose down -v` if you need a fresh start.
- **Drizzle Studio**: Use `pnpm db:studio` to visually inspect and edit database tables during development.
- **Auth secret**: Generate a new secret every time you set up a fresh `.env` — do not commit `BETTER_AUTH_SECRET` to version control.
- **Demo routes**: The `/demo` and `/sandbox` routes are scaffolding left over from `@tanstack/cli` — delete them if you want to clean up.

---

## Learn More

- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [Drizzle ORM](https://orm.drizzle.team/)
- [BetterAuth](https://www.better-auth.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
