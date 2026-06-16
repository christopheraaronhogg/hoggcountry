<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { loadCharacter, character, updateCharacter, type CharacterV1 } from '../stores/character.svelte';
  import { trailContext, updateContext } from '../stores/trailContext.svelte';

  import EquipmentTab from './character/tabs/EquipmentTab.svelte';
  import ConsumablesTab from './character/tabs/ConsumablesTab.svelte';
  import LogisticsTab from './character/tabs/LogisticsTab.svelte';
  import FinanceTab from './character/tabs/FinanceTab.svelte';
  import TrainingTab from './character/tabs/TrainingTab.svelte';
  import EmergencyTab from './character/tabs/EmergencyTab.svelte';

  let { embedded = false }: { embedded?: boolean; trailContext?: unknown } = $props();

  loadCharacter();

  // --- Local editing state (we persist on change) ---
  // Identity (public-ish)
  let displayName = $state(character.core.displayName || '');
  let nickname = $state(character.core.nickname || '');
  let telegramUsername = $state(character.core.telegramUsername || '');
  let bio = $state(character.core.bio || '');

  // Preferences / constraints
  let noHitchhiking = $state(!!character.core.constraints.noHitchhiking);
  let cleanLanguage = $state(!!character.core.constraints.cleanLanguage);

  // Tabs
  type Tab = 'overview' | 'trail' | 'equipment' | 'consumables' | 'logistics' | 'finance' | 'training' | 'emergency';
  let tab = $state<Tab>('overview');

  // Progression toggle (XP + Marks)
  let progressionEnabled = $state(!!character.progression.enabled);

  // Derived stats (from trailContext — already synced from Character on ToolPage mount)
  let mode = $derived(trailContext.mode || 'planning');
  let percent = $derived(trailContext.percentComplete || 0);
  let milesRemaining = $derived(trailContext.milesRemaining || 0);
  let nearest = $derived(trailContext.nearestLandmark?.name || 'Springer Mountain');

  let baseWeightLbs = $derived.by(() => {
    const items = character.equipment.inventory.items || [];
    const totalOz = items
      .filter((i) => !i.worn)
      .map((i) => Number(i.weightOz ?? 0))
      .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    return Math.round((totalOz / 16) * 10) / 10;
  });

  let moneySpentAllTime = $derived.by(() => {
    const expenses = character.finance.expenses || [];
    const n = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return Math.round(n);
  });

  let emergencyContacts = $derived.by(() =>
    (character.emergency.contacts || []).filter((contact) => String(contact.name || '').trim() && String(contact.phone || '').trim()).length
  );

  let inventoryCount = $derived.by(() => (character.equipment.inventory.items || []).length);

  let profileChecks = $derived.by(() => [
    { id: 'identity', label: 'Identity', done: !!(displayName.trim() || nickname.trim()), value: canonicalName() },
    { id: 'mile', label: 'Current mile', done: Number(trailContext.currentMile) > 0, value: `Mile ${Number(trailContext.currentMile || 0).toFixed(1)}` },
    { id: 'pace', label: 'Pace target', done: Number(targetPace) > 0, value: `${Number(targetPace || 0).toFixed(1)} mi/day` },
    { id: 'pack', label: 'Pack list', done: inventoryCount > 0, value: `${inventoryCount} items` },
    { id: 'resupply', label: 'Resupply defaults', done: Number(carryDays) > 0, value: `${carryDays || 0} carry days` },
    { id: 'emergency', label: 'Emergency contacts', done: emergencyContacts > 0, value: `${emergencyContacts} saved` },
  ]);

  let completedChecks = $derived.by(() => profileChecks.filter((check) => check.done).length);
  let completionPct = $derived.by(() => Math.round((completedChecks / Math.max(1, profileChecks.length)) * 100));
  let nextProfileGaps = $derived.by(() => profileChecks.filter((check) => !check.done).slice(0, 3));

  // Extra “sheet” stats (from Character slices)
  let direction = $derived(character.trail.direction || 'NOBO');
  let carryDays = $derived(character.logistics.resupply.carryDays || 0);
  let typicalWaterCarry = $derived(character.equipment.packPrefs.typicalWaterCarryLiters || 0);
  let powerBankMah = $derived(character.consumables.power.powerBankCapacityMah || 0);

  let startDate = $derived(trailContext.startDate || character.trail.startDate || '');
  let targetPace = $derived(trailContext.targetPace || character.trail.targetPace || 0);

  // Persist identity/preferences changes (guarded to avoid reactive update loops)
  let _coreSig = $state('');
  $effect(() => {
    const nextSig = JSON.stringify({
      displayName,
      nickname,
      telegramUsername,
      bio,
      noHitchhiking,
      cleanLanguage,
    });

    if (nextSig === _coreSig) return;
    _coreSig = nextSig;

    updateCharacter({
      core: {
        displayName,
        nickname,
        telegramUsername,
        bio,
        constraints: {
          noHitchhiking,
          cleanLanguage,
        },
      },
    } as Partial<CharacterV1>);
  });

  function setTab(next: Tab) {
    tab = next;
  }

  function canonicalName() {
    const a = (displayName || '').trim();
    const b = (nickname || '').trim();
    return a || b || 'Unnamed Hiker';
  }

  function handle() {
    const t = (telegramUsername || '').trim();
    if (!t) return '';
    return t.startsWith('@') ? t : `@${t}`;
  }

  function formatDate(value: string) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const tabs: Array<{ id: Tab; label: string; glyph: string; note: string }> = [
    { id: 'overview', glyph: '✦', label: 'Overview', note: 'Stats + identity' },
    { id: 'trail', glyph: '🗺️', label: 'Trail', note: 'Start, pace, mile' },
    { id: 'equipment', glyph: '🎒', label: 'Equipment', note: 'Pack + slots' },
    { id: 'consumables', glyph: '🧃', label: 'Consumables', note: 'Food / water / power' },
    { id: 'logistics', glyph: '📬', label: 'Logistics', note: 'Resupply + mail' },
    { id: 'finance', glyph: '💰', label: 'Finance', note: 'Budget + ledger' },
    { id: 'training', glyph: '🏋️', label: 'Training', note: 'Readiness' },
    { id: 'emergency', glyph: '🆘', label: 'Emergency', note: 'Contacts + medical' },
  ];

  function setTrailFromInputs(next: { startDate?: string; currentMile?: number; targetPace?: number; zeroDaysPerMonth?: number; contextExpanded?: boolean }) {
    // Use trailContext updater so the ContextHero + banner updates immediately.
    updateContext(next);
  }

  // Persist progression enable/disable
  let _progSig = $state('');
  $effect(() => {
    const nextSig = JSON.stringify({ progressionEnabled });
    if (nextSig === _progSig) return;
    _progSig = nextSig;
    updateCharacter({ progression: { enabled: progressionEnabled } } as any);
  });

  // ===== AT Weather / GPS sync helpers =====
  type Milepost = { mile: number; lat: number; lon: number };
  let gpsSyncing = $state(false);
  let gpsSyncMsg = $state('');
  let gpsSyncErr = $state('');
  let gpsMileposts = $state<Milepost[] | null>(null);

  function haversineMeters(a: [number, number], b: [number, number]) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const [lat1, lon1] = a;
    const [lat2, lon2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  async function ensureGpsMileposts(): Promise<Milepost[]> {
    if (gpsMileposts) return gpsMileposts;
    const res = await fetch('/at-mileposts.json', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`mileposts fetch failed: ${res.status}`);
    const data = await res.json();
    const mps: any[] = Array.isArray(data) ? data : data?.mileposts || [];
    gpsMileposts = mps.map((m) => ({ mile: Number(m.mile), lat: Number(m.lat), lon: Number(m.lon) })) as Milepost[];
    return gpsMileposts;
  }

  function nearestMileForLatLng(list: Milepost[], lat: number, lon: number): number | null {
    if (!list.length) return null;
    let best = list[0].mile;
    let bestD = Infinity;
    for (const mp of list) {
      const d = haversineMeters([lat, lon], [mp.lat, mp.lon]);
      if (d < bestD) {
        bestD = d;
        best = mp.mile;
      }
    }
    return best;
  }

  function getGeoPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported on this device.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60_000,
      });
    });
  }

  async function syncGpsToCurrentMile() {
    gpsSyncErr = '';
    gpsSyncMsg = '';
    gpsSyncing = true;

    try {
      const list = await ensureGpsMileposts();
      const pos = await getGeoPosition();
      const la = pos?.coords?.latitude;
      const lo = pos?.coords?.longitude;
      if (typeof la !== 'number' || typeof lo !== 'number') throw new Error('Could not read location.');

      const m = nearestMileForLatLng(list, la, lo);
      if (m == null) throw new Error('Could not match your location to a trail mile.');

      const clamped = Math.max(0, Math.min(2197, Math.round(m)));
      updateContext({ currentMile: clamped });
      gpsSyncMsg = `Synced current mile to ${clamped}.`;
    } catch (e: any) {
      gpsSyncErr = e?.message || 'GPS sync failed.';
    } finally {
      gpsSyncing = false;
    }
  }
</script>

<div class="cs" class:embedded transition:fade={{ duration: 120 }}>
  <header class="profile-hero" aria-label={embedded ? 'Profile readiness' : 'Trail profile'}>
    <div class="profile-copy">
      <p class="eyebrow">Trail Profile</p>
      <div class="name-row">
        <h1 class="title">{canonicalName()}</h1>
        {#if handle()}
          <span class="handle">{handle()}</span>
        {/if}
      </div>
      <p class="lede">
        The defaults Scout and the trail tools should trust first: who you are, where you are,
        what you carry, how you move, and who to call if something goes wrong.
      </p>
      <div class="hero-actions" aria-label="Profile shortcuts">
        <button class="hero-action primary" type="button" onclick={() => setTab('trail')}>Update mile</button>
        <button class="hero-action" type="button" onclick={() => setTab('equipment')}>Pack setup</button>
        <button class="hero-action" type="button" onclick={() => setTab('emergency')}>Emergency info</button>
      </div>
    </div>

    <aside class="readiness-panel" aria-label="Profile readiness">
      <div class="readiness-top">
        <div>
          <span class="panel-k">Ready for tools</span>
          <strong>{completionPct}%</strong>
        </div>
        <span class="pill" data-tone={mode}>{mode === 'trail' ? 'ON TRAIL' : 'PLANNING'}</span>
      </div>
      <div class="readiness-meter" aria-label={`${completionPct}% complete`}>
        <span style={`width: ${completionPct}%`}></span>
      </div>
      <div class="readiness-grid">
        <div><span>Nearest</span><strong>{nearest}</strong></div>
        <div><span>Mile</span><strong>{Number(trailContext.currentMile || 0).toFixed(1)}</strong></div>
        <div><span>Pace</span><strong>{Number(targetPace || 0).toFixed(1)}</strong></div>
        <div><span>Base</span><strong>{baseWeightLbs} lb</strong></div>
      </div>
      {#if nextProfileGaps.length}
        <div class="next-gaps">
          <span class="panel-k">Next to finish</span>
          {#each nextProfileGaps as gap (gap.id)}
            <button class="gap-row" type="button" onclick={() => setTab(gap.id === 'emergency' ? 'emergency' : gap.id === 'pack' ? 'equipment' : gap.id === 'resupply' ? 'logistics' : gap.id === 'mile' || gap.id === 'pace' ? 'trail' : 'overview')}>
              <span>{gap.label}</span>
              <strong>{gap.value}</strong>
            </button>
          {/each}
        </div>
      {/if}
    </aside>
  </header>

  <!-- Navigation -->
  <nav class="nav" aria-label="Character tabs">
    {#each tabs as t (t.id)}
      <button
        class="tab"
        class:active={tab === t.id}
        type="button"
        onclick={() => setTab(t.id)}
      >
        <span class="glyph" aria-hidden="true">{t.glyph}</span>
        <span class="lbl">{t.label}</span>
        <span class="note">{t.note}</span>
      </button>
    {/each}
  </nav>

  <!-- Panel -->
  <section class="panel" transition:fly={{ y: 6, duration: 160 }}>
    {#if tab === 'overview'}
      <div class="overview-layout">
        <div class="card identity-card">
          <div class="card-head">
            <div>
              <h2 class="h">Identity</h2>
              <p class="p">Name, trail name, contact handle, and short notes for Scout context.</p>
            </div>
            <span class="save-chip">Autosaves locally</span>
          </div>

          <div class="form">
            <label class="field">
              <span class="k">Name</span>
              <input class="in" bind:value={displayName} placeholder="Chris" />
            </label>
            <label class="field">
              <span class="k">Nickname / Trail Name</span>
              <input class="in" bind:value={nickname} placeholder="CodeHogg" />
            </label>
            <label class="field">
              <span class="k">Telegram</span>
              <input class="in" bind:value={telegramUsername} placeholder="@codehogg" />
            </label>
            <label class="field" style="grid-column: 1 / -1;">
              <span class="k">Bio</span>
              <textarea class="ta" rows="4" bind:value={bio} placeholder="Useful field context: experience, limits, preferences, support notes." ></textarea>
            </label>
          </div>
        </div>

        <div class="card status-card">
          <h2 class="h">Setup status</h2>
          <p class="p">The profile is useful when these pieces are filled in.</p>

          <div class="checklist">
            {#each profileChecks as check (check.id)}
              <button
                class="setup-row"
                class:is-done={check.done}
                type="button"
                onclick={() => setTab(check.id === 'emergency' ? 'emergency' : check.id === 'pack' ? 'equipment' : check.id === 'resupply' ? 'logistics' : check.id === 'mile' || check.id === 'pace' ? 'trail' : 'overview')}
              >
                <span class="setup-dot" aria-hidden="true"></span>
                <span>{check.label}</span>
                <strong>{check.value}</strong>
              </button>
            {/each}
          </div>
        </div>

        <div class="card preferences-card">
          <h2 class="h">Preferences</h2>
          <p class="p">Defaults that shape tools, prompts, and trail recommendations.</p>

          <div class="checks">
            <label class="check">
              <input type="checkbox" bind:checked={noHitchhiking} />
              <span>No hitchhiking</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={cleanLanguage} />
              <span>Family-friendly language</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={progressionEnabled} />
              <span>Enable progression (XP + Marks)</span>
            </label>
          </div>
        </div>

        <div class="card wide progress-card">
          <div class="card-head">
            <div>
              <h2 class="h">Trail state</h2>
              <p class="p">Current trail position and the tools that read from this profile.</p>
            </div>
            <span class="save-chip">{formatDate(startDate)}</span>
          </div>
          <div class="meter" aria-label="Trail progress">
            <div class="bar" style={`--p:${Math.max(0, Math.min(100, percent))}%`}></div>
            <div class="meter-grid"></div>
            <div class="meter-label">
              <span>{percent.toFixed(1)}%</span>
              <span>{milesRemaining} mi remaining</span>
            </div>
          </div>

          <div class="actions" style="margin-top: 0.85rem;">
            <button class="action primary-action" type="button" onclick={() => setTab('trail')}>Edit trail defaults</button>
            <a class="action" href="/tools/milestone">Journey</a>
            <a class="action" href="/tools/pack">Pack</a>
            <a class="action" href="/tools/resupply">Resupply</a>
            <a class="action" href="/tools/food">Food</a>
            <a class="action" href="/tools/water">Water</a>
            <a class="action" href="/tools/power">Power</a>
            <a class="action" href="/tools/budget">Budget</a>
            <a class="action" href="/tools/mail">Mail Drops</a>
            <a class="action" href="/tools/training">Training</a>
          </div>
        </div>
      </div>

    {:else if tab === 'trail'}
      <div class="card">
        <h2 class="h">Trail Core</h2>
        <p class="p">These drive the entire site: timeline, ETA windows, water plans, food assumptions, everything.</p>

        <div class="form">
          <label class="field">
            <span class="k">Start date</span>
            <input
              class="in"
              type="date"
              value={trailContext.startDate}
              onchange={(e) => setTrailFromInputs({ startDate: (e.currentTarget as HTMLInputElement).value })}
            />
          </label>

          <label class="field">
            <span class="k">Direction</span>
            <select
              class="in"
              value={direction}
              onchange={(e) => updateCharacter({ trail: { direction: (e.currentTarget as HTMLSelectElement).value } } as any)}
            >
              <option value="NOBO">NOBO</option>
              <option value="SOBO">SOBO</option>
              <option value="FLIP">FLIP</option>
            </select>
          </label>

          <label class="field">
            <span class="k">Current mile</span>
            <input
              class="in"
              type="number"
              min="0"
              max="2198"
              step="0.1"
              value={trailContext.currentMile}
              onchange={(e) => setTrailFromInputs({ currentMile: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </label>
          <label class="field">
            <span class="k">Target pace</span>
            <input
              class="in"
              type="number"
              min="8"
              max="25"
              step="0.5"
              value={trailContext.targetPace}
              onchange={(e) => setTrailFromInputs({ targetPace: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </label>
          <label class="field">
            <span class="k">Zeros / month</span>
            <input
              class="in"
              type="number"
              min="0"
              max="10"
              step="1"
              value={trailContext.zeroDaysPerMonth}
              onchange={(e) => setTrailFromInputs({ zeroDaysPerMonth: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </label>
        </div>

        <div class="actions" style="margin-top: 0.85rem;">
          <a class="action" href="/at-weather">AT Weather</a>
          <button class="action" type="button" onclick={syncGpsToCurrentMile} disabled={gpsSyncing}>
            {gpsSyncing ? 'Syncing GPS…' : 'Sync GPS → Current'}
          </button>
          {#if gpsSyncMsg}
            <span class="muted"><strong>{gpsSyncMsg}</strong></span>
          {/if}
          {#if gpsSyncErr}
            <span class="muted" style="color: #b91c1c; font-weight: 800;">{gpsSyncErr}</span>
          {/if}
        </div>

        <div class="checks" style="margin-top: 0.9rem;">
          <label class="check">
            <input
              type="checkbox"
              checked={trailContext.contextExpanded}
              onchange={(e) => setTrailFromInputs({ contextExpanded: (e.currentTarget as HTMLInputElement).checked })}
            />
            <span>Context panel expanded</span>
          </label>
        </div>

        <div class="mini">
          <div class="mini-card">
            <div class="mini-k">Mode</div>
            <div class="mini-v">{mode}</div>
          </div>
          <div class="mini-card">
            <div class="mini-k">Nearest</div>
            <div class="mini-v">{nearest}</div>
          </div>
          <div class="mini-card">
            <div class="mini-k">Pace (actual)</div>
            <div class="mini-v">{trailContext.actualPace} mi/day</div>
          </div>
          <div class="mini-card">
            <div class="mini-k">Finish</div>
            <div class="mini-v">{trailContext.projectedFinish?.toLocaleDateString?.('en-US') ?? '—'}</div>
          </div>
        </div>
      </div>

    {:else if tab === 'equipment'}
      <EquipmentTab />

    {:else if tab === 'consumables'}
      <ConsumablesTab />

    {:else if tab === 'logistics'}
      <LogisticsTab />

    {:else if tab === 'finance'}
      <FinanceTab />

    {:else if tab === 'training'}
      <TrainingTab />

    {:else if tab === 'emergency'}
      <EmergencyTab />

    {:else}
      <div class="card">
        <h2 class="h">{tabs.find((x) => x.id === tab)?.label}</h2>
        <p class="p">This tab is not wired yet.</p>
      </div>
    {/if}
  </section>
</div>

<style>
  /* Aesthetic direction:
     "Appalachian RPG" — WoW inspect meets ranger field-station.
     Pine + parchment + industrial accents. */

  .cs {
    /* Pull from the site-wide "logbook" tokens (src/styles/global.css) */
    --text: var(--fg, #333333);
    --ink: var(--ink, #1f2937);
    --muted: rgba(92, 102, 90, 0.82);

    --pine: #4d594a;
    --pine-2: #3d4a3a;
    --bone: #f5f2e8;

    /* "Paper" surfaces */
    --paper: rgba(255, 255, 255, 0.84);
    --paper-2: rgba(255, 255, 255, 0.70);

    --gold: #f0e000;
    --copper: #d97706;
    --blood: #dc2626;
    --border: rgba(0,0,0,0.10);
    --shadow: 0 18px 52px rgba(0,0,0,0.12);

    color: var(--text);
    position: relative;
  }

  .cs:before {
    content: '';
    position: absolute;
    inset: -18px;
    border-radius: 26px;
    pointer-events: none;
    opacity: 0.55;
    background:
      radial-gradient(900px 520px at 12% 0%, rgba(240, 224, 0, 0.20), rgba(240, 224, 0, 0) 65%),
      radial-gradient(720px 480px at 85% 30%, rgba(166, 181, 137, 0.18), rgba(166, 181, 137, 0) 60%),
      repeating-linear-gradient(135deg, rgba(0,0,0,0.025), rgba(0,0,0,0.025) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 13px);
    filter: blur(0.2px);
    z-index: 0;
  }

  .cs > * { position: relative; z-index: 1; }

  .cs.embedded:before {
    inset: -10px;
    opacity: 0.28;
  }

  .profile-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
    gap: 1rem;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .cs.embedded .profile-hero {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 21rem);
    gap: 0.75rem;
  }

  .profile-copy,
  .readiness-panel {
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 16px 42px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
  }

  .profile-copy {
    padding: clamp(1rem, 3vw, 1.35rem);
    background:
      linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,255,255,0.72)),
      linear-gradient(90deg, rgba(123, 158, 107, 0.12), rgba(217, 119, 6, 0.07));
  }

  .profile-copy:before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 0.35rem;
    background: linear-gradient(180deg, var(--pine), var(--copper));
    pointer-events: none;
  }

  .cs.embedded .profile-copy,
  .cs.embedded .readiness-panel {
    border-radius: 12px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.07);
  }

  .cs.embedded .profile-copy {
    padding: 0.95rem 1rem;
  }

  .eyebrow,
  .panel-k {
    margin: 0;
    color: rgba(52, 66, 58, 0.74);
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .name-row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .title {
    margin: 0.35rem 0 0;
    font-family: Anton, sans-serif;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: clamp(1.9rem, 6vw, 3.1rem);
    line-height: 0.95;
    color: var(--ink);
  }

  .cs.embedded .title {
    font-size: clamp(1.55rem, 4vw, 2.35rem);
  }

  .handle {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(52, 66, 58, 0.88);
    background: rgba(240,224,0,0.35);
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
  }

  .lede {
    max-width: 58ch;
    margin: 0.65rem 0 0;
    color: rgba(45, 55, 48, 0.82);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .cs.embedded .lede {
    max-width: 62ch;
    font-size: 0.9rem;
  }

  .hero-actions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .cs.embedded .hero-actions {
    margin-top: 0.8rem;
  }

  .hero-action {
    min-height: 2.35rem;
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 999px;
    background: rgba(255,255,255,0.74);
    color: rgba(31, 41, 55, 0.92);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.85rem;
    font-family: Oswald, sans-serif;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
  }

  .hero-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  }

  .hero-action.primary {
    background: #263226;
    border-color: rgba(38, 50, 38, 0.9);
    color: #fffaf0;
    box-shadow: 0 12px 24px rgba(38, 50, 38, 0.18);
  }

  .readiness-panel {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    background:
      linear-gradient(180deg, rgba(38, 50, 38, 0.96), rgba(53, 64, 51, 0.95));
    color: rgba(250, 247, 237, 0.9);
  }

  .readiness-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .readiness-top strong {
    display: block;
    margin-top: 0.15rem;
    color: #fffaf0;
    font-family: Anton, sans-serif;
    font-size: 2.2rem;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.04em;
  }

  .readiness-panel .panel-k {
    color: rgba(250, 247, 237, 0.62);
  }

  .readiness-meter {
    height: 0.6rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0,0,0,0.28);
    border: 1px solid rgba(250, 247, 237, 0.14);
  }

  .readiness-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7b9e6b, #f4c674);
  }

  .readiness-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .readiness-grid div {
    min-width: 0;
    border-radius: 10px;
    padding: 0.62rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .readiness-grid span,
  .gap-row span {
    display: block;
    color: rgba(250, 247, 237, 0.62);
    font-size: 0.7rem;
    font-family: Oswald, sans-serif;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .readiness-grid strong {
    display: block;
    margin-top: 0.2rem;
    overflow: hidden;
    color: #fffaf0;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .next-gaps {
    display: grid;
    gap: 0.45rem;
  }

  .gap-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    border: 1px solid rgba(250, 247, 237, 0.12);
    border-radius: 10px;
    background: rgba(0,0,0,0.2);
    color: inherit;
    cursor: pointer;
    padding: 0.55rem 0.65rem;
    text-align: left;
  }

  .gap-row:hover {
    background: rgba(255,255,255,0.1);
  }

  .gap-row strong {
    color: #f4c674;
    font-family: Oswald, sans-serif;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .pill {
    align-self: flex-start;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.72rem;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(250, 247, 237, 0.18);
    background: rgba(255,255,255,0.12);
    color: #fffaf0;
  }

  .pill[data-tone="trail"] {
    background: rgba(34,197,94,0.16);
    border-color: rgba(34,197,94,0.22);
  }

  .pill[data-tone="planning"] {
    background: rgba(59,130,246,0.12);
    border-color: rgba(59,130,246,0.2);
  }

  .muted {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .nav {
    display: flex;
    gap: 0.45rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.2rem;
    scrollbar-width: thin;
  }

  .tab {
    min-width: 8.5rem;
    text-align: left;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.78);
    border-radius: 12px;
    padding: 0.65rem 0.7rem;
    box-shadow: 0 8px 20px rgba(0,0,0,0.07);
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    display: grid;
    gap: 0.1rem;
  }

  .tab:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 44px rgba(0,0,0,0.14);
    border-color: rgba(0,0,0,0.14);
  }

  .tab.active {
    background: rgba(240,224,0,0.18);
    border-color: rgba(240,224,0,0.45);
  }

  .glyph {
    font-size: 1.05rem;
  }

  .lbl {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .note {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .panel {
    border-radius: 16px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.76));
    box-shadow: var(--shadow);
    padding: 1rem;
  }

  .overview-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
    gap: 1rem;
  }

  .overview-layout .wide {
    grid-column: 1 / -1;
  }

  .card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.8rem;
  }

  .card-head .p {
    margin-bottom: 0;
  }

  .save-chip {
    flex: 0 0 auto;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.1);
    background: rgba(123, 158, 107, 0.14);
    color: rgba(47, 64, 47, 0.95);
    font-family: Oswald, sans-serif;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.07em;
    padding: 0.24rem 0.55rem;
    text-transform: uppercase;
  }

  .checklist {
    display: grid;
    gap: 0.45rem;
  }

  .setup-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.55rem;
    align-items: center;
    min-height: 2.4rem;
    width: 100%;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 10px;
    background: rgba(255,255,255,0.72);
    color: rgba(31, 41, 55, 0.92);
    cursor: pointer;
    padding: 0.45rem 0.55rem;
    text-align: left;
  }

  .setup-row:hover {
    background: rgba(240,224,0,0.14);
  }

  .setup-row span:not(.setup-dot) {
    overflow: hidden;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .setup-row strong {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .setup-dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    background: #d97706;
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.12);
  }

  .setup-row.is-done .setup-dot {
    background: #4d7c0f;
    box-shadow: 0 0 0 3px rgba(77, 124, 15, 0.14);
  }

  .primary-action {
    background: var(--pine) !important;
    color: #fffaf0 !important;
  }

  :global(.cs .grid) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  :global(.cs .card) {
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 16px;
    padding: 1rem;
    background: rgba(255,255,255,0.76);
  }

  :global(.cs .card.wide) {
    grid-column: 1 / -1;
  }

  :global(.cs .h) {
    margin: 0;
    font-family: Anton, sans-serif;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 1.05rem;
    color: var(--ink);
  }

  :global(.cs .p) {
    margin: 0.4rem 0 0.9rem;
    color: var(--muted);
    max-width: 70ch;
  }

  :global(.cs .form) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  :global(.cs .field) {
    display: grid;
    gap: 0.35rem;
  }

  :global(.cs .k) {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.72rem;
    color: rgba(52, 66, 58, 0.85);
  }

  :global(.cs .in),
  :global(.cs .ta) {
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.14);
    background: rgba(255,255,255,0.92);
    padding: 0.6rem 0.65rem;
    font: inherit;
  }

  :global(.cs .in:focus),
  :global(.cs .ta:focus) {
    outline: 3px solid rgba(240,224,0,0.55);
    outline-offset: 2px;
  }

  :global(.cs .checks) {
    display: grid;
    gap: 0.45rem;
  }

  :global(.cs .check) {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: rgba(31,35,32,0.88);
    font-weight: 700;
  }

  :global(.cs .actions) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  :global(.cs .action) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.12);
    background: rgba(255,255,255,0.78);
    color: rgba(31, 41, 55, 0.92);
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.72rem;
    transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
  }

  :global(.cs .action:hover) {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(0,0,0,0.12);
    background: rgba(240,224,0,0.18);
  }

  .meter {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.10);
    background: linear-gradient(180deg, rgba(52,66,58,0.10), rgba(52,66,58,0.05));
    height: 56px;
  }

  .bar {
    position: absolute;
    inset: 0;
    width: var(--p);
    background: linear-gradient(90deg, rgba(34,197,94,0.55), rgba(240,224,0,0.55));
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
  }

  .meter-grid {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      rgba(0,0,0,0.10),
      rgba(0,0,0,0.10) 1px,
      rgba(0,0,0,0.00) 1px,
      rgba(0,0,0,0.00) 18px
    );
    mix-blend-mode: multiply;
    pointer-events: none;
    opacity: 0.35;
  }

  .meter-label {
    position: absolute;
    inset: 0;
    padding: 0 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(31,35,32,0.9);
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  :global(.cs .mini) {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  :global(.cs .mini-card) {
    border-radius: 14px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.74);
    padding: 0.8rem;
  }

  :global(.cs .mini-k) {
    color: var(--muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: Oswald, sans-serif;
    font-weight: 700;
  }

  :global(.cs .mini-v) {
    margin-top: 0.25rem;
    font-family: Anton, sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (max-width: 980px) {
    .profile-hero,
    .overview-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .cs:before {
      inset: -8px;
      border-radius: 18px;
    }

    :global(.cs .grid) { grid-template-columns: 1fr; }
    :global(.cs .form) { grid-template-columns: 1fr; }
    :global(.cs .mini) { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .readiness-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .card-head {
      display: grid;
    }

    .tab {
      min-width: 7.5rem;
    }

    .profile-copy,
    .readiness-panel,
    .panel {
      border-radius: 14px;
    }

    .title {
      font-size: clamp(1.8rem, 12vw, 2.45rem);
      line-height: 1;
    }

    .lede {
      font-size: 0.94rem;
      line-height: 1.45;
    }

    .hero-action {
      min-height: 2.2rem;
      padding: 0 0.7rem;
    }
  }
</style>
