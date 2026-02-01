<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { loadCharacter, character, updateCharacter, type CharacterV1 } from '../stores/character.svelte';
  import { trailContext, updateContext } from '../stores/trailContext.svelte';

  loadCharacter();

  // --- Local editing state (we persist on change) ---
  // Identity (public-ish)
  let displayName = $state(character.core.displayName || '');
  let nickname = $state(character.core.nickname || '');
  let telegramUsername = $state(character.core.telegramUsername || '');
  let bio = $state(character.core.bio || '');

  // Constraints
  let noHitchhiking = $state(!!character.core.constraints.noHitchhiking);
  let cleanLanguage = $state(!!character.core.constraints.cleanLanguage);
  let scriptureTranslation = $state(character.core.constraints.scriptureTranslation || 'KJV');

  // Tabs
  type Tab = 'overview' | 'trail' | 'equipment' | 'consumables' | 'logistics' | 'finance' | 'training' | 'emergency';
  let tab = $state<Tab>('overview');

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

  // Extra “sheet” stats (from Character slices)
  let direction = $derived(character.trail.direction || 'NOBO');
  let carryDays = $derived(character.logistics.resupply.carryDays || 0);
  let typicalWaterCarry = $derived(character.equipment.packPrefs.typicalWaterCarryLiters || 0);
  let powerBankMah = $derived(character.consumables.power.powerBankCapacityMah || 0);

  let startDate = $derived(trailContext.startDate || character.trail.startDate || '');
  let targetPace = $derived(trailContext.targetPace || character.trail.targetPace || 0);

  // Persist identity/constraints changes
  $effect(() => {
    updateCharacter({
      core: {
        displayName,
        nickname,
        telegramUsername,
        bio,
        constraints: {
          noHitchhiking,
          cleanLanguage,
          scriptureTranslation,
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

  // Portrait (v1: local upload / default avatar)
  let portraitUrl = $derived.by(() => {
    // future: character.core.portraitUrl
    return '';
  });

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

  function setTrailFromInputs(next: { startDate?: string; currentMile?: number; targetPace?: number; zeroDaysPerMonth?: number }) {
    // Use trailContext updater so the ContextHero + banner updates immediately.
    updateContext(next);
  }
</script>

<div class="cs" transition:fade={{ duration: 120 }}>
  <!-- Header / Identity Strip -->
  <header class="top">
    <div class="brand">
      <div class="crest" aria-hidden="true">
        <div class="crest-ring"></div>
        <div class="crest-core">HC</div>
      </div>

      <div class="who">
        <div class="name-row">
          <h1 class="title">{canonicalName()}</h1>
          {#if handle()}
            <span class="handle">{handle()}</span>
          {/if}
        </div>
        <div class="sub">
          <span class="pill" data-tone="{mode}">
            {mode === 'trail' ? 'ON TRAIL' : 'PLANNING'}
          </span>

          <span class="muted">Nearest: <strong>{nearest}</strong></span>
          <span class="muted">Base weight: <strong>{baseWeightLbs} lb</strong></span>
          <span class="muted">Spent: <strong>${moneySpentAllTime}</strong></span>

          <div class="chips" aria-label="Character quick stats">
            <span class="chip"><span class="ck">Dir</span><span class="cv">{direction}</span></span>
            {#if startDate}
              <span class="chip"><span class="ck">Start</span><span class="cv">{new Date(startDate).toLocaleDateString('en-US')}</span></span>
            {/if}
            <span class="chip"><span class="ck">Pace</span><span class="cv">{Number(targetPace || 0).toFixed(1)} /day</span></span>
            <span class="chip"><span class="ck">Carry</span><span class="cv">{carryDays} d</span></span>
            <span class="chip"><span class="ck">Water</span><span class="cv">{typicalWaterCarry} L</span></span>
            <span class="chip"><span class="ck">Bank</span><span class="cv">{powerBankMah.toLocaleString()} mAh</span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="portrait" aria-label="Character portrait">
      {#if portraitUrl}
        <img class="portrait-img" src={portraitUrl} alt="Character portrait" />
      {:else}
        <div class="portrait-placeholder">
          <div class="pp-bg"></div>
          <div class="pp-figure" aria-hidden="true"></div>
          <div class="pp-label">
            <span class="pp-k">Portrait</span>
            <span class="pp-v">Default</span>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Navigation -->
  <nav class="nav" aria-label="Character tabs">
    {#each tabs as t}
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
      <div class="grid">
        <div class="card">
          <h2 class="h">Identity</h2>
          <p class="p">This is what “inspect” and tools should treat as your public-facing hiker sheet.</p>

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
              <textarea class="ta" rows="3" bind:value={bio} placeholder="What makes this hiker tick?" />
            </label>
          </div>
        </div>

        <div class="card">
          <h2 class="h">Constraints</h2>
          <div class="checks">
            <label class="check">
              <input type="checkbox" bind:checked={noHitchhiking} />
              <span>No hitchhiking</span>
            </label>
            <label class="check">
              <input type="checkbox" bind:checked={cleanLanguage} />
              <span>Clean language</span>
            </label>
          </div>

          <label class="field" style="margin-top: 0.9rem;">
            <span class="k">Scripture translation</span>
            <select class="in" bind:value={scriptureTranslation}>
              <option value="KJV">KJV</option>
              <option value="other">Other</option>
            </select>
          </label>

          <div class="callout">
            <div class="callout-k">Pro tip</div>
            <div class="callout-v">This character sheet is the spine. Every tool is just a different window into it.</div>
          </div>
        </div>

        <div class="card wide">
          <h2 class="h">Progress</h2>
          <div class="meter" aria-label="Trail progress">
            <div class="bar" style={`--p:${Math.max(0, Math.min(100, percent))}%`}></div>
            <div class="meter-grid"></div>
            <div class="meter-label">
              <span>{percent.toFixed(1)}%</span>
              <span>{milesRemaining} mi remaining</span>
            </div>
          </div>

          <div class="actions" style="margin-top: 0.85rem;">
            <a class="action" href="/tools/milestone/">Journey</a>
            <a class="action" href="/tools/pack/">Pack</a>
            <a class="action" href="/tools/resupply/">Resupply</a>
            <a class="action" href="/tools/food/">Food</a>
            <a class="action" href="/tools/water/">Water</a>
            <a class="action" href="/tools/power/">Power</a>
            <a class="action" href="/tools/budget/">Budget</a>
            <a class="action" href="/tools/mail/">Mail Drops</a>
            <a class="action" href="/tools/training/">Training</a>
          </div>
        </div>
      </div>

    {:else if tab === 'trail'}
      <div class="card">
        <h2 class="h">Trail Core</h2>
        <p class="p">These drive the entire site: timeline, ETA windows, water plans, food assumptions, everything.</p>

        <div class="form" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
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

    {:else}
      <div class="card">
        <h2 class="h">{tabs.find((x) => x.id === tab)?.label}</h2>
        <p class="p">Wiring in progress. This section will be a WoW-style panel that edits the unified character data.</p>
        <div class="todo">
          <div class="todo-item">• Pack inventory + gear slots</div>
          <div class="todo-item">• Mail drops + budgeting + training + emergency</div>
          <div class="todo-item">• Optional: copyable AI portrait prompt + upload</div>
        </div>
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

    --pine: var(--pine, #4d594a);
    --pine-2: #3d4a3a;
    --bone: var(--bg, #f5f2e8);

    /* "Paper" surfaces */
    --paper: rgba(255, 255, 255, 0.84);
    --paper-2: rgba(255, 255, 255, 0.70);

    --gold: var(--marker, #f0e000);
    --copper: var(--terra, #d97706);
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

  .top {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 1rem;
    align-items: stretch;
    margin-bottom: 1rem;
  }

  .brand {
    display: grid;
    grid-template-columns: 62px 1fr;
    gap: 0.9rem;
    padding: 1rem;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78));
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
  }

  .brand:before {
    content: '';
    position: absolute;
    inset: -80px -120px auto auto;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle at 30% 30%, rgba(240,224,0,0.45), rgba(240,224,0,0) 55%);
    filter: blur(2px);
    transform: rotate(18deg);
    pointer-events: none;
  }

  .crest {
    width: 62px;
    height: 62px;
    border-radius: 16px;
    background: linear-gradient(180deg, #2a352f, #1d2520);
    position: relative;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 16px 30px rgba(0,0,0,0.25);
  }

  .crest-ring {
    position: absolute;
    inset: 9px;
    border-radius: 12px;
    border: 1px solid rgba(240,224,0,0.55);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.35);
  }

  .crest-core {
    font-family: Anton, sans-serif;
    letter-spacing: 0.06em;
    color: var(--gold);
    font-size: 1.2rem;
    text-shadow: 0 2px 0 rgba(0,0,0,0.25);
  }

  .name-row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .title {
    margin: 0;
    font-family: Anton, sans-serif;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 1.6rem;
    color: var(--ink);
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

  .sub {
    margin-top: 0.25rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 0.9rem;
    align-items: center;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
    justify-content: flex-end;
    margin-left: auto;
  }

  .chip {
    display: inline-flex;
    align-items: baseline;
    gap: 0.4rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.10);
    background: rgba(255,255,255,0.74);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35);
  }

  .ck {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-size: 0.62rem;
    color: var(--muted);
  }

  .cv {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.04em;
    font-size: 0.78rem;
    color: rgba(31, 41, 55, 0.92);
  }

  .pill {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.72rem;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.72);
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

  .portrait {
    border-radius: 18px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.7));
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .portrait-placeholder {
    height: 100%;
    position: relative;
    display: grid;
    place-items: center;
  }

  .pp-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(240,224,0,0.35), rgba(240,224,0,0) 55%),
      radial-gradient(circle at 70% 75%, rgba(34,197,94,0.18), rgba(34,197,94,0) 60%),
      linear-gradient(180deg, rgba(52,66,58,0.08), rgba(255,255,255,0.0));
  }

  .pp-figure {
    width: 120px;
    height: 160px;
    border-radius: 18px;
    background:
      radial-gradient(circle at 50% 30%, rgba(0,0,0,0.10), rgba(0,0,0,0) 55%),
      linear-gradient(180deg, rgba(52,66,58,0.22), rgba(52,66,58,0.10));
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.35);
  }

  .pp-label {
    position: absolute;
    inset: auto 0 0 0;
    padding: 0.7rem 0.85rem;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: baseline;
    background: linear-gradient(180deg, rgba(255,255,255,0.0), rgba(255,255,255,0.9));
  }

  .pp-k {
    font-family: Oswald, sans-serif;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .pp-v {
    font-family: Anton, sans-serif;
    letter-spacing: 0.04em;
  }

  .nav {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.55rem;
    margin-bottom: 1rem;
  }

  .tab {
    text-align: left;
    border: 1px solid var(--border);
    background: rgba(255,255,255,0.78);
    border-radius: 14px;
    padding: 0.65rem 0.7rem;
    box-shadow: 0 14px 34px rgba(0,0,0,0.10);
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
    border-radius: 18px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.76));
    box-shadow: var(--shadow);
    padding: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .card {
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: 16px;
    padding: 1rem;
    background: rgba(255,255,255,0.76);
  }

  .card.wide {
    grid-column: 1 / -1;
  }

  .h {
    margin: 0;
    font-family: Anton, sans-serif;
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 1.05rem;
    color: var(--ink);
  }

  .p {
    margin: 0.4rem 0 0.9rem;
    color: var(--muted);
    max-width: 70ch;
  }

  .form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  .k {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.72rem;
    color: rgba(52, 66, 58, 0.85);
  }

  .in,
  .ta {
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.14);
    background: rgba(255,255,255,0.92);
    padding: 0.6rem 0.65rem;
    font: inherit;
  }

  .in:focus,
  .ta:focus {
    outline: 3px solid rgba(240,224,0,0.55);
    outline-offset: 2px;
  }

  .checks {
    display: grid;
    gap: 0.45rem;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: rgba(31,35,32,0.88);
    font-weight: 700;
  }

  .callout {
    margin-top: 1rem;
    border-radius: 14px;
    border: 1px dashed rgba(0,0,0,0.18);
    padding: 0.8rem;
    background: rgba(34,197,94,0.08);
  }

  .callout-k {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
    color: rgba(52,66,58,0.85);
  }

  .callout-v {
    margin-top: 0.25rem;
    color: rgba(31,35,32,0.78);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .action {
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

  .action:hover {
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

  .mini {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .mini-card {
    border-radius: 14px;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.74);
    padding: 0.8rem;
  }

  .mini-k {
    color: var(--muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-family: Oswald, sans-serif;
    font-weight: 700;
  }

  .mini-v {
    margin-top: 0.25rem;
    font-family: Anton, sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .todo {
    margin-top: 0.8rem;
    border-radius: 14px;
    border: 1px solid rgba(0,0,0,0.10);
    background: rgba(0,0,0,0.03);
    padding: 0.8rem;
  }

  @media (max-width: 980px) {
    .top { grid-template-columns: 1fr; }
    .portrait { height: 220px; }
    .nav { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  @media (max-width: 720px) {
    .grid { grid-template-columns: 1fr; }
    .form { grid-template-columns: 1fr; }
    .mini { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
