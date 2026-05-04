import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { createWorkspaceResource, importWorkspaceResources } from '$lib/server/workspace-store';

const MAX_RESOURCE_FILES = 8;
const MAX_RESOURCE_FILE_BYTES = 8 * 1024 * 1024;
const MAX_RESOURCE_TEXT_CHARS = 80_000;

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const contentType = event.request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = (await event.request.json().catch(() => null)) as {
      kind?: unknown;
      title?: unknown;
      sourceUri?: unknown;
      text?: unknown;
      sensitivity?: unknown;
      searchable?: unknown;
    } | null;
    const kind = payload?.kind === 'url' || payload?.kind === 'official-source' ? payload.kind : 'note';
    const title = typeof payload?.title === 'string' ? payload.title : null;
    const sourceUri = typeof payload?.sourceUri === 'string' ? payload.sourceUri : null;
    const text = typeof payload?.text === 'string' ? payload.text : null;
    const sensitivity =
      payload?.sensitivity === 'normal' ||
      payload?.sensitivity === 'private' ||
      payload?.sensitivity === 'sensitive' ||
      payload?.sensitivity === 'financial' ||
      payload?.sensitivity === 'medical'
        ? payload.sensitivity
        : 'private';

    if (typeof text === 'string' && text.length > MAX_RESOURCE_TEXT_CHARS) {
      throw error(400, `Resource text is too large for beta intake. Keep pasted notes under ${MAX_RESOURCE_TEXT_CHARS.toLocaleString()} characters.`);
    }

    try {
      return ok(await createWorkspaceResource(workspaceId, betaProfile, {
        kind,
        title,
        sourceUri,
        text,
        sensitivity,
        searchable: typeof payload?.searchable === 'boolean' ? payload.searchable : true
      }));
    } catch (caught) {
      throw error(400, caught instanceof Error ? caught.message : 'Could not create resource.');
    }
  }

  const formData = await event.request.formData();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    throw error(400, 'Choose at least one file.');
  }

  if (files.length > MAX_RESOURCE_FILES) {
    throw error(400, `Upload ${MAX_RESOURCE_FILES} or fewer resources at a time.`);
  }

  const oversized = files.find((file) => file.size > MAX_RESOURCE_FILE_BYTES);
  if (oversized) {
    throw error(400, `"${oversized.name}" is too large for beta intake. Keep resources under ${Math.floor(MAX_RESOURCE_FILE_BYTES / 1024 / 1024)} MB.`);
  }

  return ok(await importWorkspaceResources(workspaceId, betaProfile, files));
};
