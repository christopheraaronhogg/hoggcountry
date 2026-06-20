# Privacy and deletion contact proof

Date: 2026-06-20

Purpose: verify that the currently published Trail Assistant privacy/deletion
contact can receive mail before App Store / Play Store submission.

## Result

Verified. The published contact was changed from the broken custom-domain
forwarder, `privacy@hoggcountry.com`, to the monitored Gmail account
`chris.stitchscreen@gmail.com`. A fresh test message to that address appeared
in the connected Gmail inbox.

The old custom-domain address remains documented separately in
`docs/launch/proof/privacy-mailbox-blocked-2026-06-20.md` as a failed proof
attempt.

## Evidence

- Connected Gmail profile: `chris.stitchscreen@gmail.com`
- Current published contact: `chris.stitchscreen@gmail.com`
- Test subject: `Hogg Country privacy mailbox release proof 20260620T1924Z`
- Gmail message id: `19ee67ea26693099`
- Gmail thread id: `19ee67ea26693099`
- From: `Chris Hogg <chris.stitchscreen@gmail.com>`
- To: `chris.stitchscreen@gmail.com`
- Timestamp: `2026-06-20T19:25:19Z`
- Labels: `UNREAD`, `SENT`, `INBOX`

The `INBOX` label proves the monitored mailbox received the message; this is not
only an outbound sent copy.

## Gmail searches

```text
subject:"Hogg Country privacy mailbox release proof 20260620T1924Z" in:inbox -in:trash -in:spam
subject:"Hogg Country privacy mailbox release proof 20260620T1924Z" -in:trash -in:spam
```

Both searches returned Gmail message id `19ee67ea26693099`.

## Source files updated to use this contact

- `apps/openclaw-web/src/routes/data/+page.svelte`
- `apps/openclaw-web/src/routes/privacy/+page.svelte`
- `apps/openclaw-web/src/routes/support/+page.svelte`
- `apps/openclaw-web/src/routes/terms/+page.svelte`
- `docs/launch/privacy/privacy-policy.md`
- `docs/launch/privacy/privacy-policy.html`
- `docs/launch/privacy/app-privacy-and-data-safety.md`
- `docs/launch/store-copy/google-play.md`
- `docs/launch/store-copy/review-notes.md`
- `docs/launch/CONSISTENCY-REVIEW.md`
- `docs/launch/MORNING-BRIEF.md`
- `mobile/scripts/release-proof.mjs`

## Remaining follow-up

Re-verify the live `/privacy`, `/support`, `/terms`, and `/data` pages after the
contact change deploys to Forge. The custom-domain `privacy@hoggcountry.com`
forwarder can be restored later only after a new non-bounced mailbox proof.
