# Design.md — Hogg Country: The Trailhead Logbook

This document captures the visual and interaction system for Hogg Country so we can keep the look/feel consistent as we build.

## 1) Concept & Story
- Core idea: a digital hiker’s logbook — a scrapbook of trips, videos, and notes arranged along a stitched trail timeline.
- Identity:
  - Title: Hogg Country — The Trailhead Logbook
  - Trail name: Hogg Country Trailblazer
  - Bio: Avid Arkansas hiker; Triple “O” Crowner (Ouachita Trail, Ozark Highlands Trail, Ozark Trail); Sassafras Award recipient.
- Tone: warm, outdoorsy, personal; confident but not flashy.

## 2) Color System
Primary (Landscape)
- Cloud White (paper): #f5f2e8 — page background with subtle texture
- Alpine Green: #a6b589 — primary accent for trips and badges
- Shadow Pine: #4d594a — headings/brand accents
- Stone Gray: #cccccc — borders and stitch axis

Accents (Action & Memories)
- Trail Marker Yellow: #f0e000 — primary CTAs/buttons
- Terracotta Sun: #d97706 — warm accent for stories/photo-centric moments

Neutrals
- Charcoal (body): #333333
- Muted pine (meta): ~#5c665a

Usage
- Background: Cloud White with subtle “paper” texture
- Cards: White with Stone Gray border; soft hover shadow
- Links/CTAs: Trail Marker Yellow; secondary UI in pine
- Badges: White fill; Stone border; pine text

## 3) Typography
- Display: Oswald (600–700) — H1/H2, entry headers
- Chapter markers: Anton (700) — full-width “Chapter” banners
- Body: Lato (400/600) — readable body copy
- Handwritten accents: Caveat (400/600) — notes/signatures

Sizes & Rhythm
- H1: clamp(2rem, 4vw, 3rem); bold; lh ~1.1
- H2: clamp(1.5rem, 2.5vw, 2rem); bold; lh ~1.15
- H3: ~1.125rem; lh ~1.25; semibold
- Body: 1rem; lh ~1.7

## 4) Layout
- Container: max width ~1100px; responsive gutters
- Header: compact (~52px), translucent; brand left + filter pills right
- Hero: title + intro paragraph + primary CTA; optional chapter marker
- Timeline (stitch): center dashed axis on desktop; left on mobile
  - Entries alternate left/right (desktop) or stack (mobile)
  - Small IconBadge on axis shows type (trip/video/post)
  - Each entry shows: title, date, source/location, and badges

## 5) Components & Patterns
- Header (compact)
  - Pills: All, Trips, Videos, Posts (client-side filter)
- IconBadge: small circular icon on axis
  - Variants: trip (alpine), video (marker), post (terracotta)
- Timeline & TimelineItem
- Cards: white, Stone border, 14–16px radius, subtle lift on hover
- Badges: pill chips for meta (Distance, Gain, Difficulty, State, tags)
- Buttons: primary (marker yellow), secondary (white + Stone border)
- Video embeds: privacy-friendly, click-to-play, title + date inline

## 6) Content Model
- Trips (content/trips/*.md):
  - title, date (ISO), state, trail_name, distance_miles, elevation_gain_ft, difficulty, gallery[], youtube[]
- Videos (RSS via channel_id):
  - id, title, published ISO, link, thumbnail
- Merge trips + videos by date desc for timeline

## 7) Accessibility
- Contrast: ensure readable pine/charcoal on white
- Focus: visible focus rings on pills, buttons, links
- Icons: aria-hidden on SVGs; labels/titles on wrappers
- Dates: entry meta has title attr with full date

## 8) Motion
- Cards: small lift on hover; transitions ~150–180ms ease-out
- IconBadge: tiny hover lift; optional slide-in on scroll later

## 9) Future Enhancements
- Chapter markers between months/regions (Anton + silhouette stripe)
- Filter persistence (URL/localStorage)
- Trip thumbnails in timeline entries if cover_image exists
- Map/GPX on trip detail pages
- Handwritten notes (Caveat) in trip captions/callouts

## 10) Do/Don’t
- Do: keep header compact; dates consistent; content-led identity
- Don’t: reintroduce large “VIDEO/TRIP” labels; overuse textures; low-contrast text

---
Implementation notes
- Astro + Svelte islands
- Fonts via Google Fonts; consider local hosting later
- Youtube RSS parsed with fast-xml-parser (Node-friendly)
- Styling via CSS variables + utilities in src/styles/global.css
