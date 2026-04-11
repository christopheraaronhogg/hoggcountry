<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createDefaultProfile, hasManual, initializeManual } from '$lib/manual-db';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let profile = $state(createDefaultProfile());
  let saving = $state(false);
  let error = $state('');

  onMount(async () => {
    if (!profile.trailName && data.betaProfile?.trailName) {
      profile.trailName = data.betaProfile.trailName;
    }

    if (await hasManual()) {
      await goto('/app/today');
    }
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    saving = true;

    try {
      await initializeManual(profile);
      await goto('/app/today');
    } catch (caught) {
      console.error(caught);
      error = 'Could not create your manual.';
    } finally {
      saving = false;
    }
  }
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Setup</p>
    <h1>Seed your manual from Dad's example.</h1>
    <p class="lede">
      This is the actual gated setup. It turns Dad's guide into the pattern for your own operating manual and gives
      OpenClaw a concrete artifact to keep improving.
    </p>
  </div>
  <a class="btn btn-ghost" href="/guide">Read Dad's guide again</a>
</section>

<form class="card panel-copy" style="margin-top:1rem; display:grid; gap:1rem;" onsubmit={handleSubmit}>
  <div class="grid-two">
    <label>
      <span class="eyebrow">Trail name</span>
      <input bind:value={profile.trailName} placeholder="Trail name or hiking identity" />
    </label>

    <label>
      <span class="eyebrow">Start date</span>
      <input type="date" bind:value={profile.startDate} />
    </label>

    <label>
      <span class="eyebrow">Direction</span>
      <select bind:value={profile.direction}>
        <option value="NOBO">NOBO</option>
        <option value="SOBO">SOBO</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Current mile</span>
      <input type="number" min="0" step="0.1" bind:value={profile.currentMile} />
    </label>

    <label>
      <span class="eyebrow">Pace target</span>
      <input type="number" min="1" step="0.5" bind:value={profile.targetPace} />
    </label>

    <label>
      <span class="eyebrow">Zero days / month</span>
      <input type="number" min="0" step="1" bind:value={profile.zeroDaysPerMonth} />
    </label>

    <label>
      <span class="eyebrow">Budget</span>
      <select bind:value={profile.budgetTier}>
        <option value="dirtbag">Dirtbag</option>
        <option value="balanced">Balanced</option>
        <option value="comfortable">Comfortable</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Experience</span>
      <select bind:value={profile.experienceLevel}>
        <option value="first-thru">First thru</option>
        <option value="some-backpacking">Some backpacking</option>
        <option value="section-hiker">Section hiker</option>
        <option value="trail-veteran">Trail veteran</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Gear philosophy</span>
      <select bind:value={profile.gearPhilosophy}>
        <option value="ultralight">Ultralight</option>
        <option value="balanced">Balanced</option>
        <option value="comfort-first">Comfort first</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Town style</span>
      <select bind:value={profile.townStyle}>
        <option value="quick-hit">Quick hit</option>
        <option value="balanced">Balanced</option>
        <option value="lingering">Lingering</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Shelter preference</span>
      <select bind:value={profile.shelterPreference}>
        <option value="tent-first">Tent first</option>
        <option value="shelter-first">Shelter first</option>
        <option value="mixed">Mixed</option>
      </select>
    </label>

    <label>
      <span class="eyebrow">Water capacity (L)</span>
      <input type="number" min="0.5" step="0.5" bind:value={profile.waterCapacityLiters} />
    </label>
  </div>

  <label>
    <span class="eyebrow">Reflection style</span>
    <select bind:value={profile.reflectionStyle}>
      <option value="faith-informed">Faith-informed</option>
      <option value="practical-only">Practical only</option>
    </select>
  </label>

  <label>
    <span class="eyebrow">Health notes</span>
    <textarea bind:value={profile.healthNotes} rows="4" placeholder="Allergies, injuries, meds, heat issues, or anything your manual should remember."></textarea>
  </label>

  {#if error}
    <p style="margin:0; color:#8a2f2f; font-weight:700;">{error}</p>
  {/if}

  <div class="subtle-actions">
    <button class="btn btn-secondary" type="submit" disabled={saving}>
      {saving ? 'Building manual...' : 'Create my manual'}
    </button>
  </div>
</form>
