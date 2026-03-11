<script lang="ts">
	const services = [
		{ name: 'Bland Post Office', type: 'Resupply', dist: '0.2 mi off trail', status: 'Closes 4:30 PM' },
		{ name: 'Big Walker Motel', type: 'Lodging', dist: '0.5 mi off trail', status: 'Laundry available' },
		{ name: 'NAPA Auto Parts', type: 'Gear/Fuel', dist: '0.8 mi off trail', status: 'Isobutane in stock' },
		{ name: 'Library', type: 'WiFi/Power', dist: '0.3 mi off trail', status: 'Free coffee' }
	];
</script>

<div class="tab-content">
	<header class="section-header">
		<h2>Upcoming: Bland, VA</h2>
		<p>Estimated Arrival: Saturday, Mar 14 (Mile 590)</p>
	</header>

	<div class="service-list">
		{#each services as service}
			<div class="service-card card">
				<div class="service-top">
					<span class="badge {service.type === 'Resupply' ? 'badge-orange' : 'badge-green'}">{service.type}</span>
					<span class="dist">{service.dist}</span>
				</div>
				<span class="name">{service.name}</span>
				<span class="status">{service.status}</span>
			</div>
		{/each}
	</div>

	<section class="hitch card gradient-bg">
		<h3>Hitch Options</h3>
		<p>US-52 crossing. Moderate traffic on weekends. Best hitch point is the parking lot near the bridge.</p>
		<button class="call-shuttle">View Local Shuttles</button>
	</section>
</div>

<style>
	.tab-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-bottom: 100px;
	}

	.section-header h2 {
		font-size: 20px;
		margin-bottom: 4px;
	}

	.section-header p {
		font-size: 13px;
		color: var(--color-text-muted);
		margin: 0;
	}

	.service-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.service-card {
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.service-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dist {
		font-size: 11px;
		color: var(--color-text-muted);
		font-weight: 700;
	}

	.name {
		font-size: 16px;
		font-weight: 700;
	}

	.status {
		font-size: 12px;
		color: var(--color-secondary);
		font-weight: 600;
	}

	.hitch h3 {
		font-size: 14px;
		margin-bottom: 8px;
	}

	.hitch p {
		font-size: 13px;
		color: var(--color-text-muted);
		margin-bottom: 12px;
	}

	.call-shuttle {
		width: 100%;
		padding: 10px;
		background: var(--color-text);
		color: white;
		border-radius: 8px;
		font-weight: 700;
		font-size: 13px;
	}
</style>
