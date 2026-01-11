---
description: 🔍 ULTRATHINK SEO Review - Technical SEO and search optimization using seo-consultant
---

# ULTRATHINK: SEO Assessment

ultrathink - Invoke the **seo-consultant** subagent for comprehensive search engine optimization evaluation.

## Output Location

**Targeted Reviews:** When a specific page/feature is provided, save to:
`./audit-reports/{target-slug}/seo-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/seo-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Homepage` → `homepage`
- `Product pages` → `product-pages`
- `Blog section` → `blog`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Technical SEO Fundamentals
- robots.txt configuration
- XML Sitemap completeness
- Canonical URL implementation
- URL structure and cleanliness
- HTTPS enforcement
- Mobile responsiveness

### Meta Tag Coverage
- Title tags (uniqueness, length, keywords)
- Meta descriptions (compelling, length)
- Meta robots directives
- Viewport meta tags
- Language/hreflang tags

### Structured Data (JSON-LD)
- Organization schema
- WebSite schema with search
- BreadcrumbList schema
- Product/Article schemas
- FAQ schemas

### Open Graph & Social
- og:title, og:description, og:image
- Twitter card implementation
- Social share optimization

### Core Web Vitals (SEO Impact)
- LCP (Largest Contentful Paint)
- INP (Interaction to Next Paint)
- CLS (Cumulative Layout Shift)

### Content SEO Factors
- Heading hierarchy (H1-H6)
- Internal linking strategy
- Image alt text coverage
- Content-to-code ratio

### Crawl Efficiency
- Page load speed
- Render-blocking resources
- JavaScript rendering requirements
- Dead links / 404s
- Redirect chains

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quick`, `/audit-frontend`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ SEO Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal SEO assessment to the appropriate path with:
- **SEO Health Score (1-10)**
- **Technical SEO Audit**
- **Meta Tag Coverage Analysis**
- **Structured Data Assessment**
- **Core Web Vitals (SEO Impact)**
- **Critical SEO Issues**
- **Quick Wins**
- **Recommendations**

**Be thorough about search visibility. Reference exact files, missing tags, and optimization opportunities.**
