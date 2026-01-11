---
description: 🔬 ULTRATHINK Stack Audit - Live research-driven best practices audit for your entire technology stack or specific packages
---

# ULTRATHINK: Technology Stack Audit

ultrathink - Invoke the **stack-consultant** subagent for comprehensive, research-driven technology stack evaluation.

## What Makes This Different

**LIVE RESEARCH REQUIRED.** This audit uses WebSearch to fetch CURRENT best practices, not cached knowledge. Technology evolves daily - this audit ensures you're following today's recommendations, not last year's.

## CRITICAL: Get Current Date First

Before ANY research, get today's date:
```bash
date +%Y-%m-%d
# or on Windows: powershell -c "Get-Date -Format 'yyyy-MM-dd'"
```

Use this date in ALL search queries. Never hardcode a year.

## Usage

**Full Stack Audit (no arguments):**
```
/audit-stack
```
Auto-detects and audits entire stack top-down based on what's installed.

**Single Package Deep Dive (with argument):**
```
/audit-stack [package-name]
```
Examples: `/audit-stack react`, `/audit-stack laravel`, `/audit-stack inertia`

## Target
$ARGUMENTS

## Output Location

**Full Stack Audit:** `./audit-reports/stack-audit-{timestamp}/`
**Single Package:** `./audit-reports/stack-{package}/`

## How It Works

### Step 1: Get Current Date
```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_YEAR=$(date +%Y)
```

### Step 2: Detect Stack (Framework-Agnostic)

Read config files to discover what's actually installed:

```
composer.json → Backend framework & PHP packages
  - Laravel? Symfony? Slim? Pure PHP?
  - What first-party/third-party packages?

package.json → Frontend framework & Node packages
  - React? Vue? Svelte? Angular?
  - What UI libraries, state management?

Config files → Additional technologies
  - tsconfig.json → TypeScript
  - tailwind.config.* → Tailwind CSS
  - vite.config.* / webpack.config.* → Build tool
  - next.config.* → Next.js
  - nuxt.config.* → Nuxt
```

### Step 3: Build Dynamic Hierarchy

Based on detection, build the dependency tree. Example for a Laravel/React stack:

```
Detected Stack:
├── Backend: Laravel 11.x
│   ├── laravel/sanctum
│   ├── laravel/horizon
│   └── laravel/scout
├── Frontend: React 19.x
│   ├── @inertiajs/react
│   └── @radix-ui/*
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── Build: Vite 6.x
```

Or for a different stack:
```
Detected Stack:
├── Backend: Symfony 7.x
├── Frontend: Vue 3.x
│   └── Pinia (state)
├── Styling: UnoCSS
└── Build: Vite 6.x
```

### Step 4: Live Research (CRITICAL)

For EACH detected package, execute searches WITH CURRENT YEAR:

```
WebSearch: "{package} {version} best practices {CURRENT_YEAR}"
WebSearch: "{package} {version} migration guide {CURRENT_YEAR}"
WebSearch: "{package} deprecated patterns {CURRENT_YEAR}"
WebSearch: "{package} security advisories {CURRENT_YEAR}"
```

**Research Focus Areas:**
- Official documentation (ALWAYS primary source)
- New recommended patterns
- Deprecated APIs/patterns
- Security advisories
- Performance best practices
- Breaking changes in recent versions

### Step 5: Audit Against Research

For each package, compare codebase against researched best practices:

| Check | Example |
|-------|---------|
| Version Currency | React 18.2 installed, 19.0 available |
| Deprecated Patterns | Using removed/deprecated APIs |
| Missing Best Practices | Not following current recommendations |
| Security Issues | Outdated package with CVE |
| Performance Patterns | Missing optimization opportunities |

## Full Stack Audit Order

When no argument provided, audit in dependency order (top-down):

### Tier 1: Core Frameworks
Detect and audit the primary backend and frontend frameworks first.
- Whatever backend framework is detected (Laravel, Symfony, Express, etc.)
- Whatever frontend framework is detected (React, Vue, Svelte, etc.)

### Tier 2: Bridge & Integration Layer
Audit packages that connect frameworks.
- Inertia.js, Livewire, or similar bridges
- API clients, GraphQL layers

### Tier 3: Type & Language Layer
- TypeScript configuration and patterns
- PHP static analysis (PHPStan, Psalm)

### Tier 4: Styling & UI
- CSS framework (Tailwind, UnoCSS, etc.)
- UI component libraries (Radix, Headless UI, etc.)

### Tier 5: Build & Tooling
- Build tool (Vite, Webpack, esbuild, etc.)
- Dev tooling

### Tier 6: Significant Packages
- State management
- Form handling
- Data fetching
- Authentication packages
- Other high-usage packages

## Single Package Deep Dive

When argument provided (e.g., `/audit-stack react`):

### Research Phase (EXTENSIVE)
Use CURRENT_YEAR in all searches:
```
WebSearch: "React {version} best practices {CURRENT_YEAR}"
WebSearch: "React hooks patterns {CURRENT_YEAR}"
WebSearch: "React performance optimization {CURRENT_YEAR}"
WebSearch: "React Server Components {CURRENT_YEAR}"
WebSearch: "React 19 new features"
```

### Dynamic Checklist Generation
Based on research findings, generate a checklist specific to:
- The installed version
- Current best practices (as of today)
- Known issues and their solutions

## Output Format

### Full Stack Report Structure
```
audit-reports/stack-audit-{timestamp}/
├── 00-stack-summary.md           # Executive summary
├── 00-version-matrix.md          # All versions vs latest
├── 01-{backend-framework}.md     # e.g., laravel, symfony
├── 02-{frontend-framework}.md    # e.g., react, vue
├── 03-{bridge-layer}.md          # e.g., inertia, livewire
├── 04-typescript.md              # If detected
├── 05-{css-framework}.md         # e.g., tailwind, unocss
├── 06-{build-tool}.md            # e.g., vite, webpack
└── 07-packages-assessment.md     # Other significant packages
```

### Report Sections (Per Package)
1. **Version Status**
   - Installed version
   - Latest stable version
   - Recommended action (update/stay/migrate)

2. **Best Practices Audit** (with sources and dates)
   - Following: [list with evidence]
   - Missing: [recommendations with source URLs]
   - Violations: [anti-patterns with file:line]

3. **Deprecated Pattern Detection**
   - Pattern found → Recommended replacement
   - Source URL for migration guide

4. **Security Status**
   - Known CVEs (searched with current date)
   - Security best practices adherence

5. **Upgrade Path**
   - Step-by-step guide if behind
   - Breaking changes to address

## Research Quality Standards

**CRITICAL: Every recommendation must cite a source with access date.**

```markdown
### Recommendation: Use React Server Components

**Source:** [React Documentation - Server Components](https://react.dev/reference/rsc/server-components)
**Researched:** {CURRENT_DATE}

Current pattern (file.tsx:42):
// Client-side data fetching

Recommended pattern:
// Server Component with async data

**Why:** [Explanation based on current docs]
```

## Minimal Return Pattern (for batch audits)

When invoked as part of `/audit-full`:
```
✓ Stack Audit Complete
  Saved to: {filepath}
  Stack: {detected frameworks}
  Outdated: X packages | Deprecated: Y patterns | Security: Z issues
  Key finding: {one-line summary}
```

## Related Commands

- `/audit-full` - All 15 domain consultants
- `/audit-backend` - Backend bundle (API, Database, Security)
- `/audit-frontend` - Frontend bundle (UI, UX, Copy, Performance)

