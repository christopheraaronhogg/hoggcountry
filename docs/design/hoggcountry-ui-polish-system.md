# Hogg Country UI Polish — Design System Brief

Scope: a practical, repo-local design direction for the current public-site, tool-page, and guide polish pass. Parallel agents should follow this verbatim before adding new patterns. Tokens, components, and conventions referenced here already exist — extend them, do not replace them.

## 1. Visual principles

**Voice.** Trail-practical, hand-built, slightly weathered. Think a clean field notebook, not a SaaS dashboard. Restraint over decoration: every chip, divider, and shadow earns its place by clarifying status or hierarchy.

**Tokens (canonical, from `src/styles/global.css`).**
- Surface: `--bg #f5f2e8` (paper), `--card #fff`, `--border #e6e1d4`.
- Ink: `--ink #1f2937` (titles), `--fg #333` (body), `--muted #5c665a` (secondary). Use `--muted-accessible #4a5448` whenever muted text sits on white cards.
- Trail palette: `--pine #4d594a` (primary), `--alpine #a6b589` (accent, progress), `--marker #f0e000` (CTA / location dot), `--terra #d97706` (alert / quick-ref accent), `--stone #ccc`.
- Never invent new hexes inline. If a tone is missing, derive from a token with `rgba(var, alpha)` or add to the token block in one PR.

**Typography.**
- Display: `Anton` (tool h1s, big numbers) — uppercase, tight letter-spacing `0.03em`, line-height `~0.95`.
- UI / eyebrows: `Oswald` — uppercase, weight 600–800, letter-spacing `0.08–0.12em`, size `0.65–0.82rem`.
- Body: `Lato`, line-height `1.5`, max measure `~58ch` for descriptions and `~70ch` for prose.
- Accent / handwritten: `Caveat` only for masthead subtitle and one-off trail notes. Do not use it for buttons, labels, or microcopy.

**Density.** Default outer padding `clamp(0.85rem, 3vw, 1.35rem)` on cards. Inter-card gap `0.75–1rem`. Tools are dense; airy whitespace belongs on the marketing/guide masthead, not inside calculators.

**Radius & elevation.** Cards `14px`, inner chips/buttons `10–12px`, pills `999px`. One shared shadow recipe: `0 16px 44px rgba(45, 54, 42, 0.08)`. No hard drop shadows; no blurred glassmorphism except the fixed guide header (`backdrop-filter: blur(12px)` on `rgba(245, 242, 232, 0.95)`).

**Cards vs panels.** A *card* is a self-contained readout with the paper-gradient background (`linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.72)), rgba(245,242,232,0.72)` + 1px `rgba(61, 74, 58, 0.14)` border). A *panel* is the dark `--pine → #2c362a` gradient used for the ContextBanner and any header strip that must read as system chrome, not content.

## 2. Tool page structure

All tool routes render through `src/components/tools/ToolPage.svelte`. Inner tool components are embedded — they must not render their own page header, back button, or progress bar. Expectations:

1. **Ribbon** (`.tool-ribbon`): back link → group chip → intent line. Group chip uses pine-on-alpine-tint pill; intent line truncates on desktop, wraps on mobile.
2. **Hero** (`.tool-title-block`): icon tile (yellow-tint square, 12px radius) + eyebrow (Oswald uppercase) + Anton h1 + 58ch description. Do not add CTAs here — the tool body owns actions.
3. **Progress strip** (`.progress-strip`): single line of `% complete · miles to Katahdin · target pace`, then the slim alpine→pine bar. Numbers are bold pine; separators are middle dots.
4. **ContextBanner** (`.context-dock`): the dark pine strip with Mile / Landmark / Date and a Settings disclosure. Always present, always above the tool content.
5. **Tool content** (`.tool-content`): the embedded calculator/decision tool. Use card-style readouts, Oswald eyebrows above each metric, Anton or 1.6rem+ numerals for the headline number, and never repeat trail context that ContextBanner already shows.
6. **Aside** (`.tool-aside`): related tools list — sticky on desktop (top `4.5rem`), inline below content on `<= 900px`. Two columns at `<= 900px`, one column at `<= 640px`.

**Readout patterns.** Each tool exposes one *headline answer* (largest number, pine), 2–4 *supporting metrics* in a grid (Oswald eyebrow + bold value), and an honest assumption line in `--muted-accessible`. Prefer terra `#d97706` for warning callouts and alpine `#a6b589` for "you're on track" affirmations — never both at once.

## 3. Guide chrome structure

The Field Guide layout is shared between Astro (`src/pages/guide/index.astro`) and the SvelteKit mirror. Three fixed layers:

- **Header wrapper** (`.guide-header-wrapper`, z `3000`): the site header on the paper-gradient + blur. Auto-hides on scroll-down via the `.is-hidden` class; `FullGuideNav` reads this with a MutationObserver — do not detach.
- **Progress scrubber** (`.progress-container`, z `1002`): full-width, 8px alpine→pine fill, yellow marker dot (`--marker`, 3px pine ring, 4px paper halo). Draggable via pointer events. Below the header, above content. Keep `padding-top: 0.95rem` on mobile so the marker doesn't clip.
- **Sidebar** (`.sidebar`, desktop ≥ 1025px, fixed `220px`): paper-tint background, Oswald section headers, active TOC item gets `border-left: 3px solid var(--alpine)` and an alpine-15% tint.

Mobile (`<= 1024px`): sidebar is hidden; a bottom-left floating `Contents` toggle opens a left drawer (`min(320px, 85vw)`) with an overlay (`rgba(0,0,0,0.4)`). The progress scrubber stays fixed at the top — no second fixed band beneath it.

Content well: `max-width: 750px`, padding `2rem 1.5rem 6rem`. Reading rhythm is paragraph + occasional callout — no full-width hero images inside chapters.

## 4. Copy rules

- **Trail-practical first.** Numbers and decisions over adjectives. "11.2 mi to Neels Gap, 2 resupply options" beats "Adventure to your next stop." Use ISO-ish phrasing for distance (`mi`, never `miles` in chips; spell out only in paragraphs).
- **Honest assumptions.** Every calculator readout names what it assumed (`Assumes 15 mi/day from current mile`). If the user hasn't set context yet, say so — never present a fabricated default as if it were their plan.
- **No overclaiming Scout.** Scout is an assistant, not an oracle. Never write "Scout knows", "Scout will guide you", or "AI-powered". Prefer "Scout suggests", "based on AWOL 2026 / NOAA", or naming the actual source.
- **Trail facts come from canonical sources only** (`src/data/trail-facts.yaml`, `src/data/trailData.ts`). Total trail = **2,197.9 mi**, approach trail **8.8 mi**, **14** states, **~260** shelters. Never round these in copy.
- **Microcopy voice.** Short, sentence-case, no exclamation points. Buttons are verbs (`Plan resupply`, `Log mile`, `Open guide`). Empty states explain what shows up here once the user does X.

## 5. Agent handoff checklist

Before opening a PR on any tool, guide, or public-page polish, the implementing agent must:

- [ ] Read `ToolPage.svelte`, `ContextBanner.svelte`, and `FullGuideNav.svelte` before touching their callers — these are the integration contract.
- [ ] Use existing tokens; no new hex literals in component styles.
- [ ] Inner tool components stay embedded (no internal page header/back link/progress); they receive `trailContext` + `embedded={true}`.
- [ ] Mobile breakpoints honored: tool layout collapses at `900px`, ribbon wraps at `640px`, guide sidebar disappears at `1024px`.
- [ ] Trail-fact strings traced to canonical source; run `/audit-trail-facts` if any AT mileage/state/shelter count changed.
- [ ] `npm run check -w @hoggcountry/scout-web` clean; svelte-check has zero new warnings.
- [ ] Build passes for both trees: `npm run build` (Astro + workspace) and `SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web` (Forge shape).
- [ ] Screenshot-verified at ≥1280px, ~900px, and ~390px before declaring done. UI claims need pixels.
