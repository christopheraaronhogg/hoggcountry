import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BUILTIN_SCOUT_SKILLS,
  buildScoutSkillPromptContext,
  createScoutSkillSearchHit,
  defaultScoutSkillSettings,
  enabledScoutSkills,
  normalizeScoutSkillSettings,
  scoutSkillEnabled,
  setScoutSkillEnabled,
} from '@hoggcountry/scout-skills';

describe('Scout skill settings', () => {
  it('enables default built-in skills for new workspaces', () => {
    const settings = defaultScoutSkillSettings('2026-05-06T00:00:00.000Z');
    assert.deepEqual(
      enabledScoutSkills(settings).map((skill) => skill.id).sort(),
      BUILTIN_SCOUT_SKILLS.filter((skill) => skill.enabledByDefault).map((skill) => skill.id).sort(),
    );
  });

  it('persists skill toggles through normalization', () => {
    const settings = defaultScoutSkillSettings('2026-05-06T00:00:00.000Z');
    const updated = setScoutSkillEnabled(settings, 'kjv-pce-scripture', false, '2026-05-06T01:00:00.000Z');
    const normalized = normalizeScoutSkillSettings(JSON.parse(JSON.stringify(updated)));
    assert.equal(scoutSkillEnabled(normalized, 'kjv-pce-scripture'), false);
  });

  it('keeps disabled Bible skill out of prompt instructions', () => {
    const settings = setScoutSkillEnabled(defaultScoutSkillSettings(), 'kjv-pce-scripture', false);
    const context = buildScoutSkillPromptContext(settings);
    assert.doesNotMatch(context, /KJV PCE Scripture/u);
    assert.doesNotMatch(context, /KJV PCE —/u);
  });

  it('injects KJV citation and wording rules when Bible skill is enabled', () => {
    const context = buildScoutSkillPromptContext(defaultScoutSkillSettings());
    assert.match(context, /KJV PCE Scripture/u);
    assert.match(context, /KJV PCE — \{reference\}/u);
    assert.match(context, /Do not invent verse wording/u);
  });

  it('keeps private workspace skill scoped to workspace-only resources', () => {
    const privateSkill = BUILTIN_SCOUT_SKILLS.find((skill) => skill.id === 'private-workspace-resources');
    assert.ok(privateSkill);
    assert.equal(privateSkill.accessLevel, 'workspace-private');
    assert.ok(privateSkill.resourceIds.every((resourceId) => resourceId.startsWith('workspace:')));
    assert.match(privateSkill.promptInstructions.join(' '), /current workspace/u);
  });

  it('requires citations on skill search hits', () => {
    const hit = createScoutSkillSearchHit({
      skillId: 'kjv-pce-scripture',
      resourceId: 'kjv-pce',
      title: 'Proverbs 3:5',
      excerpt: 'Trust in the LORD with all thine heart...',
      citation: 'KJV PCE — Proverbs 3:5',
      confidence: 0.99,
      relevance: 0.98,
    });
    assert.equal(hit.citation, 'KJV PCE — Proverbs 3:5');
    assert.throws(() => createScoutSkillSearchHit({
      skillId: 'kjv-pce-scripture',
      resourceId: 'kjv-pce',
      title: 'Proverbs 3:5',
      excerpt: 'Trust in the LORD with all thine heart...',
      citation: '',
    }));
  });
});
