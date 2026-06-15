<script lang="ts">
  // Whole-trail elevation silhouette with a position marker. Shared by the
  // public /journey page and the gated /app/progress page. Pure presentation:
  // give it the downsampled elevation series + the current mile.
  interface ElevPoint {
    mile: number;
    ft: number;
  }
  interface Props {
    elevation: { points: ElevPoint[]; minFt: number; maxFt: number };
    currentMile: number;
    totalMiles: number;
    isPreview?: boolean;
    title?: string;
  }
  const { elevation, currentMile, totalMiles, isPreview = false, title = 'The whole climb' }: Props = $props();

  const EW = 1000;
  const EH = 200;
  const EPAD_T = 14;
  const EPAD_B = 2;
  const ceil = $derived(Math.max(500, Math.ceil((elevation.maxFt || 1) / 500) * 500));
  function ex(mile: number): number {
    return totalMiles > 0 ? (mile / totalMiles) * EW : 0;
  }
  function ey(ft: number): number {
    return EPAD_T + (1 - ft / ceil) * (EH - EPAD_T - EPAD_B);
  }
  const ahead = $derived.by(() => {
    if (elevation.points.length < 2) return '';
    let d = `M 0 ${EH}`;
    for (const p of elevation.points) d += ` L ${ex(p.mile).toFixed(1)} ${ey(p.ft).toFixed(1)}`;
    return `${d} L ${EW} ${EH} Z`;
  });
  const done = $derived.by(() => {
    if (isPreview || elevation.points.length < 2) return '';
    const pts = elevation.points.filter((p: ElevPoint) => p.mile <= currentMile);
    if (pts.length < 2) return '';
    let d = `M 0 ${EH}`;
    for (const p of pts) d += ` L ${ex(p.mile).toFixed(1)} ${ey(p.ft).toFixed(1)}`;
    return `${d} L ${ex(currentMile).toFixed(1)} ${EH} Z`;
  });
  const currentFt = $derived.by(() => {
    if (!elevation.points.length) return 0;
    let best = elevation.points[0];
    for (const p of elevation.points) if (Math.abs(p.mile - currentMile) < Math.abs(best.mile - currentMile)) best = p;
    return best.ft;
  });
  function miFmt(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
</script>

{#if elevation.points.length > 1}
  <figure class="elevation">
    <figcaption class="elev-head">
      <span class="elev-title">{title}</span>
      <span class="elev-sub">Springer to Katahdin · {ceil.toLocaleString()} ft scale</span>
    </figcaption>
    <svg
      viewBox={`0 0 ${EW} ${EH}`}
      preserveAspectRatio="none"
      class="elev-svg"
      role="img"
      aria-label={`Elevation profile of the full trail${isPreview ? '' : `, current position at mile ${miFmt(currentMile)}`}`}
    >
      <path class="elev-ahead" d={ahead} />
      {#if done}<path class="elev-done" d={done} />{/if}
      {#if !isPreview}
        <line class="elev-line" x1={ex(currentMile)} y1="0" x2={ex(currentMile)} y2={EH} />
        <circle class="elev-dot" cx={ex(currentMile)} cy={ey(currentFt)} r="7" />
      {/if}
    </svg>
    <div class="elev-foot">
      <span>Springer · mi 0</span>
      {#if !isPreview}<span class="elev-here">Mile {miFmt(currentMile)} · {currentFt.toLocaleString()} ft</span>{/if}
      <span>Katahdin · mi {miFmt(totalMiles)}</span>
    </div>
  </figure>
{/if}

<style>
  .elevation {
    margin: 0 0 2.2rem;
    padding: 0.9rem 1rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: rgba(255, 255, 255, 0.75);
    box-shadow: var(--shadow-soft);
  }
  .elev-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.5rem; }
  .elev-title { font-family: Oswald, Impact, sans-serif; font-size: 1.05rem; color: var(--ink); }
  .elev-sub { font-size: 0.72rem; font-weight: 700; color: rgba(74, 84, 72, 0.6); }
  .elev-svg { display: block; width: 100%; height: clamp(110px, 26vw, 180px); }
  .elev-ahead { fill: rgba(77, 89, 74, 0.16); stroke: rgba(77, 89, 74, 0.4); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .elev-done { fill: rgba(166, 181, 137, 0.5); stroke: var(--pine); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
  .elev-line { stroke: var(--terra); stroke-width: 2; vector-effect: non-scaling-stroke; opacity: 0.85; }
  .elev-dot { fill: var(--terra); stroke: #fff; stroke-width: 2; }
  .elev-foot { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: 0.4rem; font-size: 0.72rem; font-weight: 700; color: rgba(74, 84, 72, 0.7); }
  .elev-here { color: var(--terra); }
</style>
