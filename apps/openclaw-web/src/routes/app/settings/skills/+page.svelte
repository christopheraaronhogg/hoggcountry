<script lang="ts">
  import { onMount } from 'svelte';
  import type { ScoutSkill, ScoutSkillSettings } from '@hoggcountry/scout-skills';
  import { getScoutSkillSettings, setWorkspaceScoutSkillEnabled } from '$lib/manual-db';

  let skills = $state<ScoutSkill[]>([]);
  let settings = $state<ScoutSkillSettings | null>(null);
  let loading = $state(true);
  let savingSkillId = $state('');
  let error = $state('');
  let notice = $state('');

  const enabledCount = $derived(skills.filter((skill) => skillEnabled(skill.id)).length);

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load Scout skills.';
      loading = false;
    });
  });

  async function refresh() {
    loading = true;
    const payload = await getScoutSkillSettings();
    skills = payload.skills;
    settings = payload.settings;
    loading = false;
  }

  function skillEnabled(skillId: string): boolean {
    const skill = skills.find((item) => item.id === skillId);
    const preference = settings?.preferences.find((item) => item.skillId === skillId);
    return preference?.enabled ?? skill?.enabledByDefault ?? false;
  }

  async function toggleSkill(skill: ScoutSkill) {
    if (!skill.userToggleable || savingSkillId) return;

    error = '';
    notice = '';
    savingSkillId = skill.id;
    try {
      const payload = await setWorkspaceScoutSkillEnabled(skill.id, !skillEnabled(skill.id));
      skills = payload.skills;
      settings = payload.settings;
      notice = `${skill.title} ${skillEnabled(skill.id) ? 'enabled' : 'disabled'}.`;
    } catch (caught) {
      console.error(caught);
      error = 'Could not update that skill.';
    } finally {
      savingSkillId = '';
    }
  }
</script>

<section class="skills-hero">
  <div>
    <p class="eyebrow">Scout settings</p>
    <h1>Skills control how Scout uses resources.</h1>
    <p class="lede">
      Resources are data. Skills are the rules around when Scout can search them, how it cites them, and what caveats it must keep.
    </p>
  </div>
  <div class="skills-meter" aria-label="Enabled skills summary">
    <strong>{enabledCount}</strong>
    <span>enabled skills</span>
  </div>
</section>

{#if error}
  <p class="surface-alert surface-alert--error">{error}</p>
{/if}
{#if notice}
  <p class="surface-alert surface-alert--success">{notice}</p>
{/if}

{#if loading}
  <section class="skills-list">
    <article class="skill-row card">
      <p class="muted">Loading Scout skills...</p>
    </article>
  </section>
{:else}
  <section class="skills-list" aria-label="Scout skills">
    {#each skills as skill (skill.id)}
      <article class="skill-row card">
        <div class="skill-main">
          <div>
            <p class="eyebrow">{skill.category.replace('-', ' ')}</p>
            <h2>{skill.title}</h2>
          </div>
          <button
            type="button"
            class:enabled={skillEnabled(skill.id)}
            class="skill-toggle"
            disabled={!skill.userToggleable || savingSkillId === skill.id}
            aria-pressed={skillEnabled(skill.id)}
            onclick={() => toggleSkill(skill)}
          >
            <span>{skillEnabled(skill.id) ? 'On' : 'Off'}</span>
          </button>
        </div>

        <p>{skill.description}</p>

        <div class="skill-meta">
          <span>{skill.enabledByDefault ? 'Default on' : 'Default off'}</span>
          <span>{skill.userToggleable ? 'User toggleable' : 'Locked'}</span>
          <span>{skill.accessLevel.replace('-', ' ')}</span>
          <span>{skill.retrievalStrategy.replace('-', ' ')}</span>
        </div>

        <div class="skill-detail-grid">
          <div>
            <strong>Citation</strong>
            <span>{skill.citationTemplate}</span>
          </div>
          <div>
            <strong>Rules</strong>
            <span>{skill.promptInstructions[0]}</span>
          </div>
          <div>
            <strong>Caveat</strong>
            <span>{skill.caveats[0]}</span>
          </div>
        </div>
      </article>
    {/each}
  </section>
{/if}

<style>
  .skills-hero {
    display: grid;
    gap: 1rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 24px;
    background: rgba(255, 253, 248, 0.88);
    box-shadow: var(--shadow-soft);
    padding: clamp(1rem, 4vw, 1.35rem);
  }

  .skills-hero h1,
  .skills-hero p,
  .skill-row h2,
  .skill-row p {
    margin: 0;
  }

  .skills-hero h1 {
    max-width: 13ch;
    font-size: clamp(2rem, 7vw, 3.5rem);
    line-height: 1;
  }

  .skills-meter {
    display: grid;
    align-content: center;
    gap: 0.15rem;
    border-radius: 18px;
    background: #edf3e5;
    color: var(--pine);
    padding: 1rem;
    text-align: center;
  }

  .skills-meter strong {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    line-height: 1;
  }

  .skills-meter span,
  .skill-row p,
  .skill-detail-grid span {
    color: var(--muted);
  }

  .surface-alert {
    border-radius: 16px;
    margin-top: 1rem;
    padding: 0.8rem 1rem;
    font-weight: 800;
  }

  .surface-alert--error {
    border: 1px solid rgba(138, 47, 47, 0.18);
    background: #fff0ed;
    color: #8a2f2f;
  }

  .surface-alert--success {
    border: 1px solid rgba(22, 101, 52, 0.18);
    background: #edf7e8;
    color: #166534;
  }

  .skills-list {
    display: grid;
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .skill-row {
    display: grid;
    gap: 0.8rem;
    padding: 1rem;
  }

  .skill-main,
  .skill-meta,
  .skill-detail-grid {
    display: grid;
    gap: 0.65rem;
  }

  .skill-main {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .skill-row h2 {
    font-size: clamp(1.25rem, 4vw, 1.65rem);
  }

  .skill-toggle {
    position: relative;
    min-width: 4.4rem;
    min-height: 2.45rem;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 999px;
    background: #f5f2e8;
    color: var(--muted);
    font: inherit;
    font-weight: 900;
  }

  .skill-toggle.enabled {
    background: #22382a;
    color: #fffdf8;
  }

  .skill-toggle:disabled {
    opacity: 0.62;
    cursor: wait;
  }

  .skill-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .skill-meta span {
    border-radius: 999px;
    background: rgba(245, 242, 232, 0.9);
    color: var(--muted);
    padding: 0.35rem 0.6rem;
    font-size: 0.83rem;
    font-weight: 800;
    text-transform: capitalize;
  }

  .skill-detail-grid {
    border-top: 1px solid rgba(77, 89, 74, 0.11);
    padding-top: 0.8rem;
  }

  .skill-detail-grid div {
    display: grid;
    gap: 0.2rem;
  }

  .skill-detail-grid strong {
    color: var(--pine);
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  @media (min-width: 760px) {
    .skills-hero {
      grid-template-columns: minmax(0, 1fr) minmax(180px, 0.28fr);
      align-items: stretch;
    }

    .skill-meta {
      display: flex;
      flex-wrap: wrap;
    }

    .skill-detail-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
