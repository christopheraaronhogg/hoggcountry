import {
  FIELD_MANUAL_SCHEMA_VERSION,
  normalizeManualEntry,
  sortManualEntries,
  type FieldManualEntry,
  type FieldManualExportPayload,
} from './types';

const IMPORT_DATA_PATTERN =
  /<script[^>]*id=["']field-manual-data["'][^>]*>([\s\S]*?)<\/script>/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEntryShape(value: unknown): value is FieldManualEntry {
  if (!isRecord(value)) return false;

  return typeof value.id === 'string'
    && typeof value.kind === 'string'
    && typeof value.title === 'string'
    && typeof value.summary === 'string'
    && typeof value.contentText === 'string'
    && typeof value.contentHtml === 'string'
    && typeof value.note === 'string'
    && typeof value.position === 'number'
    && isRecord(value.source)
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string';
}

export function extractFieldManualPayloadFromHtml(html: string): FieldManualExportPayload {
  const match = html.match(IMPORT_DATA_PATTERN);
  if (!match?.[1]) {
    throw new Error('This file does not contain a Field Manual payload.');
  }

  const parsed = JSON.parse(match[1]) as unknown;
  if (!isRecord(parsed) || !Array.isArray(parsed.entries)) {
    throw new Error('The Field Manual payload is malformed.');
  }

  const version = typeof parsed.version === 'number'
    ? parsed.version
    : FIELD_MANUAL_SCHEMA_VERSION;

  const entries = parsed.entries
    .filter(isEntryShape)
    .map((entry, index) => normalizeManualEntry(entry, {
      ...entry,
      position: typeof entry.position === 'number' ? entry.position : index,
    }))
    .map((entry, index) => ({
      ...entry,
      position: index,
    }));

  return {
    version: version as typeof FIELD_MANUAL_SCHEMA_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string'
      ? parsed.exportedAt
      : new Date().toISOString(),
    entries: sortManualEntries(entries),
  };
}

export async function readFieldManualImport(file: Blob): Promise<FieldManualExportPayload> {
  const html = await file.text();
  return extractFieldManualPayloadFromHtml(html);
}
