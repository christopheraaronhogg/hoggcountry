export const FIELD_MANUAL_SCHEMA_VERSION = 1 as const;

export type FieldManualEntryKind =
  | 'library'
  | 'scripture'
  | 'today'
  | 'plan'
  | 'note';

export type FieldManualCorpus = 'trail' | 'scripture' | 'personal' | 'mixed';

export type FieldManualSurface = 'guide' | 'today' | 'plan' | 'manual' | 'import';

export interface FieldManualEntrySource {
  surface: FieldManualSurface;
  corpus: FieldManualCorpus;
  sourceId?: string;
  href?: string;
  citation?: string;
}

export interface FieldManualEntryMeta {
  quickRef?: boolean;
  chapterOrder?: number;
  chapterTitle?: string;
  tags?: string[];
  savedFrom?: 'entry' | 'search' | 'today' | 'plan' | 'manual' | 'import';
}

export interface FieldManualEntry {
  id: string;
  kind: FieldManualEntryKind;
  title: string;
  summary: string;
  contentText: string;
  contentHtml: string;
  note: string;
  position: number;
  source: FieldManualEntrySource;
  meta: FieldManualEntryMeta;
  createdAt: string;
  updatedAt: string;
}

export type FieldManualEntryInput =
  & Omit<FieldManualEntry, 'position' | 'createdAt' | 'updatedAt'>
  & Partial<Pick<FieldManualEntry, 'position' | 'createdAt' | 'updatedAt'>>;

export interface FieldManualExportPayload {
  version: typeof FIELD_MANUAL_SCHEMA_VERSION;
  exportedAt: string;
  entries: FieldManualEntry[];
}

export interface FieldManualImportResult {
  imported: number;
  version: number;
}

function fallbackId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now().toString(36)}:${random}`;
}

export function createFieldManualId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}:${crypto.randomUUID()}`;
  }

  return fallbackId(prefix);
}

export function summarizeText(text: string, maxLength = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function textToParagraphHtml(text: string): string {
  const normalized = text.trim();
  if (!normalized) return '';

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.replace(/\n/g, ' ').trim())}</p>`)
    .join('\n');
}

export function sanitizeManualHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '')
    .trim();
}

export function sortManualEntries(entries: FieldManualEntry[]): FieldManualEntry[] {
  return [...entries].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function normalizeManualEntry(
  input: FieldManualEntryInput,
  existing?: FieldManualEntry,
): FieldManualEntry {
  const now = new Date().toISOString();
  const contentText = input.contentText?.trim() || existing?.contentText || input.summary?.trim() || '';
  const contentHtml = sanitizeManualHtml(
    input.contentHtml?.trim() || existing?.contentHtml || textToParagraphHtml(contentText || input.summary || ''),
  );

  return {
    id: input.id,
    kind: input.kind,
    title: input.title.trim(),
    summary: summarizeText(input.summary?.trim() || existing?.summary || contentText),
    contentText,
    contentHtml,
    note: input.note ?? existing?.note ?? '',
    position: input.position ?? existing?.position ?? 0,
    source: {
      surface: input.source.surface,
      corpus: input.source.corpus,
      sourceId: input.source.sourceId ?? existing?.source.sourceId,
      href: input.source.href ?? existing?.source.href,
      citation: input.source.citation ?? existing?.source.citation,
    },
    meta: {
      ...existing?.meta,
      ...input.meta,
      tags: input.meta.tags ?? existing?.meta.tags ?? [],
    },
    createdAt: input.createdAt ?? existing?.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function createManualNoteEntry(seed?: Partial<FieldManualEntryInput>): FieldManualEntryInput {
  const title = seed?.title?.trim() || 'Trail note';
  const bodyText = seed?.contentText?.trim() || '';

  return {
    id: seed?.id ?? createFieldManualId('note'),
    kind: 'note',
    title,
    summary: seed?.summary?.trim() || 'A blank page in your Field Manual.',
    contentText: bodyText,
    contentHtml: seed?.contentHtml?.trim() || textToParagraphHtml(bodyText),
    note: seed?.note ?? '',
    source: seed?.source ?? {
      surface: 'manual',
      corpus: 'personal',
    },
    meta: seed?.meta ?? {
      savedFrom: 'manual',
      tags: ['note'],
    },
  };
}
