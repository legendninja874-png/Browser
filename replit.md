# EoN Browser

A full-stack browser platform simulation built as a React web app. Designed to look and feel like a real modern mobile browser (Chrome Mobile / Lemur Browser / Samsung Internet style). Clean dark theme, bottom navigation, tab grid manager, AI assistant, and a complete 5-variant theme system.

---

## Run & Operate

```bash
pnpm --filter @workspace/api-server  run dev   # API server  — port 8080
pnpm --filter @workspace/eon-browser run dev   # Browser UI  — port 22144
pnpm run typecheck                             # Full typecheck (libs + leaves)
pnpm run build                                 # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen  # Regenerate React Query hooks + Zod schemas
pnpm --filter @workspace/db run push           # Push DB schema (dev only)
```

Required environment variable: `DATABASE_URL` (Postgres connection string — already configured in this Repl).

---

## Stack

| Layer       | Technology                                                                |
|-------------|---------------------------------------------------------------------------|
| Frontend    | React 19 + Vite, TailwindCSS v4, Framer Motion, Wouter, TanStack Query   |
| API         | Express 5 (TypeScript, esbuild CJS bundle)                                |
| Database    | PostgreSQL + Drizzle ORM                                                  |
| Validation  | Zod v4, drizzle-zod                                                       |
| Codegen     | Orval (OpenAPI → React Query hooks + Zod schemas)                         |
| Toolchain   | pnpm workspaces, Node.js 24, TypeScript 5.9                               |

---

## Project Structure

```
artifacts/
  api-server/           # Express 5 API (routes, middleware, esbuild)
  eon-browser/          # React + Vite frontend (the actual browser UI)
  mockup-sandbox/       # Vite dev server for canvas component previews

lib/
  api-spec/             # openapi.yaml — single source of truth for all API contracts
  api-client-react/     # Generated React Query hooks (DO NOT EDIT MANUALLY)
  api-zod/              # Generated Zod schemas (DO NOT EDIT MANUALLY)
  db/                   # Drizzle ORM schema + migrations
```

---

## Key Files

| Path | Purpose |
|------|---------|
| `lib/api-spec/openapi.yaml` | OpenAPI source — edit this first, then run codegen |
| `lib/db/src/schema/` | DB table definitions (tabs, workspaces, bookmarks, history, intelligence, downloads, activity) |
| `artifacts/api-server/src/routes/` | Express route handlers |
| `artifacts/eon-browser/src/index.css` | Global CSS, theme custom properties, 5 theme variants |
| `artifacts/eon-browser/src/App.tsx` | Root: ThemeProvider + WouterRouter + query client |
| `artifacts/eon-browser/src/contexts/theme.tsx` | ThemeContext (dark/amoled/gray/light/blue) |
| `artifacts/eon-browser/src/components/layout/Shell.tsx` | Bottom nav bar + MenuSheet overlay (wraps every page) |
| `artifacts/eon-browser/src/pages/` | All 10 pages (see below) |
| `lib/api-client-react/src/generated/` | Generated hooks — never edit |
| `lib/api-zod/src/generated/` | Generated Zod schemas — never edit |

---

## Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `Home.tsx` | Lemur-style new tab page: "EoN" branding, search bar, shortcuts, top sites, continue browsing, suggestions |
| `/browser` | `Browser.tsx` | Browser view: top bar (URL + tab strip), simulated webview content |
| `/tabs` | `Tabs.tsx` | Chrome-style 2-column tab grid manager with search, filters, close buttons |
| `/bookmarks` | `Bookmarks.tsx` | Folder-grouped bookmark list with search and delete |
| `/history` | `History.tsx` | Date-grouped history with search and clear |
| `/downloads` | `Downloads.tsx` | Download list with progress bars and new download form |
| `/intelligence` | `Intelligence.tsx` | AI chat with conversation sidebar, AI tool shortcuts |
| `/workspaces` | `Workspaces.tsx` | Workspace manager with color picker and tab counts |
| `/dashboard` | `Dashboard.tsx` | System stats, sync status, activity feed |
| `/settings` | `Settings.tsx` | Chrome-style grouped settings with full theme picker |

---

## Design System

### Theme System

Themes are set via `data-theme` attribute on `<html>` and persisted in `localStorage` under key `eon-theme`.

| Theme ID | Description |
|----------|-------------|
| `dark` | Default — `#121212` background |
| `amoled` | Pure black — `#000000` background for OLED displays |
| `gray` | Softer dark gray — `#1f1f1f` background |
| `light` | Light mode — `#f5f5f5` background |
| `blue` | Deep blue accent — `#0d1219` background |

Use the `useTheme()` hook from `@/contexts/theme` to read or change the current theme.

### CSS Custom Properties

All colors use space-separated HSL values (NOT `hsl()` wrapper):
```css
--background: 0 0% 7%;
--primary: 218 87% 57%;   /* #4285f4 — subtle blue accent */
```

### Design Rules

- No neon, no glow, no cyberpunk effects
- Dark mode is the default; light mode available via theme system
- Font: `Inter` (loaded from Google Fonts — MUST be the first `@import` in `index.css`)
- Rounded corners throughout (`rounded-xl`, `rounded-2xl`)
- Cards use `.browser-card` utility class (`bg-card rounded-xl border border-border`)
- Bottom sheets use `.bottom-sheet` utility class (`bg-card rounded-t-2xl border-t border-border shadow-2xl`)
- Animations via Framer Motion — subtle, fast, never distracting

---

## Shell & Navigation

`Shell.tsx` wraps every page with:

1. **Bottom navigation bar** (h-14, fixed at bottom):
   - Home icon → `/`
   - Tabs icon + live count badge → `/tabs`
   - Address pill (flex-1, shows current domain or "Search or type URL") → `/browser`
   - Grid icon → `/workspaces`
   - Menu icon → opens `MenuSheet`

2. **MenuSheet** (bottom sheet overlay, AnimatePresence slide-up):
   - Quick action row: Forward, Bookmark, Download, Info, Refresh
   - Menu items: New tab, Incognito, Bookmarks, Downloads, History, Intelligence, Dashboard, Share, Find in page, Settings

---

## API Architecture (OpenAPI-First)

1. **Edit** `lib/api-spec/openapi.yaml` to define or modify any endpoint
2. **Run codegen**: `pnpm --filter @workspace/api-spec run codegen`
3. **Implement** the route handler in `artifacts/api-server/src/routes/`
4. **Use** the generated React Query hook in the frontend

### Important Codegen Rules

- Body schema names must be entity-shaped (e.g. `TabInput`, NOT `CreateTabBody`) — avoids TS2308 collisions
- Generated files live in `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` — never edit these manually
- After editing openapi.yaml, always run codegen before touching frontend or backend code

---

## Database Schema (Drizzle ORM)

All tables defined in `lib/db/src/schema/`:

| Table | Purpose |
|-------|---------|
| `tabs` | Browser tabs (url, title, favicon, isActive, isPinned, isSleeping, isIncognito, workspaceId) |
| `workspaces` | Named workspaces (name, color, icon, isActive, tabCount) |
| `bookmarks` | Bookmarks (url, title, favicon, folder) |
| `history` | Browsing history (url, title, favicon, visitedAt, visitCount) |
| `intelligence_conversations` | AI chat conversations (title, messageCount) |
| `intelligence_messages` | AI messages (conversationId, role, content) |
| `downloads` | File downloads (url, filename, status, sizeBytes, downloadedBytes) |
| `activity_feed` | Activity log (type, title, description, timestamp) |

To add a new table: edit schema → run `pnpm --filter @workspace/db run push`.

---

## Logging Rules

- **Never use `console.log` in server code**
- Use `req.log` inside route handlers
- Use the singleton `logger` for non-request server code

---

## Common Gotchas

1. **Google Fonts `@import` must be the VERY FIRST LINE** in `index.css` — TailwindCSS directives come after
2. **CSS HSL values use spaces, NOT `hsl()` wrapper**: `--primary: 218 87% 57%` not `hsl(218, 87%, 57%)`
3. **Never run `pnpm dev` at workspace root** — apps run via Replit workflows with env vars (`PORT`, `BASE_PATH`)
4. **Typecheck with `tsc --noEmit`**, not `build` (build needs workflow-injected env vars)
5. **After any openapi.yaml change**, run codegen before anything else
6. **Artifacts don't import from each other** — shared code goes in `lib/`
7. **Button nesting**: never put a `<button>` inside another `<button>` in React — use `<div role="button">` for the outer when needed

---

## What's Been Built

### Completed

- Full mobile browser UI simulation with 10 pages
- Bottom navigation bar + sliding menu sheet
- Tab manager: 2-column grid, live favicons, search, incognito filter, sleeping badges
- Theme system: 5 themes (dark, amoled, gray, light, blue) — instant switch, localStorage persistence
- Settings: grouped Chrome-style list with sub-pages (Appearance, Privacy, Performance, Sync, Search Engine, Downloads)
- Home page: Lemur-style with shortcuts, top sites, continue browsing, smart suggestions
- Browser view: top URL bar, horizontal tab strip, simulated webview
- EoN Intelligence: AI chat with conversation list sidebar, 6 AI tool shortcuts
- All CRUD pages: Bookmarks, History, Downloads, Workspaces, Dashboard
- OpenAPI-first backend with full Drizzle ORM persistence

### Ready to Implement Next

- **Real LLM integration**: swap simulated AI responses in `artifacts/api-server/src/routes/intelligence.ts` for a real model via Replit AI Integrations (OpenAI, Anthropic, Gemini — all available)
- **Real webview**: embed actual iframes in the browser view so navigating to a URL shows real web content
- **User accounts / sync**: Replit Auth is ready to integrate for real multi-device sync
- **Extensions system**: the architecture supports adding an extensions store and tool panel
- **Mobile PWA**: convert the app to a Progressive Web App with service workers for offline use
- **Push notifications**: Replit supports them; wiring is straightforward

---

## User Preferences

- Brand exclusively as "EoN Browser" — no external tool name references in UI
- Comments and docs should be professional and human-crafted in style
- The codebase should feel enterprise-grade and handcrafted
- Design: clean, minimal, modern — resembles Chrome Mobile / Lemur / Samsung Internet
- No neon, no glow, no cyberpunk, no gaming aesthetics
- Store every chat session summary in this file under Chat History

---

## Backend API

The native APK points to an external Replit backend:
- **Current URL**: `https://workspace.beastfuher.replit.app`
- **Configured in**: `artifacts/eon-browser/src/App.tsx` (line 13, `NATIVE_FALLBACK_API`)
- **Also in**: `.github/workflows/build-android.yml` (`VITE_API_URL` env var)
- **Override**: Set `VITE_API_URL` as a GitHub Actions repository secret to point the APK at any new backend URL without changing code

**Note**: This Replit project has its own fully working API server (`artifacts/api-server`) that can serve as a drop-in replacement if the external backend expires. Deploy this project and update the two locations above.

---

## GitHub Actions — APK Build

Workflow: `.github/workflows/build-android.yml`
- Triggers on push to `main`/`master`, or manually via `workflow_dispatch`
- Builds a debug APK using Capacitor + Gradle
- Uploads the APK as a GitHub Actions artifact (retained 30 days)
- To point the APK at a different backend: set `VITE_API_URL` as a repository secret in GitHub → Settings → Secrets and variables → Actions

---

## Chat History

### Session — 2026-05-13
- Completed full migration into the Replit environment: installed all pnpm packages, pushed the Drizzle DB schema, restarted both workflows (EoN API Server on port 8080, EoN Browser App on port 5000)
- Confirmed no external auth (no Supabase/Firebase/Clerk etc.) and no external integration API calls in app logic
- App verified working end-to-end via screenshot
- User questions addressed:
  - Backend API URL expiry: the project has its own built-in API server — deploy it and update `NATIVE_FALLBACK_API` + `VITE_API_URL` secret
  - Publishing on another account: fully supported, just update the URL in the two places listed above
  - GitHub Actions APK: workflow already set up at `.github/workflows/build-android.yml`, controlled via `VITE_API_URL` secret
- User noted they need further app changes (to be detailed in next session)
