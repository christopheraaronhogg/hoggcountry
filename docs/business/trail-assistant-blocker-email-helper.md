# Trail Assistant Blocker Email Helper

Last updated: 2026-03-03

## Purpose
Standardize owner-decision blocker escalations when a blocker is unresolved for more than 24 hours.

Helper script:
- `scripts/trail_assistant_blocker_email_helper.py`

## Rule enforced
Escalate only when both are true:
1. blocker age >= 24 hours (configurable), and
2. owner decision is required.

If threshold is not met, helper exits with `NO_ESCALATION`.

## Draft-only (default)
The helper generates an email draft and does **not** send by default.

```bash
npm run trail-assistant:blocker-email -- \
  --task "P0.7 Resolve production deploy drift (Netlify/Forge route mismatch)" \
  --blocked-since "2026-03-02 18:35" \
  --decision-needed "Choose deploy authority path for Netlify + Forge alignment" \
  --option-a "Owner grants direct deploy-surface access so automation can run production verification and route fixes" \
  --option-b "Owner executes supplied deploy commands manually and returns logs for verification" \
  --default-path "Continue local demo-safe path and hold public rollout until deploy parity is verified" \
  --deadline "2026-03-04 09:00" \
  --context "Public URLs still return 404/500 while local routes and APIs pass" \
  --context "No safety-critical moderation/privacy controls were relaxed while blocked"
```

Default draft output:
- `docs/business/daily-updates/assets/<today>/blocker-email-<task-slug>.txt`

## Auto-send guard (explicit opt-in)
`--auto-send` is blocked unless both are provided:
- `--confirm-send SEND_BLOCKER_EMAIL`
- `--send-command '<shell command template with {to} and {subject}>'`

The helper pipes body text to the send command via STDIN.

Example guarded send:
```bash
npm run trail-assistant:blocker-email -- \
  ...args... \
  --auto-send \
  --confirm-send SEND_BLOCKER_EMAIL \
  --send-command 'mail -s "{subject}" {to}'
```

If either guard is missing, send is refused (`SEND_BLOCKED`) and the draft remains on disk.

## Required email structure
The helper always includes:
- task + blocked duration
- decision needed
- option A
- option B
- default path + deadline
- current safety posture while blocked
