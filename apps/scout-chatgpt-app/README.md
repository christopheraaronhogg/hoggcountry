# Scout ChatGPT App

Apps SDK prototype for exposing Hogg Country Scout inside ChatGPT.

This is a read-only ChatGPT app for bringing Hogg Country Scout context into
trail-planning conversations. It is intentionally not a mini clone of the field
runtime; ChatGPT gets source-backed planning and compact visual summaries while
the Scout/OpenClaw app continues to own offline field use, GPS, notifications,
and saved device state.

- `search` and `fetch` expose the license-aware AT open-reference RAG docs as standard ChatGPT knowledge tools. The generated public field-guide corpus stays out of the ChatGPT submission surface until its third-party provenance has been reviewed.
- `get_trail_reference_snapshot` reports what datasets Scout can use and the caveats attached to route, water, town, terrain, and live-condition data.
- `find_nearby_trail_context` pulls candidate water, shelters, campsites, privies, vistas, trailheads, resupply towns, terrain screens, state rules, and live-source pointers around a NOBO mile marker.
- `get_today_brief`, `plan_next_day`, `plan_next_week`, `find_next_resupply`, `build_section_plan`, and `draft_scout_document` return structured planning outputs and render through the Scout widget.

## Capability Surface

| Value axis | Scout capability | Current tools |
| --- | --- | --- |
| Know | Pull source-backed Scout AT open-reference context into the conversation. | `search`, `fetch` |
| Know | Pull license-aware AT open-reference pack inventory and candidate records. | `get_trail_reference_snapshot`, `find_nearby_trail_context` |
| Show | Render compact HUD, context, section-plan, resupply, and document views when structured trail cues beat plain text. | `get_today_brief`, `plan_next_day`, `plan_next_week`, `find_next_resupply`, `build_section_plan`, `draft_scout_document` |
| Do | No mutating field actions yet. Future candidates: save plan, create checklist, subscribe to alerts, send watch notification. | none |

The app should win when the user asks for:

- Vague planning help: "Help me think through tomorrow on trail."
- Specific planning help: "I am NOBO at mile 42, carrying 2.5L, and want a conservative day."
- Source-backed lookup: "Find Scout's open-reference resupply context for this section."
- Candidate-data lookup: "What water, shelter, and terrain leads are ahead of NOBO mile 42?"
- Section planning: "Build a 3-day plan from NOBO mile 31 to 68."
- Document drafting: "Draft my safety risk brief for Virginia."
- Compact visual summary: "Show me the trail HUD for today."

The app should not claim live conditions yet. Weather, closures, water reports,
town services, device push, and watch notifications are future capabilities that
need live data/auth before they become field-reliable.

The AT open-reference pack also has explicit limits:

- Generated open-route miles are Scout candidate miles, not official ATC/guidebook miles.
- Water records are mapped candidates with unknown reliability and potability unless a current licensed source says otherwise.
- Shelter, campsite, trailhead, vista, privy, and town records are open-data candidates that require current access/service confirmation.
- Permit, fee, weather, closure, flooding, fire/smoke, bear, and Baxter/Katahdin details require live official checks before field reliance.
- Blocked sources such as FarOut, The A.T. Guide/AWOL, AT Data Book, copied ATC resources, AllTrails, Gaia GPS, Hiking Project, private guide PDFs, and copied guidebook notes must stay as pointer/check targets only unless Hogg Country obtains written permission or a compatible license.

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

## Production Distribution

The Forge deployment runs this MCP server as `hoggcountry-scout-chatgpt-app` on
`127.0.0.1:8787` and Laravel proxies the public MCP endpoint at:

```text
https://hoggcountry.on-forge.com/mcp
```

That public HTTPS URL is the endpoint to use for ChatGPT Developer Mode testing
and the OpenAI Platform review flow. See
`docs/runbooks/scout-chatgpt-app-distribution.md` for the full submission and
publishing checklist. `chatgpt-app-submission.json` contains the review-facing
app info, tool hint justifications, and test cases for the dashboard upload.

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

Archetype: connector-style planning app with a reusable `vanilla-widget`.

The MCP server owns tool descriptions, schemas, and resource registration. The widget is a single static HTML file under `public/` and listens for Apps SDK tool-result notifications.

The app follows current Apps SDK guidance:

- MCP server required at `/mcp`.
- UI resource served as `text/html;profile=mcp-app`.
- Tool results return concise `structuredContent`.
- The widget listens for `ui/notifications/tool-result` through the MCP Apps bridge and uses `window.openai` only as an optional compatibility layer.

## Evaluation Fixture

`evals/capability-cases.json` contains the first routing/evaluation set. Use it
to check whether the tool surface handles vague, specific, no-brand-awareness,
negative, and edge-case prompts without turning into a full product clone.

Docs followed:

- https://developers.openai.com/apps-sdk/quickstart
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/plan/tools
- https://developers.openai.com/apps-sdk/reference
- https://developers.openai.com/apps-sdk/deploy
