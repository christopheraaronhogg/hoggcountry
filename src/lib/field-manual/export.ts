import {
  escapeHtml,
  sanitizeManualHtml,
  textToParagraphHtml,
  type FieldManualEntry,
  type FieldManualExportPayload,
  FIELD_MANUAL_SCHEMA_VERSION,
} from './types';

function kindLabel(kind: FieldManualEntry['kind']): string {
  switch (kind) {
    case 'library':
      return 'Trail wisdom';
    case 'scripture':
      return 'Scripture';
    case 'today':
      return 'Today';
    case 'plan':
      return 'Plan';
    case 'note':
      return 'Note';
    default:
      return kind;
  }
}

function renderSource(entry: FieldManualEntry): string {
  const pieces = [
    kindLabel(entry.kind),
    entry.source.citation,
  ].filter(Boolean);

  if (entry.source.href) {
    return `<a href="${escapeHtml(entry.source.href)}">${escapeHtml(pieces.join(' · ') || 'Source')}</a>`;
  }

  return escapeHtml(pieces.join(' · ') || 'Saved to your Field Manual');
}

function renderEntry(entry: FieldManualEntry, index: number): string {
  const body = sanitizeManualHtml(entry.contentHtml) || textToParagraphHtml(entry.contentText || entry.summary);
  const note = entry.note.trim()
    ? `
      <aside class="entry-note">
        <h3>Your note</h3>
        <p>${escapeHtml(entry.note.trim())}</p>
      </aside>
    `
    : '';

  return `
    <section class="entry">
      <div class="entry-kicker">
        <span class="entry-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="entry-kind">${escapeHtml(kindLabel(entry.kind))}</span>
      </div>
      <h2>${escapeHtml(entry.title)}</h2>
      ${entry.summary ? `<p class="entry-summary">${escapeHtml(entry.summary)}</p>` : ''}
      <div class="entry-body">
        ${body}
      </div>
      ${note}
      <p class="entry-source">${renderSource(entry)}</p>
    </section>
  `;
}

export function buildFieldManualPayload(entries: FieldManualEntry[]): FieldManualExportPayload {
  return {
    version: FIELD_MANUAL_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

export function buildFieldManualHtml(entries: FieldManualEntry[]): string {
  const payload = buildFieldManualPayload(entries);
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const renderedEntries = entries.map((entry, index) => renderEntry(entry, index)).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Field Manual</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f7f2e8;
      --ink: #2d3028;
      --pine: #4d594a;
      --alpine: #a6b589;
      --marker: #f0e000;
      --border: #d8d0bf;
      --muted: #5c665a;
      --card: rgba(255, 255, 255, 0.8);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      background:
        radial-gradient(circle at top, rgba(166, 181, 137, 0.14), transparent 30%),
        linear-gradient(180deg, #fbf8f1, var(--paper));
      color: var(--ink);
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      line-height: 1.7;
    }

    main {
      max-width: 820px;
      margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
    }

    .cover {
      padding: 2.5rem 2rem;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.62);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      background: rgba(240, 224, 0, 0.22);
      color: #5a5200;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    h1, h2, h3 {
      font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
      color: var(--pine);
      line-height: 1.15;
    }

    h1 {
      margin: 1rem 0 0.5rem;
      font-size: clamp(2.2rem, 5vw, 3.6rem);
    }

    .deck {
      margin: 0;
      color: var(--muted);
      font-size: 1.1rem;
      max-width: 60ch;
    }

    .meta {
      margin-top: 1rem;
      color: var(--muted);
      font-size: 0.95rem;
    }

    .entry {
      margin-top: 1.75rem;
      padding: 1.75rem;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--card);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
      break-inside: avoid;
    }

    .entry-kicker {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .entry-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      min-height: 2rem;
      border-radius: 999px;
      background: rgba(77, 89, 74, 0.1);
      color: var(--pine);
    }

    .entry h2 {
      margin: 0.75rem 0 0.4rem;
      font-size: 1.75rem;
    }

    .entry-summary {
      margin: 0 0 1rem;
      color: var(--muted);
      font-style: italic;
    }

    .entry-body p:first-child {
      margin-top: 0;
    }

    .entry-body p:last-child {
      margin-bottom: 0;
    }

    .entry-body ul,
    .entry-body ol {
      padding-left: 1.25rem;
    }

    .entry-body blockquote {
      margin: 1rem 0;
      padding: 1rem 1.25rem;
      border-left: 4px solid var(--alpine);
      background: rgba(166, 181, 137, 0.12);
      color: var(--pine);
    }

    .entry-body table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .entry-body th,
    .entry-body td {
      border: 1px solid var(--border);
      padding: 0.55rem 0.7rem;
      text-align: left;
      vertical-align: top;
    }

    .entry-body th {
      background: rgba(77, 89, 74, 0.08);
    }

    .entry-note {
      margin-top: 1.1rem;
      padding: 1rem 1.15rem;
      border-radius: 14px;
      background: rgba(240, 224, 0, 0.14);
      border: 1px solid rgba(224, 212, 0, 0.45);
    }

    .entry-note h3 {
      margin: 0 0 0.5rem;
      font-size: 1rem;
    }

    .entry-note p {
      margin: 0;
    }

    .entry-source {
      margin-top: 1rem;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .entry-source a {
      color: inherit;
    }

    @media print {
      body {
        background: #fff;
      }

      main {
        max-width: none;
        padding: 0.5in;
      }

      .cover,
      .entry {
        box-shadow: none;
        background: #fff;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="cover">
      <span class="eyebrow">Hogg Country</span>
      <h1>My Field Manual</h1>
      <p class="deck">A personal, offline-first Appalachian Trail operating manual built from saved trail wisdom, scripture, planning outputs, and your own notes.</p>
      <p class="meta">Exported ${escapeHtml(new Date(payload.exportedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }))} · ${entries.length} entries</p>
    </section>
    ${renderedEntries || '<section class="entry"><h2>No saved entries yet</h2><p>This manual was exported before anything was pinned.</p></section>'}
  </main>
  <script id="field-manual-data" type="application/json">${json}</script>
</body>
</html>`;
}

export function buildFieldManualFileName(date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `my-field-manual-${stamp}.html`;
}
