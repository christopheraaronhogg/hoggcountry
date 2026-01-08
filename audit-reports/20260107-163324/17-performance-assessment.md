# Performance Assessment Report

**Project:** Hogg Country - Digital Hiking Logbook
**Date:** 2026-01-07
**Consultant:** Claude Performance Consultant
**Stack:** Astro 5 (SSG) + Svelte 5 Islands + Tailwind CSS 4 + TypeScript

---

## Executive Summary

Hogg Country is a static site built on Astro 5's SSG architecture, providing inherently strong performance foundations. The site demonstrates several performance best practices including privacy-friendly YouTube embeds (click-to-play), lazy loading for images, comprehensive service worker caching for offline use, and code splitting for Svelte island tools.

However, there are several critical and high-priority performance bottlenecks that significantly impact Core Web Vitals, particularly Largest Contentful Paint (LCP) and First Input Delay / Interaction to Next Paint (INP). The most impactful issues are: render-blocking Google Fonts via CSS `@import`, excessive client-side JavaScript on the homepage and guide pages via `client:load` directives, and a large unoptimized SVG background file.

**Performance Score: 6.5/10**

The site has solid foundations but requires targeted optimizations to achieve excellent Core Web Vitals scores.

---

## Table of Contents

1. [Core Web Vitals Analysis](#1-core-web-vitals-analysis)
2. [Bundle Size and Code Splitting](#2-bundle-size-and-code-splitting)
3. [Image Optimization](#3-image-optimization)
4. [Caching Strategies](#4-caching-strategies)
5. [Render Performance](#5-render-performance)
6. [Network Optimization](#6-network-optimization)
7. [Critical Bottlenecks Summary](#7-critical-bottlenecks-summary)
8. [Recommendations](#8-recommendations)
9. [Quick Wins](#9-quick-wins)
10. [Appendix](#10-appendix)

---

## 1. Core Web Vitals Analysis

### 1.1 Largest Contentful Paint (LCP)

**Status: NEEDS IMPROVEMENT (estimated 2.5-4s)**

| Factor | Impact | Current State |
|--------|--------|---------------|
| Font Loading | HIGH | Render-blocking `@import` from Google Fonts |
| Background SVG | MEDIUM | 2400x1600 SVG with complex filters loaded on all pages |
| Hero Component | MEDIUM | Large Svelte component (ProtoF_Ranger) using `client:load` |
| YouTube Thumbnails | LOW | Already lazy-loaded with click-to-play |

**Key Issues:**

1. **Render-Blocking Google Fonts** (Critical)
   - Location: `src/styles/global.css` line 1
   - The CSS `@import` loads 4 font families (Oswald, Anton, Lato, Caveat) synchronously
   - This blocks rendering until fonts are downloaded and parsed
   - Estimated delay: 300-800ms depending on connection

2. **Large Background SVG**
   - Location: `public/topo.svg` (2400x1600 with complex SVG filters)
   - Applied via CSS `background-image` with `background-attachment: fixed`
   - SVG includes `feTurbulence`, `feDisplacementMap`, and `feMorphology` filters
   - These filters are computationally expensive to render

### 1.2 Interaction to Next Paint (INP)

**Status: POTENTIALLY POOR (>200ms expected on some interactions)**

| Factor | Impact | Current State |
|--------|--------|---------------|
| Large Svelte Islands | HIGH | ToolsApp.svelte is 1444 lines with multiple dynamic imports |
| Homepage Svelte Load | MEDIUM | ProtoF_Ranger hydrated immediately with `client:load` |
| Event Delegation | GOOD | YouTubeEmbed uses single delegated click listener |

**Key Issues:**

1. **Immediate Hydration of Large Components**
   - Homepage loads ProtoF_Ranger via `client:load` (immediate hydration)
   - Guide page loads FullGuideNav, GuideInlineSearch, and multiple DownloadGuideButton components with `client:load`
   - This blocks the main thread during hydration

2. **ToolsApp Dynamic Imports**
   - ToolsApp implements good code-splitting for 14 tools
   - However, first tool (LayeringAdvisor) is statically imported
   - Tool switching includes artificial delays (150ms + 50ms timeouts)

### 1.3 Cumulative Layout Shift (CLS)

**Status: LIKELY GOOD (<0.1)**

| Factor | Impact | Current State |
|--------|--------|---------------|
| Font FOUT | MEDIUM | Custom fonts may cause slight shift |
| Image Dimensions | GOOD | YouTube embeds use aspect-ratio CSS |
| Dynamic Content | GOOD | Most content is server-rendered |

**Positive Observations:**
- YouTube embeds have explicit aspect-ratio (56.25% padding-top)
- Most layout is defined in CSS with no JavaScript-driven reflows
- Font preloads are in place for Atkinson fonts

---

## 2. Bundle Size and Code Splitting

### 2.1 JavaScript Analysis

**Current Architecture:**

| Component | Loading Strategy | Assessment |
|-----------|------------------|------------|
| ProtoF_Ranger | `client:load` | SUBOPTIMAL - Large component loaded immediately |
| ToolsApp | `client:load` | ACCEPTABLE - Good internal code-splitting |
| BackgroundWidget | `client:only` | GOOD - Client-only, no SSR overhead |
| FullGuideNav | `client:load` | SUBOPTIMAL - Should use `client:visible` |
| GuideInlineSearch | `client:load` | SUBOPTIMAL - Should use `client:idle` |
| DownloadGuideButton | `client:load` | SUBOPTIMAL - Should use `client:visible` |

**Finding: HIGH - Overuse of `client:load` Directive**

Multiple pages use `client:load` when less aggressive strategies would suffice:

```
src/pages/index.astro:12:  <ProtoF client:load videos={videos} />
src/pages/tools/index.astro:17:    <ToolsApp client:load />
src/pages/guide/index.astro: Multiple client:load usages
```

### 2.2 CSS Analysis

**Current State:**

| File | Size | Issues |
|------|------|--------|
| global.css | 181 lines | Render-blocking font import |
| ToolsApp.svelte | ~900 lines of CSS | Large but scoped |
| guide/index.astro | ~1000 lines inline CSS | Large but page-specific |

**Finding: MEDIUM - Inline Critical CSS Missing**

The site does not extract critical CSS for above-the-fold content. While Astro handles CSS bundling well, the render-blocking Google Fonts import negates these benefits.

### 2.3 Code-Splitting Assessment

**Positive Patterns:**

1. **ToolsApp Dynamic Imports** (GOOD)
   ```javascript
   const toolLoaders = {
     shelter: () => import('./ShelterDecision.svelte'),
     weather: () => import('./WeatherAssessor.svelte'),
     // ... 12 more tools dynamically loaded
   };
   ```

2. **Asset Manifest Generation** (GOOD)
   - `scripts/generate-asset-manifest.js` creates manifest for SW caching
   - Properly filters for JS/CSS only (excludes images)

---

## 3. Image Optimization

### 3.1 Current Implementation

| Image Type | Optimization | Assessment |
|------------|--------------|------------|
| YouTube Thumbnails | Lazy loaded, click-to-play | EXCELLENT |
| Gallery Images | `loading="lazy"` | GOOD |
| Blog Placeholders | JPG format | NEEDS IMPROVEMENT |
| Logo/Icons | SVG | GOOD |
| Background topo.svg | Complex SVG with filters | NEEDS IMPROVEMENT |

### 3.2 Findings

**Finding: MEDIUM - No Modern Image Formats**

Blog placeholder images (`src/assets/blog-placeholder-*.jpg`) are JPG format. Astro's built-in image optimization with Sharp could be leveraged to generate WebP/AVIF versions.

**Finding: MEDIUM - Background SVG Performance**

The `topo.svg` file (public/topo.svg) is a large decorative background with:
- Dimensions: 2400x1600
- Complex SVG filters: feTurbulence, feDisplacementMap, feMorphology
- Applied with `background-attachment: fixed`

Fixed backgrounds with complex filters cause repaint on scroll and GPU memory issues on mobile devices.

### 3.3 YouTube Embed Pattern (EXCELLENT)

The YouTubeEmbed.astro component implements a best-practice pattern:
- Shows thumbnail image initially (lazy loaded)
- Click-to-play loads actual iframe
- Uses youtube-nocookie.com for privacy
- Single delegated event listener for all embeds

---

## 4. Caching Strategies

### 4.1 Service Worker Implementation

**Status: COMPREHENSIVE**

| Feature | Implementation | Assessment |
|---------|---------------|------------|
| Precaching | Core pages + Guide chapters + Assets | EXCELLENT |
| Runtime Caching | Network-first for HTML, Cache-first for assets | GOOD |
| Offline Fallback | Custom offline HTML page | GOOD |
| Asset Manifest | Generated post-build | GOOD |
| Cache Versioning | Manual version string (v3) | ACCEPTABLE |

**Finding: LOW - Manual Cache Version Management**

Cache versioning uses manual string (`hogg-country-v3`) rather than content-based hashing. This could lead to stale content if version is not incremented on every change.

### 4.2 Browser Caching

**Finding: MEDIUM - No Explicit Cache Headers in netlify.toml**

The `netlify.toml` file does not define caching headers:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Missing configuration for:
- Immutable assets (`/_astro/*` with long cache)
- Static assets (fonts, images)
- HTML pages (short cache for updates)

### 4.3 CDN Utilization

**Status: GOOD (via Netlify)**

Netlify provides automatic CDN distribution. However, explicit header configuration would optimize caching further.

---

## 5. Render Performance

### 5.1 CSS Render Blocking

**Finding: CRITICAL - Google Fonts via @import**

Location: `src/styles/global.css:1`
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Anton:wght@400&family=Lato:wght@400;600&family=Caveat:wght@400;600&display=swap');
```

This CSS `@import` is render-blocking:
1. Browser downloads global.css
2. Discovers @import directive
3. Must fetch Google Fonts CSS
4. Google Fonts CSS references WOFF2 files
5. Only then can rendering begin

**Estimated Impact:** 300-800ms added to LCP

### 5.2 JavaScript Execution

**Finding: HIGH - Expensive Scroll Handlers**

Multiple pages attach scroll event listeners without throttling:

Location: `src/pages/guide/index.astro:1209-1218`
```javascript
function handleScroll() {
  if (window.scrollY < scrollThreshold) {
    headerWrapper?.classList.remove('is-hidden');
  } else {
    headerWrapper?.classList.add('is-hidden');
  }
}
window.addEventListener('scroll', handleScroll, { passive: true });
```

While `passive: true` is good, the function is called on every scroll event without throttling.

### 5.3 Paint Performance

**Finding: MEDIUM - Fixed Background with SVG Filters**

Location: `src/styles/global.css:44-58`
```css
body {
  background:
    url('/topo.svg'),
    radial-gradient(...)
    radial-gradient(...)
    radial-gradient(...)
    var(--bg);
  background-attachment: fixed;
}
```

`background-attachment: fixed` combined with complex SVG filters forces:
- Repaint on every scroll
- GPU texture creation for fixed positioning
- Filter recalculation

---

## 6. Network Optimization

### 6.1 Resource Hints

**Current State:**

| Hint Type | Usage | Assessment |
|-----------|-------|------------|
| Preload | Atkinson fonts (.woff) | GOOD |
| Preconnect | None | NEEDS IMPROVEMENT |
| Prefetch | None | ACCEPTABLE |
| DNS-Prefetch | None | NEEDS IMPROVEMENT |

**Finding: HIGH - Missing Preconnect for Google Fonts**

Despite using Google Fonts, there are no preconnect hints:

Location: `src/components/BaseHead.astro`
```html
<!-- Missing: -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Finding: MEDIUM - Missing Preconnect for YouTube**

YouTube thumbnails load from `i.ytimg.com` without preconnect:
```html
<!-- Missing: -->
<link rel="preconnect" href="https://i.ytimg.com">
```

### 6.2 Font Loading Strategy

**Finding: MEDIUM - Mixed Font Loading Approaches**

The site has two font loading mechanisms:
1. Local Atkinson fonts via `<link rel="preload">` (GOOD)
2. Google Fonts via CSS `@import` (BAD)

This creates inconsistency and the Google Fonts path is suboptimal.

### 6.3 Third-Party Scripts

**Status: EXCELLENT**

No third-party analytics or advertising scripts detected. The only external resources are:
- Google Fonts (can be self-hosted)
- YouTube (click-to-play pattern minimizes impact)

---

## 7. Critical Bottlenecks Summary

### Severity Matrix

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| Render-blocking Google Fonts @import | CRITICAL | High | Low | P0 |
| Overuse of `client:load` directive | HIGH | High | Medium | P1 |
| Missing preconnect hints | HIGH | Medium | Low | P1 |
| Fixed background with SVG filters | MEDIUM | Medium | Medium | P2 |
| No explicit cache headers | MEDIUM | Low | Low | P2 |
| Unthrottled scroll handlers | MEDIUM | Low | Low | P2 |
| No modern image formats | LOW | Low | Medium | P3 |

---

## 8. Recommendations

### 8.1 Critical Priority (P0)

#### Replace Google Fonts @import with Preload/Self-Hosting

**Current:**
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald...');
```

**Recommended Options:**

**Option A - Preload Google Fonts (Quick Fix):**
```html
<!-- In BaseHead.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Anton:wght@400&family=Lato:wght@400;600&family=Caveat:wght@400;600&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Anton:wght@400&family=Lato:wght@400;600&family=Caveat:wght@400;600&display=swap" media="print" onload="this.media='all'">
```

**Option B - Self-Host Fonts (Best Performance):**
1. Download font files from Google Fonts
2. Host in `public/fonts/`
3. Use `@font-face` declarations with `font-display: swap`

**Estimated Improvement:** 300-500ms reduction in LCP

### 8.2 High Priority (P1)

#### Optimize Svelte Island Loading Strategies

**Current Issues:**
- `client:load` used for components that don't need immediate interactivity
- Homepage loads large ProtoF_Ranger immediately

**Recommended Changes:**

```astro
<!-- index.astro - Consider client:visible for below-fold content -->
<ProtoF client:visible videos={videos} />

<!-- guide/index.astro -->
<FullGuideNav client:visible chapters={navChapters} ... />
<GuideInlineSearch client:idle chapters={navChapters} />
<DownloadGuideButton client:visible variant="toc" ... />
```

**Directive Guide:**
- `client:load` - Only for above-fold interactive elements
- `client:visible` - For below-fold components
- `client:idle` - For non-critical interactions
- `client:only` - For client-side only features (no SSR)

#### Add Preconnect Hints

```html
<!-- In BaseHead.astro -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://i.ytimg.com">
```

### 8.3 Medium Priority (P2)

#### Optimize Background SVG

**Option A - Simplify Filters:**
Remove or simplify the SVG filters (feTurbulence, feDisplacementMap):
```svg
<!-- Remove filter="url(#hand-drawn)" from main group -->
<g>
  <!-- contour paths without filter -->
</g>
```

**Option B - Convert to Static Image:**
Pre-render the SVG as a WebP/PNG at build time for browsers that struggle with SVG filters.

**Option C - Remove Fixed Attachment:**
```css
body {
  background-attachment: scroll; /* Better performance than fixed */
}
```

#### Add Cache Headers

```toml
# netlify.toml

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

#### Throttle Scroll Handlers

```javascript
function throttle(fn, wait) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

const handleScroll = throttle(() => {
  if (window.scrollY < scrollThreshold) {
    headerWrapper?.classList.remove('is-hidden');
  } else {
    headerWrapper?.classList.add('is-hidden');
  }
}, 100);
```

---

## 9. Quick Wins

These changes require minimal effort but provide measurable improvements:

### 1. Add Preconnect Hints (5 minutes)

Add to `src/components/BaseHead.astro`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

**Impact:** 50-100ms improvement in font loading

### 2. Add font-display: swap to Google Fonts URL (1 minute)

Already present (`display=swap` in URL) - verify it's working correctly.

### 3. Change ProtoF from client:load to client:visible (2 minutes)

```astro
<ProtoF client:visible videos={videos} />
```

**Impact:** Reduced main thread blocking, faster Time to Interactive

### 4. Add Cache Headers in netlify.toml (5 minutes)

See Section 8.3 for configuration.

**Impact:** Faster repeat visits, reduced bandwidth

### 5. Remove background-attachment: fixed on Mobile (5 minutes)

```css
@media (max-width: 768px) {
  body {
    background-attachment: scroll;
  }
}
```

**Impact:** Smoother scrolling on mobile devices

---

## 10. Appendix

### A. Files Analyzed

| File | Purpose | Performance Notes |
|------|---------|-------------------|
| `src/styles/global.css` | Global styles | Contains render-blocking @import |
| `src/components/BaseHead.astro` | HTML head | Font preloads present |
| `src/components/YouTubeEmbed.astro` | Video embeds | Excellent click-to-play pattern |
| `src/components/ToolsApp.svelte` | Tools interface | Good code-splitting, large file |
| `src/pages/index.astro` | Homepage | Uses client:load unnecessarily |
| `src/pages/guide/index.astro` | Field Guide | Multiple client:load usages |
| `src/lib/youtube.ts` | YouTube RSS | 10-minute in-memory cache |
| `public/sw.js` | Service Worker | Comprehensive caching |
| `public/topo.svg` | Background | Complex filters, performance concern |
| `netlify.toml` | Deployment | Missing cache headers |

### B. Positive Patterns Observed

1. **Static Site Generation** - Astro SSG provides excellent baseline performance
2. **Privacy-Friendly YouTube** - Click-to-play with youtube-nocookie.com
3. **Service Worker** - Comprehensive offline support with smart caching strategies
4. **Code Splitting** - ToolsApp implements dynamic imports for 14 tools
5. **Local Font Preloads** - Atkinson fonts properly preloaded
6. **Lazy Loading** - Images use native lazy loading attribute
7. **Passive Event Listeners** - Scroll handlers use `{ passive: true }`

### C. Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5-4s | >4s |
| INP | <200ms | 200-500ms | >500ms |
| CLS | <0.1 | 0.1-0.25 | >0.25 |

### D. Monitoring Recommendations

1. Set up Lighthouse CI in GitHub Actions
2. Monitor Core Web Vitals via Google Search Console
3. Use Netlify Analytics for real user metrics
4. Consider SpeedCurve or Calibre for synthetic monitoring

---

*Report generated by Claude Performance Consultant*
*Assessment methodology based on Web Vitals best practices and Astro performance guidelines*
