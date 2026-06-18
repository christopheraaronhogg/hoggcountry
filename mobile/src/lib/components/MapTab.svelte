<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { elevationNext20, type ElevationPoint } from './cockpitData';

	// Trail-ribbon map (matches the d1 "Scout Hub" bake-off mockup): a stylized
	// winding AT line over a soft contour field, with the hiker's position and the
	// upcoming water / shelter / town placed ALONG the line by mile, plus a compact
	// "elevation ahead" card. Not a geographic tile map — a calm linear read of
	// what's coming, which is exactly how a thru-hike is experienced.
	const SPAN = 30; // miles of trail shown on the ribbon

	const from = $derived(trailAssistant.currentMile);

	type Landmark = { kind: 'water' | 'shelter' | 'town'; mile: number; label: string };

	// Upcoming landmarks within the window. Water can be plentiful, so cap it to the
	// nearest couple; shelters/towns are sparse, show all in-window.
	const landmarks = $derived.by<Landmark[]>(() => {
		const pack = trailAssistant.fieldPack;
		const ahead = <T extends { mile: number }>(items: T[]) =>
			items.filter((i) => i.mile >= from - 0.01 && i.mile <= from + SPAN).sort((a, b) => a.mile - b.mile);
		const water = ahead(pack.water).slice(0, 2).map((w) => ({ kind: 'water' as const, mile: w.mile, label: w.name }));
		const shelters = ahead(pack.shelters).map((s) => ({ kind: 'shelter' as const, mile: s.mile, label: s.name }));
		const towns = ahead(pack.towns).map((t) => ({ kind: 'town' as const, mile: t.mile, label: t.name }));
		return [...water, ...shelters, ...towns].sort((a, b) => a.mile - b.mile).slice(0, 7);
	});

	const nextWater = $derived.by(() => {
		const w = trailAssistant.fieldPack.water
			.filter((s) => s.mile >= from - 0.01)
			.sort((a, b) => a.mile - b.mile)[0];
		if (!w) return null;
		return { name: w.name, dist: Math.max(0, w.mile - from), candidate: w.reliability !== 'reliable' };
	});

	// --- place pins along the real trail path -------------------------------
	// The hiker sits ~62% down (trail already walked continues below; what's ahead
	// climbs up the ribbon). Each landmark's vertical position is proportional to
	// its distance ahead, and its horizontal position is read OFF the winding line
	// (sample the path, find the x at that y) so every pin sits on the trail. The
	// SVG uses preserveAspectRatio="none", so viewBox coords map linearly to
	// container percentages (x/320, y/540) regardless of rendered size.
	const YOU_TOP = 62; // % down where "you" sits
	const AHEAD_TOP = 9; // % down for the far end of the window
	let pathEl = $state<SVGPathElement | null>(null);
	let samples: Array<{ x: number; y: number }> = [];
	type Placed = Landmark & { leftPct: number; topPct: number };
	let placed = $state<Placed[]>([]);
	let youPos = $state<{ leftPct: number; topPct: number }>({ leftPct: 47, topPct: YOU_TOP });

	function buildSamples(): void {
		if (!pathEl) return;
		const total = pathEl.getTotalLength();
		const N = 240;
		samples = Array.from({ length: N + 1 }, (_, i) => {
			const p = pathEl!.getPointAtLength((total * i) / N);
			return { x: p.x, y: p.y };
		});
	}

	function xForY(targetY: number): number {
		if (!samples.length) return 160;
		let best = samples[0];
		for (const s of samples) {
			if (Math.abs(s.y - targetY) < Math.abs(best.y - targetY)) best = s;
		}
		return best.x;
	}

	function place(mile: number): { leftPct: number; topPct: number } {
		const frac = Math.max(0, Math.min(1, (mile - from) / SPAN));
		const topPct = YOU_TOP - frac * (YOU_TOP - AHEAD_TOP);
		return { leftPct: (xForY((topPct / 100) * 540) / 320) * 100, topPct };
	}

	$effect(() => {
		// Re-place whenever the path mounts or the landmark set / position changes.
		const list = landmarks;
		if (!pathEl) return;
		buildSamples();
		youPos = place(from);
		placed = list.map((l) => ({ ...l, ...place(l.mile) }));
	});

	const glyph: Record<Landmark['kind'], string> = { water: '💧', shelter: '⛺', town: '⌂' };

	// --- elevation-ahead sparkline (real points) ----------------------------
	const elevPath = $derived.by(() => {
		const pts: ElevationPoint[] = elevationNext20;
		if (pts.length < 2) return { d: '', hereX: 0, hereY: 40, lo: from, hi: from + SPAN, mid: '' };
		const miles = pts.map((p) => p.mile);
		const elevs = pts.map((p) => p.elevation);
		const minMile = Math.min(...miles), maxMile = Math.max(...miles);
		const minEl = Math.min(...elevs), maxEl = Math.max(...elevs);
		const W = 280, H = 46, pad = 4;
		const x = (m: number) => ((m - minMile) / (maxMile - minMile || 1)) * W;
		const y = (e: number) => H - pad - ((e - minEl) / (maxEl - minEl || 1)) * (H - pad * 2);
		const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.mile).toFixed(1)},${y(p.elevation).toFixed(1)}`).join(' ');
		const d = `${line} L${W},${H} L0,${H} Z`;
		const hereX = x(Math.max(minMile, Math.min(maxMile, from)));
		// y of the path at "here": nearest point
		const nearest = pts.reduce((a, b) => (Math.abs(b.mile - from) < Math.abs(a.mile - from) ? b : a));
		return {
			d,
			hereX,
			hereY: y(nearest.elevation),
			lo: minMile,
			hi: maxMile
		};
	});

	const nextShelterMile = $derived(
		trailAssistant.fieldPack.shelters
			.filter((s) => s.mile >= from - 0.01)
			.sort((a, b) => a.mile - b.mile)[0]?.mile ?? null
	);
</script>

<div class="map-screen">
	<div class="map-canvas">
		<!-- topo contours (decorative) -->
		<svg class="topo" viewBox="0 0 320 540" preserveAspectRatio="none" aria-hidden="true">
			<path class="faint" d="M-10,70 C60,40 120,90 180,60 C240,30 300,80 340,55" />
			<path d="M-10,110 C60,80 120,130 180,100 C240,70 300,120 340,95" />
			<path class="faint" d="M-10,158 C70,130 130,180 200,150 C260,124 310,168 340,150" />
			<path d="M-10,210 C80,184 140,236 210,206 C270,180 320,222 340,206" />
			<path class="faint" d="M-10,270 C70,250 150,296 220,266 C280,242 320,280 340,268" />
			<path d="M-10,330 C80,314 150,352 230,326 C290,306 320,338 340,330" />
			<path class="faint" d="M-10,392 C90,378 160,408 240,388 C300,374 330,398 340,392" />
			<path d="M-10,452 C90,442 170,468 250,450 C300,440 330,456 340,452" />
			<path class="river" d="M70,540 C84,470 60,420 96,372 C120,338 100,300 130,260" />
		</svg>

		<!-- AT line down the ridge -->
		<svg viewBox="0 0 320 540" preserveAspectRatio="none" class="at-svg" aria-hidden="true">
			<path
				class="at-line shadow"
				d="M150,540 C140,470 178,440 168,386 C158,330 196,300 186,250 C178,206 150,180 168,128 C182,86 162,56 176,8"
			/>
			<path
				bind:this={pathEl}
				class="at-line"
				d="M150,540 C140,470 178,440 168,386 C158,330 196,300 186,250 C178,206 150,180 168,128 C182,86 162,56 176,8"
			/>
		</svg>

		<!-- next-water + candidate chip -->
		{#if nextWater}
			<div class="map-top-chip">
				<span class="next-water-chip">
					<span class="wglyph">💧</span> Next water {nextWater.dist.toFixed(1)} mi
					{#if nextWater.candidate}<span class="cand-tag">candidate</span>{/if}
				</span>
			</div>
		{/if}

		<!-- upcoming landmark pins, placed along the line by mile -->
		{#each placed as p (p.kind + p.label + p.mile)}
			<div class="pin {p.kind}" style="left:{p.leftPct}%; top:{p.topPct}%;">
				<span class="lbl">{glyph[p.kind]} {p.label} · {(p.mile - from).toFixed(1)}mi</span>
				<span class="dot"></span>
			</div>
		{/each}

		<!-- hiker position -->
		<div class="you" style="left:{youPos.leftPct}%; top:{youPos.topPct}%;">
			<div class="ring"><div class="core"></div></div>
			<span class="youlbl">Dad · Mi {from.toFixed(1)}</span>
		</div>

		<!-- elevation ahead -->
		<div class="elev">
			<div class="etop">
				<span class="etitle">Elevation ahead · {SPAN} mi</span>
				{#if nextShelterMile !== null}
					<span class="erange">to shelter {(nextShelterMile - from).toFixed(1)} mi</span>
				{/if}
			</div>
			<svg viewBox="0 0 280 46" preserveAspectRatio="none">
				<defs>
					<linearGradient id="elevfill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="rgba(47,75,53,.30)" />
						<stop offset="1" stop-color="rgba(47,75,53,.04)" />
					</linearGradient>
				</defs>
				<path class="epath" d={elevPath.d} />
				<line class="here" x1={elevPath.hereX} y1="2" x2={elevPath.hereX} y2="46" />
				<circle class="heredot" cx={elevPath.hereX} cy={elevPath.hereY} r="3.4" />
			</svg>
			<div class="elabels">
				<span>Mi {elevPath.lo.toFixed(0)}</span>
				<span>Mi {elevPath.hi.toFixed(0)}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.map-screen {
		position: relative;
		height: 100%;
		/* break out of the .screen-scroll padding so the map is edge-to-edge */
		margin: -14px -14px -18px;
		overflow: hidden;
	}

	.map-canvas {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 30% 16%, rgba(106, 132, 95, 0.1), transparent 40%),
			linear-gradient(180deg, #e9efe0 0%, #e3e9d6 48%, #dde7cf 100%);
	}

	.topo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0.42;
		pointer-events: none;
	}
	.topo path {
		fill: none;
		stroke: #8a9b6f;
		stroke-width: 1;
	}
	.topo .faint {
		stroke: rgba(138, 155, 111, 0.5);
		stroke-width: 0.8;
	}
	.river {
		fill: none;
		stroke: var(--sky);
		stroke-width: 3;
		opacity: 0.55;
		stroke-linecap: round;
	}

	.at-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.at-line {
		fill: none;
		stroke: #a85f3b;
		stroke-width: 4.5;
		stroke-linecap: round;
	}
	.at-line.shadow {
		stroke: rgba(40, 30, 20, 0.18);
		stroke-width: 7;
		transform: translateY(1.5px);
	}

	.pin {
		position: absolute;
		transform: translate(-50%, -100%);
	}
	.pin .dot {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 2px solid #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
	}
	.pin .lbl {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 3px);
		transform: translateX(-50%);
		white-space: nowrap;
		font-size: 0.58rem;
		font-weight: 900;
		letter-spacing: 0.02em;
		padding: 2px 6px;
		border-radius: 6px;
		background: rgba(255, 253, 248, 0.92);
		color: var(--ink);
		box-shadow: var(--shadow-soft);
	}
	.pin.water .dot {
		background: var(--sky);
	}
	.pin.shelter .dot {
		background: var(--moss);
	}
	.pin.town .dot {
		background: var(--clay);
	}

	.you {
		position: absolute;
		transform: translate(-50%, -50%);
	}
	.you .ring {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: rgba(47, 75, 53, 0.18);
		display: grid;
		place-items: center;
	}
	.you .core {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--forest);
		border: 3px solid #f4efe4;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}
	.you .youlbl {
		position: absolute;
		left: calc(100% + 7px);
		top: 50%;
		transform: translateY(-50%);
		white-space: nowrap;
		font-size: 0.62rem;
		font-weight: 900;
		padding: 3px 8px;
		border-radius: 8px;
		background: var(--forest);
		color: #f4efe4;
		box-shadow: var(--shadow-soft);
	}

	.map-top-chip {
		position: absolute;
		top: 12px;
		left: 12px;
		right: 12px;
		display: flex;
		gap: 7px;
		align-items: center;
	}
	.next-water-chip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 11px;
		border-radius: 13px;
		background: rgba(255, 253, 248, 0.95);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--ink);
	}
	.next-water-chip .wglyph {
		color: var(--sky);
		font-size: 0.9rem;
	}
	.cand-tag {
		font-size: 0.58rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--clay);
		background: rgba(170, 104, 67, 0.15);
		padding: 2px 6px;
		border-radius: 6px;
	}

	.elev {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 12px;
		background: rgba(255, 253, 248, 0.95);
		border: 1px solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow);
		padding: 9px 11px 8px;
	}
	.elev .etop {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 5px;
	}
	.elev .etitle {
		font-size: 0.6rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--muted);
	}
	.elev .erange {
		font-size: 0.62rem;
		font-weight: 800;
		color: var(--forest);
	}
	.elev svg {
		display: block;
		width: 100%;
		height: 46px;
	}
	.elev .epath {
		fill: url(#elevfill);
		stroke: var(--forest);
		stroke-width: 1.6;
	}
	.elev .here {
		stroke: var(--clay);
		stroke-width: 1.4;
		stroke-dasharray: 3 3;
	}
	.elev .heredot {
		fill: var(--clay);
		stroke: #fff;
		stroke-width: 1.5;
	}
	.elev .elabels {
		display: flex;
		justify-content: space-between;
		margin-top: 3px;
		font-size: 0.56rem;
		font-weight: 800;
		color: var(--muted);
	}
</style>
