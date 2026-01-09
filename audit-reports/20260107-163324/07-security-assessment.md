# Security Assessment Report

**Project:** Hogg Country - Appalachian Trail Field Guide
**Date:** 2026-01-07
**Consultant:** Claude Security Engineer (Opus 4.5)
**Assessment Type:** Comprehensive Security Audit

---

## Executive Summary

Hogg Country is a static site generator (SSG) application built with Astro 5, Svelte 5, and Tailwind CSS. The site serves as a digital hiking logbook with a field guide, trail tools, and YouTube video integration. As a purely static site with no server-side processing, database, or user authentication, the overall attack surface is significantly reduced compared to traditional web applications.

**Overall Security Posture: LOW RISK**

The primary security concerns identified are:
1. **Missing Security Headers** - No CSP, X-Frame-Options, or other hardening headers configured
2. **Potential XSS via `{@html}` Directive** - Client-side rendering of user-influenced content without sanitization
3. **Sensitive Data in localStorage** - Emergency contact and medical information stored without encryption
4. **Exposed Admin Placeholder** - Reveals future authentication plans and technology choices
5. **Dependency Considerations** - Standard NPM dependency chain requires ongoing monitoring

Since this is a static site with author-controlled content and no user-submitted data or authentication, the exploitability of these issues is limited. However, implementing security best practices will strengthen the overall posture.

---

## Risk Rating Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Overall Risk** | LOW | Static site, no server-side code |
| **Critical Findings** | 0 | No critical vulnerabilities identified |
| **High Priority** | 0 | No high-priority issues |
| **Medium Priority** | 4 | Security headers, XSS potential, localStorage |
| **Low Priority** | 3 | Information disclosure, best practices |

---

## Attack Surface Analysis

### Entry Points Identified

| Entry Point | Type | Risk Level | Notes |
|-------------|------|------------|-------|
| Static HTML Pages | Read-only | Very Low | Pre-generated at build time |
| YouTube RSS Feed | External Fetch | Low | Build-time only, not user-accessible |
| Service Worker | Client-side | Low | Caches static assets only |
| localStorage | Client-side | Medium | Stores user preferences and sensitive data |
| Search Component | Client-side | Medium | Uses `{@html}` for highlighting |
| Admin Page | Placeholder | Low | No functionality, reveals plans |

### Data Flow Analysis

```
Build Time:
  Markdown Content --> Astro SSG --> Static HTML
  YouTube RSS --> fetch() --> Static Data

Runtime (Client):
  User Input (calculators) --> localStorage --> No server transmission
  Search Query --> highlight function --> {@html} render
  Trail Data (static) --> localStorage persistence
```

### Assets Classification

| Asset Type | Sensitivity | Storage | Protection |
|------------|-------------|---------|------------|
| Field Guide Content | Public | Static files | None needed |
| Trail Tools Data | User-specific | localStorage | None (unencrypted) |
| Emergency Contacts | Sensitive | localStorage | **None (concern)** |
| Medical Information | Sensitive | localStorage | **None (concern)** |
| Budget/Expense Data | Personal | localStorage | None |

---

## OWASP Top 10 2021 Assessment

### A01:2021 - Broken Access Control

**Rating: N/A**

| Finding | Status | Notes |
|---------|--------|-------|
| Authentication | Not Implemented | No protected resources |
| Authorization | Not Applicable | Static content only |
| Admin Access | Placeholder | Page exists but has no functionality |

**Analysis:** The admin page at `/admin/` is publicly accessible but contains no functionality. It serves only as a placeholder indicating future plans to implement Auth0 authentication.

**Evidence:**
```
File: src/pages/admin/index.astro
- Contains instructions for future Netlify Auth0 integration
- No actual admin functionality implemented
- Service worker explicitly skips /admin routes
```

---

### A02:2021 - Cryptographic Failures

**Rating: LOW**

| Finding | Status | Notes |
|---------|--------|-------|
| HTTPS | Enforced | Netlify default |
| Data at Rest | Unencrypted | localStorage data |
| Secrets in Code | None Found | No API keys or credentials |

**Analysis:** The application does not perform cryptographic operations. Sensitive data stored in localStorage (emergency contacts, medical information) is not encrypted, but this is a client-side limitation rather than a cryptographic failure.

---

### A03:2021 - Injection

**Rating: MEDIUM**

| Injection Type | Risk | Evidence |
|----------------|------|----------|
| SQL Injection | N/A | No database |
| Command Injection | N/A | No server-side execution |
| XSS (Stored) | N/A | No user-submitted content persistence |
| XSS (Reflected) | LOW | Search uses `{@html}` |
| XSS (DOM) | MEDIUM | Svelte `{@html}` directive used |

**Detailed Analysis:**

#### VULN-001: Potential DOM XSS in Search Highlight Function

**Severity: Medium**
**CVSS Estimate: 4.3**
**Location:** `src/components/GuideInlineSearch.svelte`

**Description:** The search component uses Svelte's `{@html}` directive to render highlighted search results. The highlight function constructs HTML using user-provided search terms.

**Vulnerable Code Pattern:**
```javascript
// Line 205-208
function highlightMatch(text, terms) {
  if (!terms.length) return text;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Line 246, 252, 255
<span class="result-title">{@html highlightMatch(result.title, result.matchedTerms)}</span>
<div class="result-desc">{@html highlightMatch(result.description, result.matchedTerms)}</div>
<div class="result-snippet">{@html highlightMatch(result.snippet, result.matchedTerms)}</div>
```

**Attack Vector:** A malicious search query containing HTML/JavaScript could potentially be rendered if regex escaping fails. However, the `matchedTerms` are derived from splitting and filtering user input, which provides some implicit sanitization.

**Mitigation Status:** Partial - The terms are processed before being used in the regex, but explicit HTML entity encoding is not performed.

**Recommendation:**
1. Sanitize terms before regex construction
2. Use a proper HTML sanitization library (e.g., DOMPurify)
3. Consider using CSS-based highlighting instead of HTML insertion

---

#### VULN-002: Prototype Component XSS

**Severity: Low**
**Location:** `src/components/prototypes/ProtoB_Dashboard.svelte`

**Description:** The prototype dashboard component uses `{@html}` to render SVG icons from static data.

**Code Pattern:**
```javascript
// Lines 170, 321
{@html item.icon}
{@html card.icon}
```

**Mitigation:** Icons are defined in static component data, not from user input. Risk is theoretical only.

---

### A04:2021 - Insecure Design

**Rating: LOW**

The application follows secure design principles for a static site:
- Content is pre-rendered at build time
- No user authentication means no credential management concerns
- Client-side tools are isolated (no server communication)
- YouTube embeds use privacy-friendly `youtube-nocookie.com`

**Positive Design Choices:**
1. Static site generation eliminates server-side attack surface
2. No database means no data breach risk
3. Privacy-respecting YouTube integration
4. Service worker properly handles offline scenarios

---

### A05:2021 - Security Misconfiguration

**Rating: MEDIUM**

#### VULN-003: Missing Security Headers

**Severity: Medium**
**CVSS Estimate: 5.0**

**Description:** The application does not configure security headers. The `netlify.toml` file lacks header configuration.

**Missing Headers:**
| Header | Status | Impact |
|--------|--------|--------|
| Content-Security-Policy | Missing | XSS protection reduced |
| X-Frame-Options | Missing | Clickjacking possible |
| X-Content-Type-Options | Missing | MIME sniffing possible |
| Referrer-Policy | Missing | Referrer leakage |
| Permissions-Policy | Missing | Feature control absent |
| Strict-Transport-Security | Missing | HTTPS not enforced by header |

**Current netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[build.environment]
  NODE_VERSION = "20"
```

**Recommended Addition:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://i.ytimg.com data:; frame-src https://www.youtube-nocookie.com; font-src 'self'"
```

---

### A06:2021 - Vulnerable and Outdated Components

**Rating: LOW**

**Dependency Analysis:**

| Package | Version | Notes |
|---------|---------|-------|
| astro | ^5.12.8 | Current major version |
| svelte | ^5.37.3 | Current major version |
| tailwindcss | ^4.1.11 | Current major version |
| fast-xml-parser | ^5.2.5 | Used for YouTube RSS parsing |
| jsdom | ^26.1.0 | Build-time only |
| puppeteer | ^24.34.0 | Dev dependency, PDF generation |

**Recommendation:** Run `npm audit` regularly and update dependencies. Consider implementing automated dependency scanning in CI/CD.

---

### A07:2021 - Identification and Authentication Failures

**Rating: N/A**

No authentication is implemented. The admin placeholder page indicates future plans for Netlify Auth0 integration but no credentials are handled.

---

### A08:2021 - Software and Data Integrity Failures

**Rating: LOW**

| Check | Status |
|-------|--------|
| NPM lockfile | Present (package-lock.json) |
| Integrity checks | Standard npm install |
| CI/CD security | Not assessed (no CI config found) |
| Code signing | Not applicable |

---

### A09:2021 - Security Logging and Monitoring Failures

**Rating: N/A (Static Site)**

As a static site, server-side logging is not applicable. Client-side error handling uses `console.warn` for debugging.

---

### A10:2021 - Server-Side Request Forgery (SSRF)

**Rating: LOW**

The only server-side fetch occurs at build time:

**Location:** `src/lib/youtube.ts`

```typescript
const res = await fetch(feedUrl, {
  signal: controller.signal,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; HoggCountry/1.0)'
  }
});
```

**Mitigations Present:**
- `feedUrl` is a fixed YouTube RSS URL, not user-controlled
- 5-second timeout with AbortController
- Only runs at build time
- No runtime server-side requests

---

## Additional Findings

### VULN-004: Sensitive Data in localStorage

**Severity: Medium**
**Location:** Multiple Svelte components

**Description:** The application stores sensitive user information in localStorage without encryption:

| Data Type | localStorage Key | Sensitivity |
|-----------|-----------------|-------------|
| Emergency Contacts | `at-emergency-info` | High |
| Medical Information | `at-emergency-info` | High |
| Budget Data | `at-budget-data` | Medium |
| Trail Progress | `trailContext` | Low |

**Evidence from EmergencyCard.svelte:**
```javascript
// Line 123-134
const saved = localStorage.getItem('at-emergency-info');
...
localStorage.setItem('at-emergency-info', JSON.stringify({ contacts, personal }));
```

**Risk:** If any XSS vulnerability is exploited, all localStorage data can be exfiltrated. Emergency contact information and medical details are particularly sensitive.

**Recommendations:**
1. Add clear user notification about local-only storage
2. Consider Web Crypto API for client-side encryption of sensitive fields
3. Implement data expiration/cleanup functionality
4. Add "Clear My Data" button prominently

---

### VULN-005: Information Disclosure - Admin Page

**Severity: Low**
**Location:** `src/pages/admin/index.astro`

**Description:** The admin placeholder page reveals:
- Future authentication approach (Netlify Auth0)
- Planned protected paths (`/admin/*`, `/.netlify/functions/*`)
- Implementation details

**Recommendation:** Either remove the page until authentication is implemented, or return a 404 response for the route.

---

### VULN-006: Service Worker Cache Poisoning (Theoretical)

**Severity: Low**
**Location:** `public/sw.js`

**Description:** The service worker caches responses based on request URL. While it properly checks `response.ok` before caching, a compromised CDN or MITM attack during first load could poison the cache.

**Mitigations Present:**
- HTTPS enforcement by Netlify
- Cross-origin requests are skipped
- Admin routes excluded from caching

**Recommendation:** Consider implementing subresource integrity (SRI) for critical assets.

---

## Threat Model (STRIDE Analysis)

### Spoofing

| Threat | Risk | Mitigation |
|--------|------|------------|
| Identity spoofing | N/A | No authentication |
| Content spoofing | Low | Static content, HTTPS |

### Tampering

| Threat | Risk | Mitigation |
|--------|------|------------|
| localStorage tampering | Low | No security impact |
| Service worker tampering | Low | HTTPS, same-origin |
| Content tampering | Very Low | Static hosting with HTTPS |

### Repudiation

| Threat | Risk | Mitigation |
|--------|------|------------|
| User actions | N/A | No server-side logging needed |
| Content changes | Low | Git version control |

### Information Disclosure

| Threat | Risk | Mitigation |
|--------|------|------------|
| localStorage theft | Medium | None currently |
| Admin page info | Low | Reveals implementation plans |
| Source code | N/A | Open/personal project |

### Denial of Service

| Threat | Risk | Mitigation |
|--------|------|------------|
| CDN-level DDoS | Low | Netlify infrastructure |
| Cache exhaustion | Very Low | Service worker limits |

### Elevation of Privilege

| Threat | Risk | Mitigation |
|--------|------|------------|
| Admin access | N/A | No admin functionality |
| Build system | Low | Local/Netlify controlled |

---

## Secrets Management Assessment

### Current State

| Item | Status | Notes |
|------|--------|-------|
| .env files | Not in repo | Properly gitignored |
| API keys in code | None found | Clean |
| Hardcoded credentials | None found | Clean |
| YouTube Channel ID | Public data | Not sensitive |

**Positive Findings:**
- `.gitignore` properly excludes `.env` and `.env.production`
- No sensitive data found in source control
- Static site requires no runtime secrets

---

## Input Validation Assessment

### User Input Points

| Component | Input Type | Validation | Sanitization |
|-----------|------------|------------|--------------|
| GuideInlineSearch | Search query | Length check (>2 chars) | Partial (split/filter) |
| BudgetCalculator | Expense amount | Number type | parseFloat |
| EmergencyCard | Contact info | None | None |
| MilestoneCalculator | Mile numbers | Number type | Math operations |
| DatePicker inputs | ISO dates | HTML5 date input | Browser validation |

**Observations:**
- Most calculators use HTML5 input types for basic validation
- No explicit server-side validation (not needed for static site)
- localStorage data is parsed with try/catch for corruption handling

---

## Compliance Considerations

### GDPR (General Data Protection Regulation)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data Minimization | PARTIAL | Stores emergency/medical data locally |
| Storage Limitation | PARTIAL | No automatic expiration of localStorage |
| Right to Erasure | PARTIAL | Users can manually clear localStorage |
| Consent | NOT APPLICABLE | No data transmitted to servers |
| Privacy Notice | NOT FOUND | Should document localStorage usage |

**Recommendation:** Add a privacy notice explaining that personal data (emergency contacts, medical info) is stored locally in the browser only and never transmitted.

---

## Remediation Roadmap

### Priority 1: Quick Wins (1-2 hours)

| Item | Effort | Impact |
|------|--------|--------|
| Add security headers to netlify.toml | 15 min | Medium |
| Remove or protect admin page | 15 min | Low |
| Add privacy notice for localStorage | 30 min | Low |

### Priority 2: Short-term (1-2 days)

| Item | Effort | Impact |
|------|--------|--------|
| Sanitize search highlight function | 2 hours | Medium |
| Add "Clear My Data" functionality | 2 hours | Low |
| Implement localStorage data expiration | 3 hours | Low |
| Add npm audit to build process | 1 hour | Low |

### Priority 3: Medium-term (Optional)

| Item | Effort | Impact |
|------|--------|--------|
| Implement SRI for critical assets | 4 hours | Low |
| Client-side encryption for sensitive localStorage | 8 hours | Medium |
| Dependency vulnerability monitoring | 2 hours | Low |

---

## Appendix A: Files Reviewed

| File | Security Relevance |
|------|-------------------|
| `package.json` | Dependencies, build scripts |
| `netlify.toml` | Hosting configuration, headers |
| `src/lib/youtube.ts` | External data fetching |
| `public/sw.js` | Service worker, caching logic |
| `src/components/GuideInlineSearch.svelte` | `{@html}` XSS potential |
| `src/components/EmergencyCard.svelte` | Sensitive localStorage data |
| `src/components/BudgetCalculator.svelte` | localStorage usage |
| `src/components/YouTubeEmbed.astro` | iframe handling |
| `src/pages/admin/index.astro` | Admin placeholder |
| `.gitignore` | Secrets exclusion |

---

## Appendix B: Security Header Template

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/*.html"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https://i.ytimg.com data:; frame-src https://www.youtube-nocookie.com; font-src 'self'; connect-src 'self'"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

---

## Appendix C: Search Sanitization Example

```javascript
// Secure highlight function
function highlightMatch(text, terms) {
  if (!terms.length) return escapeHtml(text);

  // Escape HTML entities first
  const escaped = escapeHtml(text);

  // Escape regex special characters in terms
  const safeTerms = terms.map(t =>
    t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  const regex = new RegExp(`(${safeTerms.join('|')})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

---

## Conclusion

Hogg Country demonstrates a secure-by-design approach through its use of static site generation, which eliminates most traditional web application vulnerabilities. The identified issues are primarily best-practice improvements rather than exploitable vulnerabilities.

**Key Strengths:**
- No server-side attack surface
- No database or user credentials to protect
- Privacy-friendly external integrations
- Proper gitignore for sensitive files

**Areas for Improvement:**
- Security headers should be added to Netlify configuration
- Search highlight function should sanitize input before HTML rendering
- Sensitive localStorage data warrants user notification about local-only storage
- Admin placeholder should be removed or protected

The overall security posture is appropriate for a personal/portfolio static website. The recommendations provided will further harden the application without requiring significant architectural changes.

---

*Report generated: 2026-01-07*
*Next review recommended: 2026-07-07 or upon major dependency updates*
