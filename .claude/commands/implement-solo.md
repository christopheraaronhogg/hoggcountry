---
description: 🎯 Implement Solo - Main agent implements PRD sequentially (recommended)
---

# Implement Solo

The main agent reads the PRD and implements the feature sequentially. This is the **recommended** approach because:

1. **No conflicts** - Single agent writing code means no merge conflicts
2. **Full context** - Main agent has complete codebase awareness
3. **Coherent changes** - Code style and patterns stay consistent
4. **Resumable** - Task markers track progress for interruption recovery

## Target Feature (Optional)

$ARGUMENTS

## Auto-Discovery

If no feature is specified, auto-discover the most recent planning directory:

```bash
# Find most recently modified planning-docs subfolder
ls -td planning-docs/*/ 2>/dev/null | head -1
```

## Execution Protocol

### Step 1: Locate PRD
```
planning-docs/{feature-slug}/
├── 00-prd.md                    # Read this first
└── 00-implementation-plan.md    # Task list to follow
```

If `00-implementation-plan.md` doesn't exist, generate it from the PRD.

### Step 2: Read All Design Docs
Scan all numbered design files (01-18) to understand:
- Architecture decisions
- API contracts
- Data models
- UI/UX specs
- Test requirements

### Step 3: Implement Tasks in Order
Follow the implementation plan, updating task markers as you go:

```markdown
## Phase 1: Foundation
- [x] Set up database models [abc1234]
- [~] Create migration files          ← Currently working
- [ ] Add model relationships

## Phase 2: Backend
- [ ] Create API endpoints
- [ ] Implement service layer
```

**Task Status:**
- `[ ]` = Pending
- `[~]` = In Progress (only ONE at a time)
- `[x]` = Complete `[commit-sha]`

### Step 4: Test as You Go
After each logical unit:
1. Run relevant tests
2. Fix any failures before proceeding
3. Mark task complete with commit SHA

### Step 5: Final Verification
After all tasks complete:
1. Run full test suite
2. Run type checks
3. Verify all acceptance criteria from PRD

## Implementation Guidelines

### Code Quality
- Follow patterns established in `03-code-standards.md`
- Match existing codebase style
- Add tests per `12-test-strategy.md`

### Commits
- Commit after each logical task or small group
- Reference the task in commit message
- Keep commits atomic and reversible

### Documentation
- Update docs per `11-documentation-plan.md`
- Add code comments for complex logic
- Update README if needed

## Handling Blockers

If you encounter a blocker:

1. **Missing requirement?** Check relevant design doc (01-18)
2. **Design decision needed?** Ask the user
3. **External dependency?** Document and skip, mark task blocked
4. **Test failure?** Fix before proceeding

## Resume After Interruption

If the session ends mid-implementation:

1. Read `00-implementation-plan.md`
2. Find the `[~]` in-progress task
3. Continue from there

## Example Session

```
User: /implement-solo

Claude: Found planning-docs/user-dashboard/
        Reading PRD and implementation plan...

        Starting Phase 1: Foundation
        [~] Set up database models

        Creating app/Models/Dashboard.php...
        Creating migration...
        Running: php artisan migrate
        Tests passing.

        [x] Set up database models [a1b2c3d]
        [~] Create API endpoints
        ...
```

## When to Use Team Instead

Consider `/implement-team` only when:
- Tasks are truly independent (different files)
- Writing documentation in parallel
- Creating independent test files
- Generating boilerplate that won't conflict

For most features, **solo implementation is faster and safer**.

## Related Commands

- `/plan-full` - Create comprehensive PRD first
- `/plan-quick` - Create quick PRD for smaller features
- `/implement-team` - Selective delegation (use carefully)