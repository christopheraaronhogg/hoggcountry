<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  import { loadCharacter, character, type CharacterV1 } from '../stores/character.svelte';
  import { loadContext, trailContext } from '../stores/trailContext.svelte';

  import {
    getLevelInfo,
    getDailyMissions,
    claimDailyMission,
    getPerkStatuses,
    purchasePerk,
    type DailyMissionStatus,
    type PerkStatus,
  } from '../lib/progression';

  import { computeWarmthStats } from '../lib/warmth';

  type ToastTone = 'good' | 'bad' | 'info';
  type MaybeNumber = number | null;
  type CharacterWithProgression = CharacterV1 & { progression: { xp: number; marks: number } };

  loadCharacter();

  let mounted = $state(false);
  let toast = $state<string | null>(null);
  let toastTone = $state<ToastTone>('info');
  let toastTimer = $state<MaybeNumber>(null);

  function showToast(msg: string, tone: 'good' | 'bad' | 'info' = 'info') {
    toast = msg;
    toastTone = tone;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast = null;
    }, 2200);
  }

  onMount(() => {
    loadCharacter();
    loadContext();
    mounted = true;
  });

  function canonicalName() {
    const a = (character.core.displayName || '').trim();
    const b = (character.core.nickname || '').trim();
    return a || b || 'Unnamed Hiker';
  }

  function handle() {
    const t = (character.core.telegramUsername || '').trim();
    if (!t) return '';
    return t.startsWith('@') ? t : `@${t}`;
  }

  let today = $state(new Date().toISOString().slice(0, 10));

  function prog() {
    return (character.data as unknown as CharacterWithProgression).progression;
  }

  let level = $derived.by(() => getLevelInfo(prog()?.xp || 0));
  let marks = $derived.by(() => Number(prog()?.marks) || 0);

  let mode = $derived(trailContext.mode || 'planning');
  let percent = $derived(trailContext.percentComplete || 0);
  let milesRemaining = $derived(trailContext.milesRemaining || 0);
  let nearest = $derived(trailContext.nearestLandmark?.name || 'Springer Mountain');

  let missions = $derived.by(() => getDailyMissions(today));
  let perks = $derived.by(() => getPerkStatuses());
  let warmth = $derived.by(() => computeWarmthStats());

  function claim(m: DailyMissionStatus) {
    const res = claimDailyMission(today, m.id);
    if (!res.ok) {
      if (res.reason === 'already-claimed') return;
      showToast(res.reason === 'not-done' ? 'Not complete yet.' : 'Could not claim.', 'bad');
      return;
    }
    const lvlUp = res.levelAfter > res.levelBefore;
    showToast(lvlUp ? `Mission claimed. Level up to ${res.levelAfter}.` : `Mission claimed. +${res.gainedXp} XP.`, 'good');
  }

  function unlockPerk(p: PerkStatus) {
    const res = purchasePerk(p.id);
    if (!res.ok) {
      if (res.reason === 'insufficient-marks') showToast('Not enough Trail Marks.', 'bad');
      else if (res.reason !== 'already-unlocked') showToast('Could not unlock perk.', 'bad');
      return;
    }
    showToast(`Unlocked: ${p.name}`, 'good');
  }
</script>

<div class="cp" class:mounted transition:fade={{ duration: 120 }}>
  <header class="hero" transition:fly={{ y: 8, duration: 180 }}>
    <div class="crest" aria-hidden="true">
      <div class="ring"></div>
      <div class="core">HC</div>
    </div>

    <div class="who">
      <div class="name-row">
        <h1 class="title">{canonicalName()}</h1>
        {#if handle()}
          <span class="handle">{handle()}</span>
        {/if}
      </div>

      <div class="sub">
        <span class="pill" data-tone={mode}>{mode === 'trail' ? 'ON TRAIL' : 'PLANNING'}</span>
        <span class="muted">Nearest: <strong>{nearest}</strong></span>
        <span class="muted">{percent.toFixed(1)}% • {milesRemaining} mi remaining</span>
      </div>
    </div>

    <div class="rank">
      <div class="rank-top">
        <span class="lvl">Lv {level.level}</span>
        <span class="ttl">{level.title}</span>
      </div>
      <div class="xp" aria-label="Trailcraft XP">
        <div class="xp-bar" style={`--p:${level.pctToNext}%`}></div>
        <div class="xp-meta">
          <span>{level.xpIntoLevel} / {level.xpToNext} XP</span>
          <span class="marks">✦ {marks} Marks</span>
        </div>
      </div>
    </div>
  </header>

  <div class="grid">
    <section class="card" aria-label="Daily missions">
      <div class="card-h">
        <h2 class="h">Daily Trailboard</h2>
        <div class="date">{today}</div>
      </div>

      {#if missions.length === 0}
        <p class="p">Progression is disabled for this character.</p>
      {:else}
        <div class="missions">
          {#each missions as m (m.id)}
            <div class="mission" data-done={m.done} data-claimed={m.claimed}>
              <div class="mission-top">
                <div class="m-title">{m.title}</div>
                <div class="m-reward">+{m.rewardXp} XP • +{m.rewardMarks} Marks</div>
              </div>
              <div class="m-desc">{m.description}</div>
              <div class="m-meter" aria-label="Mission progress">
                <div class="m-bar" style={`--p:${Math.min(100, (m.progress / m.target) * 100)}%`}></div>
                <div class="m-meta">
                  <span>{m.progress.toFixed(1)} / {m.target}</span>
                  {#if m.claimed}
                    <span class="tag ok">Claimed</span>
                  {:else if m.done}
                    <span class="tag good">Ready</span>
                  {:else}
                    <span class="tag">In progress</span>
                  {/if}
                </div>
              </div>
              <div class="m-actions">
                <button class="btn" type="button" disabled={!m.done || m.claimed} onclick={() => claim(m)}>
                  {m.claimed ? 'Claimed' : m.done ? 'Claim Reward' : 'Not Ready'}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <div class="hint">
          Tool missions complete automatically when you open a tool. Mile missions complete when you set your mile.
        </div>
      {/if}
    </section>

    <section class="card" aria-label="Warmth and kit">
      <div class="card-h">
        <h2 class="h">Warmth & Sleep</h2>
        <a class="link" href="/tools/pack/#recommendations">Tune gear →</a>
      </div>

      <div class="warmth">
        <div class="w-row">
          <div class="w-k">Warmth index</div>
          <div class="w-v">{warmth.warmthIndex} / 100</div>
        </div>
        <div class="w-row">
          <div class="w-k">Dry camp (40°F)</div>
          <div class="w-v">~{warmth.minutesDry40F} min</div>
        </div>
        <div class="w-row">
          <div class="w-k">Storm (35°F, wet)</div>
          <div class="w-v">~{warmth.minutesStorm35F} min</div>
        </div>
        <div class="w-row">
          <div class="w-k">Sleep rating</div>
          <div class="w-v">~{warmth.sleepRatingF}°F</div>
        </div>

        <div class="gear">
          <div class="g-h">Sources</div>
          <div class="g-row"><span class="g-k">Bag / Quilt</span><span class="g-v">{warmth.sources.sleepBagName || '—'}</span></div>
          <div class="g-row"><span class="g-k">Pad</span><span class="g-v">{warmth.sources.sleepPadName || '—'}</span></div>
          <div class="g-row"><span class="g-k">Insulation</span><span class="g-v">{warmth.sources.insulationName || '—'}</span></div>
          <div class="g-row"><span class="g-k">Rain shell</span><span class="g-v">{warmth.sources.rainGearName || '—'}</span></div>
        </div>

        <div class="hint">
          Tip: if your pack items include ratings like “20°” or “R ≈ 4”, the sheet will use them.
        </div>
      </div>
    </section>

    <section class="card wide" aria-label="Perks">
      <div class="card-h">
        <h2 class="h">Perks</h2>
        <a class="link" href="/tools/character/">Edit character →</a>
      </div>

      <div class="perks">
        {#each perks as p (p.id)}
          <div class="perk" data-unlocked={p.unlocked}>
            <div class="perk-main">
              <div class="perk-name">{p.name}</div>
              <div class="perk-desc">{p.description}</div>
            </div>
            <div class="perk-side">
              <div class="perk-cost">{p.unlocked ? 'Unlocked' : `Cost: ${p.costMarks} Marks`}</div>
              <button class="btn" type="button" disabled={p.unlocked || !p.canAfford} onclick={() => unlockPerk(p)}>
                {p.unlocked ? 'Unlocked' : p.canAfford ? 'Unlock' : 'Need marks'}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>

  {#if toast}
    <div class="toast" data-tone={toastTone} role="status" aria-live="polite" transition:fly={{ y: 8, duration: 160 }}>
      {toast}
    </div>
  {/if}
</div>

<style>
  .cp {
    --text: var(--fg, #333333);
    --ink: var(--ink, #1f2937);
    --muted: rgba(92, 102, 90, 0.82);
    --pine: var(--pine, #4d594a);
    --alpine: var(--alpine, #a6b589);
    --gold: var(--marker, #f0e000);
    --paper: rgba(255, 255, 255, 0.86);
    --paper-2: rgba(255, 255, 255, 0.72);
    --border: rgba(0, 0, 0, 0.10);
    --shadow: 0 18px 52px rgba(0, 0, 0, 0.12);
    color: var(--text);
    position: relative;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.35s ease, transform 0.35s ease;
  }

  .cp.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .hero {
    display: grid;
    grid-template-columns: 62px 1fr 320px;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.78));
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
  }

  .hero:before {
    content: '';
    position: absolute;
    inset: -80px -120px auto auto;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle at 30% 30%, rgba(240, 224, 0, 0.42), rgba(240, 224, 0, 0) 60%);
    filter: blur(2px);
    transform: rotate(18deg);
    pointer-events: none;
  }

  .hero > * {
    position: relative;
    z-index: 1;
  }

  .crest {
    width: 62px;
    height: 62px;
    border-radius: 16px;
    background: linear-gradient(180deg, #2a352f, #1d2520);
    position: relative;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.25);
  }

  .ring {
    position: absolute;
    inset: 9px;
    border-radius: 12px;
    border: 2px solid rgba(240, 224, 0, 0.55);
  }

  .core {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.92);
  }

  .name-row {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .title {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.02em;
    color: var(--ink);
  }

  .handle {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.62);
    border: 1px solid rgba(0, 0, 0, 0.10);
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.65);
  }

  .sub {
    margin-top: 0.3rem;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .pill {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.70);
    color: rgba(31, 41, 55, 0.82);
  }

  .pill[data-tone='trail'] {
    background: rgba(166, 181, 137, 0.35);
    border-color: rgba(77, 89, 74, 0.2);
  }

  .muted {
    color: rgba(92, 102, 90, 0.9);
    font-size: 0.92rem;
  }

  .rank {
    display: grid;
    gap: 0.45rem;
  }

  .rank-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .lvl {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.9);
  }

  .ttl {
    font-family: Caveat, "Comic Sans MS", cursive;
    font-size: 1.2rem;
    color: rgba(77, 89, 74, 0.95);
  }

  .xp {
    padding: 0.7rem 0.8rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.70);
  }

  .xp-bar {
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--gold), rgba(240, 224, 0, 0.25));
    width: calc(var(--p) * 1%);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.10);
  }

  .xp:before {
    content: '';
    display: block;
    height: 10px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    margin-bottom: -10px;
  }

  .xp-meta {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.72);
  }

  .marks {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.04em;
    color: rgba(77, 89, 74, 0.95);
  }

  .grid {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    align-items: start;
  }

  .card {
    border-radius: 18px;
    background: linear-gradient(180deg, var(--paper), var(--paper-2));
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    padding: 1rem;
  }

  .card.wide {
    grid-column: 1 / -1;
  }

  .card-h {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .h {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: rgba(31, 41, 55, 0.88);
  }

  .date {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.8rem;
    color: rgba(31, 41, 55, 0.55);
  }

  .link {
    font-weight: 700;
    text-decoration: none;
  }

  .missions {
    display: grid;
    gap: 0.75rem;
  }

  .mission {
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.62);
    padding: 0.85rem;
  }

  .mission[data-done='true'] {
    border-color: rgba(166, 181, 137, 0.55);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  }

  .mission[data-claimed='true'] {
    opacity: 0.78;
  }

  .mission-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .m-title {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.02em;
    color: rgba(31, 41, 55, 0.9);
  }

  .m-reward {
    font-size: 0.85rem;
    color: rgba(77, 89, 74, 0.85);
  }

  .m-desc {
    margin-top: 0.25rem;
    color: rgba(31, 41, 55, 0.72);
    font-size: 0.95rem;
  }

  .m-meter {
    margin-top: 0.65rem;
  }

  .m-bar {
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(166, 181, 137, 0.95), rgba(166, 181, 137, 0.25));
    width: calc(var(--p) * 1%);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.08);
  }

  .m-meter:before {
    content: '';
    display: block;
    height: 9px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    margin-bottom: -9px;
  }

  .m-meta {
    margin-top: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.60);
  }

  .tag {
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.65);
    padding: 0.08rem 0.45rem;
    border-radius: 999px;
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
  }

  .tag.good {
    border-color: rgba(166, 181, 137, 0.45);
    background: rgba(166, 181, 137, 0.22);
  }

  .tag.ok {
    border-color: rgba(0, 0, 0, 0.10);
    background: rgba(0, 0, 0, 0.05);
  }

  .m-actions {
    margin-top: 0.65rem;
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    appearance: none;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: rgba(255, 255, 255, 0.78);
    border-radius: 12px;
    padding: 0.55rem 0.75rem;
    font-family: Oswald, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.78rem;
    color: rgba(31, 41, 55, 0.88);
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.12s ease;
  }

  .btn:hover:enabled {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.10);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hint {
    margin-top: 0.75rem;
    color: rgba(31, 41, 55, 0.62);
    font-size: 0.92rem;
  }

  .warmth {
    display: grid;
    gap: 0.5rem;
  }

  .w-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.55rem 0.6rem;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.60);
  }

  .w-k {
    color: rgba(31, 41, 55, 0.68);
  }

  .w-v {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.02em;
    color: rgba(31, 41, 55, 0.9);
  }

  .gear {
    margin-top: 0.75rem;
    border-radius: 14px;
    border: 1px dashed rgba(0, 0, 0, 0.18);
    background: rgba(255, 255, 255, 0.55);
    padding: 0.75rem;
  }

  .g-h {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: rgba(77, 89, 74, 0.88);
    margin-bottom: 0.5rem;
  }

  .g-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 0.75rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .g-row:last-child {
    border-bottom: none;
  }

  .g-k {
    color: rgba(31, 41, 55, 0.62);
    font-size: 0.92rem;
  }

  .g-v {
    color: rgba(31, 41, 55, 0.85);
    font-size: 0.95rem;
  }

  .perks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .perk {
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.62);
    padding: 0.85rem;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 1fr;
  }

  .perk[data-unlocked='true'] {
    border-color: rgba(0, 0, 0, 0.10);
    background: rgba(0, 0, 0, 0.04);
  }

  .perk-name {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.02em;
    color: rgba(31, 41, 55, 0.9);
  }

  .perk-desc {
    margin-top: 0.25rem;
    color: rgba(31, 41, 55, 0.70);
    font-size: 0.95rem;
    line-height: 1.45;
  }

  .perk-side {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .perk-cost {
    font-size: 0.85rem;
    color: rgba(77, 89, 74, 0.88);
  }

  .toast {
    position: fixed;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 80;
    border-radius: 999px;
    padding: 0.6rem 0.9rem;
    border: 1px solid rgba(0, 0, 0, 0.14);
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.78rem;
    color: rgba(31, 41, 55, 0.9);
    max-width: min(520px, calc(100vw - 2rem));
    text-align: center;
  }

  .toast[data-tone='good'] {
    border-color: rgba(166, 181, 137, 0.55);
    background: rgba(166, 181, 137, 0.20);
  }

  .toast[data-tone='bad'] {
    border-color: rgba(220, 38, 38, 0.35);
    background: rgba(220, 38, 38, 0.10);
  }

  /* Responsive */
  @media (max-width: 920px) {
    .hero {
      grid-template-columns: 62px 1fr;
      grid-template-rows: auto auto;
    }
    .rank {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 860px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .perks {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cp {
      transition: none;
    }
    .btn {
      transition: none;
    }
  }
</style>
