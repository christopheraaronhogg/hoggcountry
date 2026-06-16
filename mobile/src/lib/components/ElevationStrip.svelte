<script lang="ts">
	import type { ElevationPoint } from './cockpitData';
	import { elevationNext20 } from './cockpitData';

	let {
		points = elevationNext20,
		currentMile,
		height = 96
	}: { points?: ElevationPoint[]; currentMile: number; height?: number } = $props();

	const viewWidth = 600;
	const viewHeight = $derived(height);
	const padding = { top: 8, right: 6, bottom: 18, left: 6 };

	const minMile = $derived(points[0]?.mile ?? 0);
	const maxMile = $derived(points[points.length - 1]?.mile ?? 1);
	const minElev = $derived(Math.min(...points.map((p) => p.elevation)));
	const maxElev = $derived(Math.max(...points.map((p) => p.elevation)));

	function scaleX(mile: number): number {
		if (maxMile === minMile) return padding.left;
		return (
			padding.left +
			((mile - minMile) / (maxMile - minMile)) * (viewWidth - padding.left - padding.right)
		);
	}

	function scaleY(elev: number): number {
		if (maxElev === minElev) return viewHeight - padding.bottom;
		const top = padding.top;
		const bottom = viewHeight - padding.bottom;
		return bottom - ((elev - minElev) / (maxElev - minElev)) * (bottom - top);
	}

	const linePath = $derived(
		points
			.map((point, index) => {
				const x = scaleX(point.mile).toFixed(2);
				const y = scaleY(point.elevation).toFixed(2);
				return `${index === 0 ? 'M' : 'L'}${x},${y}`;
			})
			.join(' ')
	);

	const fillPath = $derived(
		`${linePath} L${scaleX(maxMile).toFixed(2)},${(viewHeight - padding.bottom).toFixed(2)} L${scaleX(
			minMile
		).toFixed(2)},${(viewHeight - padding.bottom).toFixed(2)} Z`
	);

	const totalClimb = $derived(
		points.reduce((total, point, index) => {
			if (index === 0) return total;
			const delta = point.elevation - points[index - 1].elevation;
			return delta > 0 ? total + delta : total;
		}, 0)
	);

	const totalDrop = $derived(
		points.reduce((total, point, index) => {
			if (index === 0) return total;
			const delta = points[index - 1].elevation - point.elevation;
			return delta > 0 ? total + delta : total;
		}, 0)
	);

	const labeled = $derived(points.filter((point) => point.label));
	const currentX = $derived(scaleX(currentMile));
</script>

<div class="elevation-strip">
	<div class="header">
		<div>
			<p class="eyebrow">Next 20 mi</p>
			<strong>Elevation profile</strong>
		</div>
		<div class="totals">
			<span>+{totalClimb.toLocaleString()} ft</span>
			<span>−{totalDrop.toLocaleString()} ft</span>
		</div>
	</div>

	<svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<linearGradient id="elev-fill" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="rgba(106, 132, 95, 0.65)" />
				<stop offset="100%" stop-color="rgba(106, 132, 95, 0)" />
			</linearGradient>
		</defs>
		<path d={fillPath} fill="url(#elev-fill)" />
		<path d={linePath} fill="none" stroke="var(--forest)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		<line
			x1={currentX}
			x2={currentX}
			y1={padding.top}
			y2={viewHeight - padding.bottom}
			stroke="var(--clay)"
			stroke-width="2"
			stroke-dasharray="3 3"
		/>
		<circle cx={currentX} cy={scaleY(points[0].elevation)} r="4.5" fill="var(--clay)" stroke="#fffdf8" stroke-width="1.6" />
	</svg>

	<div class="axis">
		{#each labeled as point (point.mile)}
			<div class="axis-label" style={`left: ${(scaleX(point.mile) / viewWidth) * 100}%`}>
				<span class="tick"></span>
				<span class="label">{point.label}</span>
				<span class="mile">{point.mile.toFixed(1)}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.elevation-strip {
		display: grid;
		gap: 8px;
	}

	.header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
	}

	.header strong {
		font-size: 0.96rem;
		font-family: var(--font-display);
	}

	.totals {
		display: flex;
		gap: 10px;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--forest);
	}

	.totals span:last-child {
		color: var(--clay);
	}

	svg {
		width: 100%;
		height: 96px;
		display: block;
		background:
			linear-gradient(180deg, rgba(255, 253, 248, 0.6), rgba(239, 231, 215, 0.5)),
			repeating-linear-gradient(
				to right,
				rgba(95, 101, 88, 0.06) 0,
				rgba(95, 101, 88, 0.06) 1px,
				transparent 1px,
				transparent 16px
			);
		border-radius: 12px;
		border: 1px solid rgba(95, 101, 88, 0.14);
	}

	.axis {
		position: relative;
		height: 24px;
	}

	.axis-label {
		position: absolute;
		transform: translateX(-50%);
		display: grid;
		justify-items: center;
		gap: 2px;
		max-width: 90px;
	}

	.tick {
		width: 1px;
		height: 6px;
		background: rgba(95, 101, 88, 0.4);
	}

	.label {
		font-size: 0.66rem;
		font-weight: 800;
		color: var(--ink);
		white-space: nowrap;
		max-width: 90px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mile {
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--muted);
		letter-spacing: 0.04em;
	}
</style>
