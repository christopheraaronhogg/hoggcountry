# Portable text handoff design

## Goal

Replace body-bearing `sms:` URLs with one truthful, portable handoff for safe
check-ins, need-help details, and map invites. The app must never imply a share
sheet sent or delivered a message, expose a group of recipients to one another,
or enable location sharing as a side effect of preparing an invite.

## Chosen approach

Pure domain builders return message text. They do not know about browsers, SMS
URI syntax, recipients, or delivery. A shared `handoffText` adapter receives a
title, text, and optional URL. Installed iOS and Android apps prefer Capacitor's
native Share and Clipboard plugins; the web build uses Web Share and the browser
clipboard. If the chooser returns, Scout reports only that control returned. An
abort may mean either cancellation or no available target, so Scout combines
those cases and does not copy sensitive text as a side effect. Other share
failures fall back to the clipboard. If neither path succeeds, Scout reports
unavailable while keeping any visible prepared draft intact.

Capacitor 7 reports a native chooser cancellation as the plain message
`Share canceled`, not a browser `AbortError`; the adapter recognizes both forms.
Native mode does not open a second Web Share chooser after an awaited plugin
failure because that browser path can no longer rely on transient activation.

This is preferable to operating-system-specific SMS URL construction, which is
inconsistent for message bodies and multiple recipients, and to copying text
before opening Messages, which creates a surprising two-step flow. Direct
`tel:` links remain because they target one explicit person without claiming
message delivery.

## UI and safety behavior

Today and Safety label the separate action “Share safe update.” Need help logs a
local check-in before opening the handoff and states that Scout cannot confirm
delivery or replace 911, inReach, or PLB. Busy guards prevent repeat taps from
logging duplicate need-help records. Emergency location is deliberately two
steps: first get one foreground GPS fix and show the complete draft, then let the
user tap Share or Copy. This preserves browser user activation and gives the
hiker a reviewable/manual fallback. A refresh action can replace a stale or
no-GPS emergency draft without logging another check-in. Ordinary Need Help also
keeps its prepared text visible with an explicit Copy action, and reopening its
share chooser reuses that draft instead of logging a duplicate check-in. A
separate “Start new help request” action deliberately logs and rebuilds a later
incident with the current saved mile. Map invites use the same adapter and do not
mutate the group’s live-sharing flag. Outcome copy distinguishes returned
handoff, copied, canceled-or-no-target, and unavailable.

## Verification

Unit tests cover all adapter outcomes, native-first selection, browser fallback,
explicit copy, and pure message builders. Component contracts verify truthful
labels, local logging, duplicate guards, and the separate GPS/share actions. A
repository scan must find no `sms:` URL containing a body in `mobile/src`.
Mobile type checking, the full mobile test suite, native Capacitor sync, and the
production mobile build remain required before push.
