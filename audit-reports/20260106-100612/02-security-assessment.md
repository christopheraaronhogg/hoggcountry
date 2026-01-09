# Security Assessment Report: Hogg Country

**Assessment Date:** January 6, 2026
**Assessor:** Claude Opus 4.5 (Security Consultant Mode)
**Codebase:** Hogg Country - Astro 5 SSG with Svelte 5 Islands
**Repository Path:** `C:\Users\ChrisHogg\.claude-worktrees\hoggcountry\dazzling-perlman`

---

## Executive Summary

| Metric | Rating |
|--------|--------|
| **Overall Risk Rating** | **MEDIUM** |
| **Critical Findings** | 2 |
| **High Findings** | 3 |
| **Medium Findings** | 6 |
| **Low Findings** | 5 |

**Summary:** Hogg Country is a static site generator (SSG) application with minimal server-side attack surface. The primary security concerns relate to **known dependency vulnerabilities** (including a HIGH severity XSS in Astro), **potential client-side XSS vectors** via `@html` usage, and **absence of security headers**. As a static site deployed on Netlify with no authentication or user-submitted content, the overall risk is mitigated but not eliminated.

**Immediate Actions Required:**
1. Update `astro` package to version 5.16.0+ to resolve 9 known CVEs
2. Update `devalue` package to version 5.3.2+ to fix prototype pollution
3. Add Content-Security-Policy and other security headers
4. Audit and sanitize `@html` usage in search highlighting

---

## Table of Contents

1. [Attack Surface Analysis](#1-attack-surface-analysis)
2. [Threat Model (STRIDE)](#2-threat-model-stride)
3. [Vulnerability Findings](#3-vulnerability-findings)
4. [OWASP Top 10 Assessment](#4-owasp-top-10-assessment)
5. [Dependency Security Audit](#5-dependency-security-audit)
6. [Compliance Posture](#6-compliance-posture)
7. [Remediation Roadmap](#7-remediation-roadmap)

---

## 1. Attack Surface Analysis

### 1.1 Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   Static Files   |     |   Netlify CDN    |     |     Browser      |
|   (dist/)        |---->|   (Edge Cache)   |---->|   (Client)       |
+------------------+     +------------------+     +------------------+
         ^                                                |
         |                                                v
+------------------+                           +------------------+
| Build Process    |                           | YouTube RSS      |
| (npm run build)  |                           | (External API)   |
+------------------+                           +------------------+
```

### 1.2 Attack Surface Components

| Component | Type | Exposure | Risk Level |
|-----------|------|----------|------------|
| Static HTML/JS/CSS | Public | High | Low |
| YouTube RSS Integration | Build-time External | Medium | Low |
| Service Worker (sw.js) | Client-side | High | Low |
| localStorage Data | Client-side | Local | Medium |
| Admin Page (/admin/) | Placeholder | Medium | Low |
| Svelte Interactive Components | Client-side | High | Medium |
| Content Collections (Markdown) | Build-time | Low | Low |
| Build Scripts (Node.js) | Developer Machine | Low | Medium |

### 1.3 Data Flow Analysis

**Build-Time Data Flows:**
1. `MASTER_NOBO_FIELD_GUIDE.md` -> `parse-master-guide.js` -> Content files
2. YouTube RSS XML -> `fetchYouTubeRSS()` -> Static JSON embedding
3. Content Collections -> Zod Validation -> Static HTML

**Runtime Data Flows:**
1. User Input (calculators) -> localStorage -> No server transmission
2. Search Query -> Local JSON index -> `@html` rendering (XSS risk)
3. Service Worker -> Cache API -> Offline content delivery

### 1.4 Trust Boundaries

| Boundary | Description | Risk |
|----------|-------------|------|
| YouTube RSS | External XML parsed by `fast-xml-parser` | XML injection (mitigated by build-time processing) |
| User Input | Calculator/tool inputs stored client-side | XSS data exfiltration possible |
| Content Markdown | Author-controlled, not user-submitted | Low - trusted source |
| CDN Edge | Netlify CDN serving static files | Cache poisoning (Netlify-managed) |

---

## 2. Threat Model (STRIDE)

### 2.1 Component-Level STRIDE Matrix

| Component | S | T | R | I | D | E | Notes |
|-----------|---|---|---|---|---|---|-------|
| **Static HTML** | - | - | - | L | - | - | Cached content visible |
| **Svelte Islands** | M | L | - | L | L | - | XSS via @html |
| **Service Worker** | L | L | - | L | M | M | Cache manipulation |
| **localStorage** | L | M | - | M | M | - | No encryption |
| **YouTube RSS** | - | L | - | - | - | - | Build-time only |
| **Admin Page** | L | - | - | L | - | - | Placeholder, no auth |
| **Build Scripts** | L | M | - | - | L | - | Developer machine |

**Legend:** S=Spoofing, T=Tampering, R=Repudiation, I=Information Disclosure, D=Denial of Service, E=Elevation of Privilege
**Risk:** H=High, M=Medium, L=Low, -=Not Applicable

### 2.2 Detailed Threat Analysis

#### SPOOFING
| Threat | Component | Likelihood | Impact | Mitigation |
|--------|-----------|------------|--------|------------|
| Cache poisoning via CDN | Netlify CDN | Low | Medium | Use SRI hashes, Netlify controls |
| Malicious service worker injection | sw.js | Very Low | High | Same-origin policy protects |

#### TAMPERING
| Threat | Component | Likelihood | Impact | Mitigation |
|--------|-----------|------------|--------|------------|
| localStorage data manipulation | Client storage | Medium | Low | No sensitive data |
| XSS payload injection via search | GuideInlineSearch | Medium | Medium | Sanitize @html input |

#### INFORMATION DISCLOSURE
| Threat | Component | Likelihood | Impact | Mitigation |
|--------|-----------|------------|--------|------------|
| localStorage data theft via XSS | Client storage | Medium | Low | Contains only preferences |
| Source code exposure | Static files | High | Low | Expected for SSG |

#### DENIAL OF SERVICE
| Threat | Component | Likelihood | Impact | Mitigation |
|--------|-----------|------------|--------|------------|
| Service worker cache exhaustion | sw.js | Low | Low | Browser limits apply |
| Large search index blocking UI | GuideInlineSearch | Low | Low | Debounced, limited results |

#### ELEVATION OF PRIVILEGE
| Threat | Component | Likelihood | Impact | Mitigation |
|--------|-----------|------------|--------|------------|
| Admin page access | /admin/ | High | None | Placeholder only, no functionality |

---

## 3. Vulnerability Findings

### 3.1 Critical Findings

#### VULN-001: Known Astro XSS Vulnerability (CVE Pending)
**CVSS Score:** 7.1 (HIGH)
**Location:** `node_modules/astro` (version 5.12.8)
**Description:** The installed version of Astro is vulnerable to reflected XSS via the server islands feature (GHSA-wrwg-2hg8-v723). While this SSG deployment may not use server islands actively, the vulnerable code is present.

**Evidence:**
```json
// package.json
"astro": "^5.12.8"

// npm audit output
"title": "Astro vulnerable to reflected XSS via the server islands feature"
"severity": "high"
"range": "<=5.15.6"
```

**Risk:** An attacker could potentially inject malicious scripts if server islands are enabled or through other related attack vectors.

**Remediation:** Update to `astro@5.16.0` or later.

---

#### VULN-002: Prototype Pollution in devalue Dependency
**CVSS Score:** 7.5 (HIGH)
**Location:** `node_modules/devalue` (transitive dependency)
**Description:** The `devalue` package has a prototype pollution vulnerability that could lead to arbitrary code execution during serialization/deserialization.

**Evidence:**
```json
// npm audit
"title": "devalue prototype pollution vulnerability"
"severity": "high"
"range": "<5.3.2"
```

**Risk:** Could affect build process or client-side component hydration.

**Remediation:** Update Astro (which includes updated devalue) to resolve.

---

### 3.2 High Findings

#### VULN-003: Potential DOM-Based XSS via @html Directive
**CVSS Score:** 6.1 (MEDIUM-HIGH)
**Location:** `src/components/GuideInlineSearch.svelte` (lines 246, 252, 255)
**Description:** The search highlighting function uses Svelte's `@html` directive to render search results with highlighted terms. User search queries are processed through a regex and inserted into HTML without proper sanitization.

**Evidence:**
```svelte
// src/components/GuideInlineSearch.svelte
function highlightMatch(text, terms) {
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Usage with @html (XSS vector)
<span class="result-title">{@html highlightMatch(result.title, result.matchedTerms)}</span>
```

**Attack Vector:** If the search index (`guide-search-index.json`) contains malicious content or if the regex can be bypassed, script injection is possible.

**Risk:** While the search index is build-time generated from trusted markdown, the pattern could be exploited if:
1. Markdown content is compromised
2. Future features allow user-generated content

**Remediation:**
1. Use text content with CSS-based highlighting instead of @html
2. If @html is required, sanitize with DOMPurify before rendering

---

#### VULN-004: Multiple Astro Security Vulnerabilities
**CVSS Score:** 6.5 (MEDIUM)
**Location:** `node_modules/astro`
**Description:** Nine additional security advisories affect the installed Astro version:

| Advisory | Title | Severity |
|----------|-------|----------|
| GHSA-5ff5-9fcw-vg88 | X-Forwarded-Host reflection without validation | Moderate |
| GHSA-hr2q-hp5q-x767 | URL manipulation via headers | Moderate |
| GHSA-x3h8-62x9-952g | Dev server arbitrary file read | Low |
| GHSA-xf8x-j4p2-f749 | Unauthorized third-party images in _image | Moderate |
| GHSA-fvmw-cj7j-j39q | Stored XSS in Cloudflare adapter _image | Moderate |
| GHSA-ggxq-hp9w-j794 | Middleware bypass via URL encoding | Moderate |
| GHSA-w2vj-39qv-7vh7 | Dev server error page reflected XSS | Low |
| GHSA-whqg-ppgf-wp8c | Auth bypass via double URL encoding | Moderate |

**Risk:** While many of these affect server-side features not used in pure SSG mode, they represent code-level vulnerabilities in the framework.

**Remediation:** Update to `astro@5.16.0` or later.

---

#### VULN-005: Unprotected Admin Route
**CVSS Score:** 3.7 (LOW-MEDIUM)
**Location:** `src/pages/admin/index.astro`
**Description:** The `/admin/` route is publicly accessible and renders a page indicating future authentication plans. While currently a placeholder, it represents an attack surface.

**Evidence:**
```astro
// src/pages/admin/index.astro
<p>This route will be protected using Netlify's Auth0 Authentication integration.</p>
```

**Risk:** Currently LOW as no functionality exists, but:
1. Reveals planned authentication approach
2. Service worker explicitly skips `/admin` routes (line 142 of sw.js)
3. May be targeted by attackers probing for admin interfaces

**Remediation:**
1. Remove if not needed for deployment
2. Implement authentication before adding any functionality
3. Consider returning 404 for non-authenticated requests

---

### 3.3 Medium Findings

#### VULN-006: Missing Security Headers
**CVSS Score:** 5.0 (MEDIUM)
**Location:** `src/components/BaseHead.astro`, `netlify.toml`
**Description:** No Content-Security-Policy, X-Frame-Options, or other security headers are configured.

**Missing Headers:**
- `Content-Security-Policy` - No CSP defined
- `X-Frame-Options` - Clickjacking protection absent
- `X-Content-Type-Options` - MIME sniffing allowed
- `Referrer-Policy` - Default browser behavior
- `Permissions-Policy` - No feature restrictions

**Risk:** Increased exposure to:
- Clickjacking attacks
- XSS exploitation (no CSP fallback)
- Data leakage via referrer

**Remediation:** Add to `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://i.ytimg.com data:; frame-src https://www.youtube-nocookie.com"
```

---

#### VULN-007: localStorage Used for Sensitive User Data
**CVSS Score:** 4.3 (MEDIUM)
**Location:** Multiple Svelte components
**Description:** User data including emergency contacts, budget information, and trail progress is stored in localStorage without encryption.

**Affected Storage Keys:**
| Key | Data Stored | Sensitivity |
|-----|-------------|-------------|
| `at-emergency-info` | Emergency contacts, personal info | High |
| `at-budget-data` | Financial expenses | Medium |
| `trailContext` | Trail progress, dates | Low |
| `at-daily-logs` | Daily activity logs | Low |
| `powerManager` | Device configuration | Low |

**Evidence:**
```javascript
// src/components/EmergencyCard.svelte
localStorage.setItem('at-emergency-info', JSON.stringify({ contacts, personal }));
```

**Risk:** If any XSS vulnerability is exploited, all localStorage data can be exfiltrated. Emergency contact information is particularly sensitive.

**Remediation:**
1. Consider using IndexedDB with encryption for sensitive data
2. Add warning to users about local storage limitations
3. Do not store PII unless absolutely necessary

---

#### VULN-008: Service Worker Message Handler Allows Cache Manipulation
**CVSS Score:** 3.7 (LOW-MEDIUM)
**Location:** `public/sw.js` (lines 269-286)
**Description:** The service worker accepts postMessage commands to clear cache or trigger cache updates without origin verification.

**Evidence:**
```javascript
// public/sw.js
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
  // ...
});
```

**Risk:** Any script running on the page can send messages to the service worker. While same-origin policy provides protection, XSS could abuse this.

**Remediation:** Add origin verification:
```javascript
if (event.origin !== self.location.origin) return;
```

---

#### VULN-009: YouTube Video ID Injection in URL Construction
**CVSS Score:** 3.1 (LOW)
**Location:** `src/components/YouTubeEmbed.astro` (lines 29, 70)
**Description:** Video IDs from props or data attributes are directly interpolated into iframe URLs without validation.

**Evidence:**
```javascript
// Client-side script
iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1...`;
```

**Risk:** If a malicious video ID containing special characters is passed, it could potentially manipulate the URL. However, the source is build-time content from trusted markdown.

**Remediation:** Add video ID validation regex:
```javascript
const VALID_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;
if (!VALID_VIDEO_ID.test(videoId)) return;
```

---

#### VULN-010: External Font Loading Without SRI
**CVSS Score:** 3.1 (LOW)
**Location:** `src/styles/global.css` (line 1)
**Description:** Google Fonts are loaded via external stylesheet without Subresource Integrity (SRI) verification.

**Evidence:**
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&...');
```

**Risk:** Supply chain attack via compromised font CDN could inject malicious CSS.

**Remediation:** Self-host fonts or implement SRI where possible.

---

#### VULN-011: XML Parser Configuration May Allow Entity Expansion
**CVSS Score:** 3.1 (LOW)
**Location:** `src/lib/youtube.ts` (lines 37-41)
**Description:** The `fast-xml-parser` is configured without explicit XXE protections.

**Evidence:**
```typescript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: false,
});
```

**Risk:** While `fast-xml-parser` has some built-in protections, explicit configuration for XXE prevention is recommended for defense-in-depth.

**Remediation:** Add explicit security options:
```typescript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: false,
  processEntities: false,  // Disable entity expansion
  htmlEntities: false,
});
```

---

### 3.4 Low Findings

#### VULN-012: Generator Meta Tag Exposes Framework Version
**Location:** Auto-generated by Astro
**Risk:** Information disclosure aids targeted attacks.
**Remediation:** Can be disabled in Astro config if desired.

#### VULN-013: Build Scripts Execute Without Input Validation
**Location:** `scripts/parse-master-guide.js`
**Risk:** Path traversal possible if `MASTER_FILE` path is user-controllable (currently hardcoded).
**Remediation:** Validate file paths before operations.

#### VULN-014: No Rate Limiting on RSS Fetches
**Location:** `src/lib/youtube.ts`
**Risk:** Build process could be used for amplification if compromised.
**Remediation:** Current 10-minute cache is adequate for SSG use case.

#### VULN-015: SVG Icons Rendered via @html from Static Data
**Location:** `src/components/prototypes/ProtoB_Dashboard.svelte`
**Risk:** Very low - data is hardcoded in component.
**Remediation:** Consider Svelte components for SVG icons.

#### VULN-016: Open Redirect Potential in MailDropPlanner
**Location:** `src/components/MailDropPlanner.svelte` (line 235)
**Risk:** USPS tracking URL opened in new tab with user-provided tracking number.
**Remediation:** Validate tracking number format before URL construction.

---

## 4. OWASP Top 10 Assessment

| Category | Rating | Evidence | Notes |
|----------|--------|----------|-------|
| **A01:2021 - Broken Access Control** | LOW | Admin page is placeholder only | No authenticated resources |
| **A02:2021 - Cryptographic Failures** | N/A | No cryptographic operations | localStorage unencrypted but no PII |
| **A03:2021 - Injection** | MEDIUM | @html usage in search, XML parsing | XSS vectors present |
| **A04:2021 - Insecure Design** | LOW | SSG architecture inherently limited | Good separation of concerns |
| **A05:2021 - Security Misconfiguration** | MEDIUM | Missing security headers | CSP, X-Frame-Options absent |
| **A06:2021 - Vulnerable Components** | HIGH | 9 Astro CVEs, 1 devalue CVE | Immediate update required |
| **A07:2021 - Auth Failures** | N/A | No authentication implemented | Planned for /admin |
| **A08:2021 - Software/Data Integrity** | MEDIUM | No SRI for external resources | Font CDN dependency |
| **A09:2021 - Security Logging** | LOW | Console logging only | Acceptable for static site |
| **A10:2021 - SSRF** | LOW | Build-time fetch to YouTube only | Controlled external access |

---

## 5. Dependency Security Audit

### 5.1 Direct Dependencies

| Package | Version | Vulnerabilities | Action |
|---------|---------|-----------------|--------|
| astro | ^5.12.8 | 9 (1 HIGH, 7 MOD, 1 LOW) | **UPDATE to 5.16.0+** |
| fast-xml-parser | ^5.2.5 | 0 | Monitor |
| svelte | ^5.37.3 | 0 | OK |
| tailwindcss | ^4.1.11 | 0 | OK |
| typescript | ^5.9.3 | 0 | OK |
| sharp | ^0.34.2 | 0 | OK |
| jsdom | ^26.1.0 | 0 | OK |
| puppeteer (dev) | ^24.34.0 | 0 | OK (dev only) |

### 5.2 Transitive Dependencies with Issues

| Package | Vulnerability | Severity | Fixed In |
|---------|---------------|----------|----------|
| devalue | Prototype Pollution | HIGH | 5.3.2 |
| js-yaml | ReDoS | MODERATE | Check latest |

### 5.3 Supply Chain Considerations

- **Package Lock:** `package-lock.json` present (336KB) - ensures reproducible builds
- **npm Registry:** All packages from official npm registry
- **No Private Packages:** All dependencies are public OSS
- **Build Scripts:** Use Node.js builtins (fs, path) - minimal external risk

---

## 6. Compliance Posture

### 6.1 GDPR Considerations

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data Minimization | PASS | Only necessary data collected |
| Purpose Limitation | PASS | Data used only for stated purposes |
| Storage Limitation | PARTIAL | localStorage has no expiration |
| Right to Erasure | PARTIAL | Users can clear localStorage manually |
| Privacy Notice | NOT ASSESSED | No privacy policy link found |

### 6.2 Accessibility (WCAG)

Not in scope for security assessment, but noted:
- Semantic HTML used
- ARIA labels present on interactive elements
- Focus management in search component

### 6.3 PCI-DSS

**Not Applicable** - No payment processing.

### 6.4 SOC 2 Type II

| Control | Relevance | Status |
|---------|-----------|--------|
| Access Control | Low | No user accounts |
| Change Management | High | Git-based, could use branch protection |
| Vulnerability Management | High | **FAIL** - Outdated dependencies |
| Incident Response | Low | Static site limits incidents |

---

## 7. Remediation Roadmap

### 7.1 Immediate (0-7 days)

| Priority | Task | Effort | Risk Reduced |
|----------|------|--------|--------------|
| P0 | Update Astro to 5.16.0+ | Low | HIGH |
| P0 | Verify devalue update via Astro | Low | HIGH |
| P1 | Add security headers to netlify.toml | Low | MEDIUM |
| P1 | Review @html usage in GuideInlineSearch | Medium | MEDIUM |

### 7.2 Short-Term (1-4 weeks)

| Priority | Task | Effort | Risk Reduced |
|----------|------|--------|--------------|
| P2 | Implement CSP with nonces for inline scripts | Medium | MEDIUM |
| P2 | Add video ID validation regex | Low | LOW |
| P2 | Configure fast-xml-parser XXE protections | Low | LOW |
| P3 | Remove or protect /admin route | Low | LOW |

### 7.3 Medium-Term (1-3 months)

| Priority | Task | Effort | Risk Reduced |
|----------|------|--------|--------------|
| P3 | Self-host Google Fonts | Medium | LOW |
| P3 | Add localStorage data expiration | Medium | LOW |
| P3 | Implement automated dependency scanning (Dependabot) | Low | MEDIUM |
| P4 | Consider encrypted storage for emergency contacts | High | LOW |

### 7.4 Commands for Immediate Remediation

```bash
# Update Astro and check for breaking changes
npm update astro

# Or install specific version
npm install astro@5.16.0

# Verify fixes
npm audit

# Run build to verify no breaking changes
npm run build
```

---

## Appendix A: Files Reviewed

| File | Security Relevance |
|------|-------------------|
| `package.json` | Dependency versions |
| `package-lock.json` | Transitive dependencies |
| `astro.config.mjs` | Framework configuration |
| `netlify.toml` | Deployment configuration |
| `public/sw.js` | Service worker |
| `src/lib/youtube.ts` | External data fetching |
| `src/components/BaseHead.astro` | Security headers |
| `src/components/GuideInlineSearch.svelte` | XSS vectors |
| `src/components/YouTubeEmbed.astro` | URL construction |
| `src/components/*.svelte` | localStorage usage |
| `src/pages/admin/index.astro` | Admin access |
| `scripts/*.js` | Build process |

---

## Appendix B: Methodology

This assessment followed:
- OWASP Testing Guide v4.2
- OWASP Top 10 2021
- STRIDE Threat Modeling
- CVSS v3.1 Scoring

**Tools Used:**
- npm audit (dependency scanning)
- Manual code review
- Static analysis patterns (grep/search)

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| SSG | Static Site Generator |
| XSS | Cross-Site Scripting |
| CSP | Content Security Policy |
| XXE | XML External Entity |
| SRI | Subresource Integrity |
| CVE | Common Vulnerabilities and Exposures |
| STRIDE | Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation |

---

**Report Generated:** 2026-01-06
**Classification:** Internal Use
**Next Review:** Recommended after dependency updates
