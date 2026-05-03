import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isStandardDocumentSlotKey } from '@hoggcountry/manual-core';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { createWorkspaceDocument, importWorkspaceDocuments } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const contentType = event.request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = (await event.request.json().catch(() => null)) as {
      title?: unknown;
      textContent?: unknown;
      note?: unknown;
      slotKey?: unknown;
    } | null;
    const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
    const textContent = typeof payload?.textContent === 'string' ? payload.textContent : null;
    const note = typeof payload?.note === 'string' ? payload.note : null;
    const slotKey = isStandardDocumentSlotKey(payload?.slotKey) ? payload.slotKey : null;

    if (!title && !slotKey) {
      throw error(400, 'Document title is required.');
    }

    return ok(await createWorkspaceDocument(workspaceId, betaProfile, {
      title,
      textContent,
      note,
      slotKey
    }));
  }

  const formData = await event.request.formData();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0);

  return ok(await importWorkspaceDocuments(workspaceId, betaProfile, files));
};
