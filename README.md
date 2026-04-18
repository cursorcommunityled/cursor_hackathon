# CURSOR 48H

Open-source platform for running **48-hour AI hackathons**: landing site, registration, teams, screening, scoring, admin tools, and partner credits — built with **Next.js** and **PostgreSQL**.

---

## Contents

- [Features](#features)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [Docker & deployment](#docker--deployment)
- [Project layout](#project-layout)
- [References](#references)

---

## Features

| Area | What it does |
|------|----------------|
| **Landing** | Hero, sponsors, prizes, schedule, criteria, requirements, tech stack, partnership page. |
| **Auth** | Email + Google / GitHub via [Better Auth](https://www.better-auth.com/). Optional 2FA for admins. Admin sign-up can be limited with `SUPER_ADMIN_EMAILS`. |
| **Registration & onboarding** | User flow and completion status. |
| **Teams** | Create / join / leave, transfer lead, members. Invite links (`/r/[code]`). |
| **Screening** | MC questions, optional team video (YouTube / Drive). Admins approve or reject teams and manage questions. |
| **Projects** | Participant projects and admin CRUD. |
| **Credits** | Super-admin pools: split by team or participant, Excel upload of per-user links, shared links, short codes, audit log. |
| **Staff** | Invites, evaluation queue, team scoring. |
| **Ranking** | Public ranking from judges; optional late penalty; admin can set final overrides. |
| **Admin** | Users, teams, screening, projects, partners, credits, staff, settings (deadlines, etc.), security / 2FA. |
| **SEO** | Sitemap, robots, Open Graph, JSON-LD, canonical URLs. |

---

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**, **Framer Motion**
- **Drizzle ORM** + **PostgreSQL**
- **Better Auth** (OAuth, sessions)

Package scripts use **`npm`** in the included **Dockerfile**; locally you can use **Bun**, **pnpm**, or **yarn** if you prefer.

---

## Quick start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+ (or run Postgres via Docker)

### 1. Install

```bash
git clone <repository-url>
cd <your-project-folder>
npm install
```

### 2. Configure environment

Copy the example env file and edit values:

```bash
cp .env.example .env
```

See [Environment variables](#environment-variables) below.

### 3. Database

Start Postgres (example with Docker):

```bash
docker compose up -d postgres
npm run db:migrate
```

### 4. Run

**Development**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production build (local)**

```bash
npm run build
npm run start
```

---

## Environment variables

Create a `.env` in the project root. Typical variables:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL URL, e.g. `postgresql://user:pass@localhost:5432/yourdb` |
| `BETTER_AUTH_SECRET` | Yes | Long random string in production |
| `BETTER_AUTH_URL` | Yes | App origin used by auth (e.g. `http://localhost:3000`; HTTPS in production) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL users see |
| `SUPER_ADMIN_EMAILS` | See note | Comma-separated emails allowed for admin flows when configured |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | [Google OAuth](https://console.cloud.google.com) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | [GitHub OAuth](https://github.com/settings/developers) |
| `RESEND_API_KEY` | Optional | Transactional email (Resend) |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for metadata and sitemap (e.g. `https://your-domain.com`) |

If `SUPER_ADMIN_EMAILS` is empty, restricted admin sign-up paths are effectively disabled.

---

## Database

- **Engine:** PostgreSQL  
- **ORM:** Drizzle — schemas under `db/schema/`, migrations under `drizzle/`.  
- **Generate migrations:** `npm run db:generate`  
- **Apply migrations:** `npm run db:studio` (optional GUI) or `npm run db:migrate`

**Docker image:** the production container runs migrations on startup (`scripts/start-with-migrate.mjs`), with retries via `DB_MIGRATION_ATTEMPTS` (default `20`) and `DB_MIGRATION_DELAY_MS` (default `3000`). If you deploy without this image, run `npm run db:migrate` in CI or before switching traffic.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build (standalone) |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (once) |
| `npm run test:watch` | Vitest (watch) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Drizzle Studio |

---

## Docker & deployment

### Full stack (Postgres + app)

```bash
docker compose up -d
```

- App listens on **3001** inside the compose file (mapped to the host).  
- Postgres is exposed on **5432** (adjust for your environment).  
- Ensure `.env` exists; compose may override `DATABASE_URL` for the app service.

### Production experience (Dokploy)

This codebase has been **run in production using [Dokploy](https://dokploy.com)** (Docker-based deployments, reverse proxy, env management). For the same workflow, see `docker-compose.dokploy.yml` in this repo (instead of the default `docker-compose.yml` when Dokploy expects that layout).

**You are not locked in:** deploy on any stack you like — plain Docker, Kubernetes, a VPS with `docker compose`, PaaS (Railway, Fly.io, etc.), or another panel. Use the included **Dockerfile** and your own `DATABASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_*` values for that environment.

---

## Project layout

```
├── app/                 # Routes: marketing, dashboard, admin, API, auth, screening, ranking, staff…
├── components/          # UI and feature sections
├── db/                  # Drizzle client, schema, relations
├── lib/                 # Auth helpers, domain logic (teams, screening, credits, scoring…)
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml
└── scripts/             # e.g. start-with-migrate.mjs
```

---

## References

- [Next.js](https://nextjs.org/docs)
- [Better Auth](https://www.better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
