# codehogg

**18 expert consultant subagents for comprehensive codebase audits, feature planning, and implementation guidance.**

A Claude Code plugin that brings enterprise-grade analysis to any project through specialized AI consultants working in parallel.

## Installation

### Option 1: Install from GitHub Marketplace (Recommended)
```bash
/plugin marketplace add github:christopheraaronhogg/codehogg
```

After adding the marketplace, install the plugin:
```bash
/plugin install codehogg
```

### Option 2: Direct Plugin Install
```bash
/plugin install codehogg@github:christopheraaronhogg/codehogg
```

### Option 3: Local Development
```bash
claude --plugin-dir /path/to/codehogg
```

After installation, restart Claude Code to load the plugin.

## Quick Start

After installation, run a quick audit of your codebase:

```
/codehogg:audit-quick
```

This spawns 7 consultant subagents in parallel to analyze:
- Architecture
- Security
- Performance
- Code Quality
- UI Design
- UX
- Copy/Content

## Available Commands

### Audit Commands (Assessment Mode)

Run expert analysis on existing code:

| Command | Description |
|---------|-------------|
| `/codehogg:audit-full` | All 18 consultants in 4 waves |
| `/codehogg:audit-quick` | 7 key consultants (fastest) |
| `/codehogg:audit-architecture` | System structure evaluation |
| `/codehogg:audit-security` | OWASP vulnerabilities, auth |
| `/codehogg:audit-performance` | Bottlenecks, Core Web Vitals |
| `/codehogg:audit-database` | Schema, queries, indexes |
| `/codehogg:audit-api` | REST design, endpoints |
| `/codehogg:audit-ui` | Visual design assessment |
| `/codehogg:audit-ux` | Usability, accessibility |
| `/codehogg:audit-copy` | Content quality, voice |
| `/codehogg:audit-code` | Tech debt, maintainability |
| `/codehogg:audit-devops` | CI/CD, infrastructure |
| `/codehogg:audit-qa` | Testing strategy |
| `/codehogg:audit-docs` | Documentation coverage |
| `/codehogg:audit-cost` | Cloud costs, FinOps |
| `/codehogg:audit-compliance` | GDPR, CCPA, privacy |
| `/codehogg:audit-stack` | Framework best practices |
| `/codehogg:audit-seo` | Technical SEO |
| `/codehogg:audit-observability` | Logging, monitoring |
| `/codehogg:audit-requirements` | Product scope |

#### Bundle Commands

| Command | Consultants |
|---------|-------------|
| `/codehogg:audit-backend` | API, Database, Stack, Security, Compliance |
| `/codehogg:audit-frontend` | UI, UX, Copy, Performance, SEO |
| `/codehogg:audit-ops` | DevOps, Cost, Docs, QA, Observability |
| `/codehogg:audit-quality` | Architecture, Code Quality, Requirements |

### Plan Commands (Design Mode)

Plan new features before implementation:

| Command | Description |
|---------|-------------|
| `/codehogg:plan-full` | Full planning with all 18 consultants |
| `/codehogg:plan-quick` | Fast planning with 7 key consultants |
| `/codehogg:plan-architecture` | System design planning |
| `/codehogg:plan-api` | API contract design |
| `/codehogg:plan-database` | Schema design |
| `/codehogg:plan-security` | Security requirements |
| `/codehogg:plan-ui` | Visual design specs |
| `/codehogg:plan-ux` | User flow design |
| ... | (mirrors all audit commands) |

#### Bundle Commands

| Command | Focus |
|---------|-------|
| `/codehogg:plan-foundation` | Product spec, Architecture, Code standards |
| `/codehogg:plan-backend` | API, Database, Stack, Security, Compliance |
| `/codehogg:plan-frontend` | UI, UX, Copy, Performance, SEO |
| `/codehogg:plan-ops` | DevOps, Cost, Docs, QA, Observability |

### Implementation Commands

| Command | Description |
|---------|-------------|
| `/codehogg:implement-solo` | Main agent implements from plan sequentially |
| `/codehogg:implement-team` | Parallel delegation for independent tasks |

### Creative Commands

| Command | Description |
|---------|-------------|
| `/codehogg:explore-concepts` | Generate 3 distinct implementation directions |

## The 18 Consultant Domains

Each consultant is a specialized AI expert:

| Consultant | Expertise |
|------------|-----------|
| **architect** | System design, modularity, patterns |
| **backend** | API design, services, data access |
| **database** | Schema, queries, performance |
| **security** | OWASP, auth, vulnerabilities |
| **compliance** | GDPR, CCPA, privacy |
| **stack** | Framework best practices (live research) |
| **devops** | CI/CD, infrastructure |
| **cost** | Cloud costs, FinOps |
| **docs** | Documentation quality |
| **qa** | Testing strategy |
| **observability** | Logging, monitoring |
| **ui-design** | Visual design, aesthetics |
| **ux** | Usability, accessibility |
| **copy** | Content, voice, microcopy |
| **performance** | Bottlenecks, optimization |
| **seo** | Technical SEO |
| **code-quality** | Tech debt, maintainability |
| **product** | Requirements, scope |

## Output Structure

### Audit Reports

```
audit-reports/{timestamp}/
├── 00-executive-summary.md
├── 00-priority-matrix.md
├── 01-architecture-assessment.md
├── 02-code-quality-assessment.md
├── ...
└── 18-seo-assessment.md
```

### Planning Documents

```
planning-docs/{feature-slug}/
├── 00-prd.md
├── 00-implementation-plan.md
├── 01-product-spec.md
├── 02-architecture-design.md
├── ...
└── 18-seo-requirements.md
```

## How It Works

### Wave-Based Execution

To prevent context overflow, consultants run in waves:

1. **Wave 1: Quality** (3 consultants) - Architecture, Code Quality, Requirements
2. **Wave 2: Backend** (5 consultants) - API, Database, Stack, Security, Compliance
3. **Wave 3: Ops** (5 consultants) - DevOps, Cost, Docs, QA, Observability
4. **Wave 4: Frontend** (5 consultants) - UI, UX, Copy, Performance, SEO

Each consultant writes their full report to a file and returns only a brief status, keeping context lean.

### Parallel Subagents

Within each wave, consultants run in parallel using Claude's Task tool. This provides:
- Faster analysis (parallel execution)
- Deeper insights (each consultant has full focus)
- Structured output (consistent report format)

## Project Integration

For best results, your project should include:

### CLAUDE.md (recommended)
Project-specific guidelines, voice/tone, conventions.

### DESIGN_SYSTEM.md (recommended)
Design tokens, colors, typography, component patterns.

### The plugin reads these automatically when gathering context.

## Example Workflows

### New Project Audit
```
/codehogg:audit-full
```
Get a comprehensive 18-consultant analysis of your entire codebase.

### Security Review Before Deploy
```
/codehogg:audit-security
```
Run the security consultant for OWASP analysis and vulnerability assessment.

### Plan a New Feature
```
/codehogg:plan-quick "user authentication with OAuth"
```
Get planning documents from 7 consultants covering architecture, security, UX, and more.

### Generate UI Options
```
/codehogg:explore-concepts "admin dashboard for order analytics"
```
Get 3 distinct implementation directions with evocative physical metaphors.

## License

MIT

## Author

Christopher Hogg
[GitHub](https://github.com/christopheraaronhogg)
