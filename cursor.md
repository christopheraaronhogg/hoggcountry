### Hogg Country — Cursor Guide

This file orients contributors (human or AI) to make safe, high‑signal edits.

#### Quick facts
- **Purpose**: A digital hiker’s logbook — trips, videos, posts in a stitched timeline.
- **Stack**: Astro 5 (SSG) + Svelte islands + Tailwind 4. Typed content collections.
- **Key deps**: `astro`, `@astrojs/svelte`, `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@tailwindcss/vite`, `fast-xml-parser`, `sharp`, `typescript`.
- **Dev commands**: `npm install`, `npm run dev`, `npm run build`, `npm run preview`.
- **Docs**: See `technology.md`, `architecture.md`, `content-model.md`, `developing.md`, and visual system in `design.md`.

#### Repo map (selected)
- `src/pages/` — routes (`index.astro`, `trips/*`, `videos/*`, `blog/*`, `tags/*`, `rss.xml.js`)
- `src/components/` — UI building blocks (timeline, badges, embed, gallery)
- `src/layouts/` — shared layouts (`BlogPost.astro`)
- `src/styles/global.css` — Tailwind layers + design tokens/components
- `src/content/` — blog content & config (`src/content/config.ts`)
- `src/content.config.ts` — trips/posts collections
- `src/lib/` — utilities (`youtube.ts`, `config.ts`)
- `public/` — static assets (fonts, favicon)

#### Configuration
- `astro.config.mjs`: integrations (MDX, sitemap, Svelte), Tailwind Vite plugin, `site` URL.
  - IMPORTANT: Set `site` to the real domain (affects canonical URLs, RSS, sitemaps).
- `svelte.config.js`: `vitePreprocess()` for islands.
- `tsconfig.json`: Astro strict with `strictNullChecks`.

#### Content authoring (cheat sheet)
- Trips → `src/content/trips/*.md` (see schema in `src/content.config.ts`).
- Posts → `src/content/posts/*.md` (schema in `src/content.config.ts`).
- Blog → `src/content/blog/**/*.{md,mdx}` (schema in `src/content/config.ts`).
- Use ISO dates: `YYYY-MM-DD`. Commit images under `src/assets` or `public/`.
- See examples in `content-model.md`.

#### YouTube integration
- Channel ID: `src/lib/config.ts` → `YT_CHANNEL_ID`.
- RSS parsing and 10‑minute cache: `src/lib/youtube.ts`.
- Timeline/home merges trips (content) + videos (RSS) by date desc.

#### UI patterns
- Timeline container/item: `src/components/Timeline*.astro`.
- Icon badge: `src/components/IconBadge.astro`.
- YouTube (privacy‑friendly, click‑to‑play): `src/components/YouTubeEmbed.astro`.
- Gallery lightbox island: `src/components/Gallery.svelte`.
- Global head/meta: `src/components/BaseHead.astro`.

#### Styling conventions
- Tailwind v4 utilities are available; custom design tokens (CSS variables) live in `src/styles/global.css`.
- Prefer semantic classes already defined (`.card`, `.badge`, `.timeline-*`, `.video-frame`, `.font-display`).
- Keep the paper/ink aesthetic and contrast guidelines from `design.md`.

#### Coding conventions
- TypeScript first; keep `any` usage minimal and localized.
- Use Astro for page composition, Svelte for interactivity.
- Small, focused components. Favor early returns and guard clauses.
- Avoid broad refactors in unrelated files within a single PR.

#### AI edit guidelines (important)
- Do not introduce new build tools or frameworks.
- When adding routes, prefer `.astro` pages under `src/pages/`.
- For new interactive UI, add a Svelte component under `src/components/` and keep the client script minimal.
- Respect content schemas; update Zod schemas if frontmatter changes.
- Keep `BaseHead.astro` as the single source of truth for meta.
- If changing URLs or domain, update `astro.config.mjs` `site`.
- Don’t remove Tailwind layers or design tokens from `src/styles/global.css`.

#### Common tasks
- Add a trip: create `src/content/trips/<slug>.md` with frontmatter → shows in `/trips` and home timeline.
- Embed YouTube in a trip: add the video URL to the `youtube` array in trip frontmatter.
- Add a blog post: create under `src/content/blog/` with required frontmatter.
- Add a new page: create `src/pages/<route>.astro`, import `BaseHead`, `Header`, `Footer`.

#### PR checklist
- `npm run build` succeeds.
- `npm run preview` shows expected routes without console errors.
- Content schemas validate (run `npm run astro -- check` if needed).
- Page has correct `<title>` and description via `BaseHead`.
- No regression to timeline layout on mobile/desktop.
- If adding images, paths resolve and sizes are reasonable.

#### Release checklist
- `astro.config.mjs` `site` is correct.
- RSS at `/rss.xml` renders and links resolve.
- Sitemap indexes the expected routes.
- Basic a11y pass: focus rings visible, images have appropriate `alt` where relevant.