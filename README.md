# NETPrep Hub — UGC NET Preparation Platform

A production-ready, platform-independent full-stack web application for UGC NET aspirants. Built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, and Prisma.

> **Independent.** This project has **zero dependency on Z.ai or any proprietary platform**. Clone it, fork it, deploy it anywhere — Vercel, Render, Cloudflare, Docker, VPS, or your own server.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Requirements](#requirements)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Storage Setup](#storage-setup)
- [Authentication](#authentication)
- [Seeding](#seeding)
- [Testing](#testing)
- [Production Build](#production-build)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Render Deployment](#render-deployment)
- [Cloudflare Deployment](#cloudflare-deployment)
- [Generic VPS Deployment](#generic-vps-deployment)
- [Database Migration](#database-migration)
- [Backup and Restore](#backup-and-restore)
- [Provider Adapter Architecture](#provider-adapter-architecture)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

NETPrep Hub is a complete digital preparation ecosystem for UGC NET aspirants — covering Paper I (Teaching & Research Aptitude) and Paper II subjects (Computer Science, Commerce, Management, English, and more).

The platform provides:

- **Study materials**: detailed notes, cheat sheets, and a curated book library
- **Practice engine**: MCQ practice with immediate feedback, exam mode, revision mode, and weak-area targeting
- **Mock tests**: timed tests with question palette, scoring, and detailed analytics
- **Previous Year Questions (PYQs)**: filterable by year, subject, and topic
- **Study planner**: daily/weekly task scheduling with completion tracking
- **Progress dashboard**: syllabus completion, accuracy, streaks, weak-area identification, and personalized recommendations
- **Global search**: across notes, books, cheat sheets, questions, subjects, and articles
- **Bookmarks**: organized into folders (Important, Revise Later, Weak Topics, etc.)
- **Articles & strategy**: editorial content on preparation strategy and PYQ analysis

---

## Features

### Student-facing

| Feature | Description |
|---------|-------------|
| **Home** | Hero, search bar, quick-access cards, popular subjects, featured notes, progress snapshot |
| **Subjects** | Browse all UGC NET subjects with resource counts; filter by Paper I/II |
| **Subject Detail** | Full syllabus tree (units → topics), per-topic progress tracking, recommended books & notes |
| **Topic Detail** | Unified learning hub: notes → cheat sheet → MCQs → PYQs → mock test, all in one place |
| **Notes** | Rich markdown notes with tables, formulas, exam tips; reading-time, difficulty, views |
| **Cheat Sheets** | Concise revision sheets with formulas, definitions, comparisons |
| **Books** | Reference library with distribution-rights metadata, ratings, author/publisher info |
| **MCQ Practice** | 4 modes: Practice (immediate feedback), Exam (delayed), Revision (wrong answers), Weak Areas |
| **PYQs** | Previous-year questions grouped by year, with explanations and source citations |
| **Mock Tests** | Timed tests with question palette, mark-for-review, submit confirmation |
| **Mock Results** | Score, accuracy, topic-wise breakdown chart, question-by-question review, recommendations |
| **Dashboard** | Progress rings (completion, accuracy, streak, mock avg), study activity chart, today's plan, weak areas, recommendations |
| **Study Planner** | Week view + day view, add/complete/delete tasks, category & priority tags |
| **Bookmarks** | 5 folders, one-click bookmark toggle from any resource, folder filtering |
| **Articles** | Editorial content with categories (Strategy, PYQ Analysis, Revision, Productivity) |
| **FAQ** | Grouped by category (General, Eligibility, Exam Pattern, Preparation) |
| **Global Search** | Cmd+K modal, searches across all content types, grouped results |

### Technical

| Feature | Description |
|---------|-------------|
| **Dark mode** | Light/Dark/System with next-themes |
| **Responsive** | Mobile-first design, works from 320px to large desktops |
| **Sticky footer** | Footer stays at bottom on short pages, pushes down on long pages |
| **SEO** | Metadata, sitemap.xml, robots.txt, Open Graph |
| **Health check** | `/api/health` endpoint with database, storage, email, AI status |
| **Provider adapters** | Storage (local/S3), Email (none/SMTP/Resend), AI (none/OpenAI/Anthropic/Google), Search (postgres/Meilisearch/Typesense) |
| **Docker** | Multi-stage Dockerfile, docker-compose with PostgreSQL |

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 16 (App Router) | Industry-standard React framework |
| Language | TypeScript 5 | Type safety, better DX |
| Styling | Tailwind CSS 4 + shadcn/ui | Source-code component ownership, no runtime dependency |
| Database | SQLite (dev) / PostgreSQL (prod) | Prisma ORM makes switching trivial |
| ORM | Prisma 6 | Type-safe queries, migrations, multi-DB support |
| State | Zustand | Lightweight client state |
| Charts | Recharts | React-native charting |
| Animation | Framer Motion | Subtle, purposeful animations |
| Markdown | react-markdown + remark-gfm | Notes/articles rendering |
| Icons | Lucide React | Open-source icon set |

**No proprietary platform SDKs. No vendor lock-in.**

---

## Requirements

- **Node.js** 18+ (or **Bun** 1.0+)
- **npm**, **yarn**, or **bun** package manager
- ~500MB disk space for dependencies
- ~512MB RAM for development

That's it. No external services are required for local development — SQLite and local filesystem storage work out of the box.

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone <your-repo-url> netprep-hub
cd netprep-hub

# 2. Install dependencies
bun install
# or: npm install

# 3. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Set up the database
bun run db:push    # Create tables from Prisma schema
bun run db:seed    # Populate with UGC NET content

# 5. Start the dev server
bun run dev
# or: npm run dev
```

Open **http://localhost:3000** in your browser. The app is ready to use.

---

## Environment Variables

All configuration is via environment variables. See [`.env.example`](.env.example) for the full list with comments.

### Required for basic operation

```env
DATABASE_URL=file:./db/custom.db    # SQLite (default) or PostgreSQL URL
AUTH_SECRET=your-random-secret       # Generate with: openssl rand -base64 32
```

### Optional (app works without these)

```env
# Storage
STORAGE_PROVIDER=local               # or "s3" for S3-compatible storage
STORAGE_LOCAL_PATH=./public/uploads  # local storage directory

# Email (for password reset, notifications)
EMAIL_PROVIDER=none                  # or "smtp" or "resend"

# AI (optional enhancement — core app works without AI)
AI_PROVIDER=none                     # or "openai", "anthropic", "google"

# Search (default uses database, no external service needed)
SEARCH_PROVIDER=postgres             # or "meilisearch", "typesense"

# Public URL (for SEO, emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**All optional features fail gracefully.** If email/AI/storage isn't configured, the app still runs — those features just return "not configured" responses.

---

## Database Setup

### SQLite (default — zero config)

The project ships with SQLite. The `DATABASE_URL` in `.env` defaults to:

```env
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Run:

```bash
bun run db:push    # Create/update schema
bun run db:seed    # Insert sample data
```

### PostgreSQL (production)

1. Create a PostgreSQL database (Neon, Supabase, Railway, Render, AWS RDS, or local).
2. Update `.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/netprep?schema=public
DIRECT_URL=postgresql://user:password@host:5432/netprep  # For migrations (some providers need this)
```

3. Update `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"   // change from "sqlite"
  url      = env("DATABASE_URL")
}
```

4. Run:

```bash
bun run db:push
bun run db:seed
```

---

## Storage Setup

### Local filesystem (default)

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./public/uploads
```

Files are saved to `./public/uploads/` and served at `/uploads/`. Works everywhere, zero config.

### S3-compatible (AWS S3, Cloudflare R2, Backblaze B2, MinIO)

```env
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com   # omit for AWS S3
S3_REGION=auto
S3_BUCKET=netprep-uploads
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_FORCE_PATH_STYLE=true    # true for R2/MinIO, false for AWS S3
```

Install the AWS SDK:

```bash
bun add @aws-sdk/client-s3
```

The storage adapter is at `src/lib/services/storage/index.ts`. Switching providers is purely an env-var change — no code changes needed.

---

## Authentication

The app currently uses a **demo user** (hardcoded as `demo-user` in API routes) for simplicity. This makes the app immediately usable without auth setup.

### For production auth

The project includes `next-auth` v4 as a dependency. To enable real authentication:

1. Set in `.env`:

```env
AUTH_SECRET=your-long-random-secret
AUTH_PROVIDER=credentials    # or "google", "github"
```

2. Create `src/lib/auth.ts` with NextAuth configuration.
3. Wrap API routes with auth checks.

**The auth system is provider-neutral** — NextAuth supports credentials, Google, GitHub, and any OAuth 2.0 / OpenID Connect provider.

---

## Seeding

The seed script populates the database with realistic UGC NET content:

```bash
bun run db:seed
```

This creates:
- 5 subjects (Paper I, Computer Science, Commerce, Management, English)
- 24 units across all subjects
- 81 topics
- 6 detailed notes (with full markdown content)
- 2 cheat sheets
- 6 books
- 25 MCQ questions (with explanations)
- 2 mock tests
- 3 articles
- 9 FAQs
- 6 external resources
- Demo user profile + study tasks + progress data

All content is labeled as sample/demo data where appropriate.

---

## Testing

```bash
# Lint
bun run lint

# Type check
bunx tsc --noEmit
```

> **Note:** The project uses ESLint and TypeScript for quality assurance. Unit/integration/E2E test scaffolding can be added with your preferred framework (Vitest, Jest, Playwright).

---

## Production Build

```bash
# Build the standalone production bundle
bun run build

# Start the production server
bun run start
```

The `build` script in `package.json` is configured for Next.js standalone output, which produces a minimal self-contained server.

---

## Docker Deployment

### Quick start

```bash
# Build and run with docker-compose (includes PostgreSQL)
docker compose up -d

# The app is available at http://localhost:3000
```

### What's included

- `Dockerfile` — multi-stage build (builder + minimal runner)
- `docker-compose.yml` — app + PostgreSQL with health checks
- `.dockerignore` — keeps build context small

### Configuration

Create a `.env` file (or pass env vars to docker-compose):

```env
DATABASE_URL=postgresql://netprep:netprep@db:5432/netprep
AUTH_SECRET=your-secret
STORAGE_PROVIDER=local
```

### Custom images

```bash
# Build the image
docker build -t netprep-hub .

# Run with a volume for SQLite + uploads
docker run -p 3000:3000 \
  -v netprep-data:/app/data \
  -v netprep-uploads:/app/public/uploads \
  netprep-hub
```

The Dockerfile includes a health check on `/api/health`.

---

## Vercel Deployment

Vercel is the easiest deployment target for Next.js.

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo.
3. Configure environment variables:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `AUTH_SECRET` — a random secret
   - `NEXT_PUBLIC_APP_URL` — your Vercel domain
4. Deploy.

**Build command:** `bun run build` (or `npm run build`)
**Output:** Next.js standalone (auto-detected by Vercel)

**Database:** Use Vercel Postgres, Neon, or Supabase (all have free tiers).
**Storage:** Use Vercel Blob or any S3-compatible service.

---

## Render Deployment

1. Create a PostgreSQL database on Render (free tier available).
2. Create a Web Service:
   - **Build command:** `bun install && bun run build`
   - **Start command:** `bun run start`
   - **Environment variables:** Set `DATABASE_URL`, `AUTH_SECRET`, etc.
3. Deploy.

**Note:** Render's free tier spins down after inactivity. For always-on, use a paid plan.

---

## Cloudflare Deployment

Cloudflare Pages/Workers can deploy Next.js apps, but with some constraints:

1. Use `@cloudflare/next-on-pages` adapter.
2. Database: Use Cloudflare D1 (SQLite) or connect to external PostgreSQL via Hyperdrive.
3. Storage: Use Cloudflare R2 (S3-compatible — our adapter supports it).

**Limitations:**
- Node.js APIs that aren't Edge-compatible may not work.
- Filesystem storage (`STORAGE_PROVIDER=local`) won't work — use R2 instead.
- Some Prisma features require the data-proxy or driver adapter.

**Recommended for:** Static-heavy deployments or when you're already on Cloudflare's ecosystem.

---

## Generic VPS Deployment

```bash
# 1. SSH into your server
ssh user@your-server

# 2. Install Node.js 20+ and bun
curl -fsSL https://bun.sh/install | bash

# 3. Clone and build
git clone <your-repo> /opt/netprep
cd /opt/netprep
bun install
bun run build

# 4. Configure .env
cp .env.example .env
# Edit .env with production values

# 5. Set up the database
bun run db:push
bun run db:seed

# 6. Run with a process manager (PM2, systemd)
bun run start  # or use pm2: pm2 start "bun run start" --name netprep
```

### Reverse proxy with Nginx + HTTPS

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use `certbot` for free Let's Encrypt SSL:

```bash
sudo certbot --nginx -d your-domain.com
```

---

## Database Migration

### Change database provider (SQLite → PostgreSQL)

1. Export data from SQLite:
```bash
bun run db:seed  # re-seed into the new database
```

2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update `.env` with the PostgreSQL connection string.

4. Push schema and re-seed:
```bash
bun run db:push
bun run db:seed
```

### Prisma migrations (for production schema changes)

```bash
bunx prisma migrate dev --name your-migration-name
bunx prisma migrate deploy  # in production
```

---

## Backup and Restore

### SQLite backup

```bash
cp db/custom.db db/custom-backup-$(date +%Y%m%d).db
```

### PostgreSQL backup

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20250101.sql
```

### File storage backup

If using local storage, back up the `public/uploads/` directory. If using S3, use `aws s3 sync` or your provider's backup tools.

---

## Provider Adapter Architecture

The app uses provider adapters for all external services. **Business logic never knows which provider is active** — it talks to an interface.

```
src/lib/services/
├── storage/
│   └── index.ts          # StorageAdapter interface + Local + S3 implementations
├── email/
│   └── index.ts          # EmailAdapter interface + Noop + SMTP + Resend
├── ai/
│   └── index.ts          # AIAdapter interface + Noop + OpenAI + Anthropic + Google
└── search/
    └── index.ts          # SearchAdapter interface + Postgres + Meilisearch + Typesense
```

### Switching providers

| Service | Change env var | Code changes |
|---------|---------------|-------------|
| Database | `DATABASE_URL` + schema provider | None (Prisma handles it) |
| Storage | `STORAGE_PROVIDER` | None |
| Email | `EMAIL_PROVIDER` | None |
| AI | `AI_PROVIDER` | None |
| Search | `SEARCH_PROVIDER` | None |
| Hosting | Deploy config | None |

**No vendor lock-in.** Switching from Vercel to Render to Docker to VPS is a deployment-config change, not a code change.

---

## Troubleshooting

### Dev server crashes / OOM

Next.js dev mode uses significant memory (1-2GB). If you have limited RAM:
- Close other applications
- Use `NODE_OPTIONS=--max-old-space-size=1024 bun run dev`
- Or use `next build && next start` for production mode

### Database errors

- **SQLite:** Ensure the `db/` directory exists and is writable.
- **PostgreSQL:** Verify `DATABASE_URL` is correct and the database is reachable.
- Run `bun run db:push` to sync schema.

### Prisma client errors

```bash
bun run db:generate  # Regenerate Prisma client
```

### Port already in use

```bash
# Change the port in package.json or .env
PORT=3001 bun run dev
```

### Storage upload fails

- **Local:** Check `STORAGE_LOCAL_PATH` is writable.
- **S3:** Verify credentials, bucket name, and region. For R2/MinIO, set `S3_FORCE_PATH_STYLE=true`.

### AI features not working

AI is **optional**. If `AI_PROVIDER=none` (default), AI features return "not configured" gracefully. To enable:
1. Set `AI_PROVIDER=openai` (or `anthropic`, `google`)
2. Set the corresponding API key
3. No code changes needed

---

## License

MIT License — see [LICENSE](LICENSE).

NETPrep Hub is an independent educational platform and is **not affiliated with, endorsed by, or sponsored by** the National Testing Agency (NTA), the University Grants Commission (UGC), or any government body. "UGC NET" is a public examination name; all references are for educational purposes only.

---



**If the original development platform disappeared tomorrow, any developer could clone this repository and deploy it using only standard, documented technologies.**


---

## 👤 Let's Connect

**Ishfaq Dar | Data Analyst & Developer**

📧 Email: [dar1.ishfaq36@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=dar1.ishfaq36@gmail.com)  
💼 LinkedIn: [Ishfaq Dar](https://www.linkedin.com/in/ishfaq-dar-aaa277240/)  
🐙 GitHub: [AshfaqAIML](https://github.com/AshfaqAIML)

---
