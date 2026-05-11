# EoN Browser

A next-generation AI-native browser platform — cinematic, cyberpunk-futuristic, and commercial-grade. Combines the elegance of Arc, the gaming energy of Opera GX, and the intelligence of an AI-native OS. Built as a full-stack web application with a complete browser UI simulation, EoN Intelligence AI engine, workspace system, and cloud sync.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/eon-browser run dev` — run the browser UI (port 22144)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (tabs, workspaces, bookmarks, history, intelligence, downloads, activity)
- `artifacts/api-server/src/routes/` — Express route handlers (tabs, workspaces, bookmarks, history, intelligence, downloads, dashboard, sync)
- `artifacts/eon-browser/src/` — React frontend (9 pages + shared components)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod validation schemas (do not edit)

## Architecture decisions

- OpenAPI-first contract: all routes defined in `openapi.yaml` before implementation; codegen produces both server validators and client hooks
- Monorepo with pnpm workspaces: `lib/` for shared code, `artifacts/` for deployable services
- EoN Intelligence uses a simple in-app response system (no external AI API key required); ready to swap in a real LLM via Replit AI Integrations
- Cloud sync is simulated server-side; architecture is ready for a real multi-device sync backend
- Design system: full cyberpunk theme with CSS custom properties, glassmorphism, neon glow effects, and Framer Motion animations

## Product

EoN Browser provides:
- **Home Dashboard** — live clock, AI-powered search, top sites, recent history, smart suggestions
- **Browser View** — vertical tab sidebar, URL bar, content area, tab sleep/pin controls
- **Workspace Manager** — named workspaces with custom icons and colors, tab grouping
- **Bookmark Manager** — folder-organized bookmarks with quick access
- **History & Top Sites** — full browsing timeline and visit analytics
- **Download Manager** — file downloads with progress tracking
- **EoN Intelligence** — AI chat, conversation history, smart tools (summarize, translate, code assist, research, write)
- **Command Center Dashboard** — system stats, memory usage, trackers blocked, activity feed, sync controls
- **Settings** — theme, privacy, performance, and workspace configuration

## User preferences

- Project should remain branded exclusively as "EoN Browser" — no external tool references
- All comments and documentation should be professional and human-crafted in style
- Codebase should feel enterprise-grade and handcrafted

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`
- Body schemas in OpenAPI must use entity-shaped names (e.g. `TabInput`) not operation-shaped names (e.g. `CreateTabBody`) to avoid TS2308 collisions
- The `index.css` CSS custom properties use space-separated HSL values — NOT the `hsl()` wrapper
- Google Font `@import url(...)` must be the very first line in `index.css`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- EoN Intelligence AI responses are currently simulated — connect to a real LLM via `artifacts/api-server/src/routes/intelligence.ts`
