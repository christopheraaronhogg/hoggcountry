# Self-hosting SpacetimeDB (live tramily/family location)

The Phase 3 live-location feature runs on a self-hosted SpacetimeDB instance (we
are **not** using Maincloud). This runbook stands one up and publishes the module
at `apps/openclaw-web/spacetimedb`. Until this is done, live location is dormant
and the app is fully usable with the local-only people roster.

The module is verified — it publishes, `join_group`/`publish_position` work, and
the privacy boundary holds (a member sees a position, a non-member sees nothing;
the raw `group_member`/`group_position` tables are server-private and never sent
to clients). The only blocker to going live is infrastructure: a root-capable
host + DNS.

## What you (Chris) must provide before the handoff

1. **An Ubuntu host with root / passwordless sudo.** A small dedicated VPS is
   preferred over the Forge web box — SpacetimeDB is a long-running stateful
   service, and Forge manages nginx/deploys on `adn-forge` and can overwrite a
   hand-rolled site config. (`forge` user there has no passwordless sudo, which is
   why the first attempt was blocked.)
2. **DNS**: an `A` record `stdb.hoggcountry.com` → the host's public IP.
3. Hand the host + DNS to whoever finishes the standup (Codex or you).

## 1. Install SpacetimeDB (CLI + standalone)

Match the server version to the CLI that publishes the module — currently
`2.3.0`. It's fine to upgrade **both** to the latest `2.6.x`, just keep them in
sync.

```bash
curl -sSf https://install.spacetimedb.com | sh   # installs CLI + standalone server
spacetime --version                              # confirm
```

## 2. Run it as a service (systemd)

Dedicated user, persistent data dir, bound to localhost (TLS is terminated by the
proxy in step 3). Confirm flags against the installed version with
`spacetime start --help`.

```ini
# /etc/systemd/system/spacetimedb.service
[Unit]
Description=SpacetimeDB standalone
After=network.target

[Service]
User=spacetimedb
Group=spacetimedb
ExecStart=/usr/local/bin/spacetime start --listen-addr 127.0.0.1:3000 --data-dir /var/lib/spacetimedb
Restart=always
RestartSec=3
StateDirectory=spacetimedb

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd --system --home /var/lib/spacetimedb --shell /usr/sbin/nologin spacetimedb
sudo mkdir -p /var/lib/spacetimedb && sudo chown spacetimedb:spacetimedb /var/lib/spacetimedb
sudo systemctl daemon-reload && sudo systemctl enable --now spacetimedb
sudo systemctl status spacetimedb
```

## 3. TLS + WebSocket reverse proxy (nginx)

The iOS app connects over a secure WebSocket, so terminate TLS at nginx and proxy
both HTTP (publish/sql) and WS (subscribe) to `127.0.0.1:3000`. The `Upgrade` /
`Connection` headers are required for the WebSocket subscription to work.

```nginx
# /etc/nginx/sites-available/stdb.hoggcountry.com
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

server {
    listen 443 ssl http2;
    server_name stdb.hoggcountry.com;

    # ssl_certificate / ssl_certificate_key — issue with certbot (below)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 1h;   # long-lived subscriptions
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stdb.hoggcountry.com /etc/nginx/sites-enabled/
sudo certbot --nginx -d stdb.hoggcountry.com   # issues + wires the TLS cert
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Publish the module

From a machine with the repo + CLI (point a CLI "server" at the host):

```bash
cd apps/openclaw-web/spacetimedb
spacetime server add --url https://stdb.hoggcountry.com prod   # one-time
spacetime publish -s prod hoggcountry
```

(The `tsc not found in node_modules` warning is benign — the module build does not
need a local `tsc` and reports `Build finished successfully`.)

## 5. Point the mobile build at it + rebuild

These are **build-time** Vite vars for the iOS app (the mobile build reads
`PUBLIC_`-prefixed env after commit `1fa394e`):

```
PUBLIC_SPACETIMEDB_HOST=https://stdb.hoggcountry.com
PUBLIC_SPACETIMEDB_DB_NAME=hoggcountry
```

Then rebuild + ship: `npm --prefix mobile run cap:sync` → TestFlight. With these
set, `memberLocation` connects and live location flips from dormant to on.

## 6. Smoke test (once published)

```bash
spacetime call   -s prod hoggcountry join_group '"smoke-test-12345"' '"Smoke"'
spacetime sql    -s prod hoggcountry "SELECT group_code FROM group_member"   # → "smoke-test-12345"
spacetime delete -s prod hoggcountry   # ONLY if you want a clean slate afterward
```

## Security notes

- The privacy model is server-enforced: `group_member` / `group_position` are
  **private** tables (never sent to clients); clients read only the sender-scoped
  views `my_group_positions` / `my_group_members`. Never mark those tables public.
- A client's identity is a token it persists on-device; keep the server's default
  token issuance on — the per-group visibility scoping depends on stable client
  identities.
- `group_code` is a bearer secret: anyone with a code can join that group (the
  intended invite-link model). There is no kick / code-rotation yet — that's a
  later phase.
- Live multi-device delivery (an authenticated member's live subscription) can
  only be confirmed on real devices once the server is up; the visibility *logic*
  and reducers are verified.
```
