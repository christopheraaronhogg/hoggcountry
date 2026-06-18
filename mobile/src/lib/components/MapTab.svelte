<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { elevationNext20, type ElevationPoint } from './cockpitData';
	import Icon, { type IconName } from './Icon.svelte';

	// Trail-ribbon map (matches the d1 "Scout Hub" bake-off mockup): a stylized
	// winding AT line over a soft contour field, with the hiker's position and the
	// upcoming water / shelter / town placed ALONG the line by mile, plus a compact
	// "elevation ahead" card. Not a geographic tile map — a calm linear read of
	// what's coming, which is exactly how a thru-hike is experienced.
	//
	// One zoom control (5 / 10 / 20 mi, default 10) drives BOTH the ribbon window
	// and the elevation card, so zooming re-scales the whole "what's ahead" view.
	const ZOOMS = [5, 10, 20] as const;
	let mapZoom = $state<(typeof ZOOMS)[number]>(10);

	const from = $derived(trailAssistant.currentMile);

	type Landmark = { kind: 'water' | 'shelter' | 'town'; mile: number; label: string };

	// Upcoming landmarks within the window. Water can be plentiful, so cap it to the
	// nearest couple; shelters/towns are sparse, show all in-window.
	// Short label so long shelter names ("Morgan Stewart Memorial Shelter") don't
	// run off the ribbon and pile into their neighbors.
	function short(name: string): string {
		const trimmed = name.replace(/ (Memorial )?Shelter$/i, '');
		return trimmed.length > 15 ? trimmed.slice(0, 14).trimEnd() + '…' : trimmed;
	}

	const landmarks = $derived.by<Landmark[]>(() => {
		const pack = trailAssistant.fieldPack;
		const ahead = <T extends { mile: number }>(items: T[]) =>
			items.filter((i) => i.mile >= from - 0.01 && i.mile <= from + mapZoom).sort((a, b) => a.mile - b.mile);
		// The NEXT water already lives in the top chip, so keep the line to shelters
		// + towns (the sleep/resupply anchors) plus just the next water — fewer, less
		// cluttered pins than dropping every mapped stream on the ribbon.
		const water = ahead(pack.water).slice(0, 1).map((w) => ({ kind: 'water' as const, mile: w.mile, label: short(w.name) }));
		const shelters = ahead(pack.shelters).map((s) => ({ kind: 'shelter' as const, mile: s.mile, label: short(s.name) }));
		const towns = ahead(pack.towns).map((t) => ({ kind: 'town' as const, mile: t.mile, label: short(t.name) }));
		return [...water, ...shelters, ...towns].sort((a, b) => a.mile - b.mile).slice(0, 6);
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
		const frac = Math.max(0, Math.min(1, (mile - from) / mapZoom));
		const topPct = YOU_TOP - frac * (YOU_TOP - AHEAD_TOP);
		return { leftPct: (xForY((topPct / 100) * 540) / 320) * 100, topPct };
	}

	// Minimum vertical gap (% of height) between adjacent pins so their labels can't
	// overlap. Pins keep their true horizontal spot on the line; only the vertical
	// position is nudged up when two landmarks fall too close in mileage.
	const MIN_GAP = 9;

	$effect(() => {
		// Re-place whenever the path mounts or the landmark set / position changes.
		const list = landmarks;
		if (!pathEl) return;
		buildSamples();
		youPos = place(from);
		// Nearest first (largest topPct, lowest on screen). Walk upward and push any
		// pin that's within MIN_GAP of the previous one further up the ribbon, then
		// re-read its x off the line so the dot still sits on the trail.
		const next = list
			.map((l) => ({ ...l, ...place(l.mile) }))
			.sort((a, b) => b.topPct - a.topPct);
		for (let i = 1; i < next.length; i++) {
			const gap = next[i - 1].topPct - next[i].topPct;
			if (gap < MIN_GAP) {
				const top = Math.max(AHEAD_TOP - 4, next[i - 1].topPct - MIN_GAP);
				next[i] = { ...next[i], topPct: top, leftPct: (xForY((top / 100) * 540) / 320) * 100 };
			}
		}
		placed = next;
	});

	const pinIcon: Record<Landmark['kind'], IconName> = { water: 'water', shelter: 'shelter', town: 'town' };

	// --- elevation-ahead profile (real points, windowed by the zoom) ---------
	// Shows the next `mapZoom` miles and reports the actual ups/downs (total ascent
	// + descent), not just the silhouette, with a vertical ft scale.
	const H = 46;
	const elev = $derived.by(() => {
		const W = 280, pad = 5;
		const lo = from, hi = from + mapZoom;
		const win = elevationNext20.filter((p) => p.mile >= lo - 0.01 && p.mile <= hi + 0.01);
		if (win.length < 2) {
			return { d: '', gain: 0, loss: 0, minEl: 0, maxEl: 0, hereY: H - pad, lo, hi, empty: true };
		}
		const elevs = win.map((p) => p.elevation);
		const minEl = Math.min(...elevs), maxEl = Math.max(...elevs);
		// Fixed window on x so the right edge is exactly `from + mapZoom`.
		const x = (m: number) => ((m - lo) / (hi - lo || 1)) * W;
		const y = (e: number) => H - pad - ((e - minEl) / (maxEl - minEl || 1)) * (H - pad * 2);
		const line = win.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.mile).toFixed(1)},${y(p.elevation).toFixed(1)}`).join(' ');
		const d = `${line} L${x(win[win.length - 1].mile).toFixed(1)},${H} L${x(win[0].mile).toFixed(1)},${H} Z`;
		// Total ascent / descent across the window.
		let gain = 0, loss = 0;
		for (let i = 1; i < win.length; i++) {
			const delta = win[i].elevation - win[i - 1].elevation;
			if (delta > 0) gain += delta; else loss += -delta;
		}
		return { d, gain: Math.round(gain), loss: Math.round(loss), minEl, maxEl, hereY: y(win[0].elevation), lo, hi, empty: false };
	});

	const fmt = (n: number) => n.toLocaleString('en-US');
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
					<span class="wglyph"><Icon name="water" size={13} stroke={2} /></span> Next water {nextWater.dist.toFixed(1)} mi
					{#if nextWater.candidate}<span class="cand-tag">candidate</span>{/if}
				</span>
			</div>
		{/if}

		<!-- upcoming landmark pins, placed along the line by mile -->
		{#each placed as p (p.kind + p.label + p.mile)}
			<div class="pin {p.kind}" style="left:{p.leftPct}%; top:{p.topPct}%;">
				<span class="lbl"><Icon name={pinIcon[p.kind]} size={12} stroke={2} /> {p.label} · {(p.mile - from).toFixed(1)}mi</span>
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
				<span class="etitle">Elevation ahead</span>
				<div class="zoom" role="group" aria-label="Zoom map and elevation">
					{#each ZOOMS as z (z)}
						<button class="zbtn" class:on={mapZoom === z} onclick={() => (mapZoom = z)}>{z}</button>
					{/each}
					<span class="zunit">mi</span>
				</div>
			</div>

			<div class="updown">
				<span class="up">↑ +{fmt(elev.gain)} ft</span>
				<span class="down">↓ −{fmt(elev.loss)} ft</span>
			</div>

			<div class="chartrow">
				<div class="yax"><span>{fmt(elev.maxEl)}</span><span>{fmt(elev.minEl)}</span></div>
				<svg viewBox="0 0 280 46" preserveAspectRatio="none">
					<defs>
						<linearGradient id="elevfill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stop-color="rgba(47,75,53,.30)" />
							<stop offset="1" stop-color="rgba(47,75,53,.04)" />
						</linearGradient>
					</defs>
					<path class="epath" d={elev.d} />
				</svg>
			</div>

			<div class="elabels">
				<span>Mi {elev.lo.toFixed(0)} · here</span>
				<span>Mi {elev.hi.toFixed(0)}</span>
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
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.elev .etitle {
		font-size: 0.6rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--muted);
	}
	/* zoom toggle */
	.zoom {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		background: rgba(47, 75, 53, 0.07);
		border-radius: 8px;
		padding: 2px;
	}
	.zbtn {
		min-width: 26px;
		height: 22px;
		padding: 0 6px;
		border-radius: 6px;
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.zbtn.on {
		background: var(--surface-strong, #fffdf8);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}
	.zunit {
		font-size: 0.56rem;
		font-weight: 800;
		color: var(--muted);
		padding: 0 3px 0 2px;
	}
	/* ascent / descent */
	.updown {
		display: flex;
		gap: 14px;
		margin-bottom: 4px;
	}
	.updown .up {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--forest);
		font-variant-numeric: tabular-nums;
	}
	.updown .down {
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--clay);
		font-variant-numeric: tabular-nums;
	}
	/* chart + y-axis scale */
	.chartrow {
		display: flex;
		align-items: stretch;
		gap: 6px;
	}
	.yax {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-size: 0.54rem;
		font-weight: 800;
		color: var(--muted);
		text-align: right;
		font-variant-numeric: tabular-nums;
		min-width: 26px;
		padding: 1px 0;
	}
	.elev svg {
		display: block;
		width: 100%;
		height: 46px;
		flex: 1;
	}
	.elev .epath {
		fill: url(#elevfill);
		stroke: var(--forest);
		stroke-width: 1.6;
	}
	.elev .elabels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: 0.56rem;
		font-weight: 800;
		color: var(--muted);
	}
</style>
