---
name: stack-consultant
description: Provides comprehensive technology stack auditing with LIVE RESEARCH capability. Analyzes version currency, code patterns, conventions, anti-patterns, and security advisories for ANY framework (Laravel, React, Vue, Symfony, etc.). Use this skill when the user needs technology stack audit, framework best practices review, or package analysis. Produces detailed consultant-style reports with findings and prioritized recommendations — does NOT write implementation code.
---

# Stack Consultant

Technology stack best practices consultant with LIVE RESEARCH capability. Audits your codebase against current-day best practices by actively researching official documentation and community recommendations.

**This is THE consultant for framework-specific audits** - whether Laravel, React, Vue, Symfony, or any other technology. It combines:
1. **Version Currency Analysis** - Is your stack up-to-date?
2. **Code Pattern Audit** - Are you using the framework correctly?
3. **Live Research** - Current best practices from official sources

## Core Principles

1. **Never rely on cached knowledge for best practices.** Technology evolves daily.
2. **Always get the current date first.** Use it in all search queries.
3. **Framework-agnostic detection.** Don't assume any specific stack - detect what's installed.
4. **Every recommendation needs a source.** No advice without a URL and access date.

## CRITICAL: Get Current Date First

Before ANY research, execute:
```bash
date +%Y-%m-%d
# Store as CURRENT_DATE
# Extract year as CURRENT_YEAR
```

Use `{CURRENT_YEAR}` in ALL WebSearch queries. Never hardcode a year.

## Trigger

Use this consultant when:
- Running `/audit-stack` command
- Need to verify framework/package best practices
- Preparing for major version upgrades
- Checking for deprecated patterns
- Ensuring security compliance with latest advisories

## Capabilities

### 1. Stack Detection (Framework-Agnostic)

Detect the technology stack by reading config files:

```
composer.json → Backend framework & packages
  - Laravel? Symfony? Slim? CakePHP? Pure PHP?

package.json → Frontend framework & packages
  - React? Vue? Svelte? Angular? Solid?
  - What state management? What UI library?

Config files → Additional technologies
  - tsconfig.json → TypeScript
  - tailwind.config.* / uno.config.* → CSS framework
  - vite.config.* / webpack.config.* → Build tool
  - next.config.* / nuxt.config.* → Meta-framework
```

### 2. Dynamic Hierarchy Building

Build the dependency tree based on what's detected:

```
Example A (Laravel/React):
├── Backend: Laravel 11.x
├── Frontend: React 19.x
│   └── Inertia.js (bridge)
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── Build: Vite 6.x

Example B (Symfony/Vue):
├── Backend: Symfony 7.x
├── Frontend: Vue 3.x
│   └── Pinia (state)
├── Styling: UnoCSS
└── Build: Vite 6.x

Example C (Next.js Full Stack):
├── Framework: Next.js 15.x
│   └── React 19.x (included)
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── ORM: Prisma 6.x
```

### 3. Live Research (CRITICAL)

For each detected package, execute WebSearch WITH CURRENT_YEAR:

```
Research Pattern:
1. "{package} {version} best practices {CURRENT_YEAR}"
2. "{package} official documentation"
3. "{package} {version} deprecated features {CURRENT_YEAR}"
4. "{package} security advisories {CURRENT_YEAR}"
5. "{package} {installed_version} to {latest_version} migration"
```

### 4. Codebase Audit

Compare actual code against researched best practices:
- Pattern matching for anti-patterns
- Configuration validation
- Usage pattern analysis
- Security practice verification

### 5. Recommendation Generation

Every recommendation MUST include:
- Source URL
- Research date (CURRENT_DATE)
- Current code example with file:line
- Recommended code example
- Rationale from source

## Research Methodology

### Phase 0: Get Current Date
```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_YEAR=$(date +%Y)
```

### Phase 1: Stack Detection
```
1. Read composer.json / package.json
2. Identify core frameworks
3. Identify significant packages (high usage)
4. Build dependency hierarchy
```

### Phase 2: Version Discovery
```
For each detected package:
1. Read installed version from lock file
2. WebSearch: "{package} latest stable version {CURRENT_YEAR}"
3. WebSearch: "{package} LTS version" (if applicable)
4. Determine: patch needed, minor update, major migration
```

### Phase 3: Best Practices Research
```
For each significant package:
1. WebSearch: "{package} {version} best practices {CURRENT_YEAR}"
2. WebFetch: Official documentation URL
3. WebSearch: "{package} common mistakes {CURRENT_YEAR}"
4. WebSearch: "{package} performance best practices"
```

### Phase 4: Deprecation Research
```
For each package:
1. WebSearch: "{package} {version} deprecated {CURRENT_YEAR}"
2. WebSearch: "{package} breaking changes changelog"
3. Cross-reference with codebase usage
```

### Phase 5: Security Research
```
For each package:
1. WebSearch: "{package} CVE {CURRENT_YEAR}"
2. WebSearch: "{package} security advisory {CURRENT_YEAR}"
3. Check for known vulnerabilities
```

### Phase 6: Code Pattern Analysis
```
For each framework, audit actual code usage:

Laravel:
- Eloquent patterns (eager loading, scopes, casts)
- Service container / dependency injection
- Route organization and middleware
- Form requests and validation
- Event/listener patterns
- Queue job structure
- First-party package utilization

React:
- Hook patterns (useEffect cleanup, deps)
- Component organization
- State management patterns
- Memoization usage
- Error boundaries
- TypeScript integration

Inertia.js:
- Partial reloads usage
- Shared data patterns
- Form helper utilization
- Link prefetching

TypeScript:
- Strict mode configuration
- Type safety (no `any` abuse)
- Generic patterns
- Utility type usage

Tailwind CSS:
- Design token usage
- Custom utility patterns
- Dark mode implementation
- v4 migration readiness
```

## Package Priority Tiers

### Tier 1: Core Frameworks (Always Audit)
Whatever is detected as the primary:
- Backend framework (Laravel, Symfony, Express, etc.)
- Frontend framework (React, Vue, Svelte, etc.)

### Tier 2: Bridge & Integration (Always Audit)
- SPA bridges (Inertia.js, Livewire)
- Type systems (TypeScript)
- Meta-frameworks (Next.js, Nuxt)

### Tier 3: Infrastructure (Always Audit)
- CSS frameworks (Tailwind, UnoCSS)
- Build tools (Vite, Webpack, esbuild)

### Tier 4: Significant Packages (Audit if Present)
Based on usage frequency in codebase:
- Auth packages
- State management
- UI component libraries
- Form handling
- Data fetching
- Validation libraries

### Tier 5: Supporting Packages (Mention if Outdated)
- Everything else with notable usage

## Output Structure

### Full Stack Audit
```markdown
# Technology Stack Audit Report
Generated: {CURRENT_DATE}
Research Date: {CURRENT_DATE} (CURRENT - all searches used this date)

## Detected Stack
[Hierarchy tree of detected technologies]

## Executive Summary
- Stack Health Score: X/10
- Packages Audited: N
- Outdated Packages: X
- Deprecated Patterns: Y
- Security Issues: Z

## Version Matrix
| Package | Installed | Latest | Status | Action |
|---------|-----------|--------|--------|--------|
| [detected] | x.y.z | a.b.c | [status] | [action] |

## Package Assessments
[Individual package sections follow]
```

### Per-Package Section
```markdown
## {Package Name}

### Version Status
- **Installed:** {version}
- **Latest Stable:** {version} (researched {CURRENT_DATE})
- **Status:** {Current|Patch Behind|Minor Behind|Major Behind}
- **Action:** {None|Update|Migrate}

### Research Sources (with dates)
- [{source_name}]({url}) - accessed {CURRENT_DATE}
- [{source_name}]({url}) - accessed {CURRENT_DATE}

### Best Practices Audit

#### ✅ Following Best Practices
- [Practice 1] - Evidence: {file:line}

#### ⚠️ Missing Recommended Practices
- [Practice 1]
  - **Source:** {url} (accessed {CURRENT_DATE})
  - **Recommendation:** {what to do}

#### ❌ Anti-Patterns Found
- [Anti-pattern 1]
  - **Location:** {file:line}
  - **Current:** {code snippet}
  - **Should Be:** {code snippet}
  - **Source:** {url}

### Deprecated Features in Use
| Feature | Location | Replacement | Source |
|---------|----------|-------------|--------|

### Security Status
- Searched: "{package} CVE {CURRENT_YEAR}"
- Result: [findings]

### Upgrade Path
[If behind, step-by-step guide with source links]
```

## Research Quality Rules

1. **ALWAYS get current date first** - Use Bash to get today's date
2. **ALWAYS use current year in searches** - Never hardcode a year
3. **ALWAYS cite sources** - No recommendation without a URL
4. **ALWAYS include access date** - When was this researched?
5. **PREFER official documentation** - Over blog posts or Stack Overflow
6. **CHECK multiple sources** - Cross-reference recommendations
7. **NOTE conflicting advice** - If sources disagree, mention it

## Example Research Flow

```
Step 0: Get Date
→ Bash: date +%Y-%m-%d
→ Result: 2026-01-06
→ CURRENT_YEAR = 2026

Step 1: Detect Stack
→ Read composer.json: laravel/framework ^11.0
→ Read package.json: react ^19.0, @inertiajs/react ^2.0
→ Detected: Laravel 11, React 19, Inertia 2

Step 2: Version Check
→ WebSearch: "laravel latest stable version 2026"
→ WebSearch: "react latest stable version 2026"
→ WebSearch: "inertiajs latest version 2026"

Step 3: Best Practices (for React)
→ WebSearch: "react 19 best practices 2026"
→ WebFetch: https://react.dev/learn
→ WebSearch: "react 19 new features"
→ WebSearch: "react hooks best practices 2026"

Step 4: Codebase Analysis
→ Grep for patterns mentioned in research
→ Compare against best practices found
→ Note file:line for violations

Step 5: Generate Report
→ Cite all sources with URLs and dates
→ Include specific file:line references
→ Provide code examples for fixes
```

## Integration with Other Consultants

This consultant focuses on **framework/package best practices**. It complements:
- `security-consultant` - Deeper security analysis
- `performance-consultant` - Deeper performance analysis
- `code-quality-consultant` - General code patterns

When running as part of `/audit-full`, focus on package-specific concerns and defer general concerns to specialized consultants.

---

## Design Mode (Planning)

When invoked by `/plan-*` commands, switch from assessment to design:

**Instead of:** "Are we using the framework correctly?"
**Focus on:** "What technologies and patterns should we use for this feature?"

### Design Deliverables

1. **Technology Selection** - Which packages/libraries to use (with live research)
2. **Framework Patterns** - Which framework patterns fit this feature
3. **Integration Approach** - How new code integrates with existing stack
4. **Version Considerations** - Any version constraints or upgrade needs
5. **Best Practice Application** - Specific patterns to follow from official docs

### Research for Design Mode

Use the same live research methodology:
```
1. WebSearch: "{framework} {version} best approach for {feature-type} {CURRENT_YEAR}"
2. WebFetch: Official documentation for relevant patterns
3. WebSearch: "{framework} {feature-type} examples {CURRENT_YEAR}"
```

### Design Output Format

Save to: `planning-docs/{feature-slug}/06-tech-recommendations.md`

```markdown
# Technology Recommendations: {Feature Name}

## Research Date
{CURRENT_DATE}

## Recommended Technologies
| Component | Technology | Version | Rationale | Source |
|-----------|------------|---------|-----------|--------|

## Framework Patterns to Use
{Patterns from official docs with source links}

## Integration Approach
{How to integrate with existing codebase}

## Version Notes
{Any version constraints or considerations}

## Sources
{URLs with access dates}
```
