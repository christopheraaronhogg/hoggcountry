import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BUILTIN_SCOUT_SKILLS, enabledScoutSkills } from '@hoggcountry/scout-skills';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord, updateWorkspaceScoutSkillSetting } from '$lib/server/workspace-store';

function skillPayload(settings: Awaited<ReturnType<typeof getWorkspaceRecord>>['skillSettings']) {
  return {
    skills: BUILTIN_SCOUT_SKILLS,
    settings,
    enabledSkillIds: enabledScoutSkills(settings).map((skill) => skill.id)
  };
}

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  return ok(skillPayload(record.skillSettings));
};

export const PATCH: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    skillId?: unknown;
    enabled?: unknown;
  } | null;
  const skillId = typeof payload?.skillId === 'string' ? payload.skillId.trim() : '';
  const enabled = typeof payload?.enabled === 'boolean' ? payload.enabled : null;

  if (!skillId || enabled === null) {
    throw error(400, 'skillId and enabled are required.');
  }

  try {
    const workspace = await updateWorkspaceScoutSkillSetting(workspaceId, betaProfile, skillId, enabled);
    return ok(skillPayload(workspace.skillSettings));
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes('Unknown Scout skill')) {
      throw error(404, caught.message);
    }
    throw caught;
  }
};
