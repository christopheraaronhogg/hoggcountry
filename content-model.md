## Content Model

### Trips (`src/content/trips/*.md`)
Frontmatter schema (see `src/content.config.ts`):

```yaml
---
title: "Trail Name"
date: "2025-07-15"
state: "Arkansas" # Arkansas | Colorado | Other
trail_name: "Ouachita Trail" # optional
location: "Hot Springs, AR" # optional
distance_miles: 12.4 # optional
elevation_gain_ft: 2100 # optional
difficulty: "Moderate" # Easy | Moderate | Hard
cover_image: "/images/trips/ouachita.jpg" # optional
gallery: [
  "/images/trips/ouachita-1.jpg",
  "/images/trips/ouachita-2.jpg"
]
gpx_url: "https://example.com/track.gpx" # optional
tags: ["waterfalls", "family"]
description: "A quick loop with overlooks and creeks."
youtube: [
  "https://youtu.be/abcd1234",
  "https://www.youtube.com/watch?v=wxyz7890"
]
---

Trip story content here…
```

- Slug is derived from file path (e.g., `src/content/trips/needle-eyes-2025.md` → `/trips/needle-eyes-2025/`).
- `gallery` images are rendered via the `Gallery.svelte` island on trip detail pages.
- `youtube` URLs are embedded as privacy‑friendly, click‑to‑play players.

### Posts (`src/content/posts/*.md`)
Frontmatter schema (see `src/content.config.ts`):

```yaml
---
title: "Post title"
date: "2025-06-02"
tags: ["gear", "planning"]
summary: "Short abstract for cards"
cover_image: "/images/posts/my-cover.jpg" # optional
updatedDate: "2025-06-10" # optional
---

Post content here…
```

### Blog (`src/content/blog/**/*.{md,mdx}`)
Frontmatter schema (see `src/content/config.ts`):

```yaml
---
title: "Blog title"
description: "SEO description"
pubDate: "2025-05-01"
updatedDate: "2025-05-03" # optional
heroImage: "../assets/hero.jpg" # optional
---

Blog content here…
```

### Adding content
- Create a new Markdown (`.md`/`.mdx`) file under the appropriate collection.
- Use ISO date strings (`YYYY-MM-DD`) for `date`/`pubDate`.
- Keep image paths web‑friendly and commit assets into the repo (prefer `src/assets` or `public/` as appropriate).

### Tags and indexes
- Tag routes are available at `/tags/[tag]`.
- Trip and blog indexes are at `/trips` and `/blog`.

### Videos feed
- Channel ID lives in `src/lib/config.ts` (`YT_CHANNEL_ID`).
- The home page and videos page pull recent uploads from `https://www.youtube.com/feeds/videos.xml?channel_id=...` via `src/lib/youtube.ts`.

### Quality & accessibility
- Provide descriptive titles and alt text where possible.
- Dates are rendered with accessible labels in list and timeline UIs.