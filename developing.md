## Developing

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm (comes with Node)
- PHP 8.2+ (8.5 tested)
- Composer 2+

### Install and run
- Install: `npm install`
- Dev server: `npm run dev` (default `http://localhost:4321`)
- Build: `npm run build` (outputs to `dist/`)
- Preview production build: `npm run preview`

### Laravel API backend (monorepo)
- App path: `backend/` (Laravel 12 + Sanctum)
- First-time setup:
  - `npm run backend:install`
- Run backend locally:
  - `npm run backend:dev`
  - API base: `http://127.0.0.1:8000/api/v1`
- Backend maintenance:
  - `npm run backend:migrate`
  - `npm run backend:test`

### Backend env defaults
- Backend uses `backend/.env` (`.env.example` as template).
- Default DB is SQLite (`backend/database/database.sqlite`) unless you change `DB_*` vars.
- For local frontend integration, point the web app API base to `http://127.0.0.1:8000/api/v1`.
- Frontend can set `PUBLIC_API_BASE_URL` for browser calls (defaults to `https://hoggcountry.on-forge.com/api/v1`).

### Google OAuth (Laravel Socialite)
- Required backend env vars:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` (example: `http://127.0.0.1:8000/api/v1/auth/google/callback`)
  - `FRONTEND_AUTH_CALLBACK_URL` (example: `http://localhost:4321/login`)
- Login endpoints:
  - `GET /api/v1/auth/google/redirect`
  - `GET /api/v1/auth/google/callback`

### Project scripts
- `dev`: Astro dev server
- `build`: Astro build
- `preview`: Astro preview
- `astro`: Run Astro CLI (e.g., `npm run astro -- check`)
- `backend:install`: Install PHP deps and bootstrap Laravel env/migrations
- `backend:dev`: Run Laravel dev stack (server/queue/logs/vite)
- `backend:migrate`: Run Laravel migrations
- `backend:test`: Run Laravel tests

### Configuration
- `astro.config.mjs`: integrations (MDX, sitemap, Svelte), Tailwind Vite plugin, and `site` URL. Update `site` to your production domain for correct canonical URLs, RSS, and sitemaps.
- `svelte.config.js`: `vitePreprocess()` for Svelte islands.
- `tsconfig.json`: strict TypeScript settings (extends Astro’s strict config).

### Styling
- Tailwind CSS v4 is enabled via `@tailwindcss/vite`. No `tailwind.config.*` file is required to get started.
- Global CSS lives in `src/styles/global.css` and imports Tailwind base/components/utilities. It also defines the design tokens (CSS variables) and common UI classes.

### Content workflows
- Trips live under `src/content/trips/` and are typed via Zod in `src/content.config.ts`.
- Blog posts live under `src/content/blog/` and are typed in `src/content/config.ts`.
- Create a new file with the appropriate frontmatter (see `content-model.md` for examples).

### YouTube feed
- Update the channel ID in `src/lib/config.ts` if needed.
- Videos are fetched at build time with a 10‑minute cache (`src/lib/youtube.ts`).

### Debug tips
- Use `npm run astro -- check` to type‑check content collections and pages.
- If the RSS or sitemap use the wrong URLs, ensure `site` in `astro.config.mjs` is correct.
- If images fail to render via `<Image>`, check that assets are imported or live under `public/`.

### Future enhancements (nice to have)
- Continuous integration to run build and content checks on PRs.
- Consolidate content collection config into a single `src/content/config.ts` if desired.
- Add linting/formatting (ESLint/Prettier or Biome) when coding standards are defined.
