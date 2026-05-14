# EoN Browser

A full-stack browser platform simulation built as a React web app. Designed to look and feel like a real modern mobile browser (Chrome Mobile / Lemur Browser / Samsung Internet style). Clean dark theme, bottom navigation, tab grid manager, AI assistant, and a complete 5-variant theme system.

---

## Run & Operate

```bash
pnpm --filter @workspace/api-server  run dev   # API server  — port 8080
pnpm --filter @workspace/eon-browser run dev   # Browser UI  — port 5000
pnpm run typecheck                             # Full typecheck (libs + leaves)
pnpm run build                                 # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen  # Regenerate React Query hooks + Zod schemas
pnpm --filter @workspace/db run push           # Push DB schema (dev only)
```

Required environment variable: `DATABASE_URL` (Postgres connection string — already configured in this Repl).

### Port Conflict Fix (IMPORTANT)

The Replit artifact system sometimes auto-starts duplicate workflows that steal ports 8080 and 5000. If either main workflow fails with `EADDRINUSE`, run:

```bash
fuser -k 8080/tcp 2>/dev/null; fuser -k 5000/tcp 2>/dev/null; sleep 2
```

Then restart **"EoN API Server"** and **"EoN Browser App"** workflows. The artifact-level workflows (`artifacts/api-server: API Server`, `artifacts/eon-browser: web`) can be left in failed state — only the two named workflows above matter.

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
| `artifacts/api-server/src/routes/proxy.ts` | Web proxy route — strips iframe-blocking headers, rewrites URLs, injects JS shim |
| `artifacts/eon-browser/src/index.css` | Global CSS, theme custom properties, 5 theme variants |
| `artifacts/eon-browser/src/App.tsx` | Root: ThemeProvider + WouterRouter + query client |
| `artifacts/eon-browser/src/contexts/theme.tsx` | ThemeContext (dark/amoled/gray/light/blue) |
| `artifacts/eon-browser/src/components/layout/Shell.tsx` | Bottom nav bar + MenuSheet overlay (wraps every page) |
| `artifacts/eon-browser/src/pages/Browser.tsx` | Full browser view with real iframe webview via proxy |
| `artifacts/eon-browser/src/pages/` | All 10 pages (see below) |
| `artifacts/eon-browser/src/store/browser.ts` | Zustand store: urlInputOpen, pendingUrlInput, searchEngine, isDesktopMode |
| `lib/api-client-react/src/generated/` | Generated hooks — never edit |
| `lib/api-zod/src/generated/` | Generated Zod schemas — never edit |

---

## Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `Home.tsx` | Lemur-style new tab page: "EoN" branding, search bar, shortcuts, top sites, continue browsing, suggestions |
| `/browser` | `Browser.tsx` | Real browser view: persistent Chrome-style top bar + real iframe webview via server-side proxy |
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

## Browser Webview — Proxy Architecture

`Browser.tsx` renders real websites inside an `<iframe>` using a server-side proxy. This is how iframe-blocking headers (`X-Frame-Options`, `Content-Security-Policy: frame-ancestors`) from sites like Google, YouTube, and Reddit are bypassed.

### How it works

1. **User navigates** to a URL via the URL overlay or quick-site grid
2. **`Browser.tsx`** sets the iframe `src` to `/api/proxy?url=<encoded-url>`
3. **`/api/proxy`** (Express route in `proxy.ts`) fetches the target URL server-side:
   - Strips all iframe-blocking response headers
   - Rewrites every `src`, `href`, `action`, `srcset` attribute in the HTML to route through `/api/proxy`
   - Rewrites CSS `url()` references
   - Injects a `<base>` tag for relative URL resolution
   - Injects a JS shim that intercepts `fetch()`, `XMLHttpRequest`, link clicks, form submissions, and `history.pushState` — all routed back through the proxy or posted to the parent frame as `eon-navigate` / `eon-urlchange` messages
4. **`Browser.tsx`** listens for `window.addEventListener('message', ...)` from the iframe shim to:
   - Navigate to new URLs the user clicked inside the page
   - Update the active tab's stored URL on SPA navigation

### Proxy file: `artifacts/api-server/src/routes/proxy.ts`

Key functions:
- `rewriteHtml(html, base)` — rewrites all resource/link attributes
- `rewriteCss(css, base)` — rewrites `url()` in stylesheets
- `buildShim(base)` — returns the injected `<script>` block
- `proxyFetch(url, req)` — server-side fetch with mobile User-Agent

### What loads well vs. limitations

| Site type | Result |
|-----------|--------|
| Wikipedia, Reddit, GitHub, news sites | Loads fully — all resources proxied |
| Google Search | Loads — search results work |
| YouTube | Loads page — video playback varies (DRM) |
| Instagram, WhatsApp | May show login walls — heavy bot detection |

**Do not** try to replace this with Chromium/Blink compilation — that requires 64GB+ RAM and 40M+ lines of C++ and is impossible in any cloud environment.

### iframe sandbox attributes

```
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals"
allow="autoplay; encrypted-media; fullscreen; geolocation; camera; microphone"
```

---

## Browser.tsx — Key State & Behaviour

The browser page manages the full Chrome-style UX:

- **Persistent top bar** (always visible): back button, address pill (tappable → URL overlay), reload/stop, bookmark star, 3-dot menu
- **Multi-tab strip**: shown when >1 tab exists; each tab has favicon, title, close button; + button for new tab
- **New Tab page**: EoN branding, search pill, 8-icon quick-site grid (uses `useGetTopSites` API, falls back to static), recent history
- **URL Overlay** (full-screen slide-up): live history search, bookmark suggestions, inline "Search for X" / "Navigate to X" items, quick-access grid
- **3-dot page menu**: Bookmark page, Share, Copy URL, Desktop site toggle, Open in new tab
- **`iframeBlocked` state**: shown when a site fails to load even through proxy — friendly error with "Open in new tab" fallback
- **`iframeKey`**: incremented on reload to force iframe remount
- **Message listener**: handles `eon-navigate` (navigate to new URL) and `eon-urlchange` (SPA URL update) from proxy shim

### Zustand store (`store/browser.ts`)

```ts
urlInputOpen: boolean        // controls URL overlay visibility
setUrlInputOpen(v): void
pendingUrlInput: string      // pre-fills URL overlay before navigating to /browser
setPendingUrlInput(v): void
searchEngine: string         // "google" | "bing" | "duckduckgo" | "brave" | "ecosia" | "yahoo"
isDesktopMode: boolean
setIsDesktopMode(v): void
```

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

### API Routes

| Route | File | Notes |
|-------|------|-------|
| `GET /api/proxy?url=` | `proxy.ts` | Web proxy — no OpenAPI spec, added directly to router |
| All other `/api/*` | Per-file routers | OpenAPI-first, codegen-driven |

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
8. **Port conflicts**: artifact auto-workflows steal ports 8080/5000 — always kill them with `fuser -k` before restarting main workflows
9. **Proxy route is NOT in openapi.yaml** — it was added directly to `routes/index.ts` and `routes/proxy.ts`; do not try to codegen it

---

## What's Been Built

### Completed

- Full mobile browser UI simulation with 10 pages
- Bottom navigation bar + sliding menu sheet
- Tab manager: 2-column grid, live favicons, search, incognito filter, sleeping badges
- Theme system: 5 themes (dark, amoled, gray, light, blue) — instant switch, localStorage persistence
- Settings: grouped Chrome-style list with sub-pages (Appearance, Privacy, Performance, Sync, Search Engine, Downloads)
- Home page: Lemur-style with shortcuts, top sites, continue browsing, smart suggestions
- **Browser view**: persistent Chrome-style top bar (always visible), real iframe webview, URL overlay with live history/bookmark search
- **Server-side web proxy**: strips X-Frame-Options/CSP headers, rewrites all sub-resource URLs, injects fetch/XHR/navigation shim — loads most of the web inside the iframe
- Multi-tab strip with live tab switching and close buttons
- EoN Intelligence: AI chat with conversation list sidebar, 6 AI tool shortcuts
- All CRUD pages: Bookmarks, History, Downloads, Workspaces, Dashboard
- OpenAPI-first backend with full Drizzle ORM persistence

### Ready to Implement Next

- **Ad blocker**: block known tracker/ad domains at the proxy level in `proxy.ts` before pages load
- **Real LLM integration**: swap simulated AI responses in `artifacts/api-server/src/routes/intelligence.ts` for a real model via Replit AI Integrations (OpenAI, Anthropic, Gemini — all available)
- **User accounts / sync**: Replit Auth is ready to integrate for real multi-device sync
- **Extensions system**: the architecture supports adding an extensions store and tool panel
- **Mobile PWA**: convert the app to a Progressive Web App with service workers for offline use
- **Download interception**: detect file links in the proxy and route them to the Downloads page
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
- **Current URL**: `https://eon-browser-8vil.onrender.com`
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

### Session — 2026-05-13 (continued)
- User reported browser page looked unprofessional: ugly "Done" text + URL bar shown by InAppBrowser when opening sites, redundant top address bar in Browser.tsx, bottom URL bar not working as URL entry point
- Screenshots confirmed: top address bar X'd out by user, bottom Shell nav bar approved
- Changes made:
  - **Browser.tsx**: Removed top address bar entirely; new tab page now shows EoN + 8-icon quick-site grid + search pill; active tab page shows polished site card with Chrome-style top bar (favicon + domain + reload + open buttons); Chrome-style full-screen URL input overlay slides up from bottom with quick access grid + search/navigate suggestions
  - **Shell.tsx**: Bottom URL pill now triggers the URL overlay directly (on /browser: opens overlay; off /browser: navigates then opens overlay)
  - **store/browser.ts**: Added `urlInputOpen` / `setUrlInputOpen` state for Shell↔Browser communication
  - **InAppBrowser**: Changed to `showToolbar: false` + `hardwareBack: true` — removes the ugly "Done" button and URL bar; user closes webview with Android hardware back button (standard Chrome behavior)

### Session — 2026-05-13 (part 3)
- Port conflict resolved: artifact workflows were stealing ports 8080 and 5000; killed conflicting processes, restarted main workflows
- User reported: URL bar non-functional, tabs option broken, 3-dot menu broken, new tab broken, no history/recent searches/suggestions in URL overlay
- User provided a 3-part Chrome Replication Master Prompt requesting full Chrome-level browser UX
- Changes implemented:
  - **store/browser.ts**: Added `pendingUrlInput` + `setPendingUrlInput` so any page can pre-fill the URL overlay before navigating
  - **Browser.tsx — URL Overlay**: Now fetches real data — `useListHistory` (up to 100 entries, filtered live as user types), `useGetRecentBookmarks` (filtered live), quick-access grid, "Search for X" + "Navigate to X" inline suggestions
  - **Browser.tsx — New Tab Page**: Shows EoN branding + search pill + quick-site grid (uses `useGetTopSites` API data, falls back to static) + last 5 recent history entries
  - **Browser.tsx — Active Tab**: Chrome-style top bar (back, address pill, reload, bookmark star, 3-dots menu); 3-dots opens page actions: Bookmark, Share, Copy URL, Desktop Site, Open in browser
  - **Browser.tsx — Tabs strip**: Multi-tab strip with + button for new tab creation
  - **Home.tsx**: Search bar now opens URL overlay with pre-filled query instead of just navigating to /browser; quick-site buttons navigate properly
  - **Shell.tsx**: `handleAddressTap` now sets `urlInputOpen` synchronously BEFORE navigating (fixes timing race); 3-dot menu fully functional
- Workflow fixes: Port conflict kills + restart sequence documented

### Session — 2026-05-13 (part 4)
- User wanted real websites (Google, YouTube, etc.) to load inside the browser instead of showing a placeholder card
- **Phase 1 — Real iframe webview**: Replaced the fake "site card" UI in `Browser.tsx` with a real `<iframe>` element. Sites that don't block embedding (Wikipedia, GitHub, etc.) load immediately. Sites with `X-Frame-Options` or CSP `frame-ancestors` show a friendly error with "Open in new tab" fallback.
- **Phase 2 — Server-side proxy** (`artifacts/api-server/src/routes/proxy.ts`): Built a full web proxy route `GET /api/proxy?url=` that:
  - Fetches any URL server-side with a mobile Chrome User-Agent
  - Strips all iframe-blocking headers (`X-Frame-Options`, `Content-Security-Policy`, COOP, COEP, etc.)
  - **Rewrites HTML**: every `src`, `href`, `action`, `srcset` attribute on resource/link/form/script/img/video/audio tags is rewritten to route through `/api/proxy`
  - **Rewrites CSS**: `url()` references in stylesheets are rewritten
  - **Injects JS shim**: intercepts `fetch()`, `XMLHttpRequest`, link clicks, form submissions, `window.open`, `location` assignment, and `history.pushState/replaceState` — posts `eon-navigate` / `eon-urlchange` messages to the parent frame
  - **`Browser.tsx`**: listens for those messages to update the active tab URL and navigate to new pages
  - Proxy verified working: Wikipedia loads with 100% rewritten sub-resource URLs, Google and YouTube return 200 and load
- Registered proxy router in `artifacts/api-server/src/routes/index.ts`
- User asked about making EoN a true Chromium fork (like Kiwi/Lemur) — explained this requires forking 40M lines of C++ code, 64GB+ RAM to compile, and is not feasible in any cloud environment; the proxy approach is the correct web-platform equivalent
