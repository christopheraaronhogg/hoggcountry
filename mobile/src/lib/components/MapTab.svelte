<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isDadPilot, isSelfTracked } from '$lib/scout/hike-profile';
	import { elevationWindow } from '$lib/trail/trail-geometry';
	import Icon, { type IconName } from './Icon.svelte';
	import TrailPulseReportAction from './TrailPulseReportAction.svelte';

	// Real offline trail trace from the bundled AT lat/lon geometry. This is still
	// not a basemap or turn-by-turn navigator, but the line on screen is the actual
	// local AT shape for the selected mile window, not a decorative ribbon.
	const ZOOMS = [5, 10, 20] as const;
	let mapZoom = $state<(typeof ZOOMS)[number]>(10);

	const from = $derived(trailAssistant.currentMile);
	const geo = $derived(trailAssistant.trailGeometry);
	// The pin label follows the explicit mode boundary. Uncalibrated starter state
	// is not Dad; Dad appears only after the hiker chooses the public pilot.
	const youLabel = $derived.by(() => {
		const profile = trailAssistant.hikeProfile;
		if (isSelfTracked(profile)) return profile.trailName?.trim() || 'You';
		return isDadPilot(profile) ? 'Dad' : 'Set mile';
	});

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

	type Placed = Landmark & { leftPct: number; topPct: number };
	type ProjectedPoint = { mile: number; leftPct: number; topPct: number };

	// Minimum vertical gap (% of height) between adjacent pins so their labels can't
	// overlap. Pins keep their true horizontal spot on the line; only the vertical
	// position is nudged up when two landmarks fall too close in mileage.
	const MIN_GAP = 9;

	const trace = $derived.by(() => {
		const start = Math.max(0, from - 1);
		const end = from + mapZoom;
		const points = geo.filter((point) => point.m >= start && point.m <= end);
		if (points.length < 2) {
			return {
				empty: true,
				path: '',
				points: [] as ProjectedPoint[]
			};
		}

		const lats = points.map((point) => point.lat);
		const lons = points.map((point) => point.lon);
		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);
		const minLon = Math.min(...lons);
		const maxLon = Math.max(...lons);
		const pad = 8;
		const usable = 100 - pad * 2;
		const projected = points.map((point) => ({
			mile: point.m,
			leftPct: pad + ((point.lon - minLon) / (maxLon - minLon || 1)) * usable,
			topPct: pad + ((maxLat - point.lat) / (maxLat - minLat || 1)) * usable
		}));
		const path = projected
			.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.leftPct.toFixed(2)},${point.topPct.toFixed(2)}`)
			.join(' ');
		return { empty: false, path, points: projected };
	});

	function place(mile: number): { leftPct: number; topPct: number } {
		if (!trace.points.length) return { leftPct: 50, topPct: 58 };
		let best = trace.points[0];
		for (const point of trace.points) {
			if (Math.abs(point.mile - mile) < Math.abs(best.mile - mile)) best = point;
		}
		return { leftPct: best.leftPct, topPct: best.topPct };
	}

	const youPos = $derived(place(from));
	const placed = $derived.by<Placed[]>(() => {
		const next = landmarks
			.map((landmark) => ({ ...landmark, ...place(landmark.mile) }))
			.sort((a, b) => b.topPct - a.topPct);
		for (let i = 1; i < next.length; i++) {
			const gap = next[i - 1].topPct - next[i].topPct;
			if (gap < MIN_GAP) {
				const topPct = Math.max(8, next[i - 1].topPct - MIN_GAP);
				next[i] = { ...next[i], topPct };
			}
		}
		return next;
	});

	const pinIcon: Record<Landmark['kind'], IconName> = { water: 'water', shelter: 'shelter', town: 'town' };

	// --- elevation-ahead profile (real points, windowed by the zoom) ---------
	// Shows the next `mapZoom` miles and reports the actual ups/downs (total ascent
	// + descent), not just the silhouette, with a vertical ft scale.
	const H = 46;
	const elev = $derived.by(() => {
		const W = 280, pad = 5;
		const lo = from, hi = from + mapZoom;
		const win = elevationWindow(geo, lo, mapZoom);
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
		<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="route-svg" aria-label="Real AT trace around the current mile">
			<defs>
				<pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse">
					<path d="M10 0H0V10" class="grid-line" />
				</pattern>
			</defs>
			<rect width="100" height="100" class="map-grid" />
			{#if trace.empty}
				<text x="50" y="50" text-anchor="middle" class="empty-map">Load trail geometry</text>
			{:else}
				<path class="route-line shadow" d={trace.path} />
				<path class="route-line" d={trace.path} />
			{/if}
		</svg>

		<!-- next-water chip + honest framing: this is a linear schematic of what's
		     ahead by mile, NOT a tile-basemap navigator. Says so plainly so it isn't
		     read as (and judged against) FarOut/Gaia. -->
		<div class="map-top-chip">
			{#if nextWater}
				<span class="next-water-chip">
					<span class="wglyph"><Icon name="water" size={13} stroke={2} /></span> Next water {nextWater.dist.toFixed(1)} mi
					{#if nextWater.candidate}<span class="cand-tag">candidate</span>{/if}
				</span>
			{/if}
			<span class="schematic-tag" title="Real bundled AT geometry around your mile; not a tile basemap.">Real AT trace · offline</span>
			<span class="limit-tag" title="No offline basemap, turn-by-turn routing, or emergency navigation.">No basemap · no routing</span>
			<TrailPulseReportAction variant="map" label="Report conditions" />
		</div>

		<div class="map-meta" aria-label="Map orientation and source">
			<span class="north">N</span>
			<span>Mi {Math.max(0, from - 1).toFixed(0)}-{(from + mapZoom).toFixed(0)}</span>
			<span>USGS/AT geometry</span>
		</div>

		<!-- upcoming landmark pins, placed along the line by mile -->
		{#each placed as p (p.kind + p.label + p.mile)}
			<div class="pin {p.kind}" style="left:{p.leftPct}%; top:{p.topPct}%;">
				<span class="lbl"><Icon name={pinIcon[p.kind]} size={12} stroke={2} /> {p.label} · {(p.mile - from).toFixed(1)}mi</span>
				<span class="dot"></span>
			</div>
		{/each}

		<!-- hiker position -->
		<div class="you" style="left:{youPos.leftPct}%; top:{youPos.topPct}%;">
			<div class="you-mark"><Icon name="now" size={31} stroke={2} /></div>
			<span class="youlbl">{youLabel} · Mi {from.toFixed(1)}</span>
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
			radial-gradient(circle at 22% 16%, rgba(95, 128, 144, 0.12), transparent 38%),
			linear-gradient(180deg, #eaf0e3 0%, #dde7d2 54%, #d4e1c8 100%);
	}

	.route-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.map-grid {
		fill: url(#mapGrid);
		opacity: 0.52;
	}

	.grid-line {
		fill: none;
		stroke: rgba(95, 101, 88, 0.14);
		stroke-width: 0.22;
	}

	.empty-map {
		fill: var(--muted);
		font-size: 4px;
		font-weight: 800;
	}

	.route-line {
		fill: none;
		stroke: #a85f3b;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.route-line.shadow {
		stroke: rgba(40, 30, 20, 0.18);
		stroke-width: 2.8;
	}

	.pin {
		position: absolute;
		transform: translate(-50%, -100%);
		z-index: 2;
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
		max-width: min(180px, calc(100vw - 48px));
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.7rem;
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
		z-index: 3;
	}
	.you .you-mark {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: rgba(244, 239, 228, 0.95);
		color: var(--forest);
		display: grid;
		place-items: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
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
		right: 118px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
		z-index: 4;
		min-width: 0;
	}
	.schematic-tag {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		border-radius: 999px;
		background: rgba(31, 36, 29, 0.7);
		color: #f4efe4;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}
	.limit-tag {
		display: inline-flex;
		align-items: center;
		padding: 4px 9px;
		border-radius: 999px;
		background: rgba(154, 59, 47, 0.12);
		color: var(--danger);
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.02em;
	}
	.next-water-chip {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
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
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--clay);
		background: rgba(170, 104, 67, 0.15);
		padding: 2px 6px;
		border-radius: 6px;
	}

	.map-meta {
		position: absolute;
		right: 12px;
		top: 12px;
		z-index: 4;
		display: grid;
		justify-items: end;
		gap: 4px;
		color: var(--muted);
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-shadow: 0 1px 0 rgba(255, 253, 248, 0.7);
	}

	.map-meta span:not(.north) {
		padding: 3px 7px;
		border-radius: 999px;
		background: rgba(255, 253, 248, 0.72);
		border: 1px solid rgba(95, 101, 88, 0.1);
	}

	.north {
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: rgba(255, 253, 248, 0.92);
		color: var(--forest);
		border: 1px solid rgba(95, 101, 88, 0.14);
		box-shadow: var(--shadow-soft);
	}

	.elev {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 12px;
		z-index: 5;
		background: var(--surface-strong, #fffdf8);
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
		font-size: 0.72rem;
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
		font-size: 0.66rem;
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
		font-size: 0.66rem;
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
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--muted);
	}
</style>
