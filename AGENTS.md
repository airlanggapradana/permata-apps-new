# AGENTS.md (PERMATA monorepo map)

## Purpose & documentation pointers
PERMATA is a mental resilience / psychosocial support monorepo for disaster contexts (Aceh/Sumbar cultural context). This file is an agent-oriented navigation map; use it to find the right surface and paths quickly, then read deeper docs when needed.

Read first / deeper docs (do not duplicate long content here):
- `README.md` — overview, setup, deploy notes
- `GUIDE.md` — feature/route walkthroughs, game/task details
- `PRD Permata.md` — product requirements
- `apps/web/AGENTS.md` — Next.js-specific agent rules for work inside `apps/web` (follow it; do not replace/edit casually)
- `AI_Rules.txt` — additional guidance if relevant

## Repository map (top-level)
Major paths:
- `apps/` — application workspaces (`apps/web`, `apps/api`)
- `packages/` — shared packages (`packages/ui`, `packages/config-tailwind`)
- Root config/docs: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, `vercel.json`, `.env.example`, `.gitignore`, `.vscode/`, `.kilo/`
- Reference docs: `README.md`, `GUIDE.md`, `PRD Permata.md`, `AI_Rules.txt`

Tooling notes:
- pnpm workspaces (`apps/*`, `packages/*`); Turborepo orchestrates tasks (`turbo.json`).
- Root engines: Node `>=18`, pnpm `12.x` (see root `package.json`). Use pnpm + Turbo from repo root unless noted.

## Architecture & data/request flow
- **`apps/web` (`@permata/web`)** — Next.js 16 (App Router) + React 19 UI. Also hosts **web-internal** route handlers under `apps/web/src/app/api/*` (examples: `chat`, `mood-food`, `auth`, `games/*`, `journal`, `dashboard`, `safety-passport`, `screening`) that may use `src/lib/db.ts`, `src/lib/auth.ts`, game/reward logic in `src/lib/games/` and `src/lib/treeProgress.ts`, plus AI/storage helpers.
- **`apps/api` (`@permata/api`)** — Express + TypeScript REST API mounted at `/api/v1/*` (see `apps/api/src/app.ts`, `apps/api/src/server.ts`). Swagger at `/api/docs`, `/api/docs.json`; health at `/health`. Prisma/PostgreSQL under `apps/api/prisma/`; feature modules in `src/modules/`.
- **Proxying/integration** — `apps/web/next.config.ts` rewrites `/api/v1/:path*`, `/api/docs*`, `/health` to backend (`BACKEND_INTERNAL_URL` / `BACKEND_API_URL` / `NEXT_PUBLIC_API_URL`; dev default often `http://localhost:4000`). Root `vercel.json` defines Vercel Services (`frontend` → `apps/web`, `backend` → `apps/api` entry `src/server.ts`, build via `scripts/prepare-vercel.cjs`) and rewrites backend paths + everything else to the frontend service.
- **Data/services** — PostgreSQL (shared), Prisma on API side, `pg`/Neon-compatible access patterns appear on web side; Google Gemini for AI features; storage/S3-related deps/env may be present depending on configuration.
- **Important:** the system has both **web-internal APIs** (`apps/web/src/app/api/*`) and a separate **Express `/api/v1` backend** (`apps/api`). Before editing, identify which surface the change belongs to.

## `apps/web` layout (key paths)
- `src/app/` — App Router pages/routes (e.g. `/`, `/dashboard`, `/jurnal`, `/journal`, `/login`, `/register`, `/safety-passport`, `/offline-survival`, `/tele-screening`, `/ai-companion`, `/mood-food`, `/game-*`, `/roleplay`) plus `layout.tsx`, global styles, and `api/` route handlers.
- `src/components/` — shared UI/runtime (`Navbar`, `ThemedContent`, `PageMotion`, `OfflineRuntime`, `HopeTree`, etc.), `pages/` screen components, `games/` game UI, `ui-kit/`.
- `src/context/` — `AuthContext`, `CultureContext` (Aceh/Sumbar geo-cultural theming/terms).
- `src/lib/` — DB/auth/session, AI rules, storage, offline cache, tree/progress and game domain helpers (`lib/games/*`).
- `src/data/`, `src/utils/` — domain data (e.g. DASS-21, offline survival) and client/API/scoring utilities.
- `src/game/` — Phaser scenes/assets usage for quake/game implementations.
- `public/` — PWA assets (`sw.js`, `manifest.webmanifest`), audio/tiles/images, legacy redirect HTMLs (e.g. `PickAndDrop.html`, `Breathing.html`, `SiagaMinang.html`).
- `tests/` — Node test-runner `.mjs` suites for game logic and offline cache.
- When working in `apps/web`, follow `apps/web/AGENTS.md` for Next.js-version-specific guidance.

## `apps/api` layout (key paths)
- `src/app.ts` — Express app wiring (security/CORS/body/morgan, rate limit, Swagger, routes, errors); `src/server.ts` — boot/shutdown and export for serverless/Vercel.
- `src/modules/` — feature modules (router/controller/service/schema patterns vary) (e.g. auth/users/children/organizations, prevention, disaster-response, recovery, files/media, content/regions, analytics/dashboard, smart-technology/AI, admin, audit).
- `src/middlewares/` — auth, validation, request-id, rate limiting, error handler.
- `src/common/` — errors, response helpers, shared types; `src/config/` — env, db, logger, storage.
- `prisma/` — `schema.prisma`, `migrations/`, `seed.ts`. `scripts/prepare-vercel.cjs` — Vercel bundle prep. `tests/` — Vitest + Supertest suites.

## `packages/`
- `packages/ui` (`@permata/ui`) — shared UI exports (e.g. `src/index.ts`, `HopeTree.tsx`), consumed by web.
- `packages/config-tailwind` (`@permata/config-tailwind`) — shared Tailwind configuration.

## Tooling, config, and environment
- Root scripts: `dev`, `build`, `lint`, `test`, `format` via Turbo; DB scripts proxy to `@permata/api` (`db:generate`, `db:migrate`, `db:deploy`, `db:push`, `db:seed`).
- Turbo: `turbo.json` defines task graph/outputs/caching and `globalEnv` (API/DB/auth/AI/storage/Vercel-related vars).
- Env templates: root `.env.example`, `apps/web/.env.example`, `apps/api/.env.example` (local `.env` / `.env.local` are gitignored). Key vars commonly include: `DATABASE_URL`, web `AUTH_SESSION_SECRET` and `GEMINI_API_KEY`, API JWT/AI/storage/CORS vars, and backend URL wiring for proxying.
- Notable config: `vercel.json` (services + rewrites), `apps/web/next.config.ts` (proxy, PWA/SW cache headers, transpile packages), `.gitignore`.

## Common commands (factual)
From repo root (pnpm/Turbo):
- Install: `pnpm install`
- Dev (Turbo): `pnpm dev`
- Build/lint/test/format: `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm format`

Per workspace (examples):
- Web: `pnpm --filter @permata/web dev` (or `dev:turbo`), `pnpm --filter @permata/web build`, `pnpm --filter @permata/web lint`, `pnpm --filter @permata/web test:game`, `pnpm --filter @permata/web test:offline`
- API: `pnpm --filter @permata/api dev`, `pnpm --filter @permata/api build`, `pnpm --filter @permata/api test`, `pnpm --filter @permata/api lint`

DB (root proxies to API/Prisma):
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:deploy`, `pnpm db:push`, `pnpm db:seed` (or run via `--filter @permata/api` as appropriate).

## Agent working conventions & gotchas
- Inspect neighboring code and existing docs before adding patterns; do not duplicate long content from `README.md`/`GUIDE.md`/`PRD Permata.md`.
- Pick the correct surface: web page/UI vs web route handler (`apps/web/src/app/api/*`) vs Express module (`apps/api/src/modules/*`) vs Prisma schema/migrations (`apps/api/prisma/*`) vs shared package (`packages/*`).
- Web has its own DB/auth/game-reward/progress logic in `apps/web/src/lib` and game code; API has its own RBAC/Prisma domain model. Keep contracts and env assumptions aligned when flows span both.
- PWA/offline behavior and daily XP/reward rules are sensitive (see `GUIDE.md`, `apps/web/tests/*`, `apps/web/src/lib/games/*`); prefer existing tests/patterns.
- Preserve intent around culture context (Aceh/Sumbar), AI guardrails/crisis handling, and privacy/suppression concepts when touching related features.
- `apps/web/AGENTS.md` is tool-managed for Next.js guidance; do not hand-edit/remove casually.

## Where to edit (quick map)
- Web UI/page/route: `apps/web/src/app/<route>/`, `apps/web/src/components/pages/*`, shared `components/`, `context/`, `lib/`, `utils/`
- Web-internal API/game persistence/progress: `apps/web/src/app/api/**`, `apps/web/src/lib/**`, `apps/web/src/game/**`
- Backend REST domain/auth/RBAC/analytics/AI guardrails: `apps/api/src/modules/<domain>/**`, plus `apps/api/src/middlewares/*`, `apps/api/src/common/*`, `apps/api/src/config/*`
- DB schema/migrations/seed (Prisma/API): `apps/api/prisma/*`
- Shared UI or Tailwind: `packages/ui/src/*`, `packages/config-tailwind/*`
- Deploy/proxy wiring: `vercel.json`, `apps/web/next.config.ts`, `apps/api/scripts/prepare-vercel.cjs`
- Product/feature behavior reference: `GUIDE.md`, `README.md`, `PRD Permata.md`
