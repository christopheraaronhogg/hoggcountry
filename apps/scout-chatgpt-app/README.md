# Scout ChatGPT App

Apps SDK prototype for exposing Hogg Country Scout inside ChatGPT.

This is a read-only first pass:

- `search` and `fetch` expose the public Hogg Country guide/corpus as standard ChatGPT knowledge tools.
- `get_today_brief` renders a compact Scout Today widget.
- `plan_next_day`, `plan_next_week`, and `find_next_resupply` return deterministic planning scaffolds that ChatGPT can reason over.

## Run Locally

```bash
npm install
npm run dev:scout-app
```

The MCP endpoint is:

```text
http://localhost:8787/mcp
```

Health check:

```bash
curl http://localhost:8787/
```

Inspect tools locally:

```bash
npm run inspect -w @hoggcountry/scout-chatgpt-app
```

Optional environment:

- `PORT` - local MCP server port, defaults to `8787`.
- `PUBLIC_SITE_ORIGIN` - canonical origin used for `search`/`fetch` result URLs, defaults to `https://hoggcountry.com`.
- `SCOUT_APP_DOMAIN` - stable widget domain for app submission metadata when the deployed HTTPS origin is known.

## Connect To ChatGPT Developer Mode

ChatGPT needs a public HTTPS MCP URL, even while developing locally.

```bash
ngrok http 8787
```

Then in ChatGPT:

1. Enable Developer Mode under `Settings -> Apps & Connectors -> Advanced settings`.
2. Create a connector/app under `Settings -> Connectors`.
3. Paste the tunneled MCP URL, including `/mcp`, for example:

```text
https://example.ngrok.app/mcp
```

Refresh the connector after changing tools, metadata, or widget resources.

## App Shape

Archetype: `vanilla-widget`.

The MCP server owns tool descriptions, schemas, and resource registration. The widget is a single static HTML file under `public/` and listens for Apps SDK tool-result notifications.

Docs followed:

- https://developers.openai.com/apps-sdk/quickstart
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/deploy/submission
