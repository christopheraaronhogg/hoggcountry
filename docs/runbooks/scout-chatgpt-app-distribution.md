# Scout ChatGPT App Distribution Runbook

Last verified: 2026-06-19

## Distribution reality

The Scout ChatGPT app is not distributed by pushing code to GitHub. Public
distribution requires all of these steps:

1. Run the Apps SDK MCP server on a public, stable HTTPS URL.
2. Test the HTTPS MCP URL in ChatGPT Developer Mode.
3. Submit the app from the OpenAI Platform Dashboard for review.
4. After approval, publish the approved version from the dashboard.

OpenAI's current review flow requires the MCP server to be public, non-local,
and reviewable. Approved apps are not automatically visible on main directory
pages; users can find them by direct listing link or exact-name search unless
OpenAI grants enhanced distribution.

Canonical docs:

- https://developers.openai.com/apps-sdk/deploy
- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/app-submission-guidelines

## Hogg Country production shape

The Forge deploy starts two Node processes:

- `hoggcountry-scout` serves the Scout SvelteKit/PWA runtime on
  `127.0.0.1:3000`.
- `hoggcountry-scout-chatgpt-app` serves the ChatGPT Apps SDK MCP endpoint on
  `127.0.0.1:8788`.

Laravel exposes the MCP server at:

```text
https://hoggcountry.on-forge.com/mcp
```

That is the first review-ready MCP URL. If `app.hoggcountry.com` or another
custom app subdomain is later pointed at Forge, use the same `/mcp` path and set
`SCOUT_CHATGPT_APP_DOMAIN` to the final HTTPS origin.

## Runtime controls

Shared Forge env file:

```env
SCOUT_CHATGPT_APP_PROXY_ENABLED=true
SCOUT_CHATGPT_APP_PROXY_ORIGIN=http://127.0.0.1:8788
SCOUT_CHATGPT_APP_PORT=8788
SCOUT_CHATGPT_APP_DOMAIN=https://hoggcountry.on-forge.com
PUBLIC_SITE_ORIGIN=https://hoggcountry.com
```

Start or reload manually from the Forge repo root:

```bash
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout-chatgpt-app:pm2
pm2 save
```

Check status:

```bash
pm2 show hoggcountry-scout-chatgpt-app
pm2 logs hoggcountry-scout-chatgpt-app --lines 80
```

If `/mcp` initializes successfully but `serverInfo.name` is anything other than
`scout-chatgpt-app`, the public proxy is pointed at the wrong MCP process. As of
2026-06-19, this failure mode was observed with the KJV reader still answering
on the Hogg Country `/mcp` endpoint. On Forge, check which process owns port
`8788`, reload `hoggcountry-scout-chatgpt-app`, and make sure
`SCOUT_CHATGPT_APP_PROXY_ORIGIN` points at the Scout app process:

```bash
ss -ltnp | grep ':8788'
pm2 list
pm2 show hoggcountry-scout-chatgpt-app
cd /home/forge/hoggcountry.on-forge.com/current
npm run forge:scout-chatgpt-app:pm2
pm2 save
```

Smoke test:

```bash
curl -fsS -X POST https://hoggcountry.on-forge.com/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

## Submission checklist

Before opening review in the OpenAI Platform Dashboard:

- Verify `https://hoggcountry.on-forge.com/mcp` initializes successfully.
- Test the app in ChatGPT Developer Mode with the exact `/mcp` URL.
- Capture web and mobile screenshots of the Scout widget.
- Confirm all tools are read-only and have correct hint annotations.
- Confirm the privacy policy covers the data returned by tools.
- Prepare app name, logo, short description, company URL, privacy policy URL,
  test prompts, expected responses, and any localization fields.
- Upload or copy from `apps/scout-chatgpt-app/chatgpt-app-submission.json`
  where the dashboard supports prefilled submission details.
- Complete individual or business verification for the publishing name.
- Use a global data residency project; EU data residency projects cannot submit
  apps for review in the current flow.

The dashboard path is:

```text
OpenAI Platform Dashboard -> Apps SDK / Apps -> app draft -> Versions -> Submit for review
```

After approval, select `Publish` in the dashboard. Publishing is a separate
step from approval.
