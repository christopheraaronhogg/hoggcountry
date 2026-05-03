# Scout Mobile Workspace Interface Requirements

Status: Draft
Date: 2026-05-01
Owner: Hogg Country / Scout

## Product stance

Scout must feel useful before the hiker has a finished profile, guide import, mileage source, or polished plan. The interface should start with one obvious next action, then let Scout ask for missing details only when they affect the current trail decision.

## Reference pattern to learn from

The Claude Cowork-style workspace has four useful pieces:

1. **Left rail**: sessions/tasks/history so the user can resume work without digging.
2. **Center conversation**: the active collaboration surface.
3. **Bottom composer**: persistent input with mode/model/context controls nearby but visually quiet.
4. **Right rail**: progress, working files, and context/connectors.

For Scout, those map to trail-specific concepts:

- Left rail → recent trail threads / active jobs.
- Center → Ask Scout conversation and current answer.
- Bottom composer → one plain ask box.
- Right rail → Trail Brief, current plan/docs, source confidence, and missing decision-critical facts.

## Mobile-first requirements

### M1. One-screen default

On mobile, the first screen must show:

- Scout status in plain language.
- One primary ask box.
- 4–6 trail job chips max.
- Primary send button.

It must not require profile completion, document import, source selection, provider details, or mode picking before asking.

### M2. Bottom-biased composer

The ask box/composer should stay easy to reach with one thumb. If the page grows, the composer should remain near the active conversation or become sticky after testing.

### M3. Rails become drawers, not columns

Desktop can use left/right rails. Mobile must collapse them into simple controls:

- `Threads` drawer for recent conversations/jobs.
- `Brief` drawer/card for today’s context.
- `Docs` drawer/card for saved plans/imports.

No three-column layout on mobile.

### M4. Progressive disclosure

Advanced/source/provider/debug details must stay hidden unless explicitly opened. The normal hiker should see trail jobs, answer, and next action — not infrastructure.

### M5. No setup wall

Signup/setup cannot imply a prerequisite checklist. Email is enough to start. Name, trail name, pace, current mile, gear, health, budget, and guide imports are optional and can be gathered over time.

## Desktop/tablet requirements

### D1. Three-pane workspace above wide breakpoint

At desktop width, use a trail-specific three-pane layout:

- **Left**: recent Scout turns / trail jobs / saved threads.
- **Center**: active conversation and ask box.
- **Right**: Trail Brief, Docs, source confidence, and missing facts.

The center conversation remains primary. Side panes are support, not command centers.

### D2. The left rail should be resumable, not noisy

The left rail should contain a short list of recent meaningful trail threads/jobs, not every low-level message. Examples:

- Today’s plan
- Next resupply
- First-week prep
- Gear shakedown
- Body risk check
- Family update draft

### D3. The right rail should answer “what is Scout using?”

The right rail should show only context that helps trust or continue the work:

- Trail Brief summary.
- Current saved plan/doc target.
- Key known profile facts.
- Missing decision-critical facts.
- Source confidence / last checked status.

## Conversation requirements

### C1. Ask by trail job, not feature

Prompt chips should be framed around hiker jobs:

- Today
- Next resupply
- Body check
- Update home
- First week
- Gear shakedown
- Budget + logistics

### C2. Beginner baseline by default

If the user gives thin context, Scout should still provide a conservative baseline and ask for the smallest missing detail set. It should not respond with “upload a guide first” or “complete setup first.”

### C3. Confidence must be visible but not scary

Reports should label facts as:

- `Known from your workspace`
- `Scout baseline estimate`
- `Needs current confirmation`

This should be compact, not an audit table unless expanded.

### C4. Reports must end with the next useful action

Every substantial answer should end with one clear next action, such as:

- “Confirm water/campsite before committing.”
- “Tell me your current mile and food days if you want this tightened.”
- “Save this as your current plan?”

## Document/context requirements

### X1. Docs are optional memory, not required homework

Docs/imports should be presented as ways to make Scout sharper over time, not as prerequisites.

### X2. Saved plans should be easy to update in place

A user should be able to say “update my plan” without understanding document IDs or storage.

### X3. Source receipts should be tucked away

Show the confidence/status summary first. Keep full source receipts in an expandable area.

## Acceptance checks

- A new user can enter with only email and reach `/app/claw`.
- A new user can ask Scout without creating a profile/manual first.
- Mobile `/app/claw` has one obvious primary action: ask Scout.
- Mobile does not show simultaneous left/right rails.
- Desktop can show thread, conversation, and context panes without making the center feel secondary.
- Setup copy clearly says optional/skip allowed.
- Scout prompt/system instructions do not require preexisting profile, mileage source, guide import, or docs.
- Reports distinguish baseline estimates from confirmed facts.
- Advanced beta/provider/source details are collapsed by default.
