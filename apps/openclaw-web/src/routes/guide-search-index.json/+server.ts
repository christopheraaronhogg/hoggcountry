import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadGuideIndex } from '$lib/server/guide';

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeaders(markdown: string) {
  return markdown
    .split('\n')
    .map((line) => line.match(/^#{1,6}\s+(.*)$/)?.[1]?.trim())
    .filter(Boolean)
    .join(' | ');
}

export const GET: RequestHandler = async () => {
  const chapters = await loadGuideIndex();

  return json(
    chapters.map((chapter) => ({
      id: chapter.slug,
      title: chapter.title,
      description: chapter.description,
      quickRef: chapter.quickRef,
      content: stripMarkdown(chapter.markdown),
      headers: extractHeaders(chapter.markdown)
    })),
    {
      headers: {
        'cache-control': 'public, max-age=300'
      }
    }
  );
};
