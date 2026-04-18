import type { PageServerLoad } from './$types';
import { loadGuideIndex } from '$lib/server/guide';

export const load: PageServerLoad = async () => {
  const chapters = await loadGuideIndex();
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
    chapters,
    markdownContent
  };
};
