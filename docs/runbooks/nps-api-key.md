# NPS API Key Setup

Hogg Country keeps the National Park Service API key server-side in Laravel. Do not put the key in `mobile/.env`, `VITE_*`, or `PUBLIC_*`; the mobile/PWA bundle is static and would expose it.

## Get The Key

1. Open the official NPS signup page: <https://www.nps.gov/subjects/developer/get-started.htm>
2. Fill out the embedded `api.data.gov` form for the National Park Service API.
3. Save the 40-character key somewhere private.

NPS documents the API base URL as `https://developer.nps.gov/api/v1` and recommends sending the key in the `X-Api-Key` request header.

## Configure Laravel

Set these in `backend/.env` locally and in Forge environment variables for production:

```dotenv
NPS_API_KEY=your-40-character-key
NPS_API_BASE_URL=https://developer.nps.gov/api/v1
NPS_API_TIMEOUT=8
NPS_API_CONNECT_TIMEOUT=3
```

If config is cached on the server, clear or rebuild Laravel config after changing the key:

```sh
php artisan config:clear
```

## Smoke Test

The Laravel API proxies a small allowlist of NPS resources so the key never ships to the app:

```sh
curl 'https://hoggcountry.com/api/v1/nps/parks?parkCode=acad&limit=1'
```

Allowed resources are `parks`, `campgrounds`, `alerts`, `events`, and `visitorcenters`.
