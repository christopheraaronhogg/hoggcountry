import type { SearchHit } from '@hoggcountry/manual-core';
import { summarize } from '@hoggcountry/manual-core';
import { publicCorpus } from '../generated/public-corpus';

export interface PublicCorpusEntry {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly headers: string;
  readonly href: string;
  readonly sourceLabel: string;
}

export { publicCorpus };

function scoreMatch(haystack: string, query: string): number {
  const loweredHaystack = haystack.toLowerCase();
  const loweredQuery = query.toLowerCase();
  if (!loweredHaystack.includes(loweredQuery)) return 0;
  if (loweredHaystack.startsWith(loweredQuery)) return 5;
  return 3;
}

function excerpt(text: string, query: string): string {
  const lowered = text.toLowerCase();
  const loweredQuery = query.toLowerCase();
  const index = lowered.indexOf(loweredQuery);
  if (index < 0) return summarize(text, 170);

  const start = Math.max(0, index - 48);
  const end = Math.min(text.length, index + loweredQuery.length + 96);
  return summarize(text.slice(start, end), 170);
}

export function searchPublicCorpus(entries: readonly PublicCorpusEntry[], query: string): SearchHit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return entries
    .map((entry) => {
      const score = scoreMatch(`${entry.title} ${entry.description} ${entry.headers} ${entry.content}`, normalized);
      if (score === 0) return null;

      return {
        id: entry.id,
        sourceType: 'corpus' as const,
        sourceLabel: entry.sourceLabel,
        title: entry.title,
        excerpt: excerpt(`${entry.description} ${entry.content}`, normalized),
        href: entry.href,
        score,
      };
    })
    .filter((entry): entry is SearchHit => entry !== null)
    .sort((left, right) => right.score - left.score);
}
