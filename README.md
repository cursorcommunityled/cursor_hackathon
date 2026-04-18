# CURSOR 48H

**48-hour AI hackathon in Tashkent.** Intensive marathon of AI product development with mentorship and expert support.

- **Site:** [cursor48.uz](https://cursor48.uz) (or `NEXT_PUBLIC_SITE_URL` in production)
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, PostgreSQL, Better Auth

---

## Features

| Area | Description |
|------|-------------|
| **Landing** | Public homepage with hero, sponsors, prize fund, team building, selection process, schedule, evaluation criteria, requirements, tech stack. |
| **Auth** | Email + Google/GitHub OAuth via [Better Auth](https://www.better-auth.com/). Optional 2FA for admins. Sign-up restricted to `SUPER_ADMIN_EMAILS` when using admin callback. |
| **Registration / Onboarding** | User registration, onboarding flow, and completion status. |
| **Teams** | Create/join/leave teams, transfer lead, manage members. Referral links for invites (`/r/[code]`). |
| **Screening** | Screening phase with multiple-choice questions. Team demo video as a YouTube or Google Drive link. Submit answers, team status, phase control. Admin: approve/reject teams, manage questions. |
| **Projects** | User projects and admin project management (CRUD). |
| **Credits** | Super-admin credit pools: even split (teams or participants), Excel upload of per-user sponsor URLs, or one shared general link; redemption short codes and audit log. |
| **Staff** | Staff invites, accept by token, teams to evaluate, evaluate team (scoring). |
| **Ranking** | Public ranking from judge score averages (with optional late penalty); super admin can set a per-team final score override. |
| **Admin** | Dashboard: users, teams, screening, questions, projects, partners, credits, staff. 2FA setup, security. Project deadline and other settings. |
| **SEO** | Sitemap, robots, Open Graph, JSON-LD structured data, canonical URLs. |

---

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16 (or use Docker)
- **pnpm / npm / yarn / bun** (project uses `npm` in Docker)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd cursor-community-uz
npm install
```

### 2. Environment variables

Create a `.env` file in the project root. Required and optional variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/cursor48` |
| `BETTER_AUTH_SECRET` | Yes | Secret for Better Auth (use a long random string in production) |
| `BETTER_AUTH_URL` | Yes | App URL for auth (e.g. `http://localhost:3000`; use HTTPS in production) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `SUPER_ADMIN_EMAILS` | Yes* | Comma-separated emails allowed to sign up as admin (when using admin callback) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth (create at [Google Cloud Console](https://console.cloud.google.com)) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth (create at [GitHub Developer Settings](https://github.com/settings/developers)) |
| `RESEND_API_KEY` | Optional | Resend for transactional email |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical site URL (e.g. `https://cursor48.uz`) for metadata and sitemap |

\* If `SUPER_ADMIN_EMAILS` is empty, email sign-up to admin is disabled.

### 3. Database (Docker)

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Then run migrations:

```bash
npm run db:migrate
```

(Or use `drizzle-kit` with `DATABASE_URL` from `.env`.)

### 4. Run the app

**Development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production build:**

```bash
npm run build
npm run start
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:generate` | Drizzle: generate migrations |
| `npm run db:migrate` | Drizzle: run migrations |
| `npm run db:studio` | Drizzle Studio (DB GUI) |

---

## Docker (full stack)

To run the full stack (Postgres + app) with Docker:

```bash
# Ensure .env exists and DATABASE_URL is set (compose overrides it for the app service)
docker compose up -d
```

- App in container listens on **port 3001** (mapped from host); Postgres on 5432.
- The app image uses a startup script that runs migrations then starts the Next.js server.

For **Dokploy** deployments, use `docker-compose.dokploy.yml` instead of `docker-compose.yml`.

---

## Project structure (overview)

```
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, admin, screening, teams, ranking, etc.)
│   ├── admin/             # Admin dashboard and login
│   ├── dashboard/         # User dashboard
│   ├── register/          # Registration
│   ├── onboarding/        # Onboarding flow
│   ├── screening/         # Screening (participant)
│   ├── ranking/           # Public ranking
│   ├── staff/             # Staff evaluate / join
│   ├── profile/           # User profile
│   ├── partnership/       # Partnership page
│   ├── r/[code]/          # Referral / invite by code
│   ├── layout.tsx, page.tsx, globals.css
│   ├── sitemap.ts, robots.ts
│   └── opengraph-image.tsx
├── components/            # React components (UI, participant sections, SEO)
├── db/
│   ├── schema/            # Drizzle schemas (auth, teams, partners, screening, scoring, projects, settings)
│   ├── index.ts
│   └── relations
├── lib/                   # Auth, site config, screening, credits, scoring, teams, projects
├── drizzle.config.ts
├── docker-compose.yml
├── Dockerfile
└── scripts/               # e.g. start-with-migrate.mjs
```

---

## Database (Drizzle)

- **Dialect:** PostgreSQL.
- **Schemas:** Auth (user, session, account, team, etc.), teams (team, team_member), partners, screening (questions, answers, team video), scoring, projects, settings.
- **Migrations:** Generated with `npm run db:generate`, applied with `npm run db:migrate`. Migrations live in `./drizzle`.
- **Production (Docker image):** Migrations run **automatically** when the container starts — see `Dockerfile` (`CMD` → `scripts/start-with-migrate.mjs`), which runs `db:migrate` then `node server.js`. Retries are controlled with `DB_MIGRATION_ATTEMPTS` (default `20`) and `DB_MIGRATION_DELAY_MS` (default `3000`). If you deploy without this image (e.g. bare `next start`), run `npm run db:migrate` yourself or in your deploy pipeline before traffic hits the new version.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth](https://www.better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
