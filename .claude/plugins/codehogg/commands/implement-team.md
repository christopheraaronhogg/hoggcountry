---
description: 👥 Implement Team - Selective delegation for independent tasks (use carefully)
---

# Implement Team

Delegate specific tasks to subagents when tasks are **truly independent**. Use with caution - parallel code changes often cause conflicts.

## ⚠️ Warning

**Subagents excel at:** Research, analysis, documentation, planning
**Subagents struggle with:** Parallel code implementation (conflicts, coordination)

**Default to `/implement-solo`** unless you have a specific reason to parallelize.

## Target Feature (Optional)

$ARGUMENTS

## When Team Implementation is Safe

### ✅ Safe for Delegation

| Task Type | Why Safe |
|-----------|----------|
| Documentation writing | Separate markdown files |
| Independent test files | Don't share code |
| Database migrations | Run in sequence anyway |
| Config files | Usually independent |
| Seed data | Separate files |
| Static assets | No code dependencies |

### ❌ NOT Safe for Delegation

| Task Type | Why Dangerous |
|-----------|---------------|
| Features touching shared files | Merge conflicts |
| Code that builds on each other | Missing dependencies |
| Refactoring tasks | Cascading changes |
| Related UI components | Shared state/styles |
| Service layer + controller | Tight coupling |

## Execution Protocol

### Step 1: Read Implementation Plan
```
planning-docs/{feature-slug}/00-implementation-plan.md
```

### Step 2: Identify Independent Tasks
Look for tasks that:
- Touch completely separate files
- Have no dependencies on each other
- Won't conflict if done simultaneously

### Step 3: Main Agent Orchestrates
The main agent should:
1. Complete dependent tasks sequentially first
2. Identify parallelizable tasks
3. Delegate only truly independent work
4. Integrate results and run tests

### Step 4: Delegate Specific Tasks
For each delegated task:
```
Task: [Specific task from implementation plan]
Files: [Exact files to create/modify]
Constraints: [Don't touch any other files]
Output: [What to deliver]
```

### Step 5: Integration
After all subagents complete:
1. Review all changes
2. Run full test suite
3. Fix any integration issues
4. Update implementation plan markers

## Safe Delegation Examples

### Example 1: Documentation
```
Delegate to 3 subagents in parallel:
- Subagent A: Write API documentation (docs/api.md)
- Subagent B: Write user guide (docs/user-guide.md)
- Subagent C: Update README.md

Safe because: Completely separate files, no code changes
```

### Example 2: Test Files
```
Delegate to 2 subagents in parallel:
- Subagent A: Write unit tests (tests/Unit/DashboardTest.php)
- Subagent B: Write feature tests (tests/Feature/DashboardApiTest.php)

Safe because: Test files are independent, code already exists
```

### Example 3: Seed Data
```
Delegate to 2 subagents in parallel:
- Subagent A: Create seeder (database/seeders/DashboardSeeder.php)
- Subagent B: Create factory (database/factories/DashboardFactory.php)

Safe because: Separate files, only depend on existing models
```

## Unsafe Delegation Examples

### ❌ Don't Do This
```
# WRONG - These will conflict!
- Subagent A: Create Dashboard model and controller
- Subagent B: Create Dashboard API endpoints
- Subagent C: Create Dashboard frontend component

Problem: All touch related code, share imports, have dependencies
```

### ❌ Don't Do This Either
```
# WRONG - Sequential dependency!
- Subagent A: Create migration
- Subagent B: Create model that uses migration columns

Problem: B depends on A being complete first
```

## Recommended Workflow

1. **Solo first**: Main agent implements core feature
2. **Team for polish**: Delegate independent polish tasks
3. **Solo for integration**: Main agent integrates and tests

```
Phase 1 (Solo): Core implementation
  - Models, controllers, services
  - Main UI components
  - Core tests

Phase 2 (Team): Independent polish
  - Documentation (parallel)
  - Additional test files (parallel)
  - Seed data (parallel)

Phase 3 (Solo): Integration
  - Review all changes
  - Fix conflicts
  - Final testing
```

## Task Markers

Same as `/implement-solo`:
- `[ ]` = Pending
- `[~]` = In Progress
- `[x]` = Complete `[commit-sha]`
- `[D]` = Delegated to subagent (include agent ID)

```markdown
## Phase 3: Polish
- [D:agent-123] Write API documentation
- [D:agent-456] Write user guide
- [ ] Review and integrate
```

## Related Commands

- `/implement-solo` - Recommended for most features
- `/plan-full` - Create comprehensive PRD first
