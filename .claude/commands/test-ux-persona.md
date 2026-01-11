---
description: 🎭 Single Persona Test - Run a specific persona with a custom task against your application
---

# Single Persona UX Test

Run a single **ux-persona** agent with a specific task.

## Usage

```
/test-ux-persona sarah --url http://localhost:3000
/test-ux-persona mike --url http://localhost:3000 --task "compare pricing to your current vendor"
/test-ux-persona david --url http://localhost:3000 --task "complete signup using only keyboard"
```

## Available Personas

| Name | Archetype | Device | Default Task |
|------|-----------|--------|--------------|
| `sarah` | Small business owner | Mobile | Discover and sign up |
| `mike` | Experienced decorator | Desktop | Compare options |
| `jenny` | Rush order handler | Desktop | Place order fast |
| `carlos` | Mobile user | Mobile | Check order status |
| `david` | Accessibility user | Keyboard | Navigate with keyboard only |
| `patricia` | Skeptical shopper | Desktop | Verify trustworthiness |

## Arguments

- `{persona}` - Required. One of: sarah, mike, jenny, carlos, david, patricia
- `--url` - Required. The URL of your running application
- `--task` - Optional. Custom task (overrides default)

## Output

```
audit-reports/ux-persona-{name}-{timestamp}.md
screenshots/{name}-*.png
```

## Examples

### Test mobile experience
```
/test-ux-persona carlos --url http://localhost:3000 --task "find and track your most recent order"
```

### Test accessibility
```
/test-ux-persona david --url http://localhost:3000 --task "create an account and upload a design using only keyboard"
```

### Test trust signals
```
/test-ux-persona patricia --url http://localhost:3000 --task "decide if you'd trust this company with a $500 order"
```

### Test rush experience
```
/test-ux-persona jenny --url http://localhost:3000 --task "upload art.png and reach checkout in under 3 minutes"
```

## When to Use

- **Quick iteration** - Test specific fix with affected persona
- **Focused testing** - Deep dive on one user type
- **Custom scenarios** - Test specific flows not in defaults
- **Verification** - Confirm a fix works for the persona who found it
