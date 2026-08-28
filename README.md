# GotYaBro

Community management platform for gyms. A gym creates a community, adds its
members, tags them with roles (Trainer, Yoga, …), and tracks insights and
activity — the admin side of a two-part product whose customer-facing
community app comes later.

## Stack

- **Next.js** (App Router, Server Components + Server Actions)
- **PostgreSQL** via `pg` — plain SQL, no ORM (schema in `lib/schema.sql`)
- **Tailwind CSS**
- `zod` for input validation, `bcryptjs` for password hashing,
  HMAC-signed cookie sessions (`lib/session.ts`)

## Setup

1. Have PostgreSQL running locally and create the database:

   ```bash
   createdb gotyabro
   ```

2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` plus a long
   random `SESSION_SECRET`.

3. Install, migrate, seed, run:

   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. Open http://localhost:3000 and sign in with the seeded demo account:
   `admin@demogym.com` / `demo1234`.

## Structure

- `lib/schema.sql` — database schema (idempotent DDL)
- `lib/db.ts` — pg pool + `withTransaction`
- `lib/auth.ts` — `requireCommunity()`: resolves the tenant (gym → community)
  from the session; every query is scoped through it
- `lib/actions.ts` — all mutations as Server Actions; each writes its
  activity-log row in the same transaction via `lib/activity.ts`
- `lib/queries.ts` — read queries (members with roles, roles with counts,
  activity feed, insights)
- `app/dashboard/*` — Overview, Members, Roles, Settings
- `scripts/migrate.ts`, `scripts/seed.ts` — DB setup

Members are soft-deleted (`status = 'REMOVED'`) so history and the activity
log stay intact; roles are hard-deleted and cascade their assignments.
