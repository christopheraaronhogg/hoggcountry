---
description: 🔷 ULTRATHINK Stack Design - Technology recommendations with live research
---

# Stack Design

Invoke the **stack-consultant** in Design Mode for technology selection with live research.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/06-tech-recommendations.md`

## CRITICAL: Live Research Required

This consultant performs LIVE research using WebSearch to get current best practices. Before any research, get today's date and use it in all search queries.

```bash
date +%Y-%m-%d  # or on Windows: powershell -c "Get-Date -Format 'yyyy-MM-dd'"
```

## Design Considerations

### Technology Selection
- Which packages/libraries to use
- Version requirements
- License compatibility
- Community support/maintenance status
- Security track record

### Framework Patterns
- Which patterns fit this feature type
- Official documentation recommendations
- Current best practices (researched)
- Deprecated patterns to avoid

### Integration Approach
- How new code integrates with existing stack
- Compatibility considerations
- Migration path if updating versions
- Breaking changes to handle

### Version Considerations
- Current vs. latest stable versions
- Upgrade requirements
- Security patches needed
- Deprecation timelines

### Best Practice Application
- Official documentation patterns
- Framework-specific recommendations
- Community conventions
- Performance best practices

### Research Methodology

For each technology decision:
```
WebSearch: "{framework} {version} best approach for {feature-type} {CURRENT_YEAR}"
WebFetch: Official documentation for relevant patterns
WebSearch: "{framework} {feature-type} examples {CURRENT_YEAR}"
WebSearch: "{package} security advisories {CURRENT_YEAR}"
```

## Design Deliverables

1. **Technology Selection** - Which packages/libraries to use (with live research)
2. **Framework Patterns** - Which framework patterns fit this feature
3. **Integration Approach** - How new code integrates with existing stack
4. **Version Considerations** - Any version constraints or upgrade needs
5. **Best Practice Application** - Specific patterns to follow from official docs

## Output Format

Deliver technology recommendations document with:
- **Technology Decision Matrix** (option, pros, cons, recommendation)
- **Package List** (name, version, purpose, license)
- **Pattern Recommendations** (with source URLs and dates)
- **Integration Guide**
- **Migration Notes** (if version updates needed)
- **Security Considerations**

**All recommendations must cite sources with access dates.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
  Sources: {count} researched
```
