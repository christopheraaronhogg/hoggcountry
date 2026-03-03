# Trail Assistant FAQ (Privacy + Map Safety)

Last updated: 2026-03-02

## 1) Who can see my location by default?
Your location sharing default is **private**.

That means your check-ins are stored for your own app experience, but they are not shown on shared feeds unless you opt in.

## 2) What sharing controls do I have?
You can control:
- **Scope:** `private`, `trusted`, or `public`
- **Precision:** `exact` or `coarse`
- **Delay:** visibility delay in minutes before shared feeds can display a check-in

Safety-first defaults remain privacy-preserving:
- default scope is `private`
- public sharing is delayed (no instant public live tracking)
- coarse mode is available to reduce location precision

## 3) What is the difference between "trusted" and "public"?
- **trusted:** visible on authenticated shared feeds after delay
- **public:** visible on public feeds after enforced delay

If you are unsure, keep `private` until you explicitly want to share.

## 4) Are map hazard reports visible to everyone immediately?
No.

New map reports are treated as unverified first. Public feeds only show reports that pass verification trust rules (`trusted` or `moderator_verified`).

This helps reduce misinformation and panic from unconfirmed reports.

## 5) How does map-report verification/moderation work?
Moderators can:
- verify reports (`trusted` / `moderator_verified`)
- resolve reports when conditions change
- review immutable audit history for accountability

Moderation actions are authenticated and logged for incident review.

## 6) How does Trail Assistant resist abuse/spam?
Safety controls include:
- authenticated write routes for sensitive actions
- route-level throttling
- user-scoped idempotency replay handling
- duplicate-window guards for repeated payloads
- moderator quarantine path for suspicious intake requests
- audit trails for verification and resolution events

## 7) What happens during an emergency?
Use the SOS escalation flow. SOS requests require explicit confirmation and enter a manual review queue (`pending_review`) for responder action.

Additional abuse resistance is enforced (cooldown + daily cap + duplicate protections) so the queue stays actionable for real emergencies.

If there is immediate danger, call local emergency services first.

## 8) What is the incident response path if something looks unsafe?
If suspicious or unsafe activity is detected:
1. Quarantine or contain the request
2. Log the incident with relevant context
3. Escalate for human review through the defined security path
4. Keep affected data/actions restricted until review is complete

Trail Assistant does not execute untrusted user-provided commands or binaries.
