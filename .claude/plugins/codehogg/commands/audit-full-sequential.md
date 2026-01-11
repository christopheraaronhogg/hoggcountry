---
description: 📋 ULTRATHINK Sequential Enterprise Audit - Runs 18 consultant analyses one-by-one (safer, more controlled, lower parallelism)
---

# Full Enterprise Audit (Sequential)

Run all 18 consultant analyses ONE BY ONE for a controlled, comprehensive codebase audit using ULTRATHINK deep reasoning.

## Objective

Same comprehensive coverage as `/audit-full` but executed sequentially for:
- Lower system resource usage
- Better progress visibility
- Easier interruption/resumption
- More controlled execution

## When to Use

- System resources are limited
- You want to monitor each analysis as it completes
- You may need to interrupt and resume
- You prefer controlled, predictable execution

## Execution Order (Bundle-Aligned)

Run consultants in this order, following the same bundle structure as `/audit-full`:

### Phase 1: Quality Bundle
*Understand the structure first*

1. **architect-consultant** → `01-architecture-assessment.md`
2. **code-quality-consultant** → `02-code-quality-assessment.md`
3. **product-consultant** → `03-requirements-assessment.md`

### Phase 2: Backend Bundle
*Core application, data layer, security, compliance*

4. **backend-consultant** → `04-backend-assessment.md`
5. **database-consultant** → `05-database-assessment.md`
6. **stack-consultant** → `06-stack-assessment.md`
7. **security-consultant** → `07-security-assessment.md`
8. **compliance-consultant** → `08-compliance-assessment.md`

### Phase 3: Ops Bundle
*Deployment, testing, costs, observability*

9. **devops-consultant** → `09-devops-assessment.md`
10. **cost-consultant** → `10-cost-assessment.md`
11. **docs-consultant** → `11-documentation-assessment.md`
12. **qa-consultant** → `12-qa-assessment.md`
13. **observability-consultant** → `13-observability-assessment.md`

### Phase 4: Frontend Bundle
*User-facing polish, SEO*

14. **ui-design-consultant** → `14-ui-design-assessment.md`
15. **ux-consultant** → `15-ux-assessment.md`
16. **copy-consultant** → `16-copy-assessment.md`
17. **performance-consultant** → `17-performance-assessment.md`
18. **seo-consultant** → `18-seo-assessment.md`

## Execution

For each consultant in order:

```
Task(
  description: "Phase 1: Architecture review",
  subagent_type: "architect-consultant",
  prompt: "..."
)
// Wait for completion
// Write report
// Move to next
```

## Progress Tracking

After each consultant completes:
1. Save the report immediately
2. Update progress indicator
3. Inform user of completion

```
✓ [1/18] Architecture Assessment - Complete
✓ [2/18] Code Quality Assessment - Complete
✓ [3/18] Requirements Assessment - Complete
--- Quality Bundle Complete ---
→ [4/18] Backend Assessment - In Progress
○ [5/18] Database Assessment - Pending
...
```

## Resumption Support

If interrupted, the audit can resume:
1. Check which reports already exist in the audit directory
2. Skip completed assessments
3. Continue from where it left off

**Tip:** If you stopped mid-bundle, you can re-run just that bundle:
- Quality: `/audit-quality`
- Backend: `/audit-backend`
- Ops: `/audit-ops`
- Frontend: `/audit-frontend`

## Output Structure

Same as `/audit-full` (bundle-grouped numbering):

```
audit-reports/{timestamp}/
├── 00-executive-summary.md
├── 00-priority-matrix.md
│
├── # Quality Bundle (1-3)
├── 01-architecture-assessment.md
├── 02-code-quality-assessment.md
├── 03-requirements-assessment.md
│
├── # Backend Bundle (4-8)
├── 04-backend-assessment.md
├── 05-database-assessment.md
├── 06-stack-assessment.md
├── 07-security-assessment.md
├── 08-compliance-assessment.md
│
├── # Ops Bundle (9-13)
├── 09-devops-assessment.md
├── 10-cost-assessment.md
├── 11-documentation-assessment.md
├── 12-qa-assessment.md
├── 13-observability-assessment.md
│
├── # Frontend Bundle (14-18)
├── 14-ui-design-assessment.md
├── 15-ux-assessment.md
├── 16-copy-assessment.md
├── 17-performance-assessment.md
└── 18-seo-assessment.md
```

## Time Estimate

Sequential execution takes longer than parallel:
- Each consultant: ~2-5 minutes
- Total: ~36-90 minutes (18 consultants)
- Progress updates throughout

For faster execution, use `/audit-full` (parallel version).
