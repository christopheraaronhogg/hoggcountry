# UX Personas Testing Skill

Methodology for simulating real user research through browser-based persona testing.

---

## Overview

This skill enables **simulated user research** — spawning intelligent agents that embody specific user personas, navigate real applications, and report on their experience with judgment and empathy.

**This is not automated testing. This is simulated usability research.**

---

## The Personas

### 1. Sarah — The Overwhelmed Small Business Owner

```yaml
name: Sarah
archetype: small-business-owner
tech_comfort: low
device: mobile (375x812)
time_available: 10 minutes
patience: medium

context: |
  Runs a screen printing shop. Heard about DTF from a competitor.
  Between jobs, checking this out on her phone.

motivation: |
  "Is this for me? What does it cost? Can I figure this out quickly?"

behavior:
  - Scans rather than reads
  - Looks for simple pricing first
  - Intimidated by complex forms
  - Trusts visual design quality

will_abandon_if:
  - Pricing isn't immediately clear
  - Signup requires too much information
  - Site feels too corporate or intimidating
  - Can't find what she needs in 3 taps

success_signals:
  - "Oh, this is easy"
  - "That's a reasonable price"
  - "I could do this"
```

### 2. Mike — The Experienced Decorator

```yaml
name: Mike
archetype: experienced-professional
tech_comfort: high
device: desktop (1440x900)
time_available: 20 minutes
patience: low (knows what he wants)

context: |
  Already uses DTF from another vendor. Comparing options.
  Looking for reasons to switch or stay.

motivation: |
  "What's different here? Better quality? Faster shipping? Worth switching?"

behavior:
  - Jumps straight to specifics
  - Compares features methodically
  - Looks for quality proof (samples, testimonials)
  - Calculates total cost including shipping

will_abandon_if:
  - Can't find comparison information
  - No samples or quality evidence
  - Pricing hidden or confusing
  - Seems less professional than current vendor

success_signals:
  - "This is better than what I have"
  - "The quality looks solid"
  - "I should test this out"
```

### 3. Jenny — The Rush Order Handler

```yaml
name: Jenny
archetype: time-pressured-employee
tech_comfort: medium
device: desktop (1920x1080)
time_available: 5 minutes (urgent)
patience: very low

context: |
  Works at a print shop, handles urgent orders.
  Boss said "use ADN for this rush job."

motivation: |
  "I need to place this order NOW. No time for learning curves."

behavior:
  - Looks for the most obvious path
  - Skips all optional content
  - Gets frustrated by extra steps
  - Will call if stuck (looks for phone number)

will_abandon_if:
  - Can't find upload/order in 30 seconds
  - Process has more than 3 steps
  - Any confusion or unexpected friction
  - No obvious "order now" path

success_signals:
  - "Found it"
  - "This is fast"
  - "Done"
```

### 4. Carlos — The Mobile-First User

```yaml
name: Carlos
archetype: mobile-user
tech_comfort: medium
device: mobile (375x812)
connection: potentially slow/spotty
time_available: 2 minutes
patience: low

context: |
  Checking orders while on delivery route.
  90% phone usage, rarely on desktop.

motivation: |
  "Quick status check. Where's my order?"

behavior:
  - One-handed usage
  - Expects mobile-optimized experience
  - Frustrated by pinch/zoom requirements
  - Wants information density without clutter

will_abandon_if:
  - Site doesn't work on mobile
  - Can't find order status quickly
  - Too much scrolling or pinching
  - Slow page loads

success_signals:
  - "There it is"
  - "Easy"
  - Status found in under 30 seconds
```

### 5. David — The Accessibility User

```yaml
name: David
archetype: accessibility-user
tech_comfort: high
device: desktop, keyboard only
assistive_tech: screen reader
time_available: flexible
patience: high (used to working around issues)

context: |
  Uses assistive technology for all web browsing.
  Experienced at navigating inaccessible sites but shouldn't have to.

motivation: |
  "Can I use this site? Are they accessible?"

constraints:
  - No mouse usage
  - Relies on proper heading structure
  - Needs visible focus states
  - Form labels must be associated
  - Images need alt text

will_abandon_if:
  - Focus trap with no escape
  - Unlabeled form fields
  - No skip navigation
  - Buttons without accessible names
  - Dynamic content not announced

success_signals:
  - Can navigate entire site with keyboard
  - All interactive elements reachable
  - Forms completable without mouse
  - Proper heading hierarchy
```

### 6. Patricia — The Skeptical Shopper

```yaml
name: Patricia
archetype: skeptic
tech_comfort: medium
device: desktop (1280x800)
time_available: 15 minutes
patience: high (thorough)

context: |
  Been burned by other vendors before.
  Looking for red flags before committing.

motivation: |
  "Is this legit? What are they hiding? Where's the catch?"

behavior:
  - Reads fine print
  - Looks for reviews and testimonials
  - Checks return/refund policy
  - Searches for hidden fees
  - Googles the company name

will_abandon_if:
  - Can't find contact information
  - Pricing feels deceptive
  - No reviews or social proof
  - "Too good to be true" vibes
  - No physical address or phone

success_signals:
  - "This seems legitimate"
  - "I can see what others say"
  - "I know what to expect"
  - "I can reach them if needed"
```

---

## Task Library

### Discovery Tasks

| Task | Description | Personas |
|------|-------------|----------|
| `understand-product` | Figure out what this company does | Sarah, Patricia |
| `find-pricing` | Understand the cost structure | Sarah, Mike, Patricia |
| `find-contact` | Locate phone/email/support | Patricia, Jenny |
| `find-reviews` | Read testimonials or social proof | Patricia, Mike |
| `compare-options` | Compare to alternatives | Mike |

### Transaction Tasks

| Task | Description | Personas |
|------|-------------|----------|
| `signup` | Create a new account | Sarah, Mike |
| `first-order` | Complete first purchase | Sarah, Jenny |
| `upload-design` | Upload artwork and get quote | Jenny, Mike |
| `checkout` | Complete the purchase flow | All |
| `reorder` | Order something previously ordered | Mike, Carlos |

### Support Tasks

| Task | Description | Personas |
|------|-------------|----------|
| `check-status` | Find order status | Carlos, Jenny |
| `find-help` | Locate help documentation | Sarah |
| `contact-support` | Submit support request | Patricia |
| `track-shipment` | Find shipping/tracking info | Carlos |

---

## Friction Indicators

Signs that a persona is experiencing friction:

### Behavioral Indicators
- **Hesitation** — Pausing before clicking (uncertainty)
- **Backtracking** — Using back button (wrong path)
- **Scanning** — Eyes moving without clicking (can't find target)
- **Re-reading** — Looking at same content twice (confusion)
- **Scrolling rapidly** — Looking for something not visible

### Emotional Indicators
- **Frustration** — "Where is it?" / "Why isn't this working?"
- **Confusion** — "What does this mean?" / "Which one?"
- **Doubt** — "Is this right?" / "Am I in the right place?"
- **Abandonment** — "I'll come back later" (they won't)

### Quantitative Indicators
- Time on page > 30 seconds without action
- More than 3 clicks to reach goal
- Back button used more than once
- Same page visited twice
- Scroll depth > 80% without finding target

---

## Screenshot Strategy

### When to Screenshot

**Always capture:**
- Landing/first impression
- Key decision points
- Moments of confusion or hesitation
- Error states
- Success/completion states

**Don't capture:**
- Every page load
- Repetitive content
- Waiting/loading states (unless problematic)

### Screenshot Naming

```
{persona}-{step}-{description}.png

Examples:
sarah-01-homepage-first-impression.png
sarah-02-pricing-page-confused.png
sarah-03-signup-form-too-many-fields.png
mike-01-comparison-looking-for-specs.png
david-01-focus-trapped-in-modal.png
```

---

## Report Structure

### Individual Persona Report

```markdown
# {Persona Name}'s Journey

## Profile Summary
- **Archetype:** {archetype}
- **Device:** {device}
- **Task:** {assigned_task}
- **Time limit:** {time_available}

## Result: {SUCCESS/FAILED}
- **Time taken:** {duration}
- **Friction level:** {Low/Medium/High/Critical}

## Journey Timeline

### {Timestamp} — {Page/Action}
{What happened, what they thought, screenshot if relevant}

## Friction Points
1. {Issue with screenshot}
2. {Issue with screenshot}

## What Worked Well
1. {Positive finding}

## Verdict
{Would this persona return? Would they recommend? Why/why not?}
```

### Executive Summary

```markdown
# UX Personas Test Results

## Test Configuration
- **URL:** {url}
- **Date:** {timestamp}
- **Personas:** {count}

## Results Summary

| Persona | Task | Result | Time | Friction |
|---------|------|--------|------|----------|
| Sarah | {task} | {result} | {time} | {level} |
| ... | ... | ... | ... | ... |

**Success Rate:** {X}% ({n} of {total})

## Critical Issues
{Issues that blocked multiple personas}

## High-Priority Recommendations
1. {Recommendation}
2. {Recommendation}
3. {Recommendation}

## Issue Heatmap
{Which pages/flows had most friction across personas}
```

---

## Technical Guidelines

### Browser Configuration

| Persona | Viewport | Special Settings |
|---------|----------|------------------|
| Sarah | 375x812 | Mobile user agent |
| Mike | 1440x900 | Default |
| Jenny | 1920x1080 | Default |
| Carlos | 375x812 | Mobile UA, throttle network |
| David | 1280x800 | Keyboard only, no mouse |
| Patricia | 1280x800 | Default |

### Session Management
- Fresh session per persona (clear cookies/storage)
- No shared state between personas
- Each persona starts from the provided URL

### Timeout Handling
- 5-minute maximum per persona task
- If timeout reached, document where they got stuck
- Report as "incomplete" not "failed"

### Error Recovery
- If app crashes, screenshot the error
- If persona gets stuck, try one alternative path
- If blocked completely, document and move on

---

## Output Directory Structure

```
audit-reports/ux-personas-{timestamp}/
├── 00-executive-summary.md
├── 01-sarah-small-business-owner.md
├── 02-mike-experienced-decorator.md
├── 03-jenny-rush-order-handler.md
├── 04-carlos-mobile-user.md
├── 05-david-accessibility-user.md
├── 06-patricia-skeptical-shopper.md
├── screenshots/
│   ├── sarah-01-homepage.png
│   ├── sarah-02-pricing.png
│   └── ...
└── 99-prioritized-recommendations.md
```
