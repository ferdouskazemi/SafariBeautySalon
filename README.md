# Safari Beauty Salon (سالون آرایش سفری)

A small, fast booking site for a men's salon: a Dari (Farsi, RTL) landing page, guest booking,
booking tracking with reviews, and an admin panel for the manager and barbers.

## Stack

| Layer    | Tech                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| Monorepo | pnpm workspaces                                                                    |
| Web      | Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, Motion        |
| Data     | TanStack Query, react-hook-form                                                    |
| API      | NestJS 12 (ESM), Prisma 7 + PostgreSQL 17                                          |
| Shared   | `@safari/shared`: Zod schemas, DTO types and constants used by **both** apps       |
| Auth     | JWT access + refresh tokens in httpOnly cookies, argon2, role guards (ADMIN/STAFF) |
| Quality  | Vitest, oxlint (API), ESLint (web), Prettier                                       |

## Structure

```
apps/
  api/                  NestJS API
    prisma/             schema, migrations, seed
    src/modules/        auth · catalog · booking · reviews · staff · dashboard · health
    src/common/         Zod validation pipe/decorators, Prisma error filter
  web/                  Next.js site + admin panel
    src/app/            routes only: (site)/, admin/login, admin/(panel)/
    src/features/       landing · catalog · team · reviews · booking · auth · admin/*
    src/shared/         ui kit, http client, formatting, config
packages/
  shared/               schemas + types + time/phone helpers
```

Each feature owns its components, API hooks and state. Pages in `src/app` only compose features.

## Getting started

Requirements: Node 22+, pnpm 10, Docker.

```bash
pnpm install
docker compose up -d db                       # PostgreSQL on :5433
cp apps/api/.env.example apps/api/.env        # then set real JWT secrets
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate                               # apply migrations
pnpm db:seed                                  # manager, sample barbers, menu, demo reviews
pnpm dev                                      # web :3000, API :4000
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
- API docs (dev only): http://localhost:4000/api/docs

### Seeded accounts (development only)

| Role               | Phone                             | Password        |
| ------------------ | --------------------------------- | --------------- |
| Manager (ADMIN)    | `0700000000`                      | `ChangeMe-2026` |
| Barbers (STAFF)    | `0790000001` … `0790000003`       | `Barber-2026`   |
| Demo booking track | code `DEMO01`, phone `0799000010` |                 |

## How it works

- **Guest booking.** Customers pick a service or package, a barber from the list (or "any"), a day on
  a Saturday-to-Friday week calendar (each day shows how many free times it has), then an hour.
  They get a 6-character code; code + phone lets them cancel, or review after the visit.
- **Team notifications.** Every booking, cancellation and review creates a message for the booked
  barber and the managers. The panel polls every 30 s, shows an unread badge on «پیام‌ها» and a toast
  when something new arrives; opening a message jumps to that day in the schedule.
- **Availability** is computed on the server from each barber's working hours and existing bookings.
  "Any barber" assigns the least busy free barber.
- **No double booking.** Besides the server-side check, a PostgreSQL exclusion constraint
  (`appointments_no_overlap`) makes overlapping bookings for one barber impossible, even under races.
- **Reviews** are only accepted for completed appointments (one per visit). The manager can hide reviews.
- **Time zone.** All times are stored in UTC and shown in Asia/Kabul (UTC+04:30, no DST) using the
  Afghan solar calendar (حمل، ثور، …) and Dari digits. Prices are not shown anywhere; the site only says "prices start from 500 AFN".
- **Roles.** The manager manages staff, working hours, services/packages and reviews. Barbers log in
  and see and update only their own schedule.

## Scripts

| Command                        | What it does                        |
| ------------------------------ | ----------------------------------- |
| `pnpm dev`                     | Run shared (watch), API and web     |
| `pnpm build`                   | Build every package                 |
| `pnpm test`                    | Unit tests                          |
| `pnpm lint` / `pnpm typecheck` | Static checks                       |
| `pnpm format`                  | Prettier (with Tailwind class sort) |
| `pnpm db:migrate` / `db:seed`  | Database migrations / seed data     |

## Before going live

- Photos are free Unsplash stock (credits in `docs/brand/CREDITS.md`). Swap in real photos of the salon
  under the same file names in `apps/web/public/photos`.
- Set the real address, phone and Instagram in `apps/web/src/shared/config/site.ts`.
- Change the manager password after the first login, and use long random `JWT_*` secrets.
- In production set `COOKIE_SECURE=true`, serve over HTTPS, and run `pnpm --filter @safari/api db:deploy`.
