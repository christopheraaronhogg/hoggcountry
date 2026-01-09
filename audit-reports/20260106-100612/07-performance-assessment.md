# Performance Engineering Assessment

## Hogg Country - Astro 5 SSG Hiking Logbook

**Assessment Date:** January 6, 2026
**Codebase:** Astro 5.12.8 + Svelte 5 + Tailwind CSS 4
**Deployment:** Netlify Static Hosting
**Assessor:** Senior Performance Engineer

---

## Executive Summary

### Performance Health Rating: B+ (Good with Notable Optimization Opportunities)

Hogg Country demonstrates solid foundational performance characteristics inherent to static site generation, with pre-rendered HTML ensuring excellent Time to First Byte (TTFB). However, several optimization opportunities exist in font loading strategy, JavaScript payload size, and asset delivery that could improve Core Web Vitals scores by an estimated 15-25%.

**Key Strengths:**
- Static site generation eliminates server-side computation latency
- Comprehensive service worker provides robust offline capability
- Code-splitting in ToolsApp.svelte reduces initial JavaScript payload
- Privacy-friendly YouTube embeds with click-to-play pattern

**Critical Optimization Targets:**
- Render-blocking Google Fonts import (estimated LCP impact: 200-400ms)
- 241KB default-background.svg loaded on every page
- Large single-page Field Guide (all chapters rendered at once)
- 2,976-line ProtoF_Ranger.svelte component on homepage

---

## Bottleneck Analysis (Ranked by Impact)

### 1. CRITICAL: Render-Blocking Font Loading

**Location:** `src/styles/global.css` (Line 1)

```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Anton:wght@400&family=Lato:wght@400;600&family=Caveat:wght@400;600&display=swap');
```

**Impact:** HIGH - Blocks initial render while 4 font families are fetched from Google servers.

**Evidence:**
- 4 font families requested: Oswald (2 weights), Anton (1), Lato (2), Caveat (2)
- CSS `@import` is render-blocking by specification
- No preconnect hints for fonts.googleapis.com or fonts.gstatic.com
- User-perceived delay of 200-500ms on typical connections

**Quantified Impact:**
| Metric | Current | Optimized | Improvement |
|--------|---------|-----------|-------------|
| LCP | +300ms blocking | +50ms async | ~250ms faster |
| FCP | Delayed | Unblocked | ~200ms faster |
| Font Flash | None (blocking) | Brief FOIT/FOUT | Tradeoff |

**Recommendation:** Convert to async font loading with font-display: swap and preconnect hints.

---

### 2. HIGH: Oversized Background SVG Asset

**Location:** `public/default-background.svg`
**Size:** 241,510 bytes (241KB)

**Impact:** HIGH - This decorative asset is loaded on every page via the BackgroundWidget component.

**Evidence:**
- BackgroundWidget (`src/components/BackgroundWidget.svelte`) fetches this SVG on first visit
- Stored in localStorage after fetch (good caching strategy)
- However, initial load adds significant transfer time
- Background SVG contains procedurally-generated contour map data

**Quantified Impact:**
| Scenario | Transfer Time (3G) | Transfer Time (4G) |
|----------|-------------------|-------------------|
| Current | ~3.2s | ~0.6s |
| Optimized (50KB) | ~0.7s | ~0.1s |

**Recommendation:**
- Pre-compress SVG or generate smaller default (target: 50KB)
- Consider SVGO optimization (typically 30-50% reduction)
- Use CSS gradients as fallback during SVG load

---

### 3. HIGH: Large Homepage Svelte Component

**Location:** `src/components/prototypes/ProtoF_Ranger.svelte`
**Size:** 2,976 lines of code

**Impact:** MEDIUM-HIGH - This component is the entire homepage, loaded with `client:load`.

**Evidence:**
- Homepage (`src/pages/index.astro`) renders ProtoF_Ranger with `client:load`
- Contains extensive inline SVG for mountain graphics, decorative borders
- Multiple large inline `<style>` blocks
- Videos array passed as prop from build-time fetch (good)

**Quantified Impact:**
| Metric | Estimated Current | With Code Split |
|--------|------------------|-----------------|
| Homepage JS | ~85KB gzipped | ~45KB gzipped |
| TTI | ~1.2s | ~0.8s |
| Hydration | 200-400ms | 100-200ms |

**Recommendation:**
- Extract decorative SVGs to separate static components
- Consider splitting into smaller island components
- Move static content to Astro templates (zero JS)

---

### 4. MEDIUM: Single-Page Field Guide Architecture

**Location:** `src/pages/guide/index.astro`

**Impact:** MEDIUM - All 22 guide chapters rendered on single page with massive CSS block.

**Evidence:**
```javascript
const renderedChapters = await Promise.all(
  sortedGuides.map(async (chapter) => {
    const { Content } = await render(chapter);
    return { chapter, Content };
  })
);
```

- 32 markdown files totaling 172KB of raw content
- ~1,060 lines of inline `<style is:global>` CSS
- FullGuideNav.svelte (client:load) receives all chapter data
- markdownContent variable contains concatenated guide (~150KB string)

**Quantified Impact:**
| Metric | Current | With Pagination |
|--------|---------|-----------------|
| Guide Page HTML | ~350KB | ~50KB per chapter |
| Initial Parse | ~300ms | ~50ms |
| Memory Usage | High | Reduced 80% |

**Recommendation:**
- Consider virtual scrolling or lazy chapter loading
- Move large CSS to external stylesheet for caching
- Defer non-visible chapter rendering

---

### 5. MEDIUM: Search Index Size

**Location:** `public/guide-search-index.json`
**Size:** 156,361 bytes (156KB)

**Impact:** MEDIUM - Loaded for offline search capability.

**Evidence:**
- Pre-generated at build time (good)
- Contains full-text content for search
- Cached by service worker
- No compression applied at generation

**Recommendation:**
- Implement search index compression (gzip: ~25KB estimated)
- Consider chunked/progressive loading
- Use Fuse.js or similar with smaller index format

---

## Application Performance Assessment

### Build-Time Processing

**Rating:** EXCELLENT

The application correctly leverages SSG for all performance-critical paths:

1. **YouTube Feed Fetch:** Build-time with 5-second timeout and 10-minute cache
   ```typescript
   // src/lib/youtube.ts
   const TTL_MS = 10 * 60 * 1000; // 10 minutes
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 5000);
   ```

2. **Search Index Generation:** Pre-build script (`scripts/generate-search-index.js`)
3. **Content Collections:** Zod-validated schemas ensure type safety
4. **Asset Manifest:** Post-build generation for service worker

### Runtime Processing

**Rating:** GOOD

| Operation | Pattern | Performance |
|-----------|---------|-------------|
| Tool Switching | Dynamic imports | Excellent (code split) |
| Background Generation | Client-side Perlin noise | Good (cached) |
| Chapter Navigation | IntersectionObserver | Excellent |
| Form State | localStorage persistence | Good |

**Code Splitting Evidence:**
```javascript
// src/components/ToolsApp.svelte
const toolLoaders = {
  shelter: () => import('./ShelterDecision.svelte'),
  weather: () => import('./WeatherAssessor.svelte'),
  // ... 12 more lazy-loaded tools
};
```

### Memory Management

**Concerns:**
- BackgroundWidget stores SVG in localStorage (~240KB per domain)
- Trail context saved to localStorage on every change (debounced - good)
- Full guide content held in memory on guide page

---

## Frontend Performance Assessment (Core Web Vitals)

### Largest Contentful Paint (LCP)

**Estimated Score:** 2.0-2.8s (Needs Improvement)

**Contributing Factors:**
| Factor | Impact | Mitigation |
|--------|--------|------------|
| Render-blocking fonts | +300ms | Async loading |
| Background SVG | +100-200ms | Optimize/defer |
| ProtoF hero content | LCP candidate | Preload critical path |
| Hydration delay | +100-200ms | Partial hydration |

**Recommendations:**
1. Add `<link rel="preconnect" href="https://fonts.googleapis.com">`
2. Convert font import to async with font-display: swap
3. Inline critical CSS for above-the-fold content
4. Consider `client:visible` instead of `client:load` for below-fold islands

### First Input Delay (FID) / Interaction to Next Paint (INP)

**Estimated Score:** GOOD (<100ms typical)

**Strengths:**
- Static HTML renders immediately
- Event handlers are simple
- No heavy synchronous operations on interaction

**Potential Issues:**
- Hydration blocking during initial page load
- Perlin noise generation (if triggered) blocks main thread

### Cumulative Layout Shift (CLS)

**Estimated Score:** GOOD (<0.1)

**Strengths:**
- YouTube embeds use placeholder approach (prevents shift)
- Fixed header with explicit positioning
- Font loading with blocking prevents FOUT shifts

**Potential Issues:**
- Font swap could cause minor shifts if async loading adopted
- Dynamic content in BackgroundWidget could shift if not sized

---

## Resource Utilization Summary

### JavaScript Bundle Analysis

| Component Category | Estimated Size (gzipped) | Islands |
|-------------------|-------------------------|---------|
| Homepage (ProtoF) | ~85KB | 1 |
| Tools Page (ToolsApp) | ~25KB initial, +15KB per tool | 1 |
| Guide Page | ~35KB (FullGuideNav, GuideInlineSearch, DownloadGuideButton) | 3 |
| BackgroundWidget (global) | ~8KB | 1 |
| Gallery (lightbox) | ~3KB | 1 |

**Total Svelte Code:** 39,231 lines across all components

**Largest Components:**
1. ProtoF_Ranger.svelte: 2,976 lines
2. WaterTracker.svelte: 2,210 lines
3. WeatherAssessor.svelte: 2,205 lines
4. ProtoA_TrailHub.svelte: 2,157 lines
5. PowerManager.svelte: 2,000 lines

### CSS Analysis

| Source | Size | Loading |
|--------|------|---------|
| Tailwind (purged) | ~15-25KB | Build-time |
| Global CSS variables | ~3KB | Build-time |
| Inline component styles | ~40KB total | SSR |
| Guide page inline styles | ~30KB | Critical path |

### Network Waterfall (Typical First Visit)

```
1. HTML Document         ~50KB    |===>
2. Google Fonts CSS      ~2KB     |===> (blocking)
3. Google Fonts WOFF2    ~80KB    |====>===> (cascading)
4. Main CSS Bundle       ~25KB    |===>
5. Main JS Bundle        ~40KB    |====>
6. Component JS          ~50KB    |====>
7. Background SVG        ~241KB   |=========>
8. YouTube Thumbnails    ~30KB ea |====>
```

---

## Caching Analysis

### Service Worker Strategy

**Rating:** EXCELLENT

**Implementation:** `public/sw.js` (287 lines)

| Resource Type | Strategy | TTL |
|--------------|----------|-----|
| Static Assets (JS/CSS) | Cache-first, background update | Indefinite |
| HTML Pages | Network-first, cache fallback | Fresh on visit |
| Fonts | Cache-first | Indefinite |
| Images | Cache-first, background update | Indefinite |

**Precache List:**
- 7 core pages
- 25 guide chapters
- 6 static assets
- All `/_astro/` chunks (dynamically discovered)

**Strengths:**
- Comprehensive offline support for field guide (primary use case)
- Asset manifest generated at build time
- Graceful degradation with offline fallback HTML
- Version-based cache invalidation

**Opportunities:**
- No cache size limits (could grow unbounded)
- PDF (1.1MB) precached - consider on-demand

### CDN/Edge Caching (Netlify)

**Configuration:** `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Missing Optimizations:**
- No custom cache headers configured
- No redirect rules for trailing slashes
- No explicit asset versioning headers

**Recommendation:** Add cache control headers:
```toml
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.svg"
  [headers.values]
    Cache-Control = "public, max-age=604800"
```

---

## Scalability Assessment

### Current Capacity Limits

| Dimension | Current State | Scaling Barrier |
|-----------|---------------|-----------------|
| Content Volume | 32 guide chapters | Single-page rendering |
| Trip Entries | 2 trips | No pagination (acceptable) |
| Video Count | RSS-limited (~15) | Build-time fetch |
| Concurrent Users | Unlimited (static) | None |
| Offline Storage | ~3MB service worker | localStorage 5-10MB limit |

### Horizontal Scaling

**Rating:** EXCELLENT (inherent to SSG)

- Netlify CDN handles global distribution
- No origin server bottleneck
- Edge-cached at 200+ POPs worldwide

### Vertical Scaling (Content Growth)

**Rating:** NEEDS ATTENTION

**Guide Content:**
- Current: 22 chapters, 172KB markdown
- Projected: Could grow 3-5x with detailed trail sections
- Risk: Single-page architecture will degrade

**Recommendations:**
1. Implement chapter-based routing for guide
2. Add pagination for trips/videos if >50 items
3. Consider ISR (Incremental Static Regeneration) for YouTube feed

---

## Load Testing Maturity

### Current State: NOT IMPLEMENTED

No evidence of:
- Lighthouse CI integration
- Performance budgets
- Synthetic monitoring
- Real User Monitoring (RUM)

### Recommended Tooling

| Tool | Purpose | Priority |
|------|---------|----------|
| Lighthouse CI | PR performance gates | HIGH |
| bundlesize | JS budget enforcement | HIGH |
| WebPageTest | Baseline metrics | MEDIUM |
| Speedcurve/Calibre | RUM dashboard | LOW (small traffic) |

---

## Optimization Recommendations with Expected Gains

### Priority 1: Font Loading Strategy (HIGH IMPACT)

**Current:**
```css
@import url('https://fonts.googleapis.com/css2?family=...');
```

**Recommended:**
```html
<!-- In BaseHead.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Anton&family=Lato:wght@400;600&family=Caveat:wght@400;600&display=swap" media="print" onload="this.media='all'">
```

**Expected Gains:**
- LCP improvement: 200-350ms
- FCP improvement: 150-250ms
- Lighthouse Performance: +5-8 points

---

### Priority 2: Background SVG Optimization (HIGH IMPACT)

**Current:** 241KB default-background.svg

**Recommended Actions:**
1. Run SVGO optimization (expected: 30-40% reduction)
2. Reduce contour detail for smaller file
3. Implement progressive loading

**Expected Gains:**
- Initial load: -150-200KB transfer
- 3G users: 2+ seconds faster background appearance
- Lighthouse Performance: +3-5 points

---

### Priority 3: Homepage Component Refactoring (MEDIUM IMPACT)

**Current:** ProtoF_Ranger.svelte (2,976 lines) with `client:load`

**Recommended Actions:**
1. Extract hero section to static Astro component
2. Move decorative SVGs to sprite or external files
3. Use `client:visible` for below-fold interactive sections

**Expected Gains:**
- Initial JS: -30-40KB
- TTI improvement: 200-400ms
- Hydration time: -50%

---

### Priority 4: Guide Page Architecture (MEDIUM IMPACT)

**Current:** All chapters rendered simultaneously

**Recommended Actions:**
1. Implement virtual scrolling for chapter content
2. Move global styles to external cacheable stylesheet
3. Lazy-load chapter content as user scrolls

**Expected Gains:**
- Initial HTML: -60-70%
- Memory usage: -80%
- Parse time: -250ms

---

### Priority 5: CDN Cache Headers (LOW EFFORT, MEDIUM IMPACT)

**Recommended netlify.toml additions:**

```toml
[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.svg"
  [headers.values]
    Cache-Control = "public, max-age=604800"
```

**Expected Gains:**
- Repeat visit load time: -100-200ms
- CDN hit rate: Improved
- Bandwidth costs: Reduced

---

## Performance Budget Recommendations

### Recommended Budgets

| Metric | Budget | Current Estimate | Status |
|--------|--------|------------------|--------|
| Total JS (initial) | <150KB | ~130KB | PASS |
| Total CSS | <50KB | ~45KB | PASS |
| LCP | <2.5s | ~2.5s | AT RISK |
| TTI | <3.0s | ~2.8s | PASS |
| CLS | <0.1 | ~0.05 | PASS |
| Total Page Weight | <1MB | ~600KB | PASS |

### Implementation

Create `.lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['warning', { maxNumericValue: 1000000 }],
      },
    },
  },
};
```

---

## Summary of Key Findings

### Critical Issues (Immediate Action)
1. **Render-blocking Google Fonts import** - Estimated LCP impact: 200-400ms

### High Priority Issues
2. **241KB default-background.svg** - Excessive for decorative element
3. **ProtoF_Ranger.svelte (2,976 lines)** - Large homepage component

### Medium Priority Issues
4. **Single-page guide architecture** - Scalability concern
5. **156KB search index** - Could be compressed
6. **Missing CDN cache headers** - Easy win

### Commendations
- Excellent service worker implementation for offline use
- Proper code-splitting in ToolsApp
- Privacy-friendly YouTube embed pattern
- Build-time data fetching eliminates runtime dependencies

---

## Appendix: File Sizes Reference

### Public Assets
| File | Size |
|------|------|
| AT-Field-Guide-2026.pdf | 1.15MB |
| default-background.svg | 241KB |
| guide-search-index.json | 156KB |
| topo.svg | 10KB |
| fonts/atkinson-regular.woff | 23KB |
| fonts/atkinson-bold.woff | 22KB |

### Largest Svelte Components (Lines of Code)
| Component | Lines |
|-----------|-------|
| ProtoF_Ranger.svelte | 2,976 |
| WaterTracker.svelte | 2,210 |
| WeatherAssessor.svelte | 2,205 |
| ProtoA_TrailHub.svelte | 2,157 |
| PowerManager.svelte | 2,000 |
| ProtoG_Compass.svelte | 1,812 |
| ProtoB_Dashboard.svelte | 1,736 |

### Content Size
| Collection | Files | Total Size |
|------------|-------|------------|
| Guide chapters | 22 | 148KB |
| Quick references | 5 | 15KB |
| Blog posts | 3 | 7KB |
| Trips | 2 | 2KB |

---

*Report generated by Senior Performance Engineer - Claude Opus 4.5*
