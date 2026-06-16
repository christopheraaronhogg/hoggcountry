import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadGuideBySlug, loadGuideIndex } from '$lib/server/guide';

export const load: PageServerLoad = async ({ params }) => {
  const [entry, chapters] = await Promise.all([loadGuideBySlug(params.slug), loadGuideIndex()]);

  if (!entry) {
    throw error(404, 'Guide chapter not found.');
  }

  // Same bundle as /guide so the download button in the chrome works on chapter pages too.
  const markdownContent = [
    '# Appalachian Trail NOBO Field Guide 2026',
    '## Northbound: Springer Mountain, GA -> Mount Katahdin, ME',
    '### February Start Edition',
    '',
    '---',
    '',
    ...chapters.flatMap((chapter) => [chapter.markdown, '', '---', ''])
  ].join('\n');

  return {
    entry,
    chapters,
    markdownContent
  };
};
