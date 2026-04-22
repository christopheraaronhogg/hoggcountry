export type ScoutLabVariantId = 'mission-control' | 'trail-desk' | 'docs-radar' | 'campfire';

export interface ScoutLabVariant {
  readonly id: ScoutLabVariantId;
  readonly name: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly conversationTitle: string;
  readonly docsTitle: string;
  readonly actionsTitle: string;
  readonly promptPlaceholder: string;
  readonly layoutClass: string;
}

export const SCOUT_LAB_VARIANTS: ScoutLabVariant[] = [
  {
    id: 'mission-control',
    name: 'Mission Control',
    eyebrow: 'Ops board',
    title: 'Run Scout like a trail operations board.',
    summary: 'Chat stays primary, but the workspace pulse, saved plans, and document locker stay visible in the same frame.',
    conversationTitle: 'Live thread',
    docsTitle: 'Plans and locker',
    actionsTitle: 'Ops shortcuts',
    promptPlaceholder: 'Ask Scout for the next 7 days, the next carry, or the weakest link in the plan.',
    layoutClass: 'variant-mission-control'
  },
  {
    id: 'trail-desk',
    name: 'Trail Desk',
    eyebrow: 'Three-rail desk',
    title: 'Keep the pulse, conversation, and docs open at once.',
    summary: 'A tighter operator desk: status on the left, thread in the middle, docs on the right.',
    conversationTitle: 'Conversation rail',
    docsTitle: 'Document rail',
    actionsTitle: 'Quick prompts',
    promptPlaceholder: 'Send Scout a direct trail question and keep the latest plan in view.',
    layoutClass: 'variant-trail-desk'
  },
  {
    id: 'docs-radar',
    name: 'Docs Radar',
    eyebrow: 'Doc-first board',
    title: 'Put the documents first and keep Scout beside them.',
    summary: 'Best for comparing saved plans, imported docs, and the live thread without leaving one page.',
    conversationTitle: 'Scout beside the docs',
    docsTitle: 'Radar locker',
    actionsTitle: 'Document-aware workflow',
    promptPlaceholder: 'Use Scout to tighten a saved plan while keeping the locker visible.',
    layoutClass: 'variant-docs-radar'
  },
  {
    id: 'campfire',
    name: 'Campfire',
    eyebrow: 'Chat-first companion',
    title: 'Make Scout feel like a simple companion with docs close by.',
    summary: 'The thread stays front and center, with quick prompt chips and a lighter docs shelf below.',
    conversationTitle: 'Campfire thread',
    docsTitle: 'Docs shelf',
    actionsTitle: 'Starter sparks',
    promptPlaceholder: 'Start with a plain question and let Scout answer without the console feel.',
    layoutClass: 'variant-campfire'
  }
];

export function getScoutLabVariant(id: string): ScoutLabVariant | null {
  return SCOUT_LAB_VARIANTS.find((variant) => variant.id === id) ?? null;
}
