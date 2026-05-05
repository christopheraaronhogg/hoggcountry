# Scout research-backed RAG/tooling implementation

Date: 2026-05-04
Status: implementation recommendation after live native-tool dogfood

## Decision

The best implementation for Hogg Country Scout is **host-orchestrated corrective RAG with deterministic trail validators**, not an agent-only tool loop.

For cheap/default models like `deepseek-v4-pro`, Scout should not rely on the model to decide when to call tools, whether the retrieved evidence is enough, or whether a route is valid. The host app should:

1. classify the user request and risk level;
2. retrieve/open source evidence from a license-cleared catalog;
3. run deterministic validators for route order, mileage, shelters/towns, water/service freshness, and official alerts;
4. generate a compact evidence packet with source receipts;
5. let the model write the answer using that packet;
6. extract/check atomic claims after generation; and
7. refuse or downgrade unsupported exact trail claims.

Native tools can stay available, but they are a secondary capability. For itinerary planning, the host must gather and validate evidence before the model writes.

## Why this is the right direction

The live Pine Grove Furnace test failed in the exact way RAG papers warn about: retrieval/tooling was present, but the model still produced unsupported or misordered route facts. A trail product needs a stronger contract than "the model had access to a tool."

Scout's safety-critical claims need this rule:

> If a named route point, mileage, service, water source, closure, or weather alert is not backed by a source receipt or deterministic validator, Scout must not present it as fact.

## Papers reviewed and what they imply for Scout

| Paper | Finding | Scout implementation consequence |
|---|---|---|
| Lewis et al., **Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks** (2020), arXiv:2005.11401 | RAG combines parametric model knowledge with explicit non-parametric memory, helping provenance and knowledge updates. | Build a source catalog and evidence receipts. Do not expect the model's memory to carry trail facts. |
| Gao et al., **Retrieval-Augmented Generation for Large Language Models: A Survey** (2023/2024), arXiv:2312.10997 | RAG has evolved from naive retrieve-then-read into advanced/modular pipelines with separate retrieval, generation, and augmentation controls. | Implement Scout as a modular pipeline: classify -> retrieve -> validate -> generate -> verify. |
| Karpukhin et al., **Dense Passage Retrieval for Open-Domain Question Answering** (2020), arXiv:2004.04906 | Dense retrievers can outperform sparse retrieval on open QA by improving top-k passage retrieval. | Use embeddings for semantic source search, especially for guide/manual prose. |
| Khattab & Zaharia, **ColBERT** (2020), arXiv:2004.12832 | Late-interaction retrieval improves relevance with much lower query-time cost than full cross-encoder reranking. | V1 can use lexical + embedding retrieval; later add reranking/late interaction for larger source packs. |
| Liu et al., **Lost in the Middle** (2023), arXiv:2307.03172 | LLMs can ignore relevant facts buried in the middle of long contexts. | Keep evidence packets short, ranked, and structured. Put critical route facts and warnings at the top and bottom. |
| Asai et al., **Self-RAG** (2023), arXiv:2310.11511 | Adaptive retrieval and self-critique improve factuality and citation accuracy. | Scout should decide retrieval need by host classifier and run a critique/claim-check pass before saving an itinerary. |
| Yan et al., **Corrective Retrieval Augmented Generation** (2024), arXiv:2401.15884 | A retrieval evaluator can detect poor retrieval, trigger corrective actions, and use web search when static corpora are weak. | Add retrieval confidence. If source hits are weak/ambiguous, fetch official/live sources or say exactly what needs verification. |
| Jiang et al., **Active Retrieval Augmented Generation / FLARE** (2023), arXiv:2305.06983 | Long-form generation needs retrieval across the generation, not only once at the beginning. | For multi-day plans, retrieve per section: route, camping, water, resupply, weather, fire/ticks, checklist. |
| Trivedi et al., **IRCoT** (2022/2023), arXiv:2212.10509 | Multi-step QA improves when retrieval is interleaved with reasoning steps. | For itinerary prompts, break the answer into route-leg subquestions and validate each leg independently. |
| Yao et al., **ReAct** (2022/2023), arXiv:2210.03629 | Interleaving reasoning and actions helps models gather external facts and reduce hallucination on QA/fact verification. | Keep typed tools, but use them inside controlled host loops for trail-critical tasks. |
| Schick et al., **Toolformer** (2023), arXiv:2302.04761 | LMs can learn when/how to call APIs for facts, arithmetic, search, etc. | Tools are useful, but exact mileage arithmetic and route ordering should be API/program outputs, not prose model judgments. |
| Gao et al., **RARR** (2022/2023), arXiv:2210.08726 | Post-hoc research and revision can improve attribution while preserving a model's answer. | After Scout drafts, run a claim verifier and either revise unsupported claims or append a clear verification-needed section. |
| Min et al., **FActScore** (2023), arXiv:2305.14251 | Long-form factuality should be evaluated as atomic facts supported by reliable sources, not one overall quality score. | Extract atomic claims like `Pine Grove -> Boiling Springs = 19.2 mi` and validate each claim against a source/route table. |
| Gao et al., **ALCE: Enabling LLMs to Generate Text with Citations** (2023), arXiv:2305.14627 | Even strong cited systems often lack complete citation support; citation quality needs explicit measurement. | Display tool/source receipts and score citation precision/recall in evals. Do not treat citations as decoration. |
| Es et al., **Ragas** (2023/2025), arXiv:2309.15217 | RAG needs separate metrics for context relevance, context precision/recall, faithfulness, and answer quality. | Add a Scout eval harness with retrieval metrics plus trail-specific route validation. |
| Niu et al., **RAGTruth** (2024), arXiv:2401.00396 | RAG outputs can still contain unsupported or contradictory claims even when retrieval is used. | The product must fail closed on unsupported trail facts; "RAG was used" is not a safety guarantee. |

## Recommended Scout architecture

### 1. Source catalog with rights and authority

Create a source catalog package, likely `packages/scout-sources`, with generated indexes and explicit rights metadata.

```ts
interface ScoutSourceManifest {
  id: string;
  title: string;
  lane: 'private_workspace' | 'reviewed_hogg_country' | 'official_live' | 'user_owned_guide' | 'public_signal';
  rights: 'owned' | 'licensed' | 'public-domain' | 'user-imported' | 'metadata-only' | 'external-check-only';
  authority: 'deterministic' | 'official' | 'reviewed' | 'user-supplied' | 'community-signal';
  freshness: 'static' | 'seasonal' | 'live' | 'unknown';
  allowedUses: readonly ('quote' | 'summarize' | 'search' | 'validate' | 'link-out')[];
  citationLabel: string;
}
```

Use the catalog to decide what Scout may quote, summarize, validate against, or merely tell the user to check.

### 2. Hybrid retrieval, but structured validators for structured facts

Use two different paths:

- **Narrative/prose sources**: hybrid retrieval over chunks.
  - BM25/lexical for exact trail terms, shelter names, town names, acronyms.
  - Dense embeddings for semantic guide/manual questions.
  - Optional reranking once the corpus grows.
- **Route/mileage/service facts**: structured lookup, not free-text RAG.
  - route graph / ordered milepost table;
  - aliases for shelters, roads, towns, parks;
  - deterministic leg calculations;
  - source-system identifier so one answer does not mix mileage systems silently.

This is the core fix for Pine Grove Furnace. The model should never invent route order from prose context.

### 3. Host-side grounding orchestrator

Add a host orchestrator before the model call.

```ts
interface ScoutGroundingPacket {
  mode: 'none' | 'standard' | 'strict-route';
  queryPlan: readonly ScoutGroundingStep[];
  evidence: readonly ScoutEvidenceReceipt[];
  routeValidation: RouteValidationReceipt | null;
  officialChecks: readonly OfficialCheckReceipt[];
  answerRules: readonly string[];
}
```

Suggested flow:

1. `classifyScoutPrompt(prompt)`
   - route itinerary, official/weather, gear/manual, private workspace, document editing, general chat.
2. `buildQueryPlan(prompt, record)`
   - generate source-specific subqueries.
3. `retrieveEvidence(queryPlan)`
   - hybrid retrieval for prose docs/resources.
4. `validateRouteFacts(prompt)`
   - parse named points and requested direction/duration.
   - compute possible legs from one source system.
5. `checkLiveOfficialSources(prompt)`
   - ATC alerts, NWS, land-manager/park pages when relevant.
6. `renderGroundingPacket(packet)`
   - compact, ranked, source-labeled packet.
7. `generateAnswer(packet)`
   - model writes trail-useful language.
8. `verifyGeneratedClaims(answer, packet)`
   - atomic fact extraction and support check.
9. `repairOrDowngrade(answer)`
   - unsupported route facts become verification tasks, not final itinerary claims.

### 4. Strict route mode

Route/itinerary prompts should trigger strict mode when they mention:

- named AT points, shelters, road crossings, towns, parks;
- direction (NOBO/SOBO);
- mileage/day targets;
- camping/shelter assumptions;
- resupply/water/service locations.

Strict mode rules:

1. Use exactly one route/mileage source system per answer.
2. Every named endpoint must be recognized or labeled unverified.
3. Every leg mileage must come from the route validator.
4. If the validator cannot produce a sane ordered route, Scout gives a planning checklist and asks for/imports the user's guide data instead of making an itinerary.
5. Official/live conditions are separated from static route facts.

Example Pine Grove validator target:

```ts
validateAtRoute({
  direction: 'NOBO',
  start: 'Pine Grove Furnace State Park, PA',
  candidates: ['James Fry Shelter', 'Alec Kennedy Shelter', 'Boiling Springs', 'Darlington Shelter', 'Duncannon']
})
```

Expected behavior: it must know Boiling Springs comes before Darlington NOBO from Pine Grove. If it cannot verify that from a license-cleared or user-imported source, it must not guess.

### 5. Corrective RAG gates

For each answer section, store retrieval confidence:

- `sufficient`: enough evidence to answer directly;
- `ambiguous`: answer with caveats and tell what to verify;
- `insufficient`: do not answer exact facts; request/import/check the source.

Dynamic source policy:

- **Weather/fire/closure**: live official source required.
- **Water/shelter condition**: user-owned guide/FarOut comments or recent direct source required; otherwise caveat.
- **Route order/mileage**: deterministic route source required.
- **Personal gear/manual**: private workspace or reviewed Hogg Country source enough.

### 6. Tool receipts as product UX

Persist receipts separately from assistant messages.

```ts
interface ScoutEvidenceReceipt {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  authority: ScoutSourceManifest['authority'];
  rights: ScoutSourceManifest['rights'];
  query: string;
  excerpt: string;
  url?: string;
  fetchedAt?: string;
  supports: readonly string[];
  warnings: readonly string[];
}
```

UI should show a compact "Sources Scout used" drawer/card below answers. This matters because research on citations shows citation quality must be measured and visible, not assumed.

## First implementation slice

Build the smallest version that would have stopped the bad Pine Grove answer.

1. Add `packages/scout-sources` with source manifest types and generated fixture support.
2. Add a route validation module under `packages/trail-data` or `packages/scout-sources`:
   - point aliases;
   - ordered milepoints;
   - leg calculation;
   - source-system id;
   - validation statuses.
3. Add Pine Grove regression fixtures using only source material Hogg Country is allowed to store/use.
4. Add `buildScoutGroundingPacket(...)` in the app server.
5. Route itinerary prompts through `strict-route` before `Agent.prompt(...)`.
6. Update the Scout system prompt to say: exact route facts must come from the grounding packet; unsupported facts must be phrased as verification tasks.
7. Add post-generation claim checks for route points/mileage.
8. Add an eval script:

```bash
npm run eval:scout-grounding
```

Gate conditions for the Pine Grove prompt:

- Pine Grove recognized near the halfway/Pennsylvania section.
- Boiling Springs must appear before Darlington in NOBO order.
- If Tagg Run is not in the validator source, Scout must not use it as a firm endpoint.
- James Fry/Alec Kennedy/Boiling Springs/Darlington/Duncannon claims must either validate or be marked unverified.
- No exact mileage claim without source receipt.
- Final checklist must include ATC alerts, NWS forecast, water/shelter condition, parking/shuttle, and user-owned guide verification.

## What not to build first

- Do not start with a giant vector database migration.
- Do not fine-tune a model before the source/validator harness exists.
- Do not depend on native tool calls as the safety boundary.
- Do not ingest third-party guidebook/FarOut data into shared Scout knowledge without rights review.
- Do not let citation-looking text satisfy the product requirement unless the system has an actual receipt.

## Practical recommendation

Build **strict route grounding** first.

A cheap model with a strong validator will beat an expensive model with loose tools for this use case. The trail user's risk is not that prose is slightly awkward; it is that Scout confidently puts a shelter/town in the wrong order. The first production-quality slice should therefore make that class of failure impossible or visibly blocked.
