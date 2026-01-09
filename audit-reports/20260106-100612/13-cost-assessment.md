# Cloud Cost Assessment: Hogg Country

**Assessment Date:** January 6, 2026
**Project:** Hogg Country - Digital Hiking Logbook
**Stack:** Astro 5 SSG + Svelte 5 + Tailwind CSS 4
**Hosting:** Netlify (Static Site Hosting)
**Analyst:** Cloud Cost Consultant

---

## Executive Summary

### Total Identified Annual Savings: $0 - $228/year

Hogg Country is an exceptionally cost-efficient static site with minimal cloud infrastructure expenses. The project follows modern JAMstack best practices, leveraging:

- **Zero backend costs** (no servers, databases, or serverless functions)
- **Zero API costs** (YouTube RSS is a free public feed)
- **Efficient static hosting** (Netlify free tier likely sufficient)
- **Optimized build pipeline** (fast Astro SSG builds)

**Current Estimated Annual Cost:** $0 - $228/year (depending on tier)
**Optimized Annual Cost:** $0/year (achievable with free tier optimization)
**Potential Savings:** $0 - $228/year (100% of paid costs, if any)

---

## Cost Overview and Distribution

### Infrastructure Breakdown

| Service | Current Provider | Monthly Cost | Annual Cost | % of Total |
|---------|-----------------|--------------|-------------|------------|
| Static Hosting | Netlify | $0-19 | $0-228 | 100% |
| Database | None | $0 | $0 | 0% |
| Serverless Functions | None (configured but unused) | $0 | $0 | 0% |
| CDN | Netlify (included) | $0 | $0 | 0% |
| Domain | External | ~$12 | ~$12 | N/A |
| External APIs | YouTube RSS (free) | $0 | $0 | 0% |

### Current Netlify Tier Analysis

| Tier | Monthly Cost | Bandwidth | Build Minutes | Recommended? |
|------|-------------|-----------|---------------|--------------|
| Free | $0 | 100 GB | 300 min | Yes (likely sufficient) |
| Pro | $19 | 1 TB | 1000 min | Only if scaling significantly |
| Business | $99 | 1 TB | 1000 min | No (overkill) |

---

## Compute Optimization Opportunities

### Build Time Analysis

**Current Build Configuration (netlify.toml):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

**Build Pipeline:**
1. `prebuild`: Parse guide + generate search index (~5-10 seconds)
2. `build`: Astro SSG compilation (~30-60 seconds)
3. `postbuild`: Asset manifest generation (~1-2 seconds)

**Estimated Build Time:** 1-2 minutes per build

**Monthly Build Minutes Estimate:**
- Assuming 50 deployments/month (active development): 50-100 minutes
- Free tier provides 300 minutes - **SUFFICIENT**

### Savings Opportunity: Build Optimization

| Optimization | Current | Optimized | Monthly Savings |
|-------------|---------|-----------|-----------------|
| Incremental builds | Full rebuild | Cache node_modules | ~30% faster builds |
| Build caching | Default | Persistent cache | ~20% faster builds |
| Skip PDF generation in CI | Always runs | On-demand only | ~30 seconds/build |

**Estimated Savings:** $0 (already free tier) or faster deployments

---

## Storage Optimization Opportunities

### Static Asset Analysis

| Asset Category | File Count | Total Size | Optimization Potential |
|----------------|------------|------------|----------------------|
| PDF Guide | 1 | 1.15 MB | Compress further: ~$0.02/GB transfer saved |
| Search Index JSON | 1 | 153 KB | Already text-compressed by CDN |
| Custom Fonts (WOFF) | 2 | 46.6 KB | Optimal format |
| SVG Graphics | 5 | 253 KB | Consider SVGO compression |
| Placeholder Images | 6 | 189 KB | Already optimized JPEGs |
| **Total Static Assets** | 15 | **~1.8 MB** | Minimal savings possible |

### Image Optimization Assessment

**Current State:**
- 6 placeholder images in `src/assets/` (189 KB total)
- Images processed by Astro's sharp integration
- Using `loading="lazy"` on YouTube thumbnails

**Recommendations:**

| Optimization | Impact | Estimated Savings |
|-------------|--------|-------------------|
| Convert JPG to WebP | 25-35% size reduction | ~$0.01/1000 page views |
| Implement AVIF fallback | Additional 20% savings | Negligible |
| Remove unused placeholders | 6 files exist | ~$0.001/month |

**Total Storage Savings:** ~$0.05/month (~$0.60/year)

---

## Database Optimization Opportunities

### Assessment: N/A

**Finding:** No database infrastructure exists.

The site uses:
- Markdown files for content (34 files, ~172 KB total)
- JSON files for search index (153 KB)
- No external database connections

**Cost Impact:** $0 - This is optimal for a static site.

---

## Network/Data Transfer Analysis

### Bandwidth Estimation

**Site Structure:**
- 34 content pages (guide chapters, trips, blog)
- ~15 static pages (home, about, tools, etc.)
- ~50 total routes

**Average Page Weight Estimate:**
| Component | Size | Notes |
|-----------|------|-------|
| HTML | ~15-50 KB | Varies by page |
| CSS (Tailwind) | ~30-50 KB | Minified, tree-shaken |
| JavaScript (Svelte islands) | ~50-100 KB | Per interactive page |
| Fonts | ~47 KB | Cached after first load |
| Images | ~50 KB avg | Lazy loaded |
| **Average Page Load** | ~200-300 KB | First visit |
| **Cached Page Load** | ~50-100 KB | Return visit |

**Service Worker Caching:**
The site implements aggressive offline caching via `sw.js`:
- Precaches all guide chapters (20+ pages)
- Precaches static assets
- Cache-first strategy for assets
- Network-first for HTML

**Bandwidth Reduction from Service Worker:** ~60-70% for return visitors

### Monthly Bandwidth Calculation

| Scenario | Monthly Visits | Data Transfer | Cost Impact |
|----------|---------------|---------------|-------------|
| Low (hobby) | 1,000 | ~100 MB | Free tier |
| Medium | 10,000 | ~1 GB | Free tier |
| High | 100,000 | ~10 GB | Free tier |
| Very High | 1,000,000 | ~100 GB | Free tier limit |

**Savings Opportunity:** Current service worker implementation already optimizes bandwidth by 60-70%.

---

## Waste Elimination Register

### Identified Waste

| Resource | Type | Current Status | Monthly Waste | Action |
|----------|------|----------------|---------------|--------|
| Netlify Functions directory | Configured, unused | No functions deployed | $0 | Remove config or keep for future |
| Puppeteer devDependency | PDF generation | Only used locally | $0 | Keep (dev only) |
| Prototype components (7) | UI exploration | Not linked in production | $0 bytes | Consider removing if unused |
| Blog placeholder images | Placeholder content | 189 KB | $0 | Replace or remove |

**Total Waste Identified:** $0/month (effectively zero)

### Unused Resources Analysis

**netlify.toml Functions Configuration:**
```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

**Finding:** Directory `netlify/functions` does not exist. This configuration is harmless but could be removed for cleanliness.

**Savings:** $0 (no cost, no action needed)

---

## Commitment Recommendations (RI/SP Strategy)

### Assessment: Not Applicable

Netlify does not use reserved instances or savings plans. Pricing is straightforward:

| Tier | Commitment | Annual Cost | Notes |
|------|------------|-------------|-------|
| Free | None | $0 | Sufficient for most use cases |
| Pro (annual) | 12 months | $190/year | Save $38 vs monthly |
| Pro (monthly) | None | $228/year | Flexible |

**Recommendation:** Remain on Free tier unless:
- Bandwidth exceeds 100 GB/month
- Build minutes exceed 300/month
- Team collaboration features needed (Forms, Analytics, etc.)

---

## Cost Allocation & Tagging Assessment

### Current State

| Dimension | Implementation | Status |
|-----------|---------------|--------|
| Environment tags | N/A (single prod environment) | N/A |
| Team allocation | Single owner | N/A |
| Feature flagging | None | Not needed |
| Cost centers | N/A | Single project |

**Recommendation:** No action needed. Single-project, single-owner setup requires no cost allocation strategy.

---

## FinOps Maturity Scorecard

| Category | Score (1-5) | Assessment |
|----------|-------------|------------|
| **Cost Visibility** | 5/5 | Single service (Netlify), transparent pricing |
| **Resource Optimization** | 5/5 | Static site with no waste |
| **Rate Optimization** | 5/5 | Using free tier appropriately |
| **Architectural Efficiency** | 5/5 | Optimal JAMstack architecture |
| **Governance** | 4/5 | No spending limits configured (minor) |
| **Forecasting** | 4/5 | Predictable costs, no forecasting tool |

**Overall FinOps Maturity:** 28/30 (93%) - **Highly Mature**

### Best Practices Already Implemented

1. **Static Site Generation** - Zero server costs
2. **Public RSS feed** - No YouTube API costs
3. **Privacy-friendly embeds** - youtube-nocookie.com (no tracking overhead)
4. **Efficient fonts** - WOFF format, subset fonts
5. **Service Worker** - Aggressive caching reduces bandwidth
6. **Lazy loading** - Images and videos load on demand
7. **No database** - Content in markdown files
8. **Build-time data fetching** - YouTube data cached at build

---

## Savings Roadmap

### Quick Wins (Implement This Week): $0

| Action | Effort | Savings | Priority |
|--------|--------|---------|----------|
| Verify on Free tier | 5 min | $0-19/mo | High |
| Add WebP images | 30 min | ~$0.01/mo | Low |

**The site is already optimally configured for cost efficiency.**

### Short-term (This Month): $0

| Action | Effort | Savings | Priority |
|--------|--------|---------|----------|
| Monitor bandwidth usage | 15 min | Visibility | Medium |
| Review Netlify analytics | 10 min | Awareness | Medium |
| Remove unused netlify.toml function config | 2 min | Code cleanliness | Low |

### Medium-term (This Quarter): $0

| Action | Effort | Savings | Priority |
|--------|--------|---------|----------|
| Implement Astro Image optimization | 2 hours | ~$0.50/year | Low |
| Review for scaling needs | 30 min | Planning | Medium |

### Long-term (Architecture Changes): $0 potential

| Scenario | Trigger | Action | Cost Impact |
|----------|---------|--------|-------------|
| High traffic (100K+ monthly) | Bandwidth >100GB | Consider Cloudflare Pages | Potentially cheaper |
| Team expansion | Multiple editors | Evaluate CMS options | +$0-50/mo |
| Dynamic features | User accounts needed | Add backend | +$10-100/mo |

---

## Alternative Hosting Cost Comparison

| Provider | Free Tier | Paid Starting | Best For |
|----------|-----------|---------------|----------|
| **Netlify** | 100 GB/mo | $19/mo | Current choice, excellent |
| Cloudflare Pages | Unlimited | $5/mo | Higher bandwidth needs |
| Vercel | 100 GB/mo | $20/mo | Similar to Netlify |
| GitHub Pages | Unlimited | Free only | Simple sites |
| AWS Amplify | 5 GB/mo | ~$0.15/GB | AWS ecosystem |

**Recommendation:** Stay with Netlify. The service worker caching means even high traffic will stay within free tier limits for most use cases.

---

## Cost Monitoring Recommendations

### Metrics to Track

1. **Monthly bandwidth usage** (Netlify dashboard)
2. **Build minutes consumed** (Netlify dashboard)
3. **Page load performance** (affects user experience, not cost)
4. **Cache hit rate** (service worker effectiveness)

### Alerts to Configure

| Metric | Threshold | Action |
|--------|-----------|--------|
| Bandwidth | 80 GB/month | Review traffic sources |
| Build minutes | 240/month | Optimize build pipeline |
| Build failures | >10% | Investigate CI issues |

---

## Detailed Component Cost Analysis

### YouTube Integration (Zero Cost)

**Implementation:**
```typescript
// src/lib/youtube.ts
const TTL_MS = 10 * 60 * 1000; // 10 minutes cache
export async function fetchYouTubeRSS(feedUrl: string): Promise<YtVideo[]>
```

**Cost Analysis:**
- Uses public YouTube RSS feed (no API key needed)
- Feed URL: `https://www.youtube.com/feeds/videos.xml?playlist_id=...`
- Data fetched at build time only
- Thumbnails served from `i.ytimg.com` (YouTube's cost, not yours)
- Embeds use `youtube-nocookie.com` (privacy-friendly, no tracking)

**Annual Cost:** $0

### Content Storage (Zero Cost)

**Markdown Content:**
- Guide chapters: 20 files
- Quick references: 5 files
- Blog posts: 4 files
- Trips: 2 files
- Posts: 1 file
- **Total:** 34 files, ~172 KB

**JSON Data:**
- Search index: 153 KB
- Gear data: minimal
- Manifests: ~3 KB

**Annual Storage Cost:** $0 (included in static hosting)

### PDF Generation (Zero Cost)

**Implementation:**
- Uses Puppeteer (dev dependency)
- Generates PDF locally or in CI
- Output: `AT-Field-Guide-2026.pdf` (1.15 MB)

**Cost:** $0 (local process, served as static file)

---

## Risk Assessment

### Cost Escalation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Traffic spike (viral content) | Low | Medium | Service worker reduces bandwidth |
| Frequent deployments | Medium | Low | 300 min/mo buffer exists |
| Large asset additions | Low | Low | Review before commit |
| YouTube API changes | Very Low | Low | RSS is stable, public |

### No-Cost Dependencies

| Dependency | Risk | Alternative |
|------------|------|-------------|
| YouTube RSS | Very Low | Self-hosted video (expensive) |
| Netlify CDN | Very Low | Any static host |
| Google Fonts (Caveat, Oswald) | Very Low | Self-hosted |

---

## Conclusion

Hogg Country represents an exemplary implementation of cost-efficient web architecture:

1. **Zero recurring infrastructure costs** achievable with Netlify free tier
2. **No wasted resources** - all infrastructure serves a purpose
3. **Optimal architecture** for the use case (static site + client interactivity)
4. **Built-in cost controls** through service worker caching

### Key Findings

- **Current monthly cost:** $0-19 (depending on tier)
- **Optimal monthly cost:** $0 (free tier sufficient for expected usage)
- **Waste identified:** $0
- **Optimization opportunities:** Minimal (already optimized)

### Primary Recommendation

**Verify the site is on Netlify's Free tier.** If paying for Pro tier, evaluate whether the additional features (team seats, analytics, forms) are being utilized. If not, downgrade to save $228/year.

---

## Appendix A: Infrastructure Inventory

| Component | Provider | Configuration | Monthly Cost |
|-----------|----------|---------------|--------------|
| Static Hosting | Netlify | Free tier | $0 |
| DNS | External | hoggcountry.com | ~$1/mo |
| SSL | Netlify | Auto (Let's Encrypt) | $0 |
| CDN | Netlify | Global edge network | $0 |
| Build CI | Netlify | Auto deploy from Git | $0 |
| Analytics | None configured | - | $0 |
| Forms | None configured | - | $0 |
| Functions | None deployed | - | $0 |

## Appendix B: File Size Inventory

| Category | Files | Total Size |
|----------|-------|------------|
| Source TypeScript | ~10 | ~15 KB |
| Astro Components | ~20 | ~80 KB |
| Svelte Components | 32 | ~150 KB |
| Markdown Content | 34 | ~172 KB |
| Static Assets | 15 | ~1.8 MB |
| Configuration | 10 | ~15 KB |
| **Total Source** | ~120 | **~2.2 MB** |
| **Total with node_modules** | - | ~300+ MB |
| **Built Output (dist)** | - | ~5-10 MB (estimated) |

## Appendix C: External Service Dependencies

| Service | Usage | Cost | Alternative |
|---------|-------|------|-------------|
| YouTube RSS | Video feed | $0 | None needed |
| YouTube Thumbnails | Video images | $0 | Self-hosted |
| Google Fonts CDN | Typography | $0 | Self-hosted |
| Netlify CDN | Static hosting | $0 | Cloudflare, Vercel |

---

*Report generated by Cloud Cost Analysis Consultant*
*Analysis based on codebase review as of January 6, 2026*
