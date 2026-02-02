# HoggCountry “Big Picture” Platform Diagram (Draft)

Date: 2026-02-02

This is the current target architecture direction:
- **Web:** Astro + Svelte
- **Native app:** TBD (Expo/React Native vs Swift+Kotlin vs other)
- **Backend:** Laravel (HoggCountryOS API)
- **Queue:** Redis + workers
- **DB:** Postgres (source of truth)
- **Object storage:** Cloudflare R2 (S3-compatible)
- **Search/index:** optional (Meilisearch and/or pgvector)

## Diagram (Mermaid)

```mermaid
flowchart LR

subgraph Clients
  WEB["HoggCountry Web (Astro/Svelte)"]
  NATIVE["Native App (iOS/Android)"]
  ASSIST["Appalachian Assistant (bot + automations)"]
end

subgraph Platform
  API["HoggCountryOS API (Laravel)"]
  Q["Queue/Jobs (Redis + workers)"]
end

subgraph Data
  DB[("Postgres (source of truth)")]
  OBJ[("Object Storage (S3/R2)")]
  IDX[("Search/Index (optional: Meilisearch/pgvector)")]
end

WEB -->|HTTPS| API
NATIVE -->|HTTPS| API
ASSIST -->|"HTTPS (service token)"| API

API --> DB
API --> OBJ
API --> IDX
API --> Q

Q --> DB
Q --> OBJ
```

## Notes
- Keep **DB as source of truth**; object storage is for blobs (images, GPX, exports, etc.).
- The **Assistant** should call the API using a service token and only expose whitelisted actions.
- Search can start as **Postgres full-text** or **pgvector**, then graduate to Meilisearch if needed.
