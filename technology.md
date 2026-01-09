## Technology Stack

### Overview
Hogg Country is a static site built with Astro 5 using Svelte islands and Tailwind CSS 4. Content is managed via Astro Content Collections and Markdown/MDX. Recent videos are pulled from YouTube’s channel RSS feed at build time.

- **Framework**: Astro 5 (Static Site Generation)
- **Islands**: Svelte 5 for interactive components
- **Styling**: Tailwind CSS 4 via Vite plugin + custom CSS variables
- **Content**: Astro Content Collections (Markdown/MDX)
- **Feeds/SEO**: RSS (`@astrojs/rss`), Sitemap (`@astrojs/sitemap`), meta in `BaseHead`
- **Media**: `sharp` for image optimization, preloaded WOFF fonts
- **YouTube ingest**: `fast-xml-parser` parsing YouTube RSS
- **Language**: TypeScript (strict null checks)

### Packages and versions
From `package.json`:
- `astro` ^5.12.8
- `@astrojs/svelte` ^7.1.0
- `@astrojs/mdx` ^4.3.3
- `@astrojs/rss` ^4.0.12
- `@astrojs/sitemap` ^3.4.2
- `@tailwindcss/vite` ^4.1.11
- `svelte` ^5.37.3
- `tailwindcss` ^4.1.11
- `typescript` ^5.9.2
- `fast-xml-parser` ^5.2.5
- `sharp` ^0.34.2

### Rendering model
- Astro renders pages to static HTML by default.
- Interactivity is added via islands:
  - `src/components/Gallery.svelte` (lightbox UI)
  - `src/components/YouTubeEmbed.astro` (small client script to swap thumbnail for iframe on click)

### Styling
- Tailwind v4 is wired through Vite (`@tailwindcss/vite`) in `astro.config.mjs`.
- Global styles live in `src/styles/global.css` and include Tailwind layers plus a design system using CSS variables (palette, typography, components like `.card`, `.badge`, timeline styles).

### Content system
- Blog collection defined in `src/content/config.ts`.
- Trips and posts collections defined in `src/content.config.ts`.
- Pages are in `src/pages/` as `.astro` files, with routes based on file paths.

### YouTube integration
- Channel ID in `src/lib/config.ts` (`YT_CHANNEL_ID`).
- RSS pulled and parsed in `src/lib/youtube.ts` with a 10‑minute in‑memory cache.
- Home page combines latest trips and videos chronologically.

### SEO & feeds
- `BaseHead.astro` centralizes meta tags, preloads fonts, and links RSS/sitemap.
- RSS feed at `src/pages/rss.xml.js` uses `@astrojs/rss`.
- Sitemap via `@astrojs/sitemap` (set `site` in `astro.config.mjs`).

### Configuration highlights
- `astro.config.mjs`: integrations (MDX, sitemap, Svelte), Tailwind Vite plugin, `site` URL.
- `svelte.config.js`: `vitePreprocess()` for Svelte.
- `tsconfig.json`: extends Astro strict config with `strictNullChecks`.

### Environment and tooling
- Recommended Node: 20+ (Astro 5 + sharp work well on Node 20 LTS).
- NPM scripts: `dev`, `build`, `preview`, `astro`.

### Notable conventions
- CSS variables define brand palette and are used alongside Tailwind utilities.
- Content frontmatter is strongly typed via Zod schemas in content collections.

### Follow‑ups / TODOs
- Update `site` in `astro.config.mjs` from `https://example.com` to the production domain.
- Consider consolidating content collection configs into a single `src/content/config.ts` for consistency.