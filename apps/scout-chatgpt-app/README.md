# Scout ChatGPT App

Apps SDK prototype for exposing Hogg Country Scout inside ChatGPT.

This is a focused, read-only first pass. It is intentionally not a mini clone of
the full trail app; it gives ChatGPT a few reusable Scout powers it can invoke
inside trail-planning conversations.

- `search` and `fetch` expose the public Hogg Country guide/corpus as standard ChatGPT knowledge tools.
- `get_today_brief` renders a compact Scout Today widget.
- `plan_next_day`, `plan_next_week`, and `find_next_resupply` return deterministic planning scaffolds that ChatGPT can reason over.

## Capability Surface

| Value axis | Scout capability | Current tools |
| --- | --- | --- |
| Know | Pull public, source-backed Hogg Country trail context into the conversation. | `search`, `fetch` |
| Show | Render a compact HUD-style view when structured trail cues beat plain text. | `get_today_brief` |
| Do | No mutating field actions yet. Future candidates: save plan, create checklist, subscribe to alerts, send watch notification. | none |

The app should win when the user asks for:

- Vague planning help: "Help me think through tomorrow on trail."
- Specific planning help: "I am NOBO at mile 42, carrying 2.5L, and want a conservative day."
- Source-backed lookup: "Find the Hogg Country resupply guidance for this section."
- Compact visual summary: "Show me the trail HUD for today."

The app should not claim live conditions yet. Weather, closures, water reports,
town services, device push, and watch notifications are future capabilities that
need live data/auth before they become field-reliable.

## Design Rules

- Keep tools small and composable so ChatGPT can call Scout as one step in a broader conversation.
- Start useful on the first turn: return a plan scaffold or HUD before asking for extra profile detail.
- Use minimal structured inputs. Do not ask ChatGPT to send the whole conversation.
- Return stable IDs, concise structured output, and source receipts so follow-up tools can build on the result.
- Preserve the standard `search` and `fetch` tool shape for knowledge-style access.

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

## Evaluation Fixture

`evals/capability-cases.json` contains the first routing/evaluation set. Use it
to check whether the tool surface handles vague, specific, no-brand-awareness,
negative, and edge-case prompts without turning into a full product clone.

Docs followed:

- https://developers.openai.com/apps-sdk/quickstart
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/deploy/submission
- https://developers.openai.com/apps-sdk/plan/tools
