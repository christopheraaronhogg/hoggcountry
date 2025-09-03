## Developing

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm (comes with Node)

### Install and run
- Install: `npm install`
- Dev server: `npm run dev` (default `http://localhost:4321`)
- Build: `npm run build` (outputs to `dist/`)
- Preview production build: `npm run preview`

### Project scripts
- `dev`: Astro dev server
- `build`: Astro build
- `preview`: Astro preview
- `astro`: Run Astro CLI (e.g., `npm run astro -- check`)

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