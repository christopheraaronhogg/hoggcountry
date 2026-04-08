import { marked } from 'marked';
import { summarizeText, type FieldManualEntryInput } from './types';

export interface GuideManualSeedInput {
  slug: string;
  title: string;
  description?: string;
  body: string;
  order: number;
  quickRef?: boolean;
  savedFrom?: 'entry' | 'search';
  href?: string;
}

export function stripMarkdownForManual(text: string): string {
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

export function buildGuideManualEntry(input: GuideManualSeedInput): FieldManualEntryInput {
  const contentText = stripMarkdownForManual(input.body);
  const contentHtml = marked.parse(input.body) as string;
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
        ? `Hogg Country Quick Reference · ${input.title}`
        : `Hogg Country Field Manual · ${input.title}`,
    },
    meta: {
      quickRef: input.quickRef ?? false,
      chapterOrder: input.order,
      chapterTitle: input.title,
      savedFrom: input.savedFrom ?? 'entry',
      tags: input.quickRef ? ['quick-ref'] : ['chapter'],
    },
  };
}
