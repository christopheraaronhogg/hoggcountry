# Auth Backend Bootstrap (February 7, 2026)

## Objective
Start the first backend-auth foundation so hikers can log in and we can move profile data out of browser-only storage.

## Task List
- [x] Align header UX work in parallel with account rollout:
  - [x] Match Tools menu toggle height to Guide button.
  - [x] Add a representative icon to the Guide button.
  - [x] Rename Character page surfaces to My Profile.
- [x] Improve homepage videos section:
  - [x] Parse and expose video description text from YouTube RSS.
  - [x] Render short excerpts in the dispatch cards.
- [x] Add auth backend primitives (Netlify Functions):
  - [x] Shared auth helper for password verification + cookie sessions.
  - [x] `auth-login` function (POST).
  - [x] `auth-session` function (GET).
  - [x] `auth-logout` function (POST).
- [x] Add frontend entry point:
  - [x] `/login` page with form-based login flow.
  - [x] Add login link in the tools drawer.
- [x] Add developer setup tooling:
  - [x] `npm run auth:user -- <email> <password> [display name]`
  - [x] Environment variable contract documented in `developing.md`.

## Environment Contract
- `AUTH_SESSION_SECRET`: random secret string, minimum 32 characters.
- `AUTH_USERS_JSON`: JSON array of users:

```json
[
  {
    "id": "jimmy-hogg",
    "email": "jimmy@example.com",
    "name": "Jimmy Hogg",
    "salt": "<hex salt>",
    "passwordHash": "<hex scrypt hash>"
  }
]
```

## Next Backend Milestones
- Move user records from env JSON to a real database table (`users`, `profiles`, `sessions`).
- Add signup + password reset flows.
- Gate My Profile and saved data endpoints behind authenticated sessions.
- Introduce server-side persistence for profile + tool state.
