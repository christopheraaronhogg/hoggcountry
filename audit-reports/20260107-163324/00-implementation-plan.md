# Implementation Plan - Audit Remediation

Generated from: 00-remediation-roadmap.md
Started: 2026-01-07

---

## Phase 0: Critical Security (Immediate) - COMPLETE

- [x] Add security headers to netlify.toml (CSP, X-Frame-Options, HSTS)
- [x] Sanitize search highlight function to prevent XSS
- [x] Consolidate duplicate schema files (content.config.ts)
- [x] Fix service worker cache paths to match actual routes

## Phase 1: Foundation (Week 1) - COMPLETE

- [ ] Create CI/CD pipeline (GitHub Actions) - deferred
- [x] Fix 2 failing unit tests
- [ ] Implement Sentry error tracking - deferred
- [x] Replace render-blocking Google Fonts @import with preload
- [x] Add preconnect hints for Google Fonts and YouTube
- [x] Change ProtoF from client:load to client:visible
- [x] Add cache headers in netlify.toml

## Phase 2: Security & Accessibility (Week 2)

- [ ] Implement focus trap in Gallery lightbox
- [ ] Add ARIA tabs pattern to Tools navigation
- [ ] Add skip-to-content link
- [ ] Add visible focus indicators to all interactive elements
- [ ] Associate form labels with inputs (for/id)
- [ ] Fix color contrast for muted text
- [ ] Add prefers-reduced-motion support
- [ ] Increase mobile touch targets to 44px minimum

## Phase 3: Performance & Quality (Week 3)

- [ ] Add tests for YouTube RSS parser
- [ ] Add basic component tests (Vitest)
- [ ] Implement privacy-friendly analytics
- [ ] Add Core Web Vitals tracking
- [ ] Simplify fixed background SVG on mobile
- [ ] Throttle scroll event handlers
- [ ] Add localStorage validation with Zod schemas

## Phase 4: SEO & Content Quality (Week 4)

- [ ] Implement JSON-LD structured data
- [ ] Add BreadcrumbList schema to all pages
- [ ] Add descriptive alt text to all images
- [ ] Remove Lorem ipsum blog content
- [ ] Add footer internal navigation links
- [ ] Create branded social sharing image
- [ ] Standardize title separator format

## Phase 5: Polish & Documentation (Ongoing)

- [ ] Add JSDoc to all exported functions
- [ ] Create CONTRIBUTING.md
- [ ] Delete redundant AI assistant files
- [ ] Enhance empty states with warmer copy
- [ ] Add error message patterns
- [ ] Create privacy policy page
- [ ] Add cookie/localStorage consent mechanism
- [ ] Refactor ToolsApp.svelte into smaller modules
- [ ] Implement E2E tests with Playwright
- [ ] Self-host all Google Fonts

---

## Progress Log

| Date | Phase | Task | Commit |
|------|-------|------|--------|
| 2026-01-07 | - | Started implementation | - |
