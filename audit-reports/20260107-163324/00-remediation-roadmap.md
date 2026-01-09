# Remediation Roadmap

Generated: 2026-01-07
Based on: 18 consultant assessments

## Overview

This roadmap sequences 63 findings into 5 phases, respecting technical dependencies and maximizing impact.

**Total estimated effort:** 80-120 person-hours
**Critical items:** 4 (must address immediately)
**Quick wins available:** 12 (high impact, low effort)

---

## Dependency Graph

```
[Foundation Layer]
    |
    +-- Duplicate Schema Files -----+-- Content Validation
    |                               +-- Build Reliability
    |
    +-- Service Worker Cache Paths -+-- Offline Functionality
    |                               +-- Guide Chapter Access
    |
    +-- CI/CD Pipeline -------------+-- Test Automation
                                    +-- Quality Gates
                                    +-- Security Scanning

[Performance Layer]
    |
    +-- Google Fonts @import -------+-- LCP Improvement
    |                               +-- First Paint
    |
    +-- client:load Optimization ---+-- TTI Improvement
    |                               +-- Main Thread Blocking
    |
    +-- Preconnect Hints -----------+-- Resource Loading

[Security Layer]
    |
    +-- Security Headers -----------+-- CSP Protection
    |                               +-- XSS Mitigation
    |
    +-- Search XSS Fix -------------+-- Safe Content Rendering
    |
    +-- Input Validation -----------+-- Data Integrity

[Accessibility Layer]
    |
    +-- Focus Trap (Gallery) -------+-- Keyboard Navigation
    |                               +-- Screen Reader Support
    |
    +-- ARIA Tabs (Tools) ----------+-- Accessible Tool Switching
    |
    +-- Skip Link ------------------+-- Bypass Blocks

[Quality Layer]
    |
    +-- Error Tracking (Sentry) ----+-- Production Visibility
    |                               +-- Error Reporting
    |
    +-- Fix Failing Tests ----------+-- Test Trust
    |                               +-- Regression Detection
    |
    +-- Structured Data (JSON-LD) --+-- Rich Snippets
                                    +-- Search Visibility
```

---

## Phase 0: Critical Security (Immediate - Days 1-3)

**Goal:** Eliminate active security risks and data integrity issues
**Duration:** 1-3 days
**Team:** Senior engineer

| # | Task | Source | Effort | Risk if Delayed |
|---|------|--------|--------|-----------------|
| 1 | Add security headers to netlify.toml (CSP, X-Frame-Options, HSTS) | Security | 1 hour | Medium - clickjacking, MIME sniffing |
| 2 | Sanitize search highlight function to prevent XSS | Security, UX | 2 hours | Medium - DOM XSS in search results |
| 3 | Consolidate duplicate schema files (content.config.ts) | Architecture, Backend, Database, Code Quality, Requirements | 2 hours | High - build inconsistencies, validation drift |
| 4 | Fix service worker cache paths to match actual routes | Architecture, Backend, Requirements, DevOps | 3 hours | High - offline functionality broken |

**Exit Criteria:**
- Security headers return in HTTP responses
- Search uses sanitized HTML rendering
- Single content.config.ts is source of truth
- Service worker correctly caches all guide chapters

---

## Phase 1: Foundation (Week 1)

**Goal:** Address root causes that enable other fixes
**Duration:** 1 week
**Blocked by:** Phase 0 completion

| # | Task | Source | Effort | Enables |
|---|------|--------|--------|---------|
| 1 | Create CI/CD pipeline (GitHub Actions) | DevOps, QA | 3 hours | Test automation, quality gates |
| 2 | Fix 2 failing unit tests | QA | 30 min | Test suite trustworthiness |
| 3 | Implement Sentry error tracking | Observability | 3 hours | Production error visibility |
| 4 | Replace render-blocking Google Fonts @import with preload | Performance | 1 hour | LCP improvement |
| 5 | Add preconnect hints for Google Fonts and YouTube | Performance | 15 min | Resource loading speed |
| 6 | Change ProtoF from client:load to client:visible | Performance | 5 min | TTI improvement |
| 7 | Add cache headers in netlify.toml | Performance, DevOps | 15 min | Faster repeat visits |

**Parallel Opportunities:**
- Tasks 1-3 (DevOps/QA track) can run concurrently with tasks 4-7 (Performance track)
- Task 2 should complete before task 1 to establish passing baseline

**Exit Criteria:**
- CI runs on every push/PR
- All tests passing
- Error tracking capturing production issues
- LCP under 2.5 seconds

---

## Phase 2: Security & Accessibility Hardening (Week 2)

**Goal:** Comprehensive security improvements and WCAG compliance
**Duration:** 1 week
**Blocked by:** Phase 1 (CI/CD for regression testing)

| # | Task | Source | Effort | Enables |
|---|------|--------|--------|---------|
| 1 | Implement focus trap in Gallery lightbox | UX | 2 hours | Keyboard navigation, WCAG 2.1.2 |
| 2 | Add ARIA tabs pattern to Tools navigation | UX | 3 hours | Screen reader support, WCAG 2.1.1 |
| 3 | Add skip-to-content link | UX | 30 min | WCAG 2.4.1 compliance |
| 4 | Add visible focus indicators to all interactive elements | UX | 2 hours | WCAG 2.4.7 compliance |
| 5 | Associate form labels with inputs (for/id) | UX | 2 hours | WCAG 1.3.1, 3.3.2 compliance |
| 6 | Fix color contrast for muted text | UX, UI | 30 min | WCAG 1.4.3 compliance |
| 7 | Add prefers-reduced-motion support | UX | 30 min | Motion sensitivity |
| 8 | Increase mobile touch targets to 44px minimum | UX | 1 hour | WCAG 2.5.5 compliance |

**Exit Criteria:**
- Gallery fully keyboard navigable
- Tools navigation announced to screen readers
- All focus states visible
- Color contrast meets AA standards

---

## Phase 3: Performance & Quality (Week 3)

**Goal:** Optimize performance and establish quality baselines
**Duration:** 1 week
**Blocked by:** Database foundation work from Phase 1

| # | Task | Source | Effort | Enables |
|---|------|--------|--------|---------|
| 1 | Add tests for YouTube RSS parser | QA | 3 hours | API change detection |
| 2 | Add basic component tests (Vitest) | QA, Code Quality | 6 hours | Refactoring confidence |
| 3 | Implement privacy-friendly analytics (Plausible/Umami) | Observability | 2 hours | User behavior visibility |
| 4 | Add Core Web Vitals tracking (web-vitals) | Observability, Performance | 2 hours | Performance monitoring |
| 5 | Simplify or remove fixed background SVG on mobile | Performance | 1 hour | Mobile scroll performance |
| 6 | Throttle scroll event handlers | Performance | 30 min | Main thread relief |
| 7 | Add localStorage validation with Zod schemas | Database, Backend | 3 hours | Data integrity |

**Exit Criteria:**
- YouTube parser has test coverage
- At least 20% component test coverage
- Analytics capturing page views
- Core Web Vitals monitored

---

## Phase 4: SEO & Content Quality (Week 4)

**Goal:** Improve search visibility and content completeness
**Duration:** 1 week
**Blocked by:** Core functionality stable from Phases 1-3

| # | Task | Source | Effort | Enables |
|---|------|--------|--------|---------|
| 1 | Implement JSON-LD structured data (Organization, WebSite, Person) | SEO | 4 hours | Rich snippets, search visibility |
| 2 | Add BreadcrumbList schema to all pages | SEO | 2 hours | Navigation in search results |
| 3 | Add descriptive alt text to all images | SEO, UX | 1 hour | Image search, accessibility |
| 4 | Remove or replace Lorem ipsum blog content | Copy, SEO, Requirements | 30 min | Credibility |
| 5 | Add footer internal navigation links | SEO | 30 min | Crawlability |
| 6 | Create branded 1200x630 social sharing image | SEO | 2 hours | Social CTR |
| 7 | Standardize title separator format | SEO | 15 min | Consistency |

**Exit Criteria:**
- Structured data validates in Google Rich Results Test
- No placeholder content visible
- All images have meaningful alt text

---

## Phase 5: Polish & Documentation (Week 5+)

**Goal:** Improve developer and user experience
**Duration:** Ongoing
**Blocked by:** Core fixes from Phases 1-4

| # | Task | Source | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | Add JSDoc to all exported functions | Documentation, Code Quality | 4 hours | Maintainability |
| 2 | Create CONTRIBUTING.md | Documentation | 2 hours | Contributor onboarding |
| 3 | Delete redundant AI assistant files (AGENTS.md, GEMINI.md) | Documentation | 5 min | Reduce confusion |
| 4 | Enhance empty states with warmer copy | Copy | 1 hour | User experience |
| 5 | Add error message patterns | Copy, UX | 2 hours | Error handling UX |
| 6 | Create privacy policy page | Compliance | 3 hours | GDPR/CCPA compliance |
| 7 | Add cookie/localStorage consent mechanism | Compliance | 4 hours | ePrivacy compliance |
| 8 | Refactor ToolsApp.svelte into smaller modules | Architecture, Code Quality | 8 hours | Maintainability |
| 9 | Implement E2E tests with Playwright | QA | 8 hours | User flow verification |
| 10 | Self-host all Google Fonts | Performance, Compliance | 3 hours | Privacy, performance |

---

## Quick Wins (Can Start Anytime)

These items have no dependencies and provide immediate value:

| Task | Source | Effort | Impact |
|------|--------|--------|--------|
| Add preconnect hints for Google Fonts | Performance | 5 min | Medium |
| Fix 2 failing tests | QA | 15 min | Low |
| Add skip-to-content link | UX | 15 min | Medium |
| Remove/replace Lorem ipsum blog content | Copy, SEO | 15 min | High |
| Add alt text to hero images | SEO, UX | 30 min | High |
| Add cache headers in netlify.toml | DevOps | 5 min | Medium |
| Change ProtoF to client:visible | Performance | 2 min | Medium |
| Fix muted text color contrast | UX | 10 min | Medium |
| Standardize title separator | SEO | 10 min | Low |
| Delete AGENTS.md (duplicate) | Documentation | 2 min | Low |
| Remove unused Netlify functions config | DevOps, Cost | 5 min | Low |
| Add JSDoc to fetchYouTubeRSS | Documentation | 15 min | Low |

---

## Risk Timeline

| Week | Risk Level | Key Milestones |
|------|------------|----------------|
| 0 | CRITICAL | Security headers missing, XSS potential, offline broken |
| 1 | HIGH | Foundations in place, CI/CD operational, errors tracked |
| 2 | MEDIUM | Security hardened, accessibility improved |
| 3 | LOW | Performance optimized, quality monitored |
| 4+ | ACCEPTABLE | SEO enhanced, continuous improvement |

---

## Success Metrics

Track these as you progress through phases:

### Phase 0 Completion
- [ ] Security headers present in HTTP responses
- [ ] Search XSS vulnerability mitigated
- [ ] Single content.config.ts in use
- [ ] All guide chapters accessible offline

### Phase 1 Completion
- [ ] CI/CD pipeline runs on all pushes
- [ ] Zero failing tests
- [ ] Error tracking operational
- [ ] LCP < 2.5s on 3G connection

### Phase 2 Completion
- [ ] Gallery lightbox keyboard navigable
- [ ] Tools navigation has ARIA tabs pattern
- [ ] All interactive elements have visible focus states
- [ ] Color contrast meets WCAG AA

### Phase 3 Completion
- [ ] YouTube parser has 80%+ test coverage
- [ ] Analytics capturing page views
- [ ] Core Web Vitals monitored in production
- [ ] localStorage data validated

### Phase 4 Completion
- [ ] Structured data validates in Rich Results Test
- [ ] No placeholder content on site
- [ ] All images have descriptive alt text
- [ ] Branded social sharing image in use

### Phase 5+ (Ongoing)
- [ ] Test coverage above 60%
- [ ] Documentation complete for critical paths
- [ ] Privacy policy published
- [ ] Consent mechanism operational

---

## Estimated Total Effort by Phase

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 0: Critical Security | 1-3 days | 8 hours | P0 |
| Phase 1: Foundation | 1 week | 12 hours | P0 |
| Phase 2: Security & Accessibility | 1 week | 12 hours | P1 |
| Phase 3: Performance & Quality | 1 week | 18 hours | P1 |
| Phase 4: SEO & Content | 1 week | 12 hours | P2 |
| Phase 5: Polish & Documentation | Ongoing | 40+ hours | P2-P3 |
| **Total** | **5+ weeks** | **100+ hours** | |

---

*Roadmap generated by CTO Integrator synthesizing 18 consultant assessments*
*Last updated: 2026-01-07*
