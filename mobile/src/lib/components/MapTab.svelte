<script lang="ts">
	import { onMount, onDestroy, tick, untrack } from 'svelte';
	import type * as LeafletNS from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isDadPilot, isSelfTracked } from '$lib/scout/hike-profile';
	import { elevationWindow, snapToMile } from '$lib/trail/trail-geometry';
	import Icon, { type IconName } from './Icon.svelte';
	import TrailPulseReportAction from './TrailPulseReportAction.svelte';
	import PeopleSheet from './PeopleSheet.svelte';
	import { people, AVATAR_TINTS, personInitial } from '$lib/people/people.svelte';
	import { memberLocation } from '$lib/people/memberLocation.svelte';
	import { registerLiveLocation } from '$lib/people/liveLocation.svelte';
	import {
		waterReports,
		waterBucket,
		WATER_STATUS_WORD,
		relAge,
		ageBucket,
		type WaterStatus
	} from '$lib/water/waterReports.svelte';

	// A real Leaflet map on OpenTopoMap tiles showing the whole Appalachian Trail
	// from the bundled offline geometry — progress-shaded, with the corridor's
	// shelters/water/towns. Beautiful in town on live tiles; honest on-trail:
	// when tiles can't load the route + markers stay legible on a paper ground.
	const OVERVIEW = -1 as const;
	const ZOOMS = [OVERVIEW, 20, 10, 5] as const;
	type Zoom = (typeof ZOOMS)[number];

	let L = $state<typeof LeafletNS | null>(null);
	let map = $state<LeafletNS.Map | null>(null);
	let host = $state<HTMLDivElement | null>(null);

	let mapZoom = $state<Zoom>(10); // open on a 10-mi corridor; pinch for custom zoom
	let liveZoom = $state(0);
	let userInteracted = $state(false);
	// While a POI popup is open, suppress the pilot auto-recenter — the map
	// shouldn't jump (and close the popup) while you're reading/reporting a point.
	let poiPopupOpen = $state(false);
	let viewFocusMile = $state(trailAssistant.currentMile);
	let headUp = $state(false);
	let tilesOk = $state(false);
	let tileErrored = $state(false);
	// elevation-card window (driven by the live map bounds on moveend)
	let viewStart = $state(0);
	let viewEnd = $state(0);
	// A tapped trail point → measures distance + climb/descent from the current
	// mile (the "how far / how much up" tool). null when nothing is being measured.
	let measureMile = $state<number | null>(null);
	// True when the measure target is a POI the user selected (vs a free trail tap),
	// so we skip the draggable measure dot — the POI coin already marks the spot.
	let measureFromPoi = $state(false);

	// Whole-trail shelters (OSM, open-licensed) — the navigation landmarks a
	// thru-hiker keys off. Loaded once so the map shows POIs the length of the
	// trail, not just the handful in the field pack near the current mile.
	type TrailShelter = { name: string; mile: number; lat: number; lon: number };
	let trailShelters = $state<TrailShelter[]>([]);

	// High-resolution trail centerline (~0.1 mi sampling, 10x the elevation data)
	// used to DRAW the route so it hugs the real path. Elevation/position/measure
	// stay on the 1-mi data; this is geometry-only. Empty until loaded → the map
	// falls back to the 1-mi line.
	let routeHi = $state<[number, number][]>([]);

	const geo = $derived(trailAssistant.trailGeometry);
	const from = $derived(trailAssistant.currentMile);
	// 0.1-mi quantized current mile — throttles the route rebuild to real movement.
	const fromQ = $derived(Math.round(from * 10) / 10);
	const trailLo = $derived(geo.length ? geo[0].m : 0);
	const trailHi = $derived(geo.length ? geo[geo.length - 1].m : 0);
	const fromClamped = $derived(Math.max(trailLo, Math.min(trailHi, from)));
	const TOTAL_MILES = 2197.4; // canonical AT length — keeps % in step with Today/header

	function clamp(v: number, lo: number, hi: number): number {
		return Math.min(hi, Math.max(lo, v));
	}

	// Real elevation per mile is bundled, so difficulty bands are honest, not faked.
	const hasElev = $derived(geo.length >= 100 && geo.every((p) => Number.isFinite(p.ft)));
	const isOverview = $derived(liveZoom > 0 ? liveZoom < 8.5 : mapZoom === OVERVIEW);
	// Shelters in (or near) the current window — all of them at overview so the
	// whole trail is dotted; the few in frame when zoomed in.
	const sheltersInView = $derived.by(() => {
		if (!trailShelters.length) return [];
		const margin = isOverview ? 0 : 2;
		const lo = viewStart - margin;
		const hi = viewEnd + margin;
		return trailShelters.filter((s) => s.mile >= lo && s.mile <= hi);
	});
	const showPois = $derived(liveZoom >= 9);

	// --- chrome data (kept from the schematic version) ------------------------
	const youLabel = $derived.by(() => {
		const profile = trailAssistant.hikeProfile;
		if (isSelfTracked(profile)) return profile.trailName?.trim() || 'You';
		return isDadPilot(profile) ? 'Dad' : 'Set mile';
	});

	type PoiKind = 'water' | 'shelter' | 'town';
	type WaterReliability = 'reliable' | 'seasonal' | 'thin';
	type Landmark = { kind: PoiKind; mile: number; label: string; reliability?: WaterReliability };
	const POI_WORD = { water: 'Water', shelter: 'Shelter', town: 'Town' } as const;
	// The open water dataset carries no real flow data — the pack defaults every
	// unconfirmed source to 'thin', so 'thin' here means "unverified", NOT a
	// measured low flow. Only 'reliable'/'seasonal' are positive confirmations.
	const RELIABILITY_WORD: Record<WaterReliability, string> = {
		reliable: 'reliable',
		seasonal: 'seasonal',
		thin: 'unverified'
	};
	const landmarks = $derived.by<Landmark[]>(() => {
		const pack = trailAssistant.fieldPack;
		const lo = viewStart - 0.5;
		const hi = viewEnd + 0.5;
		const inWin = <T extends { mile: number }>(items: T[]) =>
			items.filter((i) => i.mile >= lo && i.mile <= hi).sort((a, b) => a.mile - b.mile);
		const water = inWin(pack.water)
			.slice(0, 14)
			.map((w) => ({ kind: 'water' as const, mile: w.mile, label: w.name, reliability: w.reliability }));
		const shelters = inWin(pack.shelters).map((s) => ({ kind: 'shelter' as const, mile: s.mile, label: s.name }));
		const towns = inWin(pack.towns).map((t) => ({ kind: 'town' as const, mile: t.mile, label: t.name }));
		return [...water, ...shelters, ...towns].sort((a, b) => a.mile - b.mile).slice(0, 40);
	});
	// POI category filter, doubling as the legend's state. Never let all three off
	// (an empty map reads as broken).
	let poiFilter = $state(new Set<PoiKind>(['water', 'shelter', 'town']));
	function togglePoi(k: PoiKind) {
		const next = new Set(poiFilter);
		if (next.has(k)) next.delete(k);
		else next.add(k);
		if (next.size === 0) return;
		poiFilter = next;
	}
	const visibleLandmarks = $derived(landmarks.filter((lm) => poiFilter.has(lm.kind)));
	const nextWater = $derived.by(() => {
		const w = trailAssistant.fieldPack.water
			.filter((s) => s.mile >= from - 0.01)
			.sort((a, b) => a.mile - b.mile)[0];
		if (!w) return null;
		return { dist: Math.max(0, w.mile - from), candidate: w.reliability !== 'reliable' };
	});
	function distanceLabel(mile: number): string {
		const d = mile - from;
		if (Math.abs(d) < 0.05) return 'here';
		return d > 0 ? `${d.toFixed(1)}mi` : `${Math.abs(d).toFixed(1)}mi back`;
	}

	// Honest, reactive basemap state for the elevation-card tag.
	const basemapState = $derived.by(() => {
		if (!trailAssistant.onlineStatus) return { dot: 'off', text: 'Offline · trail-only' };
		if (tilesOk && tileErrored) return { dot: 'partial', text: 'Topo cached · weak signal' };
		if (tilesOk) return { dot: 'live', text: 'OpenTopoMap · live' };
		if (tileErrored) return { dot: 'off', text: 'Paper basemap · needs signal' };
		return { dot: 'partial', text: 'Loading basemap…' };
	});

	// --- geometry helpers -----------------------------------------------------
	// Interpolate a position along the SAME line we draw (the high-res centerline
	// when loaded). Everything — the you-avatar, the measured point, the POIs —
	// rides this one geometry, so nothing floats off on a parallel 1-mi track.
	function interpAtMile(mile: number): [number, number] {
		const src = routeSource;
		if (src.length < 2) return [geo[0]?.lat ?? 34.6273, geo[0]?.lon ?? -84.194];
		const span = (trailHi - trailLo) || 1;
		const fi = Math.max(0, Math.min(1, (mile - trailLo) / span)) * (src.length - 1);
		const lo = Math.floor(fi);
		const hi = Math.min(src.length - 1, lo + 1);
		const t = fi - lo;
		return [src[lo][0] + (src[hi][0] - src[lo][0]) * t, src[lo][1] + (src[hi][1] - src[lo][1]) * t];
	}
	const latlngs = $derived<[number, number][]>(geo.map((p) => [p.lat, p.lon]));
	const splitIdx = $derived.by(() => {
		const a = geo;
		if (a.length < 2) return 1;
		if (from <= a[0].m) return 1;
		if (from >= a[a.length - 1].m) return a.length - 1;
		let lo = 0;
		let hi = a.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (a[mid].m <= from) lo = mid;
			else hi = mid;
		}
		return Math.max(1, hi);
	});
	function decimate(pts: [number, number][], step: number): [number, number][] {
		return step <= 1 ? pts : pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
	}

	// The line we DRAW: the high-res centerline when loaded, else the 1-mi points.
	// Both are the same OSM trail at different densities, so positions map by
	// fraction-along-trail and difficulty by the corresponding 1-mi geo segment.
	const routeSource = $derived<[number, number][]>(routeHi.length > 1 ? routeHi : latlngs);
	const routeCount = $derived(routeSource.length);
	const splitIdxRoute = $derived.by(() => {
		if (routeCount < 2 || geo.length < 2) return 1;
		const frac = (fromClamped - trailLo) / ((trailHi - trailLo) || 1);
		return Math.max(1, Math.min(routeCount - 1, Math.round(frac * (routeCount - 1))));
	});
	// Sustained terrain difficulty at a mile — TOTAL vertical change (every up AND
	// down) per mile over a ~0.4-mi window. We only have real elevation (no
	// rock-surface data), and total change is the honest proxy for how punishing a
	// stretch is (the AT's hardest miles are rolling, churned-up PUDs). Windowed so
	// the 100-m profile's local spikes don't paint everything steep, and tuned to
	// the real profile: easy ridgewalks read gentle, typical AT moderate, rugged
	// climbs steep.
	function bandAtMile(mile: number): 0 | 1 | 2 {
		const a = geo;
		if (a.length < 2) return 0;
		const lo = mile - 0.2;
		const hi = mile + 0.2;
		let i = 0;
		let j = a.length - 1;
		while (j - i > 1) {
			const m = (i + j) >> 1;
			if (a[m].m < lo) i = m;
			else j = m;
		}
		let change = 0;
		let span = 0;
		for (let k = i; k < a.length - 1 && a[k].m < hi; k++) {
			if (a[k + 1].m <= lo) continue;
			change += Math.abs(a[k + 1].ft - a[k].ft);
			span += a[k + 1].m - a[k].m;
		}
		if (span < 0.02) return 0;
		const perMile = change / span;
		return perMile > 650 ? 2 : perMile > 320 ? 1 : 0;
	}

	// --- Leaflet layers (created in onMount) ----------------------------------
	let tiles: LeafletNS.TileLayer | null = null;
	let routeLayer: LeafletNS.LayerGroup | null = null;
	let poiLayer: LeafletNS.LayerGroup | null = null;
	let endpointLayer: LeafletNS.LayerGroup | null = null;
	let shelterLayer: LeafletNS.LayerGroup | null = null;
	let measureLayer: LeafletNS.LayerGroup | null = null;
	let measureMarker: LeafletNS.Marker | null = null;
	let measureRenderer: LeafletNS.SVG | null = null;
	let measureDragging = false;
	let youLayer: LeafletNS.LayerGroup | null = null;
	let memberLayer: LeafletNS.LayerGroup | null = null;
	let youMarker: LeafletNS.Marker | null = null;
	let youInitial = ''; // tracked so the avatar glyph only re-renders when it changes
	let atBounds: LeafletNS.LatLngBounds | null = null;
	let initialFrameReady = false;
	let routeHiRequested = false;

	function addBasemapTiles(): void {
		if (!trailAssistant.onlineStatus || !initialFrameReady || !L || !map || tiles) return;
		tilesOk = false;
		tileErrored = false;
		tiles = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
			maxZoom: 16,
			maxNativeZoom: 16,
			minZoom: 4,
			opacity: 0.96,
			crossOrigin: true,
			keepBuffer: 2,
			updateWhenIdle: true,
			className: 'otm-tiles',
			errorTileUrl:
				'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
		});
		tiles.on('tileload', () => {
			tilesOk = true;
		});
		tiles.on('load', () => {
			tilesOk = true;
		});
		tiles.on('tileerror', () => {
			tileErrored = true;
		});
		tiles.addTo(map);
	}

	function loadRouteHi(): void {
		if (routeHiRequested) return;
		routeHiRequested = true;
		fetch('/trail/route-hi.json')
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d && Array.isArray(d.path) && d.path.length > 1) routeHi = d.path;
			})
			.catch(() => {
				routeHiRequested = false;
			});
	}

	function loadRouteHiDeferred(): void {
		const go = () => loadRouteHi();
		if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 2500 });
		else setTimeout(go, 1200);
	}

	function fitWholeTrail(animate = true) {
		if (!map || !atBounds) return;
		map.fitBounds(atBounds, {
			paddingTopLeft: [26, 70],
			paddingBottomRight: [26, 150],
			animate
		});
	}
	function flyToCorridor(centerMile: number, widthMiles: number, animate = true) {
		if (!map || !L || geo.length < 2) return;
		const lo = clamp(centerMile - widthMiles / 2, trailLo, trailHi);
		const hi = clamp(lo + widthMiles, trailLo, trailHi);
		const slice = geo.filter((p) => p.m >= lo && p.m <= hi).map((p) => [p.lat, p.lon] as [number, number]);
		if (slice.length < 2) return;
		const b = L.latLngBounds(slice);
		const opts = { paddingTopLeft: [22, 62] as [number, number], paddingBottomRight: [22, 140] as [number, number] };
		if (animate) map.flyToBounds(b, { ...opts, duration: 0.7, easeLinearity: 0.2 });
		else map.fitBounds(b, { ...opts, animate: false });
	}
	function setZoom(z: Zoom) {
		mapZoom = z;
		userInteracted = false;
		if (z === OVERVIEW) fitWholeTrail();
		else flyToCorridor(viewFocusMile, z);
	}
	function recenter() {
		userInteracted = false;
		viewFocusMile = from;
		const width = mapZoom === OVERVIEW ? 10 : (mapZoom as number);
		mapZoom = width as Zoom;
		flyToCorridor(from, width);
	}
	const showRecenter = $derived(userInteracted && !isOverview);

	function onMapClick(lat: number, lon: number) {
		if (geo.length < 2 && routeHi.length < 2) return;
		// Snap the tap to the nearest point on the trail; a tap far out in open map
		// clears it. Tolerance scales with zoom — generous on the whole-trail view
		// (the line is a few pixels wide), tighter in the corridor.
		const tol = isOverview ? 80 : 6;
		measureMile = snapMeasureToTrail(lat, lon, tol);
		measureFromPoi = false; // a free trail tap — show the draggable measure dot
	}
	// Snap straight to the nearest point on the DRAWN high-res line (not the 1-mi
	// elevation points, whose geometry differs). This is exact at any zoom — a tap
	// at 1-mi or tighter lands precisely where you touched, and a drag glides along
	// the line. ~70k points is a sub-millisecond scan; fine per tap and per drag.
	function snapMeasureToTrail(lat: number, lon: number, tol: number): number | null {
		if (routeHi.length < 2) return snapToMile(geo, lat, lon, tol);
		const cosLat = Math.cos((lat * Math.PI) / 180);
		let bestIdx = 0;
		let bestD = Infinity;
		for (let i = 0; i < routeHi.length; i++) {
			const dLat = routeHi[i][0] - lat;
			const dLon = (routeHi[i][1] - lon) * cosLat;
			const d = dLat * dLat + dLon * dLon;
			if (d < bestD) {
				bestD = d;
				bestIdx = i;
			}
		}
		// 1° latitude ≈ 69 mi — reject taps farther than the tolerance from the line.
		if (Math.sqrt(bestD) * 69 > tol) return null;
		const span = (trailHi - trailLo) || 1;
		return trailLo + (bestIdx / (routeHi.length - 1)) * span;
	}
	function clearMeasure() {
		measureMile = null;
		measureFromPoi = false;
	}
	// Select a POI as the measured spot: distance + climb/descent to it light up in
	// the card and the trail highlights, alongside the popup that names it.
	function selectPoi(mile: number) {
		measureMile = clamp(mile, trailLo, trailHi);
		measureFromPoi = true;
	}

	function onMoveEnd() {
		if (!map || geo.length < 2) return;
		liveZoom = map.getZoom();
		const b = map.getBounds();
		let lo = Infinity;
		let hi = -Infinity;
		for (const p of geo) {
			if (b.contains([p.lat, p.lon])) {
				if (p.m < lo) lo = p.m;
				if (p.m > hi) hi = p.m;
			}
		}
		if (lo <= hi) {
			viewStart = lo;
			viewEnd = hi;
		}
		host?.classList.toggle('z-overview', liveZoom < 8.5);
	}

	// head-up bearing along the trail at the current mile
	function bearingAtMile(mile: number): number {
		const [aLat, aLon] = interpAtMile(mile - 0.5);
		const [bLat, bLon] = interpAtMile(mile + 0.5);
		const dLon = ((bLon - aLon) * Math.PI) / 180;
		const y = Math.sin(dLon) * Math.cos((bLat * Math.PI) / 180);
		const x =
			Math.cos((aLat * Math.PI) / 180) * Math.sin((bLat * Math.PI) / 180) -
			Math.sin((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.cos(dLon);
		return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
	}
	const bearing = $derived(geo.length > 1 ? bearingAtMile(fromClamped) : 0);

	// Elevation (ft) interpolated at an exact mile from the 100-m profile.
	function elevAtMile(mile: number): number {
		const a = geo;
		if (a.length < 1) return 0;
		const m = clamp(mile, a[0].m, a[a.length - 1].m);
		let lo = 0;
		let hi = a.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (a[mid].m <= m) lo = mid;
			else hi = mid;
		}
		const t = (m - a[lo].m) / Math.max(1e-6, a[hi].m - a[lo].m);
		return a[lo].ft + (a[hi].ft - a[lo].ft) * t;
	}

	// Build an elevation segment with interpolated endpoints, so even a span
	// shorter than the 100-m profile spacing still has a real ≥2-point profile.
	function elevSegment(lo: number, hi: number): { mile: number; elevation: number }[] {
		const interior = elevationWindow(geo, lo, hi - lo).filter(
			(p) => p.mile > lo + 1e-6 && p.mile < hi - 1e-6
		);
		return [
			{ mile: lo, elevation: elevAtMile(lo) },
			...interior,
			{ mile: hi, elevation: elevAtMile(hi) }
		];
	}

	// --- measurement: tap a trail point → distance + gain/loss from current mile -
	// Cumulative climb + descent actually walked from the current mile to a target
	// mile (either direction). Reused by the measure card and the POI popups.
	function elevChangeTo(targetMile: number): { gain: number; loss: number } {
		const target = clamp(targetMile, trailLo, trailHi);
		const a = Math.min(fromClamped, target);
		const b = Math.max(fromClamped, target);
		const segUp = elevSegment(a, b);
		const seq = target >= fromClamped ? segUp : [...segUp].reverse();
		let gain = 0;
		let loss = 0;
		for (let i = 1; i < seq.length; i++) {
			const delta = seq[i].elevation - seq[i - 1].elevation;
			if (delta > 0) gain += delta;
			else loss += -delta;
		}
		return { gain: Math.round(gain), loss: Math.round(loss) };
	}
	const measure = $derived.by(() => {
		if (measureMile == null || geo.length < 2) return null;
		const target = clamp(measureMile, trailLo, trailHi);
		const { gain, loss } = elevChangeTo(target);
		return {
			mile: target,
			ahead: target >= fromClamped,
			dist: Math.abs(target - fromClamped),
			gain,
			loss
		};
	});

	// --- elevation profile (whole hike / visible window / measured segment) ------
	// Decimate a high-res window to ~targetN buckets for the SVG, keeping each
	// bucket's local min AND max (in mile order) so summits and notches survive —
	// a plain stride would alias them away at whole-trail zoom. Gain/loss is always
	// summed from the full-resolution window, never this drawing copy.
	function decimateProfile(
		pts: { mile: number; elevation: number }[],
		targetN: number
	): { mile: number; elevation: number }[] {
		if (pts.length <= targetN) return pts;
		const bucket = pts.length / targetN;
		const out: { mile: number; elevation: number }[] = [pts[0]];
		for (let b = 0; b < targetN; b++) {
			const start = Math.floor(b * bucket);
			const end = Math.min(pts.length, Math.floor((b + 1) * bucket));
			let lo = pts[start];
			let hi = pts[start];
			for (let i = start + 1; i < end; i++) {
				if (pts[i].elevation < lo.elevation) lo = pts[i];
				if (pts[i].elevation > hi.elevation) hi = pts[i];
			}
			const [first, second] = lo.mile <= hi.mile ? [lo, hi] : [hi, lo];
			if (first !== out[out.length - 1]) out.push(first);
			if (second !== first) out.push(second);
		}
		const last = pts[pts.length - 1];
		if (out[out.length - 1] !== last) out.push(last);
		return out;
	}
	const H = 46;
	const elevLo = $derived(measure ? Math.min(fromClamped, measure.mile) : viewStart);
	const elevHi = $derived(measure ? Math.max(fromClamped, measure.mile) : Math.max(viewEnd, viewStart + 0.5));
	const elev = $derived.by(() => {
		const W = 280;
		const pad = 5;
		const lo = elevLo;
		const hi = Math.max(elevHi, lo + 0.5);
		const full = elevSegment(lo, hi);
		if (full.length < 2) {
			return { fillD: '', segments: [] as { d: string; band: 0 | 1 | 2 }[], gain: 0, loss: 0, minEl: 0, maxEl: 0, lo, hi, empty: true };
		}
		// Gain/loss from the full-resolution window — honest at 100-m spacing.
		let gain = 0;
		let loss = 0;
		for (let i = 1; i < full.length; i++) {
			const delta = full[i].elevation - full[i - 1].elevation;
			if (delta > 0) gain += delta;
			else loss += -delta;
		}
		// Decimate only for drawing the SVG path.
		const win = decimateProfile(full, 220);
		const elevs = win.map((p) => p.elevation);
		const minEl = Math.min(...elevs);
		const maxEl = Math.max(...elevs);
		const x = (m: number) => ((m - lo) / (hi - lo || 1)) * W;
		const y = (e: number) => H - pad - ((e - minEl) / (maxEl - minEl || 1)) * (H - pad * 2);
		const pt = (i: number) => `${x(win[i].mile).toFixed(1)},${y(win[i].elevation).toFixed(1)}`;
		const line = win.map((_, i) => `${i === 0 ? 'M' : 'L'}${pt(i)}`).join(' ');
		const fillD = `${line} L${x(win[win.length - 1].mile).toFixed(1)},${H} L${x(win[0].mile).toFixed(1)},${H} Z`;
		// Colour the line by the same sustained terrain band the map uses (a ±0.2-mi
		// window), merging consecutive same-band segments so the profile reads
		// gentle / moderate / steep instead of saturating on every 100-m wiggle.
		const segments: { d: string; band: 0 | 1 | 2 }[] = [];
		let runBand: 0 | 1 | 2 | null = null;
		let runD = '';
		for (let i = 1; i < win.length; i++) {
			const band = bandAtMile((win[i - 1].mile + win[i].mile) / 2);
			if (band === runBand) {
				runD += ` L${pt(i)}`;
			} else {
				if (runD) segments.push({ d: runD, band: runBand as 0 | 1 | 2 });
				runBand = band;
				runD = `M${pt(i - 1)} L${pt(i)}`;
			}
		}
		if (runD) segments.push({ d: runD, band: runBand as 0 | 1 | 2 });
		return { fillD, segments, gain: Math.round(gain), loss: Math.round(loss), minEl, maxEl, lo, hi, empty: false };
	});
	const rangeLabel = $derived(
		measure
			? `Mi ${Math.min(fromClamped, measure.mile).toFixed(0)}–${Math.max(fromClamped, measure.mile).toFixed(0)}`
			: isOverview
				? 'Whole trail'
				: `Mi ${elev.lo.toFixed(0)}–${elev.hi.toFixed(0)}`
	);
	const elevTitle = $derived(
		measure
			? `From here · ${measure.dist.toFixed(1)} mi ${measure.ahead ? 'ahead' : 'back'}`
			: isOverview
				? 'Whole-hike elevation'
				: 'Elevation in view'
	);
	const progressLabel = $derived(`${Math.round((from / TOTAL_MILES) * 100)}% complete`);
	const fmt = (n: number) => n.toLocaleString('en-US');

	// --- lifecycle ------------------------------------------------------------
	// Connect the live-data SpacetimeDB feeds (tramily water reports + family
	// location) OFF the boot/hydration frame. When the app launches straight onto the
	// Map tab, MapTab.onMount runs during hydration; a SpacetimeDB connect burst there
	// (identity-token POST + WebSocket build) both froze the iOS WebView and, on a
	// production build, starved the map's own dynamic import('leaflet') so the chunk
	// never loaded and the map stayed blank. Deferring it past hydration lets the map
	// win the boot frame; both calls are idempotent (guarded), so re-opening the Map
	// never reconnects. See the boot-freeze rule in mobile/README.md.
	function startLiveDataDeferred() {
		const go = () => {
			waterReports.startSync();
			registerLiveLocation();
		};
		if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 2000 });
		else setTimeout(go, 600);
	}

	onMount(async () => {
		// Build the map FIRST — its dynamic import('leaflet') + init must win the boot
		// frame (see startLiveDataDeferred above). The live-data connects are scheduled
		// at the END of onMount, once the map is up and clear of hydration.
		const leaflet = await import('leaflet');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		L = ((leaflet as any).default ?? leaflet) as typeof LeafletNS;
		if (!host || !L) return;

		map = L.map(host, {
			zoomControl: false,
			attributionControl: false,
			scrollWheelZoom: true,
			// Fully continuous pinch zoom — no snapping to fixed levels.
			zoomSnap: 0,
			zoomDelta: 0.5,
			minZoom: 4,
			maxZoom: 16,
			preferCanvas: false,
			maxBoundsViscosity: 0.7,
			// A POI popup is a working surface (water-status buttons) — don't let a
			// stray map click dismiss it; it closes via its ✕ or opening another.
			closePopupOnClick: false,
			renderer: L.svg({ padding: 0.5 })
		});
		map.setView([39, -77], 5);

		// A dedicated pane for the measure highlight, above the route corridor. The
		// corridor redraws (clearLayers + re-add) on every zoom; in the shared
		// overlay pane that re-stacks the corridor ON TOP of the highlight and hides
		// it (you keep the draggable point but lose the line). Its own higher pane
		// keeps the highlight visible regardless of redraw order.
		map.createPane('measureHi');
		const measurePaneEl = map.getPane('measureHi');
		if (measurePaneEl) measurePaneEl.style.zIndex = '450';
		measureRenderer = L.svg({ pane: 'measureHi', padding: 0.5 });

		routeLayer = L.layerGroup().addTo(map);
		shelterLayer = L.layerGroup().addTo(map);
		poiLayer = L.layerGroup().addTo(map);
		endpointLayer = L.layerGroup().addTo(map);
		measureLayer = L.layerGroup().addTo(map);
		youLayer = L.layerGroup().addTo(map);
		memberLayer = L.layerGroup().addTo(map);

		// Load the whole-trail shelter POIs (best-effort; the map works without them).
		fetch('/trail/shelters.json')
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => {
				if (d && Array.isArray(d.shelters)) trailShelters = d.shelters;
			})
			.catch(() => {});

		map.on('zoomend moveend', onMoveEnd);
		map.on('dragstart zoomstart', () => (userInteracted = true));
		map.on('click', (e: LeafletNS.LeafletMouseEvent) => onMapClick(e.latlng.lat, e.latlng.lng));
		// One delegated handler (registered once) re-renders a POI popup from fresh
		// state on open and wires any water-report buttons — survives the corridor
		// layer being torn down and rebuilt, where per-marker listeners wouldn't.
		map.on('popupopen', (e: LeafletNS.PopupEvent) => {
			if (e.popup.getElement()?.querySelector('.poi-pop')) {
				poiPopupOpen = true;
				renderPoiPopup(e.popup);
			}
		});
		map.on('popupclose', () => (poiPopupOpen = false));

		await tick();
		requestAnimationFrame(() => {
			map?.invalidateSize();
			if (latlngs.length > 1 && L) {
				atBounds = L.latLngBounds(latlngs).pad(0.12);
				map?.setMaxBounds(atBounds);
				if (mapZoom === OVERVIEW) fitWholeTrail(false);
				else flyToCorridor(from, mapZoom as number, false);
				initialFrameReady = true;
				addBasemapTiles();
				loadRouteHiDeferred();
			}
			onMoveEnd();
		});

		// Map is up — now bring the live SpacetimeDB feeds online, off this frame.
		startLiveDataDeferred();
	});

	onDestroy(() => {
		map?.off();
		map?.remove();
		map = null;
	});

	// Establish bounds + initial frame once geometry has loaded (it's async).
	$effect(() => {
		if (!L || !map || latlngs.length < 2) return;
		atBounds = L.latLngBounds(latlngs).pad(0.12);
		map.setMaxBounds(atBounds);
		if (!userInteracted && !poiPopupOpen) {
			if (mapZoom === OVERVIEW) fitWholeTrail(false);
			else flyToCorridor(from, mapZoom as number, false);
		}
		initialFrameReady = true;
		addBasemapTiles();
		loadRouteHiDeferred();
		onMoveEnd();
	});

	$effect(() => {
		void trailAssistant.onlineStatus;
		addBasemapTiles();
	});

	// Build the route, coloured by terrain difficulty so the climbs read straight
	// off the map. Rebuilds on real movement and zoom (detail) changes.
	$effect(() => {
		void fromQ;
		void routeSource;
		void liveZoom;
		void hasElev;
		if (!L || !map || !routeLayer || routeCount < 2) return;
		routeLayer.clearLayers();
		const overview = liveZoom > 0 ? liveZoom < 8 : true;
		const hires = routeHi.length > 1;
		// Full resolution in the corridor so the line hugs every bend AND matches
		// the measure highlight exactly (no parallel double-line). Lighter only at
		// overview, where the fine bends aren't visible anyway.
		const step = overview ? (hires ? 7 : 3) : 1;
		const src = routeSource;
		const split = splitIdxRoute;
		const n = routeCount;

		// 1) casing/halo — solid under the done portion, dash-matched under the
		//    remainder, so each coloured dash keeps its outline (no white line
		//    bleeding through between dashes).
		L.polyline(decimate(src.slice(0, split + 1), step), {
			color: '#fffdf8',
			weight: 6.5,
			opacity: 0.85,
			lineCap: 'round',
			lineJoin: 'round',
			interactive: false,
			className: 'rt rt-halo'
		}).addTo(routeLayer);
		L.polyline(decimate(src.slice(split), step), {
			color: '#fffdf8',
			weight: 6,
			opacity: 0.8,
			dashArray: '2 7',
			lineCap: 'round',
			lineJoin: 'round',
			interactive: false,
			className: 'rt rt-halo'
		}).addTo(routeLayer);

		if (hasElev) {
			// Difficulty band for a stretch of the drawn line, looked up from the
			// matching 1-mi elevation segment(s).
			const span = (trailHi - trailLo) || 1;
			const bandFor = (ra: number, rb: number): 0 | 1 | 2 =>
				bandAtMile(trailLo + (((ra + rb) / 2) / (routeCount - 1)) * span);
			// 2) difficulty-banded trail. Done = solid, upcoming remainder = dashed
			//    (same gentle/moderate/steep colours), so progress still reads.
			const drawBanded = (i0: number, i1: number, dashed: boolean) => {
				if (!L || !routeLayer || i1 <= i0) return;
				const idx: number[] = [];
				for (let i = i0; i < i1; i += step) idx.push(i);
				idx.push(i1);
				if (idx.length < 2) return;
				const style: LeafletNS.PolylineOptions = dashed
					? { weight: 4, opacity: 0.95, dashArray: '2 7' }
					: { weight: 5, opacity: 1 };
				let runStartK = 1;
				let runBand = bandFor(idx[0], idx[1]);
				const flush = (endK: number) => {
					const slice = idx.slice(runStartK - 1, endK + 1).map((i) => src[i]);
					if (slice.length > 1) {
						L!.polyline(slice, {
							...style,
							lineCap: 'round',
							lineJoin: 'round',
							interactive: false,
							className: `rt rt-band b${runBand}`
						}).addTo(routeLayer!);
					}
				};
				for (let k = 2; k < idx.length; k++) {
					const band = bandFor(idx[k - 1], idx[k]);
					if (band !== runBand) {
						flush(k - 1);
						runStartK = k;
						runBand = band;
					}
				}
				flush(idx.length - 1);
			};
			drawBanded(0, split, false); // done — solid
			drawBanded(split, n - 1, true); // remainder — dashed
		} else {
			// No elevation data yet — fall back to honest progress shading, no faked grade.
			L.polyline(decimate(src.slice(0, split + 1), step), {
				color: '#2f4b35',
				weight: 4,
				opacity: 0.97,
				lineCap: 'round',
				lineJoin: 'round',
				interactive: false,
				className: 'rt rt-done'
			}).addTo(routeLayer);
			L.polyline(decimate(src.slice(split), step), {
				color: '#8a8475',
				weight: 2.8,
				opacity: 0.9,
				dashArray: '2 7',
				lineCap: 'round',
				interactive: false,
				className: 'rt rt-remain'
			}).addTo(routeLayer);
		}
	});

	// Category POI markers — a category-coloured COIN (disc + cream ring) with the
	// matching glyph (droplet / tent / house) centred. The icon + ring + size set
	// it apart from the trail's small bare difficulty dots, and the glyph (not hue
	// alone) carries the category. A neutral circle — no shape that implies a type.
	const POI_GLYPH: Record<PoiKind, string> = {
		water: '<path d="M12 3.5C12 3.5 5.5 11 5.5 15.5a6.5 6.5 0 0 0 13 0C18.5 11 12 3.5 12 3.5Z"/>',
		shelter: '<path d="M2.5 20 12 4.5 21.5 20"/><path d="M2.5 20H21.5"/><path d="M9 20 12 13.5 15 20"/>',
		town: '<path d="M4 11 12 4.5 20 11V20H4Z"/><path d="M10 20v-5h4v5"/>'
	};
	// Water coins are shaded by reliability: a faint disc = "unverified", filling to
	// opaque as it's confirmed flowing. The class drives --shade-alpha (CSS); the
	// data-wbucket lets a report update the coin's fill in place (no marker rebuild).
	function waterShadeClass(mile: number): string {
		const rep = waterReports.latestForBucket(waterBucket(mile));
		return `water-${rep ? rep.status : 'unverified'}`;
	}
	function poiIcon(kind: PoiKind, water?: { shadeClass: string; bucket: number }) {
		const d = liveZoom >= 12 ? 30 : 26;
		const body =
			kind === 'water' && water
				? `<span class="pp-body ${water.shadeClass}" data-wbucket="${water.bucket}"></span>`
				: `<span class="pp-body"></span>`;
		return L!.divIcon({
			className: `poi-pin pin-${kind}`,
			iconSize: [d, d],
			iconAnchor: [d / 2, d / 2], // coin sits centred on the trail point
			popupAnchor: [0, -Math.round(d / 2) - 2], // popup opens just above the coin
			html: body + `<svg class="pp-glyph" viewBox="0 0 24 24" aria-hidden="true">${POI_GLYPH[kind]}</svg>`
		});
	}
	// Re-shade every on-screen coin for a water bucket in place (after a report).
	function shadeWaterCoin(bucket: number, status: WaterStatus): void {
		document
			.querySelectorAll<HTMLElement>(`.poi-pin .pp-body[data-wbucket="${bucket}"]`)
			.forEach((el) => (el.className = `pp-body water-${status}`));
	}

	// You-marker — a Life360-style avatar (trail-name initial in a forest ring
	// over a pulse). Created once and moved so the pulse never restarts; the glyph
	// only re-renders if the label changes. This is the first member of the
	// people layer the live-sharing presence system will fill out.
	const avatarIcon = (initial: string) =>
		L!.divIcon({
			className: 'you-leaf',
			iconSize: [38, 38],
			iconAnchor: [19, 19],
			html: `<span class="yl-pulse"></span><span class="yl-avatar">${initial}</span>`
		});
	$effect(() => {
		void fromQ;
		void youLabel;
		if (!L || !map || !youLayer || geo.length < 2) return;
		const ll = interpAtMile(fromClamped);
		const initial = (youLabel.trim()[0] || 'Y').toUpperCase();
		const content = `<span class="tip-rot">${youLabel} · Mi ${fromClamped.toFixed(1)}</span>`;
		if (!youMarker) {
			youInitial = initial;
			youMarker = L.marker(ll, { icon: avatarIcon(initial), zIndexOffset: 1000, interactive: false })
				.bindTooltip(content, { direction: 'right', offset: [16, 0], className: 'map-tip you-tip' })
				.addTo(youLayer);
		} else {
			youMarker.setLatLng(ll);
			youMarker.setTooltipContent(content);
			// Only swap the icon (which restarts the pulse) when the initial changes.
			if (initial !== youInitial) {
				youInitial = initial;
				youMarker.setIcon(avatarIcon(initial));
			}
		}
	});

	// Live tramily/family avatars — co-members of the active group sharing a
	// position via SpacetimeDB, placed at their real trail mile (clay ring, so they
	// read distinctly from the forest "you"). Empty until live sharing is on and
	// configured; redraws on each position update (small N → clear+rebuild is fine).
	// Privacy is server-enforced: positions only arrive for groups this device is in.
	function liveAge(iso: string): string {
		const t = Date.parse(iso);
		if (!Number.isFinite(t)) return 'live';
		const secs = Math.max(0, Math.round((Date.now() - t) / 1000));
		if (secs < 90) return 'just now';
		const mins = Math.round(secs / 60);
		if (mins < 60) return `${mins} min ago`;
		const hrs = Math.round(mins / 60);
		if (hrs < 24) return `${hrs}h ago`;
		return `${Math.round(hrs / 24)}d ago`;
	}
	const memberAvatarIcon = (initial: string) =>
		L!.divIcon({
			className: 'member-leaf',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			html: `<span class="ml-avatar">${escapeHtml(initial)}</span>`
		});
	$effect(() => {
		const live = memberLocation.positions;
		const code = people.activeGroup?.shareCode;
		void fromQ;
		if (!L || !map || !memberLayer || geo.length < 2) return;
		memberLayer.clearLayers();
		if (!code) return;
		for (const m of live) {
			if (m.groupCode !== code || m.isSelf) continue;
			const ll = interpAtMile(Math.max(trailLo, Math.min(trailHi, m.mile)));
			const initial = (m.trailName.trim()[0] || '?').toUpperCase();
			const tip = `<span class="tip-rot">${escapeHtml(m.trailName)} · Mi ${m.mile.toFixed(1)} · ${liveAge(m.updatedAt)}</span>`;
			L.marker(ll, { icon: memberAvatarIcon(initial), zIndexOffset: 800, interactive: true })
				.bindTooltip(tip, { direction: 'right', offset: [15, 0], className: 'map-tip member-tip' })
				.addTo(memberLayer);
		}
	});

	// Whole-trail shelter POIs — small moss dots at their real positions, the
	// length of the trail: the thru-hiker's orientation backbone. Labels on tap
	// (not permanent) so 180 markers don't shout at once. When zoomed into the
	// corridor a shelter is promoted to a labelled pin, so we suppress the dot
	// wherever a corridor shelter pin already shows it (mile-bucket dedup).
	$effect(() => {
		void sheltersInView;
		void liveZoom;
		void visibleLandmarks;
		void fromQ;
		if (!L || !map || !shelterLayer) return;
		shelterLayer.clearLayers();
		const pinned = showPois
			? new Set(
					visibleLandmarks
						.filter((lm) => lm.kind === 'shelter')
						.map((lm) => Math.round(lm.mile * 20)) // ~0.05-mi buckets
				)
			: new Set<number>();
		const r = liveZoom >= 11 ? 5 : liveZoom >= 8 ? 4 : 3;
		for (const s of sheltersInView) {
			if (pinned.has(Math.round(s.mile * 20))) continue; // a corridor pin already shows it
			const ec = elevChangeTo(s.mile);
			const dot = L.circleMarker([s.lat, s.lon], {
				radius: r,
				weight: 1.8,
				color: '#fffdf8',
				fillColor: '#6a845f',
				fillOpacity: 1,
				className: 'poi poi-shelter'
			}).bindPopup(
				`<div class="poi-pop pop-shelter"><strong class="pp-name">${s.name}</strong>` +
					`<span class="pp-meta">Shelter · ${distanceLabel(s.mile)}</span>` +
					`<span class="pp-elev">↑ ${fmt(ec.gain)} ft · ↓ ${fmt(ec.loss)} ft to reach</span></div>`,
				{ className: 'poi-popup', closeButton: true, autoPanPaddingTopLeft: [24, 64], autoPanPaddingBottomRight: [70, 300], maxWidth: 240 }
			);
			dot.on('click', () => selectPoi(s.mile));
			dot.addTo(shelterLayer);
		}
	});

	// Corridor POI pins (only when zoomed in), filtered by the legend. Tap → select
	// it as the measured spot (distance + climb/descent light up the card and the
	// trail) AND open a popup naming it, with the elevation change to get there.
	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
	// The bind-time popup body is a reactive-free SHELL: just the root with data-poi-*
	// and the name. It reads nothing reactive (no distance/elev/store), so the marker
	// effect can't depend on the current mile or the water store — and therefore never
	// recreates the marker (closing an open popup) on a position tick or a report.
	function poiPopupShell(lm: Landmark): string {
		const name = escapeHtml(lm.label);
		return (
			`<div class="poi-pop pop-${lm.kind}" data-poi-kind="${lm.kind}" data-poi-mile="${lm.mile}" ` +
			`data-poi-name="${name}" data-poi-rel="${lm.reliability ?? ''}">` +
			`<strong class="pp-name">${name}</strong></div>`
		);
	}
	// The reported-state detail span for a water source (or the dataset default).
	function waterDetailHtml(mile: number, reliability?: WaterReliability): string {
		const rep = waterReports.latestForBucket(waterBucket(mile));
		if (rep)
			return `<span class="pp-water-state age-${ageBucket(rep.observedAt)}">${WATER_STATUS_WORD[rep.status]}</span> · ${escapeHtml(waterReports.attribution(rep))} · ${relAge(rep.observedAt)}`;
		return reliability ? RELIABILITY_WORD[reliability] : 'unverified';
	}
	// Full popup body, built from FRESH state on open (and reconstructed from the
	// shell's data-poi-*). Reads distance/elevation/store — fine here because this
	// runs in event handlers, not the reactive marker effect.
	function poiPopupBody(kind: PoiKind, mile: number, label: string, reliability?: WaterReliability): string {
		const ec = elevChangeTo(mile);
		const elev = `<span class="pp-elev">↑ ${fmt(ec.gain)} ft · ↓ ${fmt(ec.loss)} ft to reach</span>`;
		if (kind !== 'water') {
			return `<strong class="pp-name">${escapeHtml(label)}</strong><span class="pp-meta">${POI_WORD[kind]} · ${distanceLabel(mile)}</span>${elev}`;
		}
		const rep = waterReports.latestForBucket(waterBucket(mile));
		const buttons = (['flowing', 'low', 'dry'] as WaterStatus[])
			.map(
				(s) =>
					`<button type="button" class="wbtn wbtn-${s}${rep?.status === s ? ' active' : ''}" data-water-set="${s}">${WATER_STATUS_WORD[s]}</button>`
			)
			.join('');
		return (
			`<strong class="pp-name">${escapeHtml(label)}</strong>` +
			`<span class="pp-meta">Water · ${distanceLabel(mile)} · ${waterDetailHtml(mile, reliability)}</span>${elev}` +
			`<div class="pp-water-report" role="group" aria-label="Report water state">${buttons}</div>`
		);
	}
	// On popupopen: fill the shell with fresh content and wire any water-report
	// buttons. Reports update the line + active button IN PLACE (no setContent →
	// no autoPan → the marker effect never re-runs, so the popup stays put).
	function renderPoiPopup(popup: LeafletNS.Popup): void {
		const root = popup.getElement()?.querySelector('.poi-pop') as HTMLElement | null;
		if (!root) return;
		const kind = (root.dataset.poiKind as PoiKind) || 'water';
		const mile = Number(root.dataset.poiMile);
		const label = root.dataset.poiName ?? '';
		const reliability = (root.dataset.poiRel as WaterReliability) || undefined;
		root.innerHTML = poiPopupBody(kind, mile, label, reliability);
		if (kind !== 'water') return;
		const bucket = waterBucket(mile);
		root.querySelectorAll<HTMLButtonElement>('[data-water-set]').forEach((btn) => {
			btn.addEventListener('click', (ev) => {
				ev.stopPropagation(); // don't bubble to the map (would drop a measure)
				const rep = waterReports.report({ bucket, mile, status: btn.dataset.waterSet as WaterStatus, name: label });
				const meta = root.querySelector('.pp-meta');
				if (meta) meta.innerHTML = `Water · ${distanceLabel(mile)} · ${waterDetailHtml(mile, reliability)}`;
				root
					.querySelectorAll<HTMLButtonElement>('.wbtn')
					.forEach((b) => b.classList.toggle('active', b.dataset.waterSet === rep.status));
				shadeWaterCoin(bucket, rep.status); // re-shade the coin in place
			});
		});
	}

	$effect(() => {
		void visibleLandmarks;
		void showPois;
		void liveZoom;
		// NOT fromQ and NOT the store: the bind content is a reactive-free shell, so
		// the markers are rebuilt only when the visible set / zoom changes — never on
		// a position tick or a water report, which would close an open popup.
		if (!L || !map || !poiLayer) return;
		poiLayer.clearLayers();
		if (!showPois) return;
		for (const lm of visibleLandmarks) {
			// Read the report state UNTRACKED for the initial shade — the marker effect
			// must not subscribe to the store (a report would recreate it + close the
			// open popup); shadeWaterCoin updates the fill in place instead.
			const water =
				lm.kind === 'water'
					? { shadeClass: untrack(() => waterShadeClass(lm.mile)), bucket: waterBucket(lm.mile) }
					: undefined;
			const marker = L.marker(interpAtMile(lm.mile), { icon: poiIcon(lm.kind, water), keyboard: false })
				.bindPopup(poiPopupShell(lm), {
					// Pan clear of the top strip, the right control stack, and the bottom card.
					className: 'poi-popup',
					closeButton: true,
					autoPanPaddingTopLeft: [24, 64],
					autoPanPaddingBottomRight: [70, 300],
					maxWidth: 240
				});
			marker.on('click', () => selectPoi(lm.mile));
			marker.addTo(poiLayer);
		}
	});

	// Keep the coin shading in sync with the reports — runs when a report lands
	// (your own OR a synced one from the tramily) and after the coins are rebuilt on
	// pan/zoom. Re-shades existing coins IN PLACE (class only), so it never recreates
	// a marker or closes an open popup.
	$effect(() => {
		void waterReports.all;
		void visibleLandmarks;
		if (typeof document === 'undefined') return;
		document.querySelectorAll<HTMLElement>('.poi-pin .pp-body[data-wbucket]').forEach((el) => {
			const rep = waterReports.latestForBucket(Number(el.dataset.wbucket));
			el.className = `pp-body water-${rep ? rep.status : 'unverified'}`;
		});
	});

	// Measurement: a draggable point you can pick up and slide along the trail.
	// The segment highlight rebuilds reactively in measureLayer; the marker is
	// persistent (created once) so a drag isn't torn down mid-gesture.
	$effect(() => {
		void measure;
		void fromQ;
		void measureFromPoi;
		if (!L || !map || !measureLayer) return;
		measureLayer.clearLayers();
		const m = measure;
		if (!m) {
			if (measureMarker) {
				measureMarker.remove();
				measureMarker = null;
			}
			return;
		}
		const a = Math.min(fromClamped, m.mile);
		const b = Math.max(fromClamped, m.mile);
		// Slice the drawn (high-res) line so the highlight hugs the same path.
		const span = (trailHi - trailLo) || 1;
		const aIdx = Math.round(((a - trailLo) / span) * (routeCount - 1));
		const bIdx = Math.round(((b - trailLo) / span) * (routeCount - 1));
		const seg = routeSource.slice(Math.max(0, Math.min(aIdx, bIdx)), Math.max(aIdx, bIdx) + 1);
		if (seg.length >= 2) {
			L.polyline(seg, {
				weight: 5.5,
				opacity: 0.96,
				lineCap: 'round',
				lineJoin: 'round',
				interactive: false,
				// Render into the dedicated high pane so a corridor redraw on zoom
				// can't paint over the highlight.
				renderer: measureRenderer ?? undefined,
				className: 'rt rt-measure'
			}).addTo(measureLayer);
		}
		// A POI selection already shows its own coin + popup, so skip the draggable
		// measure dot (it would cover the category icon) — just the highlight + card.
		if (measureFromPoi) {
			if (measureMarker) {
				measureMarker.remove();
				measureMarker = null;
			}
			return;
		}
		const dir = m.ahead ? 'ahead' : 'back';
		const html = `<span class="mz-line"><b>${m.dist.toFixed(1)} mi</b> ${dir}</span><span class="mz-sub">↑ ${fmt(m.gain)} ft · ↓ ${fmt(m.loss)} ft · mi ${m.mile.toFixed(1)}</span>`;
		const ll = interpAtMile(m.mile);
		if (!measureMarker) {
			measureDragging = false;
			measureMarker = L.marker(ll, {
				icon: L.divIcon({
					className: 'measure-leaf',
					iconSize: [30, 30],
					iconAnchor: [15, 15],
					html: '<span class="mz-ring"></span><span class="mz-dot"></span>'
				}),
				draggable: true,
				autoPan: false,
				bubblingMouseEvents: false,
				zIndexOffset: 1300
			})
				// 'auto' flips the callout left when the point sits on the right edge
				// (e.g. under the zoom stack), so the chrome never occludes it.
				.bindTooltip(html, { permanent: true, direction: 'auto', offset: [0, 0], className: 'map-tip measure-tip' })
				.addTo(map);
			measureMarker.on('dragstart', () => {
				measureDragging = true;
			});
			measureMarker.on('drag', (e) => {
				const p = (e.target as LeafletNS.Marker).getLatLng();
				// Fine snap (no tolerance) — the point rides the high-res line
				// smoothly instead of stepping mile to mile.
				const snapped = snapMeasureToTrail(p.lat, p.lng, Number.POSITIVE_INFINITY);
				if (snapped != null) measureMile = snapped;
			});
			measureMarker.on('dragend', () => {
				measureDragging = false;
				if (measureMile != null) measureMarker?.setLatLng(interpAtMile(clamp(measureMile, trailLo, trailHi)));
			});
		} else {
			measureMarker.setTooltipContent(html);
			if (!measureDragging) measureMarker.setLatLng(ll);
		}
	});

	// Endpoint markers + permanent labels (shown in overview via CSS).
	$effect(() => {
		void latlngs;
		if (!L || !map || !endpointLayer || latlngs.length < 2) return;
		endpointLayer.clearLayers();
		const ep = (ll: [number, number], label: string, dir: 'top' | 'bottom') =>
			L!
				.circleMarker(ll, { radius: 5.5, weight: 2.5, color: '#fffdf8', fillColor: '#2f4b35', fillOpacity: 1, className: 'ep-mark', interactive: false })
				.bindTooltip(`<span class="tip-rot">${label}</span>`, {
					permanent: true,
					direction: dir,
					offset: [0, dir === 'top' ? -5 : 5],
					className: 'map-tip ov-tip'
				})
				.addTo(endpointLayer!);
		ep(latlngs[0], 'Springer · GA', 'bottom');
		ep(latlngs[latlngs.length - 1], 'Katahdin · ME', 'top');
	});

	// Head-up: Leaflet 1.x has no native rotation, so rotate the host + counter-rotate labels.
	$effect(() => {
		if (!host || !map) return;
		const rot = headUp ? -bearing : 0;
		host.style.setProperty('--maprot', `${-rot}deg`);
		host.style.transform = headUp ? `rotate(${rot}deg)` : '';
		host.classList.toggle('head-up', headUp);
		const t = setTimeout(() => map?.invalidateSize(false), 90);
		return () => clearTimeout(t);
	});

	// Re-fit / resize when the tab is shown or the container resizes.
	$effect(() => {
		if (!host || !map) return;
		const io = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) {
				map?.invalidateSize();
				if (!userInteracted) {
					if (mapZoom === OVERVIEW) fitWholeTrail(false);
					else flyToCorridor(viewFocusMile, mapZoom as number, false);
				}
			}
		});
		io.observe(host);
		let raf = 0;
		const ro = new ResizeObserver(() => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => map?.invalidateSize());
		});
		ro.observe(host);
		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<div class="map-screen">
	<div class="map-paper" aria-hidden="true"></div>
	<div class="leaflet-host" bind:this={host}></div>
	<div class="map-scrim" aria-hidden="true"></div>

	<!-- Top status strip: Family selector + Next water, one left-aligned row -->
	<div class="map-top">
		<!-- Group selector (Life360-style) — opens the people sheet -->
		<button class="map-group" type="button" onclick={() => people.openSheet()} aria-haspopup="dialog">
			<span class="mg-glyph" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24">
					<circle cx="9" cy="8" r="3.2" fill="currentColor" />
					<circle cx="16.5" cy="9.5" r="2.4" fill="currentColor" opacity="0.7" />
					<path d="M3 19c0-3 2.7-5 6-5s6 2 6 5z" fill="currentColor" />
					<path d="M14.5 19c0-2 1.4-3.6 3.6-3.6S21.5 17 21.5 19z" fill="currentColor" opacity="0.7" />
				</svg>
			</span>
			<span class="mg-name">{people.activeGroup.name}</span>
			<span class="mg-caret" aria-hidden="true">▾</span>
		</button>

		{#if nextWater}
			<span class="next-water-chip">
				<span class="wglyph"><Icon name="water" size={14} stroke={2} /></span>
				<span class="nw-text">Next water <strong>{nextWater.dist.toFixed(1)} mi</strong></span>
				{#if nextWater.candidate}<span class="cand-tag" title="Candidate water source — verify on arrival" aria-label="candidate water source">?</span>{/if}
			</span>
		{/if}
	</div>

	<!-- Top-right controls: orientation (rose) · whole-trail · recenter · drop-note.
	     Zoom is pinch (the map opens at 10 mi). -->
	<div class="map-tools">
		<button class="tool-btn orient-btn" class:head={headUp} type="button" onclick={() => (headUp = !headUp)} aria-label={headUp ? 'Heading up — switch to north up' : 'North up — switch to heading up'} aria-pressed={headUp}>
			<svg class="rose" width="22" height="22" viewBox="0 0 24 24" style="transform: rotate({headUp ? -bearing : 0}deg)" aria-hidden="true">
				<path d="M12 2 L15 12 L12 10 L9 12 Z" fill="var(--danger)" />
				<path d="M12 22 L9 12 L12 14 L15 12 Z" fill="var(--muted)" />
			</svg>
		</button>
		<button
			class="tool-btn overview"
			class:on={isOverview}
			onclick={() => (isOverview ? setZoom(10) : setZoom(OVERVIEW))}
			aria-label={isOverview ? 'Back to my corridor' : 'Whole trail'}
			aria-pressed={isOverview}
		>
			<Icon name="map" size={18} stroke={2} />
		</button>
		<button class="tool-btn recenter" onclick={recenter} aria-label="Recenter on current mile">
			<Icon name="now" size={20} stroke={2} />
		</button>
		<!-- Drop a note at the current location. -->
		<TrailPulseReportAction variant="fab" />
	</div>

	<!-- Orientation + elevation card -->
	<div class="elev">
		<div class="orient">
			{#if measure}
				<button class="orient-back measuring" onclick={clearMeasure} aria-label="Clear measurement">✕ Clear</button>
				<span class="orient-range">{rangeLabel}</span>
			{:else}
				{#if !isOverview}
					<button class="orient-back" onclick={() => setZoom(OVERVIEW)} aria-label="Back to whole trail">‹ Whole trail</button>
				{/if}
				<span class="orient-range">{rangeLabel}</span>
				<span class="orient-progress">{progressLabel}</span>
				<span class="measure-hint">tap or drag the trail to measure</span>
			{/if}
			<span class="basemap-tag" data-state={basemapState.dot}>
				<span class="bm-dot"></span>{basemapState.text}
			</span>
		</div>

		<div class="etop">
			<span class="etitle">{elevTitle}</span>
			<div class="updown">
				<span class="up">↑ +{fmt(measure ? measure.gain : elev.gain)} ft</span>
				<span class="down">↓ −{fmt(measure ? measure.loss : elev.loss)} ft</span>
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
				{#if elev.fillD}<path class="efill" d={elev.fillD} />{/if}
				{#each elev.segments as seg, i (i)}
					<path class="eline b{seg.band}" d={seg.d} />
				{/each}
			</svg>
		</div>

		{#if showPois}
			<div class="poi-legend" role="group" aria-label="Points of interest — tap to filter">
				{#each ['water', 'shelter', 'town'] as const as k (k)}
					<button
						type="button"
						class="poi-key {k}"
						class:off={!poiFilter.has(k)}
						aria-pressed={poiFilter.has(k)}
						onclick={() => togglePoi(k)}
					>
						<Icon name={k} size={13} stroke={2} />
						<span>{POI_WORD[k]}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if !elev.empty}
			<div class="band-legend" aria-label="Difficulty key">
				<span><i class="b0"></i>Gentle</span>
				<span><i class="b1"></i>Moderate</span>
				<span><i class="b2"></i>Steep</span>
			</div>
		{/if}
	</div>

	<PeopleSheet />
</div>

<style>
	.map-screen {
		position: relative;
		height: 100%;
		/* The parent <main> drops its padding for Map (.flush-screen), so the map
		   fills the whole middle row flush to header and nav — no dead strip. */
		overflow: hidden;
		background: var(--bg-deep);
	}

	/* offline ground — a warm topo field the route always reads on when tiles fail */
	.map-paper {
		position: absolute;
		inset: 0;
		z-index: 0;
		background:
			radial-gradient(120% 80% at 16% 6%, rgba(255, 255, 255, 0.28), transparent 46%),
			radial-gradient(120% 82% at 95% 103%, rgba(45, 60, 42, 0.16), transparent 55%),
			linear-gradient(180deg, var(--bg) 0%, var(--bg-deep) 100%);
	}

	.leaflet-host {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	/* subtle edge vignette; stronger in dark to calm the bright topo tiles */
	.map-scrim {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
		background: radial-gradient(125% 90% at 50% 0%, transparent 58%, rgba(31, 36, 29, 0.06));
	}

	:global(.leaflet-host .leaflet-container) {
		background: transparent;
		font-family: var(--font-sans);
		outline: none;
	}

	/* route — CSS-var strokes so dark mode recolors for free (SVG renderer) */
	:global(.rt) {
		fill: none;
	}
	:global(.rt-halo) {
		stroke: #fffdf8;
	}
	:global(.rt-done) {
		stroke: var(--forest);
	}
	:global(.rt-remain) {
		stroke: var(--muted);
	}
	:global(.rt-band.b0) {
		stroke: #2f8a4e;
	}
	:global(.rt-band.b1) {
		stroke: #d98b0a;
	}
	:global(.rt-band.b2) {
		stroke: #b23a1e;
	}
	:global(.poi-water) {
		fill: var(--sky);
	}
	:global(.poi-shelter) {
		fill: var(--moss);
	}
	:global(.poi-town) {
		fill: var(--clay);
	}
	:global(.ep-mark) {
		fill: var(--forest);
	}

	/* Category POI coin — a category-coloured disc with a --surface-strong ring and
	   the glyph centred (cream in light, near-black in dark for contrast on either
	   theme). A neutral circle, sized + ringed + iconed so it never reads as a bare
	   trail dot. */
	:global(.poi-pin) {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
	}
	/* Generous invisible tap pad — a finger shouldn't have to hit the 26px coin
	   dead-centre to select it. */
	:global(.poi-pin::before) {
		content: '';
		position: absolute;
		inset: -10px;
		border-radius: 50%;
	}
	:global(.poi-pin .pp-body) {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		/* --shade-alpha (water only) fades the FILL by reliability; the ring + glyph
		   stay solid so the coin is always legible/tappable. Non-water = solid. */
		background: color-mix(in srgb, var(--pin-fill) var(--shade-alpha, 100%), transparent);
		border: 2px solid var(--surface-strong);
		transition: background 0.2s ease;
	}
	/* Water reliability shading: unverified is faint, filling to opaque as a hiker
	   confirms it flowing; dry is the faintest (no water to rely on). */
	:global(.poi-pin .pp-body.water-flowing) {
		--shade-alpha: 100%;
	}
	:global(.poi-pin .pp-body.water-low) {
		--shade-alpha: 62%;
	}
	:global(.poi-pin .pp-body.water-unverified) {
		--shade-alpha: 42%;
	}
	:global(.poi-pin .pp-body.water-dry) {
		--shade-alpha: 24%;
	}
	:global(.poi-pin .pp-glyph) {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60%;
		height: 60%;
		/* counter-rotate the glyph in head-up mode so it stays upright */
		transform: translate(-50%, -50%) rotate(var(--maprot, 0deg));
		fill: none;
		stroke: var(--surface-strong);
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
		pointer-events: none;
	}
	:global(.poi-pin.pin-water) {
		--pin-fill: var(--sky);
	}
	:global(.poi-pin.pin-shelter) {
		--pin-fill: var(--moss);
	}
	:global(.poi-pin.pin-town) {
		--pin-fill: var(--clay);
	}

	/* measurement: bright gold highlight on the from→tapped segment + a pin */
	:global(.rt-measure) {
		stroke: #f0c24a;
		filter: drop-shadow(0 0 3px rgba(240, 194, 74, 0.55));
	}
	:global(.measure-leaf) {
		display: grid;
		place-items: center;
		cursor: grab;
	}
	:global(.measure-leaf.leaflet-drag-target),
	:global(.leaflet-dragging .measure-leaf) {
		cursor: grabbing;
	}
	:global(.measure-leaf .mz-dot) {
		position: absolute;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: #f0c24a;
		border: 3px solid #fffdf8;
		box-shadow: 0 0 0 2px rgba(240, 194, 74, 0.45), 0 2px 7px rgba(0, 0, 0, 0.35);
	}
	:global(.measure-leaf .mz-ring) {
		position: absolute;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: color-mix(in srgb, #f0c24a 45%, transparent);
		animation: youPulse 2.4s ease-out infinite;
		will-change: transform, opacity;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.measure-leaf .mz-ring) {
			animation: none;
			opacity: 0;
		}
	}

	/* you-marker: layered pulse + dot, animation survives GPS updates */
	:global(.you-leaf) {
		display: grid;
		place-items: center;
	}
	:global(.you-leaf .yl-dot) {
		position: absolute;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--forest);
		border: 3px solid #fffdf8;
		box-shadow: 0 0 0 3px rgba(47, 75, 53, 0.35), 0 2px 6px rgba(0, 0, 0, 0.3);
	}
	/* Life360-style avatar: trail-name initial in a forest ring. */
	:global(.you-leaf .yl-avatar) {
		position: absolute;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: linear-gradient(135deg, var(--forest), #3a5f43);
		border: 2.5px solid #fffdf8;
		box-shadow: 0 0 0 2px rgba(47, 75, 53, 0.3), 0 3px 8px rgba(0, 0, 0, 0.4);
		color: #f4efe4;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.95rem;
		line-height: 1;
	}
	/* Live co-member avatar — clay ring so family/tramily read distinctly from the
	   forest "you", no pulse (only your own dot pulses). */
	:global(.member-leaf .ml-avatar) {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--clay), #8f4f33);
		border: 2.5px solid #fffdf8;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
		color: #fff;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.92rem;
		line-height: 1;
	}
	@media (prefers-color-scheme: dark) {
		:global(.member-leaf .ml-avatar) {
			border-color: #1b2117;
		}
	}
	@media (prefers-color-scheme: dark) {
		:global(.you-leaf .yl-avatar) {
			border-color: #1b2117;
			background: linear-gradient(135deg, #98c48e, #7fad78);
			color: #10160f;
		}
	}
	:global(.you-leaf .yl-pulse) {
		position: absolute;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--forest) 45%, transparent);
		animation: youPulse 2.4s ease-out infinite;
		will-change: transform, opacity;
	}
	@keyframes youPulse {
		0% {
			transform: scale(1);
			opacity: 0.5;
		}
		70%,
		100% {
			transform: scale(3.4);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.you-leaf .yl-pulse) {
			animation: none;
			opacity: 0;
		}
	}

	/* tooltips as paper pills */
	:global(.leaflet-tooltip.map-tip) {
		background: rgba(255, 253, 248, 0.96);
		border: 1px solid var(--line);
		color: var(--ink);
		font-weight: 900;
		font-size: 0.66rem;
		letter-spacing: 0.01em;
		box-shadow: var(--shadow-soft);
		border-radius: 7px;
		padding: 2px 7px;
		white-space: nowrap;
	}
	:global(.leaflet-tooltip.map-tip::before) {
		display: none;
	}
	:global(.leaflet-tooltip.you-tip),
	:global(.leaflet-tooltip.ov-tip) {
		background: var(--forest);
		color: #f4efe4;
		border-color: var(--forest);
	}
	:global(.leaflet-tooltip.ov-tip) {
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.62rem;
	}
	:global(.tip-rot) {
		display: inline-block;
		transform: rotate(var(--maprot, 0deg));
	}
	/* measurement callout: a two-line gold-edged bubble at the tapped point */
	:global(.leaflet-tooltip.measure-tip) {
		text-align: center;
		padding: 4px 9px;
		border-color: #e2af3c;
		box-shadow: var(--shadow);
	}
	:global(.leaflet-tooltip.measure-tip .mz-line) {
		display: block;
		font-size: 0.72rem;
		color: var(--ink);
	}
	:global(.leaflet-tooltip.measure-tip .mz-line b) {
		color: #a9790f;
	}
	:global(.leaflet-tooltip.measure-tip .mz-sub) {
		display: block;
		font-size: 0.6rem;
		font-weight: 800;
		color: var(--muted);
		margin-top: 1px;
	}
	/* POI selection popup — click-to-open and it stays put (a selection, not a
	   hover hint). Name first, then category · distance. Mode-aware via tokens. */
	:global(.leaflet-popup.poi-popup .leaflet-popup-content-wrapper) {
		background: var(--surface-strong);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 12px;
		box-shadow: var(--shadow);
		/* counter-rotate so the bubble stays upright in head-up mode */
		transform: rotate(var(--maprot, 0deg));
	}
	:global(.leaflet-popup.poi-popup .leaflet-popup-content) {
		margin: 8px 12px;
	}
	:global(.leaflet-popup.poi-popup .leaflet-popup-tip) {
		background: var(--surface-strong);
		border: 1px solid var(--line);
		box-shadow: none;
	}
	:global(.poi-pop .pp-name) {
		display: block;
		font-size: 0.92rem;
		font-weight: 900;
		color: var(--ink);
		line-height: 1.18;
	}
	:global(.poi-pop .pp-meta) {
		display: block;
		margin-top: 2px;
		font-size: 0.68rem;
		font-weight: 800;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	/* climb/descent to reach the POI — echoes the measure card's gold accent */
	:global(.poi-pop .pp-elev) {
		display: block;
		margin-top: 5px;
		padding-top: 5px;
		border-top: 1px solid var(--line);
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--ink);
	}
	/* Reported water state in the detail line — fresh reads confident, then ages to
	   warn, then muted, so old reports visibly carry less weight. */
	:global(.poi-pop .pp-water-state) {
		font-weight: 900;
	}
	:global(.poi-pop .pp-water-state.age-fresh) {
		color: var(--ink);
	}
	:global(.poi-pop .pp-water-state.age-aging) {
		color: var(--warn);
	}
	:global(.poi-pop .pp-water-state.age-stale) {
		color: var(--muted);
	}
	/* One-tap report row: Flowing / Low / Dry. */
	:global(.poi-pop .pp-water-report) {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}
	:global(.poi-pop .wbtn) {
		flex: 1;
		min-height: 38px;
		padding: 4px 6px;
		border-radius: 9px;
		border: 1.5px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.72rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background var(--dur-fast, 0.12s) ease,
			transform var(--dur-fast, 0.12s) ease;
	}
	:global(.poi-pop .wbtn:active) {
		transform: scale(0.96);
	}
	:global(.poi-pop .wbtn.active) {
		background: var(--forest);
		border-color: var(--forest);
		color: var(--on-accent);
	}
	:global(.leaflet-popup.poi-popup a.leaflet-popup-close-button) {
		color: var(--muted);
		font-weight: 700;
		width: 24px;
		height: 24px;
		font-size: 19px;
		padding: 3px 0 0;
	}
	:global(.leaflet-popup.poi-popup a.leaflet-popup-close-button:hover) {
		color: var(--ink);
	}
	/* zoom-gated labels: hide POIs in overview, endpoints in corridor */
	:global(.z-overview .leaflet-tooltip.poi-tip),
	:global(.z-overview .leaflet-tooltip.you-tip) {
		display: none;
	}
	:global(.leaflet-host:not(.z-overview) .leaflet-tooltip.ov-tip) {
		display: none;
	}

	/* head-up: overscan the container so rotation never bares a corner */
	:global(.leaflet-host.head-up) {
		width: 160%;
		height: 160%;
		inset: -30%;
	}

	@media (prefers-color-scheme: dark) {
		:global(.otm-tiles) {
			filter: brightness(0.72) saturate(0.8) contrast(1.06) hue-rotate(-6deg);
		}
		.map-scrim {
			background: radial-gradient(125% 90% at 50% 0%, transparent 40%, rgba(0, 0, 0, 0.28));
		}
		:global(.rt-halo) {
			stroke: #10160f;
		}
		:global(.leaflet-tooltip.map-tip) {
			background: rgba(22, 29, 20, 0.95);
			color: var(--ink);
		}
		:global(.you-tip),
		:global(.ov-tip) {
			color: #10160f;
		}
		:global(.leaflet-tooltip.measure-tip .mz-line b) {
			color: #f0c24a;
		}
	}

	/* ---- chrome (floats over the map) -------------------------------------- */
	/* Life360-style group selector, centered up top. */
	.map-group {
		flex: 0 0 auto; /* primary control — never shrinks, name stays readable */
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 36px; /* match the chip so the strip reads as one unit */
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--surface-strong);
		border: 1px solid var(--line);
		box-shadow: var(--shadow-soft);
		color: var(--forest);
		font-weight: 800;
		font-size: 0.86rem;
	}
	.mg-glyph {
		display: inline-flex;
	}
	.mg-name {
		color: var(--ink);
		max-width: 10rem; /* guard against a pathologically long future group name */
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mg-caret {
		font-size: 0.7rem;
		color: var(--muted);
	}

	.map-top {
		position: absolute;
		top: max(12px, env(safe-area-inset-top)); /* promoted to the top band */
		left: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
		z-index: 6;
		pointer-events: none;
	}
	.map-top > * {
		pointer-events: auto;
	}
	.next-water-chip {
		flex: 0 1 auto; /* yields before the row can overflow */
		min-width: 0; /* lets .nw-text actually ellipsis under pressure */
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 36px;
		padding: 7px 12px;
		border-radius: 999px;
		background: var(--surface-strong);
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
	/* Candidate (unconfirmed) water → a compact disc, not a 76px word badge. A
	   single glyph can never mid-word-ellipsis; full meaning lives in title +
	   aria-label. */
	.cand-tag {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		font-size: 0.66rem;
		font-weight: 900;
		line-height: 1;
		color: var(--clay);
		background: var(--clay-soft);
		border-radius: 50%;
	}
	/* The rose now lives in the .map-tools stack as a .tool-btn — it only needs
	   its active tint and the rotation transition; the 44px circle/surface/border
	   come from .tool-btn. */
	.orient-btn.head {
		border-color: var(--forest);
		background: var(--forest-soft);
	}
	.orient-btn .rose {
		transition: transform 0.4s ease;
	}

	/* Controls live in the top-right corner — a short, solid stack (globe ·
	   recenter · drop-note), never floating out toward the middle. Zoom is pinch
	   now (the map opens at 10 mi). */
	.map-tools {
		position: absolute;
		right: 12px;
		top: max(58px, calc(env(safe-area-inset-top) + 46px)); /* tuck under the strip */
		z-index: 5;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 9px;
	}
	.tool-btn {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--surface-strong);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		color: var(--forest);
	}
	.tool-btn.overview.on {
		background: var(--forest-soft);
		border-color: var(--forest);
		color: var(--forest);
	}
	.tool-btn.recenter {
		color: var(--forest);
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
	.orient-progress {
		color: var(--forest);
	}
	.orient-back.measuring {
		background: rgba(240, 194, 74, 0.18);
		color: #a9790f;
	}
	@media (prefers-color-scheme: dark) {
		.orient-back.measuring {
			color: #f0c24a;
		}
	}
	.measure-hint {
		color: var(--muted);
		font-weight: 700;
		text-transform: none;
		letter-spacing: 0;
		font-size: 0.62rem;
		opacity: 0.85;
	}
	.basemap-tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-left: auto;
		color: var(--muted);
		font-weight: 800;
		letter-spacing: 0.02em;
		text-transform: none;
	}
	.bm-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--muted);
	}
	.basemap-tag[data-state='live'] .bm-dot {
		background: var(--success);
		box-shadow: 0 0 0 3px rgba(47, 106, 71, 0.18);
	}
	.basemap-tag[data-state='partial'] .bm-dot {
		background: var(--warn);
	}
	.basemap-tag[data-state='off'] .bm-dot {
		background: var(--clay);
	}
	.etop {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}
	.etitle {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.09em;
		color: var(--muted);
	}
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
	.elev .efill {
		fill: url(#elevfill);
		stroke: none;
	}
	.elev .eline {
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.elev .eline.b0 {
		stroke: #2f8a4e;
	}
	.elev .eline.b1 {
		stroke: #d98b0a;
	}
	.elev .eline.b2 {
		stroke: #b23a1e;
	}
	/* POI key — also the category filter. Each chip's tint matches its pin colour,
	   so the legend teaches the code. Tap to show/hide a category. */
	.poi-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
	}
	.poi-key {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-height: 30px;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border: 1.5px solid transparent;
		background: var(--bg);
		color: var(--ink);
		transition:
			opacity var(--dur-fast, 0.12s) ease,
			transform var(--dur-fast, 0.12s) ease;
	}
	.poi-key.water {
		background: var(--sky-soft);
		border-color: color-mix(in srgb, var(--sky) 55%, transparent);
		color: var(--sky);
	}
	.poi-key.shelter {
		background: var(--moss-soft);
		border-color: color-mix(in srgb, var(--moss) 55%, transparent);
		color: var(--moss);
	}
	.poi-key.town {
		background: var(--clay-soft);
		border-color: color-mix(in srgb, var(--clay) 55%, transparent);
		color: var(--clay);
	}
	.poi-key.off {
		background: var(--bg);
		border-color: var(--line);
		color: var(--muted);
		opacity: 0.5;
	}
	.poi-key:active {
		transform: scale(0.97);
	}

	.band-legend {
		display: flex;
		gap: 14px;
		margin-top: 8px;
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}
	.band-legend span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.band-legend i {
		width: 12px;
		height: 3px;
		border-radius: 2px;
	}
	.band-legend i.b0 {
		background: #2f8a4e;
	}
	.band-legend i.b1 {
		background: #d98b0a;
	}
	.band-legend i.b2 {
		background: #b23a1e;
	}

	/* Dark mode: float the chrome on dark surfaces (placed after the base chrome
	   rules so it wins) — their token-colored text was washing out on cream. */
	@media (prefers-color-scheme: dark) {
		/* Solid dark chrome — one consistent surface, crisp on any terrain. The
		   strip pills (.map-group / .next-water-chip) use --surface-strong, so they
		   pick up dark automatically; the rose is now a .tool-btn below. */
		.tool-btn {
			background: var(--surface-strong);
			border-color: var(--line);
			color: var(--forest);
		}
		.tool-btn.overview.on {
			background: var(--forest-soft);
			border-color: var(--forest);
			color: var(--forest);
		}
	}
</style>
