import type { PageServerLoad } from './$types';
import { loadGuideIndex } from '$lib/server/guide';
import { isEnabled } from '../../../../../../src/lib/features';
import { marked } from 'marked';

// FieldManualEntryInput shape (duplicated here to avoid cross-tree SSR import issues)
interface FieldManualEntryInput {
  id: string;
  kind: 'library' | 'scripture' | 'today' | 'plan' | 'note';
  title: string;
  summary: string;
  contentText: string;
  contentHtml: string;
  note: string;
  source: {
    surface: 'guide' | 'today' | 'plan' | 'manual' | 'import';
    corpus: 'trail' | 'scripture' | 'personal' | 'mixed';
    sourceId?: string;
    href?: string;
    citation?: string;
  };
  meta: {
    quickRef?: boolean;
    chapterOrder?: number;
    chapterTitle?: string;
    tags?: string[];
    savedFrom?: 'entry' | 'search' | 'today' | 'plan' | 'manual' | 'import';
  };
}

function stripMarkdownForManual(text: string): string {
  return text
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function summarizeText(text: string, maxLength = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

async function buildGuideManualEntry(input: {
  slug: string;
  title: string;
  description?: string;
  body: string;
  order: number;
  quickRef?: boolean;
  href?: string;
}): Promise<FieldManualEntryInput> {
  const contentText = stripMarkdownForManual(input.body);
  const contentHtml = await marked.parse(input.body);
  const href = input.href ?? `/guide/#${input.slug}`;

  return {
    id: `guide:${input.slug}`,
    kind: 'library',
    title: input.title,
    summary: input.description?.trim() || summarizeText(contentText),
    contentText,
    contentHtml,
    note: '',
    source: {
      surface: 'guide',
      corpus: 'trail',
      sourceId: input.slug,
      href,
      citation: input.quickRef
        ? `Hogg Country Quick Reference - ${input.title}`
        : `Hogg Country Field Manual - ${input.title}`,
    },
    meta: {
      quickRef: input.quickRef ?? false,
      chapterOrder: input.order,
      chapterTitle: input.title,
      savedFrom: 'entry',
      tags: input.quickRef ? ['quick-ref'] : ['chapter'],
    },
  };
}

export const load: PageServerLoad = async () => {
  const allGuides = await loadGuideIndex();

  // Sort: main chapters by order, then quick refs
  const mainChapters = allGuides.filter((g) => !g.quickRef);
  const quickRefs = allGuides.filter((g) => g.quickRef);
  const sortedGuides = [...mainChapters, ...quickRefs];

  const markdownContent = [
    '# Appalachian Trail NOBO Field Guide 2026',
    '## Northbound: Springer Mountain, GA -> Mount Katahdin, ME',
    '### February Start Edition',
    '',
    '---',
    '',
    ...sortedGuides.flatMap((chapter) => [chapter.markdown, '', '---', ''])
  ].join('\n');

  const manualBuilderPath = '/guide/manual-builder/';

  const manualEntrySeeds = await Promise.all(
    sortedGuides.map((chapter) =>
      buildGuideManualEntry({
        slug: chapter.slug,
        title: chapter.title,
        description: chapter.description,
        body: chapter.markdown,
        order: chapter.order,
        quickRef: chapter.quickRef,
        href: `${manualBuilderPath}#${chapter.slug}`,
      })
    )
  );

  const manualEntriesBySlug = Object.fromEntries(
    manualEntrySeeds.map((entry) => [entry.source.sourceId ?? entry.id, entry])
  );

  const navChapters = sortedGuides.map((ch) => ({
    id: ch.slug,
    data: {
      title: ch.title,
      description: ch.description,
      part: ch.part,
      order: ch.order,
      quickRef: ch.quickRef
    }
  }));

  return {
    chapters: sortedGuides,
    mainChaptersCount: mainChapters.length,
    quickRefsCount: quickRefs.length,
    markdownContent,
    manualEntriesBySlug,
    navChapters,
    scriptureSearchEnabled: isEnabled('SCRIPTURE_SEARCH'),
    manualBuilderPath
  };
};
