import type { ImportedDocument, ManualProfile, ManualSection, WorkspaceResource, WorkspaceTool } from '@hoggcountry/manual-core';

export interface ClawLane {
  readonly title: string;
  readonly prompt: string;
  readonly action: string;
  readonly source: string;
}

function hasSectionNote(sections: ManualSection[], sectionId: string): boolean {
  return sections.some((section) => section.id === sectionId && section.blocks.some((block) => block.type === 'user'));
}

export function buildClawLanes(
  profile: ManualProfile,
  sections: ManualSection[],
  docs: ImportedDocument[],
  tools: WorkspaceTool[],
  resources: WorkspaceResource[] = []
): ClawLane[] {
  const resourceCount = resources.length;
  const livingDocCount = docs.filter((document) => document.rights === 'assistant-generated').length;
  const toolCount = tools.length;
  const hasEmergencyNote = hasSectionNote(sections, 'emergency-sheet');
  const hasTownNote = hasSectionNote(sections, 'town-stop');
  const paceText = profile.targetPace > 0 ? `${profile.targetPace.toFixed(0)} mpd` : 'your real pace';

  return [
    {
      title: 'Stabilize today',
      prompt: `Current mile is ${profile.currentMile.toFixed(1)}. Make sure the manual reflects the next obvious weather, water, and sleep decision.`,
      action: 'Review the Today defaults section and add one note for what would make you bail, shelter, or slow down right now.',
      source: 'Profile + starter manual'
    },
    {
      title: 'Plan the next carry',
      prompt: `From mile ${profile.currentMile.toFixed(1)}, sketch the next food carry with a practical town or hostel cadence instead of vague optimism.`,
      action: 'Ask Scout for a 4-day carry or next-resupply plan, then save the assumptions that matter.',
      source: 'Trail ops planning'
    },
    {
      title: 'Run the next week',
      prompt: `Draft a 7-day itinerary from mile ${profile.currentMile.toFixed(1)} using ${paceText}, with likely sleep targets, bailout logic, and town timing.`,
      action: 'Use the cloud thread to turn the next week into a concrete plan you could actually follow tired.',
      source: 'Trail ops planning'
    },
    {
      title: 'Strengthen the source locker',
      prompt: resourceCount > 0
        ? `You have ${resourceCount} private resource${resourceCount === 1 ? '' : 's'} and ${livingDocCount} living Scout doc${livingDocCount === 1 ? '' : 's'}. Pick one resource and ask Scout what it changes.`
        : 'No private resources are attached yet. Add a readable file, URL, or pasted trail note for Scout to use as source context.',
      action: resourceCount > 0 ? 'Open Resources, choose Ask Scout or Draft Doc, then save the useful reply into Docs.' : 'Open Resources and add one source you want Scout to reference.',
      source: 'Resources → Scout → Docs'
    },
    {
      title: 'Patch the brittle sections',
      prompt: hasEmergencyNote
        ? 'Emergency notes already exist. Read them once and make sure they are still simple enough to use tired.'
        : 'Emergency is still template-only. The manual needs your actual contacts, meds, and bail logic.',
      action: hasEmergencyNote ? 'Tighten any emergency note that still sounds vague.' : 'Add one emergency note with real contact or medical detail.',
      source: 'Manual gap analysis'
    },
    {
      title: 'Build the next trail tool',
      prompt: toolCount > 0
        ? `You already have ${toolCount} trail tool${toolCount === 1 ? '' : 's'}. Add the next checklist for a repeated decision instead of burying it in prose.`
        : 'No trail tools exist yet. Capture the next repeated decision as a checklist instead of another generic note.',
      action: toolCount > 0
        ? 'Open Tools and create one checklist you expect to reuse in the next week.'
        : 'Open Tools and build your first checklist from a real trail routine.',
      source: 'Safe tool builder'
    },
    {
      title: 'Keep town from hijacking the hike',
      prompt: hasTownNote
        ? 'Town strategy has at least one custom note. Make sure it still reflects your actual spending and recovery habits.'
        : 'Town strategy is still generic. That is usually where good plans start to leak.',
      action: hasTownNote ? 'Update the town-stop note with one real correction.' : 'Add a town-stop note covering your top three town jobs.',
      source: 'Operating manual pattern'
    }
  ];
}
