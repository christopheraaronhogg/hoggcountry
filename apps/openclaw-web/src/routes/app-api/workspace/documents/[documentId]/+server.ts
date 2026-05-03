import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { deleteWorkspaceDocument, getWorkspaceDocument, updateWorkspaceDocumentState } from '$lib/server/workspace-store';
import type { ImportedDocumentStatus, ImportedDocumentVisibility } from '@hoggcountry/manual-core';

const STATUSES = new Set(['draft', 'needs-review', 'active', 'archived']);
const VISIBILITIES = new Set(['private', 'trusted-link', 'public']);

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const document = await getWorkspaceDocument(workspaceId, betaProfile, event.params.documentId);

  if (!document) {
    throw error(404, 'Document not found.');
  }

  return ok({ document });
};

export const PATCH: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    status?: unknown;
    visibility?: unknown;
    searchable?: unknown;
    currentVersionId?: unknown;
  } | null;

  const status = typeof payload?.status === 'string' && STATUSES.has(payload.status)
    ? payload.status as ImportedDocumentStatus
    : null;
  const visibility = typeof payload?.visibility === 'string' && VISIBILITIES.has(payload.visibility)
    ? payload.visibility as ImportedDocumentVisibility
    : null;
  const searchable = typeof payload?.searchable === 'boolean' ? payload.searchable : null;
  const currentVersionId = typeof payload?.currentVersionId === 'string' && payload.currentVersionId.trim()
    ? payload.currentVersionId.trim()
    : null;

  try {
    const result = await updateWorkspaceDocumentState(workspaceId, betaProfile, {
      documentId: event.params.documentId,
      status,
      visibility,
      searchable,
      currentVersionId
    });

    return ok(result);
  } catch (caught) {
    if (caught instanceof Error && caught.message === 'Document not found.') {
      throw error(404, caught.message);
    }

    if (caught instanceof Error && caught.message === 'Document version not found.') {
      throw error(400, caught.message);
    }

    throw caught;
  }
};

export const DELETE: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  return ok(await deleteWorkspaceDocument(workspaceId, betaProfile, event.params.documentId));
};
