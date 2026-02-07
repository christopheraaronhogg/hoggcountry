<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCharacter, character } from '../../stores/character.svelte';
  import { loadContext, trailContext, TRAIL_TOTAL_MILES } from '../../stores/trailContext.svelte';
  import type { AppMode, PresenceVisibility, ShellUser } from '../../lib/trail-shell-store';

  interface Props {
    mode: AppMode;
    user: ShellUser | null;
    visibility: PresenceVisibility;
  }

  let { mode = 'prep', user = null, visibility = 'private' }: Props = $props();

  let mounted = $state(false);
  let equipPulse = $state(false);
  let previousGearCount = $state(0);
  let pulseTimer: number | null = null;

  function preferredName(): string {
    const trailName = character.core.nickname?.trim();
    if (trailName) return trailName;

    const displayName = character.core.displayName?.trim();
    if (displayName) return displayName;

    const authTrailName = user?.profile?.trail_name?.trim();
    if (authTrailName) return authTrailName;

    const authDisplay = user?.profile?.display_name?.trim();
    if (authDisplay) return authDisplay;

    return user?.name || 'Trail Character';
  }

  let distanceComplete = $derived.by(() => Number(trailContext.currentMile || 0));
  let progressPct = $derived.by(() => {
    const pct = (distanceComplete / TRAIL_TOTAL_MILES) * 100;
    return Math.max(0, Math.min(100, pct));
  });
  let milesRemaining = $derived.by(() => Math.max(0, TRAIL_TOTAL_MILES - distanceComplete));

  let inventoryItems = $derived.by(() => character.equipment.inventory.items || []);
  let packedItemsCount = $derived.by(() => inventoryItems.filter((item) => !item.worn).length);
  let wornItemsCount = $derived.by(() => inventoryItems.filter((item) => item.worn).length);
  let baseWeightLb = $derived.by(() => {
    const ounces = inventoryItems
      .filter((item) => !item.worn)
      .reduce((total, item) => total + (Number(item.weightOz) || 0), 0);
    return ounces / 16;
  });

  let profileCards = $derived.by(() => {
    const warmth = Number(character.consumables.power.daysSinceTown || 0);
    return [
      {
        label: 'Current Mile',
        value: `${distanceComplete.toFixed(1)}`,
      },
      {
        label: 'Target Pace',
        value: `${Number(character.trail.targetPace || 0).toFixed(1)} mpd`,
      },
      {
        label: 'Base Weight',
        value: `${baseWeightLb.toFixed(1)} lb`,
      },
      {
        label: 'Visibility',
        value: visibility,
      },
      {
        label: 'Zero Days',
        value: `${Number(character.trail.zeroDaysPerMonth || 0)} / mo`,
      },
      {
        label: 'Days Since Town',
        value: `${warmth}`,
      },
    ];
  });

  let gearHighlights = $derived.by(() => {
    return inventoryItems
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        name: item.name || item.category || 'Gear',
        worn: Boolean(item.worn),
      }));
  });

  let modeCopy = $derived.by(() => {
    if (mode === 'live') {
      return {
        label: 'Live Trail',
        blurb: 'Map and trail tools are tuned for fast on-foot decisions right now.',
      };
    }

    if (mode === 'post') {
      return {
        label: 'Post Trail',
        blurb: 'Capture takeaways and reset your setup for the next push.',
      };
    }

    return {
      label: 'Mile 0 Prep',
      blurb: 'Dial your setup, then start your hike when you are ready to go live.',
    };
  });

  onMount(() => {
    loadCharacter();
    loadContext();
    mounted = true;
  });

  $effect(() => {
    const currentCount = packedItemsCount + wornItemsCount;

    if (!mounted) {
      previousGearCount = currentCount;
      return;
    }

    if (currentCount !== previousGearCount) {
      equipPulse = true;
      if (pulseTimer) {
        window.clearTimeout(pulseTimer);
      }
      pulseTimer = window.setTimeout(() => {
        equipPulse = false;
      }, 420);
      previousGearCount = currentCount;
    }

    return () => {
      if (pulseTimer) {
        window.clearTimeout(pulseTimer);
      }
    };
  });
</script>

<section class="character-hub" class:mounted>
  <header class="hub-head">
    <div class="identity">
      <p class="kicker">Character Hub</p>
      <h1>{preferredName()}</h1>
      <p>{modeCopy.blurb}</p>
    </div>

    <div class="trail-progress" aria-label="Trail progress">
      <div class="progress-top">
        <strong>{modeCopy.label}</strong>
        <span>{progressPct.toFixed(1)}%</span>
      </div>
      <div class="progress-bar" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
        <span style={`width:${progressPct}%`}></span>
      </div>
      <div class="progress-meta">
        <span>{distanceComplete.toFixed(1)} mi complete</span>
        <span>{milesRemaining.toFixed(1)} mi to Katahdin</span>
      </div>
    </div>
  </header>

  <div class="hub-grid">
    <div class="avatar-stage" class:equip-pulse={equipPulse}>
      <div class="avatar-core" aria-hidden="true">
        <div class="halo"></div>
        <div class="body"></div>
      </div>

      <div class="gear-orbit" aria-label="Equipped and packed items">
        {#each gearHighlights as item, idx}
          <div class="gear-chip" class:worn={item.worn} style={`--chip-index:${idx}`}>
            {item.name}
          </div>
        {/each}
      </div>

      <div class="avatar-meta">
        <div>
          <span class="meta-label">Packed</span>
          <strong>{packedItemsCount}</strong>
        </div>
        <div>
          <span class="meta-label">Worn</span>
          <strong>{wornItemsCount}</strong>
        </div>
        <div>
          <span class="meta-label">Base</span>
          <strong>{baseWeightLb.toFixed(1)} lb</strong>
        </div>
      </div>
    </div>

    <div class="stats-grid" aria-label="Current hiking stats">
      {#each profileCards as card}
        <article class="stat-card">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .character-hub {
    position: relative;
    z-index: var(--layer-character, 20);
    padding: 0.75rem 0.9rem 6.25rem;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 220ms ease, transform 220ms ease;
  }

  .character-hub.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .hub-head {
    display: grid;
    gap: 0.85rem;
    margin-bottom: 0.85rem;
  }

  .identity {
    display: grid;
    gap: 0.32rem;
  }

  .kicker {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    font-size: 0.71rem;
    font-family: Oswald, sans-serif;
    color: rgba(31, 41, 55, 0.72);
  }

  .identity h1 {
    margin: 0;
    font-size: clamp(1.5rem, 5vw, 2.1rem);
    line-height: 1.05;
  }

  .identity p {
    margin: 0;
    font-size: 0.89rem;
    line-height: 1.42;
    color: rgba(31, 41, 55, 0.78);
  }

  .trail-progress {
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 14px;
    padding: 0.65rem 0.7rem 0.6rem;
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 10px 24px rgba(38, 52, 39, 0.08);
  }

  .progress-top,
  .progress-meta {
    display: flex;
    justify-content: space-between;
    gap: 0.6rem;
    font-size: 0.76rem;
    color: rgba(31, 41, 55, 0.75);
  }

  .progress-top {
    align-items: baseline;
    margin-bottom: 0.4rem;
  }

  .progress-top strong {
    font-size: 0.79rem;
    color: var(--pine, #4d594a);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .progress-bar {
    height: 9px;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.14);
    margin-bottom: 0.36rem;
    overflow: hidden;
  }

  .progress-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #a6b589, #4d594a);
  }

  .hub-grid {
    display: grid;
    gap: 0.85rem;
  }

  .avatar-stage {
    position: relative;
    border-radius: 18px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background:
      radial-gradient(circle at 50% 22%, rgba(166, 181, 137, 0.26), transparent 58%),
      linear-gradient(180deg, rgba(253, 252, 248, 0.94), rgba(244, 240, 228, 0.9));
    min-height: 280px;
    display: grid;
    place-items: center;
    overflow: hidden;
    box-shadow: 0 14px 32px rgba(33, 46, 34, 0.12);
  }

  .avatar-core {
    position: relative;
    width: min(220px, 66vw);
    aspect-ratio: 1 / 1.22;
    display: grid;
    place-items: center;
  }

  .halo {
    position: absolute;
    inset: 10% 12%;
    border-radius: 50%;
    border: 1px dashed rgba(77, 89, 74, 0.34);
    opacity: 0.9;
  }

  .body {
    width: 48%;
    height: 72%;
    background: linear-gradient(180deg, rgba(77, 89, 74, 0.25), rgba(31, 41, 55, 0.12));
    border-radius: 45% 45% 22% 22%;
    position: relative;
  }

  .body::before {
    content: '';
    position: absolute;
    top: -28%;
    left: 50%;
    transform: translateX(-50%);
    width: 44%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background: rgba(77, 89, 74, 0.35);
  }

  .body::after {
    content: '';
    position: absolute;
    inset: 26% -22%;
    border-radius: 30px;
    border: 1px solid rgba(77, 89, 74, 0.26);
  }

  .gear-orbit {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .gear-chip {
    position: absolute;
    left: 50%;
    top: 50%;
    transform:
      rotate(calc(var(--chip-index) * 45deg))
      translateY(-128px)
      rotate(calc(var(--chip-index) * -45deg));
    transform-origin: center;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.22);
    background: rgba(255, 255, 255, 0.9);
    color: #1f2937;
    font-size: 0.69rem;
    line-height: 1;
    padding: 0.35rem 0.52rem;
    max-width: min(26vw, 120px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gear-chip.worn {
    background: rgba(166, 181, 137, 0.28);
    border-color: rgba(166, 181, 137, 0.62);
  }

  .avatar-meta {
    width: calc(100% - 1rem);
    margin: auto 0 0.55rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .avatar-meta > div {
    border-radius: 11px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background: rgba(255, 255, 255, 0.8);
    padding: 0.42rem 0.48rem;
    text-align: center;
  }

  .meta-label {
    display: block;
    font-size: 0.63rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgba(31, 41, 55, 0.72);
  }

  .avatar-meta strong {
    display: block;
    margin-top: 0.13rem;
    font-size: 0.86rem;
    color: #1f2937;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .stat-card {
    border-radius: 13px;
    border: 1px solid rgba(77, 89, 74, 0.18);
    background: rgba(255, 255, 255, 0.8);
    padding: 0.58rem 0.62rem;
    display: grid;
    gap: 0.2rem;
    box-shadow: 0 6px 14px rgba(35, 49, 37, 0.08);
  }

  .stat-card span {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(31, 41, 55, 0.64);
  }

  .stat-card strong {
    font-size: 0.92rem;
    color: #1f2937;
  }

  .avatar-stage.equip-pulse {
    animation: equipPulse 420ms ease-out;
  }

  @keyframes equipPulse {
    0% {
      box-shadow: 0 0 0 rgba(166, 181, 137, 0);
      transform: translateY(0);
    }
    36% {
      box-shadow: 0 0 0 9px rgba(166, 181, 137, 0.22);
      transform: translateY(-2px);
    }
    100% {
      box-shadow: 0 14px 32px rgba(33, 46, 34, 0.12);
      transform: translateY(0);
    }
  }

  @media (min-width: 980px) {
    .character-hub {
      padding-inline: 1.2rem;
    }

    .hub-head {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      align-items: end;
    }

    .hub-grid {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      align-items: stretch;
    }

    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-content: start;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .character-hub,
    .gear-chip,
    .avatar-stage {
      transition: none;
      animation: none;
    }
  }
</style>
