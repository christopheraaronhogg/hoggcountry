# Trail Assistant Subscription Event Model (Pre-Stripe)

Last updated: 2026-02-27

## Purpose
Define entitlement state transitions before Stripe account onboarding, so app/backend logic is ready to wire.

## Event types
- `subscription.trial_started`
- `subscription.activated`
- `subscription.renewed`
- `subscription.payment_failed`
- `subscription.grace_started`
- `subscription.canceled`
- `subscription.expired`

## Entitlement states
- `free`
- `active`
- `grace`
- `past_due`
- `canceled`

## Required payload fields
- `event_id` (unique)
- `user_id`
- `plan_id`
- `state_before`
- `state_after`
- `effective_at`
- `provider` (`internal|stripe`)
- `provider_reference` (nullable until Stripe live)

## App behavior rules
- if `active`: full chat + check-ins + progress history
- if `grace`: allow chat/check-ins, show payment warning
- if `past_due`: reduced chat quota, keep data read access
- if `canceled|expired`: fallback to free features only

## Stripe mapping (later)
- Stripe `checkout.session.completed` -> `subscription.activated`
- Stripe `invoice.payment_succeeded` -> `subscription.renewed`
- Stripe `invoice.payment_failed` -> `subscription.payment_failed`
- Stripe `customer.subscription.deleted` -> `subscription.canceled`
