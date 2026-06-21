import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dataDir = mkdtempSync(join(tmpdir(), 'scout-documents-'));
process.env.SCOUT_WORKSPACE_DATA_DIR = dataDir;

const libRoot = new URL('../apps/openclaw-web/src/lib/', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('$lib/')) {
      return nextResolve(new URL(`${specifier.slice('$lib/'.length)}.ts`, libRoot).href, context);
    }

    return nextResolve(specifier, context);
  }
});

const {
  createWorkspaceDocument,
  getWorkspaceDocument,
  updateWorkspaceDocumentContent
} = await import('../apps/openclaw-web/src/lib/server/workspace-store.ts');

const betaProfile = {
  email: 'document-test@hoggcountry.local',
  name: 'Document Tester',
  trailName: 'Doc'
};

test('workspace documents can be edited as active user-authored versions', async () => {
  const workspaceId = 'document-edit';
  const created = await createWorkspaceDocument(workspaceId, betaProfile, {
    title: 'Rainy Ridge Plan',
    textContent: '# Rainy Ridge Plan\n\nStart with the old plan.'
  });

  assert.equal(created.document.versions?.length, 1);
  const firstVersionId = created.document.currentVersionId;

  const updated = await updateWorkspaceDocumentContent(workspaceId, betaProfile, {
    documentId: created.document.id,
    title: 'Rainy Ridge Plan v2',
    textContent: '# Rainy Ridge Plan v2\n\nCarry the rain shell at the top of the pack.',
    note: 'Edited after checking the forecast.'
  });

  assert.equal(updated.document.title, 'Rainy Ridge Plan v2');
  assert.equal(updated.document.status, 'active');
  assert.equal(updated.document.textContent, '# Rainy Ridge Plan v2\n\nCarry the rain shell at the top of the pack.');
  assert.equal(updated.document.note, 'Edited after checking the forecast.');
  assert.notEqual(updated.document.currentVersionId, firstVersionId);
  assert.equal(updated.document.versions?.length, 2);
  assert.equal(updated.document.versions?.at(-1)?.author, 'user');
  assert.equal(updated.document.versions?.at(-1)?.versionNumber, 2);

  const reloaded = await getWorkspaceDocument(workspaceId, betaProfile, created.document.id);
  assert.equal(reloaded?.title, 'Rainy Ridge Plan v2');
  assert.equal(reloaded?.versions?.length, 2);

  const raw = JSON.parse(await readFile(join(dataDir, `${workspaceId}.json`), 'utf8'));
  assert.equal(raw.documents[0].versions.length, 2);
});

test('workspace document edits reject empty text and missing documents', async () => {
  await assert.rejects(
    updateWorkspaceDocumentContent('document-edit-errors', betaProfile, {
      documentId: 'missing-doc',
      title: 'Missing',
      textContent: 'Still missing.'
    }),
    /Document not found\./u
  );

  const created = await createWorkspaceDocument('document-edit-errors', betaProfile, {
    title: 'Empty Body Guard',
    textContent: '# Empty Body Guard'
  });

  await assert.rejects(
    updateWorkspaceDocumentContent('document-edit-errors', betaProfile, {
      documentId: created.document.id,
      title: 'Empty Body Guard',
      textContent: '   '
    }),
    /Document text is required\./u
  );
});
