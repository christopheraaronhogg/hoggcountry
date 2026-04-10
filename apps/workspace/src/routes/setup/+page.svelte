<script lang="ts">
  import { goto } from '$app/navigation';
  import { createDefaultProfile, initializeManual } from '$lib/manual-db';

  let profile = createDefaultProfile();
  let saving = false;
  let error = '';

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    saving = true;

    try {
      await initializeManual(profile);
      await goto('/today');
    } catch (caught) {
      console.error(caught);
      error = 'Could not create your manual.';
    } finally {
      saving = false;
    }
  }
</script>

<section class="hero">
  <div>
    <p class="eyebrow">Setup</p>
    <h1>Build your personal field manual.</h1>
    <p class="lede">Dad's field guide stays public. This workspace turns it into your own operating manual and keeps it local on your device.</p>
  </div>
  <a href="https://hoggcountry.com/guide/" class="side-link" rel="noopener noreferrer">Read dad's guide first</a>
</section>

<form class="card form-grid" onsubmit={handleSubmit}>
  <label>
    <span>Trail name</span>
    <input bind:value={profile.trailName} placeholder="Hiker name or trail name" />
  </label>

  <label>
    <span>Start date</span>
    <input type="date" bind:value={profile.startDate} />
  </label>

  <label>
    <span>Direction</span>
    <select bind:value={profile.direction}>
      <option value="NOBO">NOBO</option>
      <option value="SOBO">SOBO</option>
    </select>
  </label>

  <label>
    <span>Current mile</span>
    <input type="number" min="0" step="0.1" bind:value={profile.currentMile} />
  </label>

  <label>
    <span>Pace target</span>
    <input type="number" min="1" step="0.5" bind:value={profile.targetPace} />
  </label>

  <label>
    <span>Zero days / month</span>
    <input type="number" min="0" step="1" bind:value={profile.zeroDaysPerMonth} />
  </label>

  <label>
    <span>Budget tier</span>
    <select bind:value={profile.budgetTier}>
      <option value="dirtbag">Dirtbag</option>
      <option value="balanced">Balanced</option>
      <option value="comfortable">Comfortable</option>
    </select>
  </label>

  <label>
    <span>Experience</span>
    <select bind:value={profile.experienceLevel}>
      <option value="first-thru">First thru</option>
      <option value="some-backpacking">Some backpacking</option>
      <option value="section-hiker">Section hiker</option>
      <option value="trail-veteran">Trail veteran</option>
    </select>
  </label>

  <label>
    <span>Gear philosophy</span>
    <select bind:value={profile.gearPhilosophy}>
      <option value="ultralight">Ultralight</option>
      <option value="balanced">Balanced</option>
      <option value="comfort-first">Comfort first</option>
    </select>
  </label>

  <label>
    <span>Town style</span>
    <select bind:value={profile.townStyle}>
      <option value="quick-hit">Quick hit</option>
      <option value="balanced">Balanced</option>
      <option value="lingering">Lingering</option>
    </select>
  </label>

  <label>
    <span>Shelter preference</span>
    <select bind:value={profile.shelterPreference}>
      <option value="tent-first">Tent first</option>
      <option value="shelter-first">Shelter first</option>
      <option value="mixed">Mixed</option>
    </select>
  </label>

  <label>
    <span>Water capacity (L)</span>
    <input type="number" min="0.5" step="0.5" bind:value={profile.waterCapacityLiters} />
  </label>

  <label class="full">
    <span>Reflection style</span>
    <select bind:value={profile.reflectionStyle}>
      <option value="faith-informed">Faith-informed</option>
      <option value="practical-only">Practical only</option>
    </select>
  </label>

  <label class="full">
    <span>Health notes</span>
    <textarea bind:value={profile.healthNotes} rows="4" placeholder="Allergies, injuries, meds, heat issues, or anything your manual should remember."></textarea>
  </label>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <div class="actions full">
    <button type="submit" disabled={saving}>{saving ? 'Building manual...' : 'Create my manual'}</button>
  </div>
</form>

<style>
  .hero {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: end;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.4rem;
    color: #b45309;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.6rem);
    line-height: 0.95;
    color: #1f2937;
  }

  .lede {
    max-width: 58ch;
    color: #5d675c;
    line-height: 1.7;
  }

  .side-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    background: rgba(255, 255, 255, 0.72);
    color: #304136;
    font-weight: 700;
    text-decoration: none;
  }

  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    padding: 1.1rem;
  }

  label {
    display: grid;
    gap: 0.4rem;
    font-weight: 700;
    color: #304136;
  }

  label span {
    font-size: 0.88rem;
    letter-spacing: 0.03em;
  }

  .full {
    grid-column: 1 / -1;
  }

  input,
  select,
  textarea {
    width: 100%;
    min-height: 46px;
    border-radius: 14px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    padding: 0.8rem 0.9rem;
    font: inherit;
    background: #fff;
    color: #1f2937;
  }

  textarea {
    min-height: 130px;
    resize: vertical;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  button {
    min-height: 48px;
    padding: 0.85rem 1.2rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(160deg, #304136, #4a5e4e);
    color: #fff;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .error {
    margin: 0;
    color: #8a2f2f;
    font-weight: 700;
  }
</style>
