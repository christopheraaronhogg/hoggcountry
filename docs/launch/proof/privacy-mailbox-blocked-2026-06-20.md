# Privacy mailbox delivery proof - blocked

Date: 2026-06-20

Purpose: verify that the published privacy/deletion contact, `privacy@hoggcountry.com`, can receive mail before App Store / Play Store submission.

## Result

Blocked. A live test message sent to `privacy@hoggcountry.com` bounced with a remote-server failure:

```text
554 5.7.1 : Relay access denied
```

This means the privacy/deletion mailbox cannot be treated as reachable yet.

## Evidence

- Connected Gmail account checked by Codex: `chris.stitchscreen@gmail.com`
- Test subject: `Hogg Country privacy mailbox release proof 20260620T190538Z`
- Sent timestamp: `2026-06-20T19:05:44Z`
- Sent Gmail message id: `19ee66cb550b04d8`
- Bounce timestamp: `2026-06-20T19:05:45Z`
- Bounce Gmail message id: `19ee66cba1ee87f5`
- Bounce sender: `Mail Delivery Subsystem <mailer-daemon@googlemail.com>`
- Bounce summary: "Your message couldn't be delivered to privacy@hoggcountry.com because the remote server is misconfigured."
- MX lookup for `hoggcountry.com` returned Namecheap forwarding hosts:

```text
10 eforward1.registrar-servers.com.
10 eforward2.registrar-servers.com.
10 eforward3.registrar-servers.com.
15 eforward4.registrar-servers.com.
20 eforward5.registrar-servers.com.
```

## Commands and searches

```bash
dig +short MX hoggcountry.com
dig +short TXT hoggcountry.com
```

Gmail searches:

```text
subject:"Hogg Country privacy mailbox release proof 20260620T190538Z" -in:sent -in:trash -in:spam
subject:"Hogg Country privacy mailbox release proof 20260620T190538Z" in:inbox
"20260620T190538Z" newer_than:1d -in:trash -in:spam
(from:mailer-daemon OR from:postmaster OR subject:(undelivered OR delivery OR failure OR returned)) "privacy@hoggcountry.com" newer_than:1d -in:trash -in:spam
```

## Required follow-up

Fix the `privacy@hoggcountry.com` mailbox or forwarding configuration, then send a fresh external test message and confirm a received, non-bounced copy in the monitored inbox. Only then should `privacy-contact-and-deletion` move from `blocked` to `verified` in `docs/launch/release-evidence.json`.
