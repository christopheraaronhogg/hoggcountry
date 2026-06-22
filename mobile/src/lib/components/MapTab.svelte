<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isDadPilot, isSelfTracked } from '$lib/scout/hike-profile';
	import { elevationWindow } from '$lib/trail/trail-geometry';
	import Icon, { type IconName } from './Icon.svelte';
	import TrailPulseReportAction from './TrailPulseReportAction.svelte';

	// Real offline AT geometry — the FULL bundled Springer→Katahdin centerline
	// (~2107 one-mile points). The map shows the whole trail by default with
	// progress shading, and zooms into the corridor for detail: one projected
	// path seen through a moving SVG viewBox "camera". Still no tiles/basemap —
	// offline-safe, the line is the real AT shape.
	const VB = 1000; // projected world side (square coordinate space)
	// Asymmetric overview insets: extra room on the right + top where the chrome
	// lives (zoom stack, compass, next-water chip), so the trail's top-right end
	// (Katahdin) pulls clear of the controls and the bottom-left end (Springer)
	// sits in open paper. Only affects the overview frame; the corridor camera
	// reframes per mile-window.
	const INSET_L = 80;
	const INSET_R = 190;
	const INSET_T = 150;
	const INSET_B = 96;
	const TOTAL_MILES = 2197.4; // canonical AT length (AWOL) — keep % in step with Today/header
	const OVERVIEW = -1 as const;
	const ZOOMS = [OVERVIEW, 20, 10, 5] as const;
	type Zoom = (typeof ZOOMS)[number];
	const FOCUS_OFFSET = 0.35;
	let mapZoom = $state<Zoom>(OVERVIEW); // default = whole trail
	const isOverview = $derived(mapZoom === OVERVIEW);

	const from = $derived(trailAssistant.currentMile);
	const geo = $derived(trailAssistant.trailGeometry);
	const trailEnd = $derived.by(() => (geo.length ? geo[geo.length - 1].m : Math.max(from + 10, 0)));
	let viewFocusMile = $state(trailAssistant.currentMile);
	let userPanned = $state(false);
	let drag = $state<{
		pointerId: number;
		startX: number;
		startY: number;
		startFocus: number;
		width: number;
		moved: boolean;
	} | null>(null);
	let canvasW = $state(0);
	let canvasH = $state(0);

	function clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	const viewStart = $derived.by(() => {
		if (isOverview) return 0;
		const span = mapZoom as number;
		const maxStart = Math.max(0, trailEnd - span);
		return clamp(viewFocusMile - span * FOCUS_OFFSET, 0, maxStart);
	});
	const viewEnd = $derived.by(() => (isOverview ? trailEnd : Math.min(trailEnd, viewStart + (mapZoom as number))));
	const currentInView = $derived(from >= viewStart - 0.05 && from <= viewEnd + 0.05);
	const viewportRange = $derived(`Mi ${viewStart.toFixed(0)}–${viewEnd.toFixed(0)}`);
	const currentOffset = $derived(viewFocusMile - from);
	// Offer recenter only once the view has left the current mile (corridor only).
	const showRecenter = $derived(!isOverview && userPanned && !currentInView);
	// In overview the same control becomes "zoom to my location".
	const showLocate = $derived(isOverview || showRecenter);

	$effect(() => {
		if (!userPanned) viewFocusMile = from;
	});

	function setZoom(zoom: Zoom) {
		mapZoom = zoom;
		if (zoom !== OVERVIEW) viewFocusMile = clamp(viewFocusMile, 0, trailEnd);
	}

	function recenter() {
		if (isOverview) mapZoom = 10; // fly from the whole trail into the corridor
		userPanned = false;
		viewFocusMile = from;
	}

	function beginPan(event: PointerEvent) {
		if (event.button !== 0 && event.pointerType === 'mouse') return;
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		drag = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			startFocus: viewFocusMile,
			width: Math.max(rect.width, 1),
			moved: false
		};
		target.setPointerCapture?.(event.pointerId);
	}

	function movePan(event: PointerEvent) {
		if (!drag || drag.pointerId !== event.pointerId) return;
		const dx = event.clientX - drag.startX;
		if (Math.abs(dx) > 3 || Math.abs(event.clientY - drag.startY) > 3) drag.moved = true;
		if (isOverview) return; // nothing to pan in the whole-trail view
		if (Math.abs(dx) > 3) userPanned = true;
		viewFocusMile = clamp(drag.startFocus - (dx / drag.width) * (mapZoom as number), 0, trailEnd);
		event.preventDefault();
	}

	function endPan(event: PointerEvent) {
		if (!drag || drag.pointerId !== event.pointerId) return;
		const target = event.currentTarget as HTMLElement;
		target.releasePointerCapture?.(event.pointerId);
		// Tap (no drag) in overview → fly into the corridor at the tapped mile.
		if (isOverview && !drag.moved) {
			const mile = screenToMile(event.clientX, event.clientY, target.getBoundingClientRect());
			if (mile !== null) {
				viewFocusMile = mile;
				mapZoom = 10;
				userPanned = true;
			}
		}
		drag = null;
	}

	function nudgeViewport(deltaMiles: number) {
		if (isOverview) return;
		userPanned = true;
		viewFocusMile = clamp(viewFocusMile + deltaMiles, 0, trailEnd);
	}

	function handleMapKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			if (isOverview) return; // nothing to pan in the whole-trail view — don't swallow the key
			nudgeViewport(-(mapZoom as number) * 0.25);
			event.preventDefault();
		} else if (event.key === 'ArrowRight') {
			if (isOverview) return;
			nudgeViewport((mapZoom as number) * 0.25);
			event.preventDefault();
		} else if (event.key === 'Home') {
			recenter();
			event.preventDefault();
		} else if ((event.key === 'Enter' || event.key === ' ') && isOverview) {
			recenter(); // overview → drop into the corridor at the current mile
			event.preventDefault();
		}
	}

	function distanceLabel(mile: number): string {
		const dist = mile - from;
		if (Math.abs(dist) < 0.05) return 'here';
		return dist > 0 ? `${dist.toFixed(1)}mi` : `${Math.abs(dist).toFixed(1)}mi back`;
	}

	function currentOffsetLabel(): string {
		if (currentInView) return 'Current mile in view';
		if (Math.abs(currentOffset) < 0.1) return 'Centered on current mile';
		return currentOffset > 0
			? `${Math.abs(currentOffset).toFixed(1)} mi ahead of current`
			: `${Math.abs(currentOffset).toFixed(1)} mi behind current`;
	}

	const orientOffset = $derived(
		isOverview ? `${Math.round((from / TOTAL_MILES) * 100)}% complete` : currentOffsetLabel()
	);
	const rangeLabel = $derived(isOverview ? 'Whole trail' : viewportRange);
	const elevTitle = $derived(isOverview ? 'Whole-hike elevation' : 'Elevation in view');

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
			items.filter((i) => i.mile >= viewStart - 0.01 && i.mile <= viewEnd + 0.01).sort((a, b) => a.mile - b.mile);
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

	// Minimum vertical gap (% of height) between adjacent pins so their labels can't
	// overlap. Pins keep their true horizontal spot on the line; only the vertical
	// position is nudged up when two landmarks fall too close in mileage.
	const MIN_GAP = 9;

	// ---- Full-trail projection + viewBox camera ------------------------------
	// One global equirectangular projection (cos-lat corrected) into a fixed VB×VB
	// world. The whole trail is ONE path; overview vs corridor is the same path
	// seen through a moving viewBox. HTML overlays project through `toScreen`.
	type Proj = { m: number; x: number; y: number };

	const projection = $derived.by(() => {
		if (geo.length < 2) return null;
		let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
		for (const p of geo) {
			if (p.lat < minLat) minLat = p.lat;
			if (p.lat > maxLat) maxLat = p.lat;
			if (p.lon < minLon) minLon = p.lon;
			if (p.lon > maxLon) maxLon = p.lon;
		}
		const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
		const projW = (maxLon - minLon) * kx || 1;
		const projH = maxLat - minLat || 1;
		const usableW = VB - INSET_L - INSET_R;
		const usableH = VB - INSET_T - INSET_B;
		const scale = Math.min(usableW, usableH) / Math.max(projW, projH); // uniform — true shape, no warp
		const offX = INSET_L + (usableW - projW * scale) / 2;
		const offY = INSET_T + (usableH - projH * scale) / 2;
		const project = (lat: number, lon: number) => ({
			x: offX + (lon - minLon) * kx * scale,
			y: offY + (maxLat - lat) * scale // north → top
		});
		return { project };
	});

	const projectedPoints = $derived.by<Proj[]>(() => {
		const proj = projection;
		if (!proj) return [];
		return geo.map((p) => {
			const c = proj.project(p.lat, p.lon);
			return { m: p.m, x: c.x, y: c.y };
		});
	});

	function buildPath(pts: Proj[]): string {
		if (pts.length < 2) return '';
		let d = '';
		for (let i = 0; i < pts.length; i += 1) d += (i ? 'L' : 'M') + pts[i].x.toFixed(1) + ',' + pts[i].y.toFixed(1);
		return d;
	}

	function decimate(pts: Proj[], step: number): Proj[] {
		if (pts.length <= step) return pts;
		const out: Proj[] = [];
		for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
		const last = pts[pts.length - 1];
		if (out[out.length - 1] !== last) out.push(last);
		return out;
	}

	// Split the path at the current mile for progress shading (binary search).
	const splitIdx = $derived.by(() => {
		const a = projectedPoints;
		if (a.length < 2) return 1;
		if (from <= a[0].m) return 1;
		if (from >= a[a.length - 1].m) return a.length - 1;
		let lo = 0, hi = a.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (a[mid].m <= from) lo = mid;
			else hi = mid;
		}
		return Math.max(1, hi);
	});

	const donePath = $derived(buildPath(projectedPoints.slice(0, splitIdx + 1)));
	const remainPath = $derived(buildPath(projectedPoints.slice(splitIdx)));
	const overviewBedPath = $derived(buildPath(decimate(projectedPoints, 8)));

	const camera = $derived.by(() => {
		if (!projection || projectedPoints.length < 2) return { x: 0, y: 0, w: VB, h: VB };
		if (isOverview) return { x: 0, y: 0, w: VB, h: VB };
		const win = projectedPoints.filter((p) => p.m >= viewStart && p.m <= viewEnd);
		if (win.length < 2) return { x: 0, y: 0, w: VB, h: VB };
		let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
		for (const p of win) {
			if (p.x < x0) x0 = p.x;
			if (p.y < y0) y0 = p.y;
			if (p.x > x1) x1 = p.x;
			if (p.y > y1) y1 = p.y;
		}
		const margin = 60;
		x0 -= margin; y0 -= margin; x1 += margin; y1 += margin;
		let w = x1 - x0, h = y1 - y0;
		const aspect = canvasW && canvasH ? canvasW / canvasH : 1;
		if (w / h < aspect) {
			const nw = h * aspect;
			x0 -= (nw - w) / 2;
			w = nw;
		} else {
			const nh = w / aspect;
			y0 -= (nh - h) / 2;
			h = nh;
		}
		return { x: x0, y: y0, w, h };
	});

	const vbStr = $derived(`${camera.x.toFixed(1)} ${camera.y.toFixed(1)} ${camera.w.toFixed(1)} ${camera.h.toFixed(1)}`);

	function projAtMile(mile: number): Proj {
		const a = projectedPoints;
		if (a.length < 2) return { m: mile, x: VB / 2, y: VB * 0.58 };
		if (mile <= a[0].m) return a[0];
		if (mile >= a[a.length - 1].m) return a[a.length - 1];
		let lo = 0, hi = a.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (a[mid].m <= mile) lo = mid;
			else hi = mid;
		}
		const A = a[lo], B = a[hi], t = (mile - A.m) / ((B.m - A.m) || 1);
		return { m: mile, x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) };
	}

	// World (0..VB) → viewport %, mirroring viewBox + preserveAspectRatio xMidYMid meet.
	function toScreen(x: number, y: number): { leftPct: number; topPct: number } {
		const c = camera;
		if (!canvasW || !canvasH) return { leftPct: (x / VB) * 100, topPct: (y / VB) * 100 };
		const s = Math.min(canvasW / c.w, canvasH / c.h);
		const offX = (canvasW - c.w * s) / 2;
		const offY = (canvasH - c.h * s) / 2;
		return {
			leftPct: ((offX + (x - c.x) * s) / canvasW) * 100,
			topPct: ((offY + (y - c.y) * s) / canvasH) * 100
		};
	}

	function screenToMile(clientX: number, clientY: number, rect: DOMRect): number | null {
		const a = projectedPoints;
		if (a.length < 2 || !canvasW || !canvasH) return null;
		const c = camera;
		const s = Math.min(canvasW / c.w, canvasH / c.h);
		const offX = (canvasW - c.w * s) / 2;
		const offY = (canvasH - c.h * s) / 2;
		const wx = c.x + (clientX - rect.left - offX) / s;
		const wy = c.y + (clientY - rect.top - offY) / s;
		let best = a[0], bestD = Infinity;
		for (const p of a) {
			const d = (p.x - wx) ** 2 + (p.y - wy) ** 2;
			if (d < bestD) {
				bestD = d;
				best = p;
			}
		}
		return best.m;
	}

	function place(mile: number): { leftPct: number; topPct: number } {
		const p = projAtMile(mile);
		return toScreen(p.x, p.y);
	}

	// HTML overlays project through the live camera + canvas size; until the
	// canvas is measured (bind:clientWidth fires async) toScreen falls back to
	// raw percentages, so hold the overlays one frame to avoid a position snap.
	const ready = $derived(canvasW > 0 && canvasH > 0);
	const youPos = $derived(place(from));
	const endpointStart = $derived(
		projectedPoints.length ? toScreen(projectedPoints[0].x, projectedPoints[0].y) : null
	);
	const endpointEnd = $derived(
		projectedPoints.length
			? toScreen(projectedPoints[projectedPoints.length - 1].x, projectedPoints[projectedPoints.length - 1].y)
			: null
	);

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

	// --- elevation profile (whole hike in overview; the corridor window in detail) ---
	const H = 46;
	const elev = $derived.by(() => {
		const W = 280, pad = 5;
		const lo = viewStart, hi = viewEnd;
		const span = isOverview ? Math.max(trailEnd, 1) : (mapZoom as number);
		const win = elevationWindow(geo, lo, span);
		if (win.length < 2) {
			return { d: '', gain: 0, loss: 0, minEl: 0, maxEl: 0, hereY: H - pad, lo, hi, empty: true };
		}
		const elevs = win.map((p) => p.elevation);
		const minEl = Math.min(...elevs), maxEl = Math.max(...elevs);
		const x = (m: number) => ((m - lo) / (hi - lo || 1)) * W;
		const y = (e: number) => H - pad - ((e - minEl) / (maxEl - minEl || 1)) * (H - pad * 2);
		const line = win.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.mile).toFixed(1)},${y(p.elevation).toFixed(1)}`).join(' ');
		const d = `${line} L${x(win[win.length - 1].mile).toFixed(1)},${H} L${x(win[0].mile).toFixed(1)},${H} Z`;
		let gain = 0, loss = 0;
		for (let i = 1; i < win.length; i++) {
			const delta = win[i].elevation - win[i - 1].elevation;
			if (delta > 0) gain += delta;
			else loss += -delta;
		}
		return { d, gain: Math.round(gain), loss: Math.round(loss), minEl, maxEl, hereY: y(win[0].elevation), lo, hi, empty: false };
	});

	const fmt = (n: number) => n.toLocaleString('en-US');
</script>

<div class="map-screen" class:dragging={Boolean(drag)}>
	<div class="map-canvas" bind:clientWidth={canvasW} bind:clientHeight={canvasH}>
		<div class="map-contours" aria-hidden="true"></div>
		<svg viewBox={vbStr} preserveAspectRatio="xMidYMid meet" class="route-svg" aria-label="Offline Appalachian Trail — full route">
			{#if !projection}
				<text x={VB / 2} y={VB / 2} text-anchor="middle" class="empty-map">Load trail geometry</text>
			{:else}
				<path class="route-bed" d={isOverview ? overviewBedPath : `${donePath} ${remainPath}`} vector-effect="non-scaling-stroke" />
				<path class="route-remain" d={remainPath} vector-effect="non-scaling-stroke" />
				<path class="route-done" d={donePath} vector-effect="non-scaling-stroke" />
				{#if isOverview}
					<circle class="endpoint" cx={projectedPoints[0].x} cy={projectedPoints[0].y} r="15" />
					<circle class="endpoint" cx={projectedPoints[projectedPoints.length - 1].x} cy={projectedPoints[projectedPoints.length - 1].y} r="15" />
				{/if}
			{/if}
		</svg>
		<div
			class="map-gesture-layer"
			role="slider"
			tabindex="0"
			aria-label="Selected Appalachian Trail mile. Tap the whole trail to jump there; in the corridor, drag or use arrow keys to move, Home to recenter."
			aria-orientation="horizontal"
			aria-valuemin={0}
			aria-valuemax={Math.round(trailEnd)}
			aria-valuenow={Math.round(viewFocusMile)}
			aria-valuetext={`Mile ${viewFocusMile.toFixed(1)}`}
			onpointerdown={beginPan}
			onpointermove={movePan}
			onpointerup={endPan}
			onpointercancel={endPan}
			onkeydown={handleMapKeydown}
		></div>

		<!-- Clean top row: the one glanceable fact (next water) + a compass.
		     The honest "offline schematic, not a basemap" framing lives in the
		     bottom card so it stays visible without crowding the trace. -->
		<div class="map-top">
			{#if nextWater}
				<span class="next-water-chip">
					<span class="wglyph"><Icon name="water" size={14} stroke={2} /></span>
					<span class="nw-text">Next water <strong>{nextWater.dist.toFixed(1)} mi</strong></span>
					{#if nextWater.candidate}<span class="cand-tag">candidate</span>{/if}
				</span>
			{/if}
			<span class="compass" aria-label="North is up">N</span>
		</div>

		<!-- Right-edge controls, maps-app style: whole-trail/zoom window, locate,
		     and a quick conditions report. -->
		<div class="map-tools">
			<div class="zoom-stack" role="group" aria-label="Map zoom">
				{#each ZOOMS as z (z)}
					<button
						class="zbtn"
						class:map={z === OVERVIEW}
						class:on={mapZoom === z}
						onclick={() => setZoom(z)}
						aria-pressed={mapZoom === z}
						aria-label={z === OVERVIEW ? 'Whole trail' : `${z} mile view`}
					>
						{#if z === OVERVIEW}<Icon name="map" size={15} stroke={2} />{:else}{z}{/if}
					</button>
				{/each}
				<span class="zunit">mi</span>
			</div>
			{#if showLocate}
				<button class="tool-btn recenter" onclick={recenter} aria-label={isOverview ? 'Zoom to my location' : 'Recenter map on current mile'}>
					<Icon name="now" size={20} stroke={2} />
				</button>
			{/if}
			<div class="tool-report"><TrailPulseReportAction variant="map" label="Report" /></div>
		</div>

		<!-- overview endpoint labels -->
		{#if ready && isOverview && endpointStart && endpointEnd}
			<div class="endpoint-lbl start" style="left:{endpointStart.leftPct}%; top:{endpointStart.topPct}%;">
				<span class="lbl">Springer · GA</span>
			</div>
			<div class="endpoint-lbl end" style="left:{endpointEnd.leftPct}%; top:{endpointEnd.topPct}%;">
				<span class="lbl">Katahdin · ME</span>
			</div>
		{/if}

		<!-- upcoming landmark pins (corridor only) -->
		{#if ready && !isOverview}
			{#each placed as p (p.kind + p.label + p.mile)}
				<div class="pin {p.kind}" style="left:{p.leftPct}%; top:{p.topPct}%;">
					<span class="lbl"><Icon name={pinIcon[p.kind]} size={12} stroke={2} /> {p.label} · {distanceLabel(p.mile)}</span>
					<span class="dot"></span>
				</div>
			{/each}
		{/if}

		<!-- hiker position -->
		{#if ready && (isOverview || currentInView)}
			<div class="you" class:overview={isOverview} style="left:{youPos.leftPct}%; top:{youPos.topPct}%;">
				<div class="you-mark"><Icon name="now" size={isOverview ? 22 : 31} stroke={2} /></div>
				{#if !isOverview}<span class="youlbl">{youLabel} · Mi {from.toFixed(1)}</span>{/if}
			</div>
		{/if}

		<!-- orientation + elevation card -->
		<div class="elev">
			<div class="orient">
				{#if !isOverview}
					<button class="orient-back" onclick={() => setZoom(OVERVIEW)} aria-label="Back to whole trail">‹ Whole trail</button>
				{/if}
				<span class="orient-range">{rangeLabel}</span>
				<span class="orient-offset" class:inview={currentInView}>{orientOffset}</span>
				<span class="orient-tag" title="Real bundled AT geometry — an offline schematic, not a tile basemap or turn-by-turn navigator.">Offline · no basemap</span>
			</div>

			<div class="etop">
				<span class="etitle">{elevTitle}</span>
				<div class="updown">
					<span class="up">↑ +{fmt(elev.gain)} ft</span>
					<span class="down">↓ −{fmt(elev.loss)} ft</span>
				</div>
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
				<span>Mi {elev.lo.toFixed(0)}</span>
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

	/* paper ground — a warm topo field, replaces the flat gradient + graph grid */
	.map-canvas {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(120% 80% at 16% 6%, rgba(255, 255, 255, 0.3), transparent 46%),
			radial-gradient(120% 82% at 95% 103%, rgba(45, 60, 42, 0.16), transparent 55%),
			linear-gradient(180deg, var(--bg) 0%, var(--bg-deep) 100%);
	}

	.map-contours {
		position: absolute;
		inset: -20%; /* overscan so the rotation never bares a corner */
		z-index: 0;
		pointer-events: none;
		transform: rotate(-7deg);
		background:
			repeating-linear-gradient(0deg, transparent 0 21px, var(--contour-line) 21px 21.8px),
			repeating-linear-gradient(0deg, transparent 0 105px, var(--contour-index) 105px 106.2px),
			repeating-linear-gradient(74deg, transparent 0 26px, var(--stream-line) 26px 26.8px);
		opacity: 0.9;
	}

	.route-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
	}

	.map-gesture-layer {
		position: absolute;
		inset: 0;
		z-index: 1;
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.map-screen.dragging .map-gesture-layer {
		cursor: grabbing;
	}

	.empty-map {
		fill: var(--muted);
		font-size: 40px;
		font-weight: 800;
	}

	/* full-trail line — progress shading (constant screen-width strokes) */
	.route-bed {
		fill: none;
		stroke: var(--surface-strong);
		stroke-width: 4;
		opacity: 0.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.route-remain {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.9;
		opacity: 0.7;
		stroke-dasharray: 2.5 6;
		stroke-linecap: round;
	}
	.route-done {
		fill: none;
		stroke: var(--forest);
		stroke-width: 2.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.endpoint {
		fill: var(--forest);
		stroke: var(--surface-strong);
		stroke-width: 4;
	}

	/* overview endpoint labels (HTML overlays) */
	.endpoint-lbl {
		position: absolute;
		z-index: 2;
		pointer-events: none;
	}
	.endpoint-lbl .lbl {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #f4efe4;
		background: var(--forest);
		padding: 2px 7px;
		border-radius: var(--radius-sm);
		white-space: nowrap;
		box-shadow: var(--shadow-soft);
	}
	/* Anchor labels at the endpoint and lean inward so they never run off-screen:
	   Springer sits bottom-left → label above & extending right; Katahdin sits
	   top-right → label below & extending left. */
	.endpoint-lbl.start {
		transform: translate(-6px, calc(-100% - 11px));
	}
	.endpoint-lbl.end {
		transform: translate(calc(-100% + 6px), 11px);
	}

	.pin {
		position: absolute;
		transform: translate(-50%, -100%);
		z-index: 2;
		pointer-events: none;
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
		pointer-events: none;
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
	.you.overview .you-mark {
		width: 26px;
		height: 26px;
		border: 2px solid var(--forest);
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

	/* top row: next-water + compass */
	.map-top {
		position: absolute;
		top: max(12px, env(safe-area-inset-top));
		left: 12px;
		right: 12px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
		z-index: 4;
		pointer-events: none;
	}
	.map-top > * {
		pointer-events: auto;
	}
	.next-water-chip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 36px;
		max-width: calc(100% - 52px);
		padding: 7px 12px;
		border-radius: 999px;
		background: rgba(255, 253, 248, 0.95);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		font-size: 0.76rem;
		font-weight: 700;
		color: var(--ink);
	}
	.next-water-chip .wglyph {
		display: inline-flex;
		color: var(--sky);
	}
	.next-water-chip .nw-text {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.next-water-chip strong {
		font-weight: 900;
	}
	.cand-tag {
		flex: 0 0 auto;
		font-size: 0.64rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--clay);
		background: var(--clay-soft);
		padding: 2px 6px;
		border-radius: 6px;
	}
	.compass {
		flex: 0 0 auto;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: rgba(255, 253, 248, 0.95);
		color: var(--forest);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		font-size: 0.82rem;
		font-weight: 900;
	}

	/* right-edge control stack */
	.map-tools {
		position: absolute;
		right: 12px;
		top: 64px;
		z-index: 5;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 9px;
	}
	.zoom-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3px;
		padding: 4px;
		border-radius: 16px;
		background: rgba(255, 253, 248, 0.95);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
	}
	.tool-btn {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: rgba(255, 253, 248, 0.95);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		color: var(--forest);
	}
	.tool-btn.recenter {
		background: var(--forest);
		border-color: var(--forest);
		color: #f4efe4;
	}
	.tool-report :global(button) {
		min-width: 44px;
		min-height: 40px;
		padding: 0 14px;
		border-radius: 999px;
		font-size: 0.74rem;
		box-shadow: var(--shadow-soft);
	}

	/* orientation strip on the bottom card */
	.orient {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 10px;
		margin-bottom: 8px;
		font-size: 0.66rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.orient-back {
		display: inline-flex;
		align-items: center;
		min-height: 30px;
		padding: 4px 11px;
		border-radius: var(--radius-pill);
		background: var(--forest-soft);
		color: var(--forest);
		font-size: 0.64rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.orient-range {
		color: var(--ink);
		font-weight: 900;
	}
	.orient-offset {
		color: var(--clay);
	}
	.orient-offset.inview {
		color: var(--forest);
	}
	.orient-tag {
		margin-left: auto;
		color: var(--muted);
		font-weight: 800;
		letter-spacing: 0.02em;
		text-transform: none;
	}

	.elev {
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: max(12px, env(safe-area-inset-bottom));
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
	/* vertical zoom window (right-edge stack) */
	.zbtn {
		width: 44px;
		min-height: 40px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.zbtn.on {
		background: var(--forest);
		color: #f4efe4;
		box-shadow: var(--shadow-soft);
	}
	.zunit {
		font-size: 0.62rem;
		font-weight: 800;
		color: var(--muted);
		padding-bottom: 2px;
	}
	/* ascent / descent */
	.updown {
		display: flex;
		gap: 14px;
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

	/* Dark mode: the floating map chrome was hardcoded light cream (so its
	   token-colored text vanished on dark), and the filled-green labels/buttons
	   need a dark glyph. Adapt them to the night-on-trail theme. */
	@media (prefers-color-scheme: dark) {
		.next-water-chip,
		.compass,
		.zoom-stack,
		.tool-btn {
			background: rgba(22, 29, 20, 0.92);
		}
		.tool-btn.recenter {
			background: var(--forest);
			color: #10160f;
		}
		.zbtn.on {
			color: #10160f;
		}
		.pin .lbl {
			background: rgba(22, 29, 20, 0.94);
			color: var(--ink);
		}
		.pin .dot {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 1px 5px rgba(0, 0, 0, 0.6);
		}
		.endpoint-lbl .lbl,
		.you .youlbl {
			color: #10160f;
		}
		.route-bed {
			opacity: 0.35;
		}
	}
</style>
