import type { ImportedDocument, ManualProfile, ManualSection } from '@hoggcountry/manual-core';

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
  docs: ImportedDocument[]
): ClawLane[] {
  const docCount = docs.length;
  const hasEmergencyNote = hasSectionNote(sections, 'emergency-sheet');
  const hasTownNote = hasSectionNote(sections, 'town-stop');

  return [
    {
      title: 'Stabilize today',
      prompt: `Current mile is ${profile.currentMile.toFixed(1)}. Make sure the manual reflects the next obvious weather, water, and sleep decision.`,
      action: 'Review the Today defaults section and add one note for what would make you bail, shelter, or slow down right now.',
      source: 'Profile + starter manual'
    },
    {
      title: 'Strengthen the source locker',
      prompt: docCount > 0
        ? `You already have ${docCount} imported document${docCount === 1 ? '' : 's'}. Convert the most important one into a manual note.`
        : 'No private source docs are imported yet. Bring in a permit PDF, gear list, or saved town intel file next.',
      action: docCount > 0 ? 'Open Docs and lift one concrete fact into the manual.' : 'Import a PDF or text file you want the manual to reference.',
      source: 'Imported docs locker'
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
      title: 'Keep town from hijacking the hike',
      prompt: hasTownNote
        ? 'Town strategy has at least one custom note. Make sure it still reflects your actual spending and recovery habits.'
        : 'Town strategy is still generic. That is usually where good plans start to leak.',
      action: hasTownNote ? 'Update the town-stop note with one real correction.' : 'Add a town-stop note covering your top three town jobs.',
      source: 'Operating manual pattern'
    }
  ];
}
