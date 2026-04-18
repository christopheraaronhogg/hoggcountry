export type Direction = 'NOBO' | 'SOBO';
export type BudgetTier = 'dirtbag' | 'balanced' | 'comfortable';
export type ExperienceLevel = 'first-thru' | 'some-backpacking' | 'section-hiker' | 'trail-veteran';
export type GearPhilosophy = 'ultralight' | 'balanced' | 'comfort-first';
export type TownStyle = 'quick-hit' | 'balanced' | 'lingering';
export type ReflectionStyle = 'faith-informed' | 'practical-only';
export type ShelterPreference = 'tent-first' | 'shelter-first' | 'mixed';

export interface ManualProfile {
  id: string;
  trailName: string;
  startDate: string;
  direction: Direction;
  currentMile: number;
  targetPace: number;
  zeroDaysPerMonth: number;
  budgetTier: BudgetTier;
  experienceLevel: ExperienceLevel;
  gearPhilosophy: GearPhilosophy;
  townStyle: TownStyle;
  reflectionStyle: ReflectionStyle;
  shelterPreference: ShelterPreference;
  waterCapacityLiters: number;
  healthNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualCitation {
  label: string;
  detail?: string;
  href?: string;
}

export type ManualBlockType = 'template' | 'assistant' | 'user' | 'reflection';

export interface ManualBlock {
  id: string;
  type: ManualBlockType;
  title: string;
  content: string;
  citations: ManualCitation[];
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ManualSectionKind =
  | 'profile'
  | 'today'
  | 'plan'
  | 'town'
  | 'gear'
  | 'emergency'
  | 'reflection';

export interface ManualSection {
  id: string;
  title: string;
  kind: ManualSectionKind;
  summary: string;
  blocks: ManualBlock[];
  lastUpdated: string;
}

export type ImportedDocumentKind = 'pdf' | 'markdown' | 'text' | 'html';

export interface ImportedDocument {
  id: string;
  title: string;
  fileName: string;
  kind: ImportedDocumentKind;
  rights: 'user-imported';
  searchable: boolean;
  textContent: string;
  note: string;
  importedAt: string;
  sizeBytes: number;
}

export type WorkspaceToolKind = 'checklist';
export type WorkspaceToolAuthor = 'template' | 'assistant' | 'user';

export interface WorkspaceToolItem {
  id: string;
  label: string;
  detail?: string;
}

export interface WorkspaceTool {
  id: string;
  title: string;
  kind: WorkspaceToolKind;
  author: WorkspaceToolAuthor;
  summary: string;
  instructions: string;
  items: WorkspaceToolItem[];
  createdAt: string;
  updatedAt: string;
}

export type SearchSourceType = 'manual' | 'corpus' | 'doc' | 'tool';

export interface SearchHit {
  id: string;
  sourceType: SearchSourceType;
  sourceLabel: string;
  title: string;
  excerpt: string;
  sectionId?: string;
  href?: string;
  score: number;
}

const TEMPLATE_CITATION: ManualCitation = {
  label: 'Hogg Country Field Manual Template',
};

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return `${prefix}:${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function summarize(text: string, maxLength = 180): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function templateBlock(title: string, content: string, type: ManualBlockType = 'template'): ManualBlock {
  const timestamp = nowIso();

  return {
    id: createId(type),
    type,
    title,
    content,
    citations: [TEMPLATE_CITATION],
    locked: type !== 'user',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function reflectionBlock(profile: ManualProfile): ManualBlock {
  const content = profile.reflectionStyle === 'faith-informed'
    ? 'This manual is practical first, but it is also meant to steady your heart. Save the verses, reminders, and honest notes that keep you moving when the trail gets loud.'
    : 'This manual is practical first. Keep the notes that calm you down, cut noise, and make the next decision clearer.';

  return templateBlock('Reflection posture', content, 'reflection');
}

export function buildStarterManual(profile: ManualProfile): ManualSection[] {
  const timestamp = nowIso();
  const waterRule = profile.waterCapacityLiters >= 2
    ? `You have ${profile.waterCapacityLiters.toFixed(1)}L of carrying capacity. Leave town full on exposed or humid stretches and treat dry updates as a decision trigger, not background noise.`
    : `You only carry ${profile.waterCapacityLiters.toFixed(1)}L. Build conservative refill habits and treat every uncertain water report as a planning problem.`;
  const shelterRule = profile.shelterPreference === 'tent-first'
    ? 'Default to your tent when weather, sleep quality, or crowding argue for control.'
    : profile.shelterPreference === 'shelter-first'
      ? 'Default to shelters when conditions are stable, but switch to your tent quickly when noise, crowding, or hygiene turn the night against you.'
      : 'Start with the simplest overnight option, then switch fast when weather, sleep, or morale shifts.';

  return [
    {
      id: 'profile',
      title: 'Trail profile',
      kind: 'profile',
      summary: 'Who this manual is for and how the hike is framed.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Starting picture',
          `${profile.trailName || 'Hiker'} is planning a ${profile.direction} Appalachian Trail hike beginning ${profile.startDate || 'TBD'}, targeting ${profile.targetPace} miles per day with roughly ${profile.zeroDaysPerMonth} zero days per month.`,
        ),
        templateBlock(
          'Preferences',
          `Budget: ${profile.budgetTier}. Experience: ${profile.experienceLevel}. Gear philosophy: ${profile.gearPhilosophy}. Town style: ${profile.townStyle}. Shelter preference: ${profile.shelterPreference}.`,
        ),
      ],
    },
    {
      id: 'today-defaults',
      title: 'Today defaults',
      kind: 'today',
      summary: 'What to reach for first when a trail day starts to drift.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Water and weather',
          waterRule,
        ),
        templateBlock(
          'Shelter rule',
          shelterRule,
        ),
      ],
    },
    {
      id: 'journey-plan',
      title: 'Journey plan',
      kind: 'plan',
      summary: 'Pace, finish rhythm, and the basic operating tempo.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Pace rule',
          `Use ${profile.targetPace} miles per day as the default planning pace. If morale, weather, or recovery disagree, protect consistency first and mileage second.`,
        ),
        templateBlock(
          'Zero-day rule',
          `Plan around ${profile.zeroDaysPerMonth} zero days per month. Treat zeros as recovery or logistics tools, not proof that the plan is failing.`,
        ),
      ],
    },
    {
      id: 'town-stop',
      title: 'Town stop',
      kind: 'town',
      summary: 'How town time should work instead of turning into drift.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Town rhythm',
          profile.townStyle === 'quick-hit'
            ? 'Get in, solve the problems, and get out. Town is for calories, charging, cleanup, and resupply.'
            : profile.townStyle === 'lingering'
              ? 'Use town as an intentional recovery tool, but name the reason before you spend the extra time or money.'
              : 'Use town for recovery and logistics, but decide your priorities before you get pulled into the vortex.',
        ),
        templateBlock(
          'Budget guardrail',
          profile.budgetTier === 'dirtbag'
            ? 'Protect the runway. Hostel nights, restaurant splurges, and outfitters need a clear reason.'
            : profile.budgetTier === 'comfortable'
              ? 'Use money to solve real problems, not to avoid every discomfort.'
              : 'Spend where it protects momentum: shoes, food, rest, weather, and reliable shuttles.',
        ),
      ],
    },
    {
      id: 'gear-transition',
      title: 'Gear transitions',
      kind: 'gear',
      summary: 'How to change gear without reinventing the hike every time.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Gear philosophy',
          `Run a ${profile.gearPhilosophy} system. Change gear only when conditions, safety, or repeated friction justify the complexity.`,
        ),
        templateBlock(
          'Replacement rule',
          'Shoes, socks, batteries, and layers fail gradually. Mark replacement windows early and make changes before a small annoyance becomes a trail-stopper.',
        ),
      ],
    },
    {
      id: 'emergency-sheet',
      title: 'Emergency sheet',
      kind: 'emergency',
      summary: 'What must stay simple when everything else narrows.',
      lastUpdated: timestamp,
      blocks: [
        templateBlock(
          'Emergency rule',
          'When the trail narrows your thinking, default to simple facts: where you are, who needs to know, what changed, what resources are nearby, and what the next safe stop is.',
        ),
        templateBlock(
          'Health notes',
          profile.healthNotes.trim() || 'No personal health notes have been recorded yet.',
        ),
      ],
    },
    {
      id: 'reflection-resolve',
      title: 'Reflection and resolve',
      kind: 'reflection',
      summary: 'The part of the manual that steadies the hiker, not just the plan.',
      lastUpdated: timestamp,
      blocks: [
        reflectionBlock(profile),
      ],
    },
  ];
}

export function addUserBlock(
  sections: ManualSection[],
  sectionId: string,
  title: string,
  content: string,
): ManualSection[] {
  const timestamp = nowIso();

  return sections.map((section) => {
    if (section.id !== sectionId) return section;

    return {
      ...section,
      lastUpdated: timestamp,
      blocks: [
        ...section.blocks,
        {
          id: createId('user'),
          type: 'user',
          title: title.trim() || 'Trail note',
          content: content.trim(),
          citations: [],
          locked: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    };
  });
}

export function updateProfileTimestamp(profile: ManualProfile): ManualProfile {
  return {
    ...profile,
    updatedAt: nowIso(),
  };
}

export function createChecklistTool(args: {
  title: string;
  summary: string;
  instructions: string;
  items: Array<string | { label: string; detail?: string }>;
  author?: WorkspaceToolAuthor;
}): WorkspaceTool {
  const timestamp = nowIso();

  return {
    id: createId('tool'),
    title: args.title.trim(),
    kind: 'checklist',
    author: args.author ?? 'user',
    summary: args.summary.trim(),
    instructions: args.instructions.trim(),
    items: args.items
      .map((item) => {
        if (typeof item === 'string') {
          return {
            id: createId('tool-item'),
            label: item.trim(),
          } satisfies WorkspaceToolItem;
        }

        return {
          id: createId('tool-item'),
          label: item.label.trim(),
          detail: item.detail?.trim() || undefined,
        } satisfies WorkspaceToolItem;
      })
      .filter((item) => item.label.length > 0),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function buildStarterTools(profile: ManualProfile): WorkspaceTool[] {
  const waterLabel = profile.waterCapacityLiters >= 2
    ? `Leave reliable water with ${profile.waterCapacityLiters.toFixed(1)}L when the next dry stretch or heat load is uncertain.`
    : `Your ${profile.waterCapacityLiters.toFixed(1)}L capacity is tight. Top off sooner and treat every dry report as a real constraint.`;

  const townResetThirdItem = profile.townStyle === 'quick-hit'
    ? 'Leave town as soon as food, charging, cleanup, and resupply are solved.'
    : profile.townStyle === 'lingering'
      ? 'Name the reason for staying longer before you spend extra time or money.'
      : 'Set the top three town jobs before you let the vortex pick for you.';

  return [
    createChecklistTool({
      title: 'Morning trail reset',
      summary: 'A short opening routine that keeps the day from drifting before the first climb.',
      instructions: 'Run this in order before you chase miles.',
      author: 'template',
      items: [
        'Check weather, water, and bailout constraints before leaving camp or town.',
        `Anchor the day to your ${profile.targetPace} mi/day default, then lower it early if recovery or terrain disagree.`,
        'Name the one trail decision that would make you slow down, shelter, or stop early.'
      ]
    }),
    createChecklistTool({
      title: 'Water and heat guardrail',
      summary: 'A simple carry rule for exposed, humid, or uncertain stretches.',
      instructions: 'Use this whenever the next segment looks dry, hot, or vague.',
      author: 'template',
      items: [
        waterLabel,
        'Treat uncertain source intel as a planning problem, not a gamble.',
        'If heat, climb, or injury stacks up, shorten the segment before you run the tank dry.'
      ]
    }),
    createChecklistTool({
      title: 'Town reset tool',
      summary: 'Protect recovery and momentum when you hit town.',
      instructions: 'Finish these before you start making optional town decisions.',
      author: 'template',
      items: [
        'Solve calories, charging, cleanup, and resupply first.',
        profile.budgetTier === 'dirtbag'
          ? 'Guard the budget. Pay for solutions, not for drift.'
          : 'Spend where it protects momentum, safety, or recovery.',
        townResetThirdItem
      ]
    })
  ];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildManualExportHtml(profile: ManualProfile, sections: ManualSection[]): string {
  const payload = JSON.stringify({ profile, sections }).replace(/</g, '\\u003c');
  const renderedSections = sections.map((section) => {
    const blocks = section.blocks.map((block) => {
      const citations = block.citations.length > 0
        ? `<p class="block-citations">${block.citations.map((citation) => escapeHtml(citation.label)).join(' | ')}</p>`
        : '';

      return `
        <article class="block block-${block.type}">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.content)}</p>
          ${citations}
        </article>
      `;
    }).join('\n');

    return `
      <section class="section">
        <div class="section-kicker">${escapeHtml(section.kind)}</div>
        <h2>${escapeHtml(section.title)}</h2>
        <p class="section-summary">${escapeHtml(section.summary)}</p>
        <div class="section-blocks">${blocks}</div>
      </section>
    `;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(profile.trailName || 'My')} Field Manual</title>
  <style>
    body { margin: 0; font-family: Georgia, serif; background: #f6f1e6; color: #292723; line-height: 1.6; }
    main { max-width: 780px; margin: 0 auto; padding: 3rem 1.25rem 5rem; }
    .cover, .section { background: rgba(255,255,255,0.82); border: 1px solid #ddd4bf; border-radius: 18px; padding: 1.5rem; box-shadow: 0 16px 34px rgba(0,0,0,0.06); }
    .cover { margin-bottom: 1.5rem; }
    .eyebrow, .section-kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; color: #5a5b43; font-weight: 700; }
    h1, h2, h3 { color: #40503f; line-height: 1.15; }
    h1 { font-size: 2.6rem; margin: 0.6rem 0; }
    .section { margin-top: 1rem; }
    .section-summary { color: #5d5a4f; margin-top: 0; }
    .block { border-top: 1px solid #e4dcc8; padding-top: 1rem; margin-top: 1rem; }
    .block:first-child { border-top: none; margin-top: 0; padding-top: 0; }
    .block-reflection { background: rgba(166,181,137,0.12); padding: 1rem; border-radius: 12px; }
    .block-citations { font-size: 0.85rem; color: #6b6556; }
  </style>
</head>
<body>
  <main>
    <section class="cover">
      <div class="eyebrow">Personal Field Manual</div>
      <h1>${escapeHtml(profile.trailName || 'Unnamed')} Manual</h1>
      <p>${escapeHtml(`${profile.direction} start on ${profile.startDate}. Pace target: ${profile.targetPace} mi/day. Budget: ${profile.budgetTier}.`)}</p>
    </section>
    ${renderedSections}
  </main>
  <script id="manual-data" type="application/json">${payload}</script>
</body>
</html>`;
}

function scoreMatch(haystack: string, query: string): number {
  const loweredHaystack = haystack.toLowerCase();
  const loweredQuery = query.toLowerCase();
  if (!loweredHaystack.includes(loweredQuery)) return 0;
  if (loweredHaystack.startsWith(loweredQuery)) return 5;
  return 3;
}

function buildExcerpt(text: string, query: string): string {
  const lowered = text.toLowerCase();
  const loweredQuery = query.toLowerCase();
  const index = lowered.indexOf(loweredQuery);
  if (index < 0) return summarize(text, 160);

  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + loweredQuery.length + 80);
  return summarize(text.slice(start, end), 160);
}

export function searchManualSections(sections: ManualSection[], query: string): SearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const hits: SearchHit[] = [];

  for (const section of sections) {
    const sectionScore = scoreMatch(`${section.title} ${section.summary}`, normalized);
    if (sectionScore > 0) {
      hits.push({
        id: `section:${section.id}`,
        sourceType: 'manual',
        sourceLabel: 'My Manual',
        title: section.title,
        excerpt: buildExcerpt(section.summary, normalized),
        sectionId: section.id,
        score: sectionScore + 2,
      });
    }

    for (const block of section.blocks) {
      const text = `${block.title} ${block.content}`;
      const blockScore = scoreMatch(text, normalized);
      if (blockScore > 0) {
        hits.push({
          id: block.id,
          sourceType: 'manual',
          sourceLabel: 'My Manual',
          title: `${section.title} - ${block.title}`,
          excerpt: buildExcerpt(block.content, normalized),
          sectionId: section.id,
          score: blockScore,
        });
      }
    }
  }

  return hits.sort((left, right) => right.score - left.score);
}

export function searchImportedDocuments(docs: ImportedDocument[], query: string): SearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return docs
    .filter((doc) => doc.searchable && doc.textContent.toLowerCase().includes(normalized))
    .map((doc) => ({
      id: doc.id,
      sourceType: 'doc' as const,
      sourceLabel: 'Imported Doc',
      title: doc.title,
      excerpt: buildExcerpt(doc.textContent, normalized),
      score: scoreMatch(`${doc.title} ${doc.textContent}`, normalized),
    }))
    .sort((left, right) => right.score - left.score);
}

export function searchWorkspaceTools(tools: WorkspaceTool[], query: string): SearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return tools
    .map((tool) => {
      const haystack = [tool.title, tool.summary, tool.instructions, ...tool.items.map((item) => `${item.label} ${item.detail ?? ''}`)]
        .join(' ')
        .trim();
      const score = scoreMatch(haystack, normalized);
      if (score <= 0) return null;

      return {
        id: tool.id,
        sourceType: 'tool' as const,
        sourceLabel: 'Trail Tool',
        title: tool.title,
        excerpt: buildExcerpt(`${tool.summary} ${tool.instructions}`, normalized),
        score: score + 1,
      } satisfies SearchHit;
    })
    .filter((tool): tool is SearchHit => tool !== null)
    .sort((left, right) => right.score - left.score);
}
