<script lang="ts">
	const days = [
		{ day: 'Wed', date: 'Mar 11', miles: 15.5, gain: '+2,100', destination: 'Chestnut Knob' },
		{ day: 'Thu', date: 'Mar 12', miles: 14.2, gain: '+1,450', destination: 'Walker Gap' },
		{ day: 'Fri', date: 'Mar 13', miles: 12.8, gain: '+3,200', destination: 'Burkes Garden' },
		{ day: 'Sat', date: 'Mar 14', miles: 8.5, gain: '+400', destination: 'Bland (Town)' },
		{ day: 'Sun', date: 'Mar 15', miles: 0, gain: '0', destination: 'Zero Day' },
		{ day: 'Mon', date: 'Mar 16', miles: 16.0, gain: '+1,800', destination: 'Jenny Knob' },
		{ day: 'Tue', date: 'Mar 17', miles: 14.5, gain: '+2,400', destination: 'Helveys Mill' }
	];
</script>

<div class="tab-content">
	<header class="section-header">
		<h2>7-Day Itinerary</h2>
		<p>Adjusting for your current pace of 2.1 mph.</p>
	</header>

	<div class="itinerary-list">
		{#each days as day}
			<div class="day-card card {day.miles === 0 ? 'zero' : ''}">
				<div class="day-info">
					<span class="day-name">{day.day}</span>
					<span class="day-date">{day.date}</span>
				</div>
				<div class="day-main">
					<span class="dest">{day.destination}</span>
					<div class="day-stats">
						<span class="stat">{day.miles} mi</span>
						{#if day.miles > 0}
							<span class="divider">·</span>
							<span class="stat gain">{day.gain} ft</span>
						{/if}
					</div>
				</div>
				{#if day.miles > 15}
					<span class="warning-tag">Big Day</span>
				{/if}
			</div>
		{/each}
	</div>
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

	.itinerary-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.day-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 14px;
	}

	.day-card.zero {
		background: var(--color-secondary-soft);
		border-color: var(--color-secondary);
	}

	.day-info {
		display: flex;
		flex-direction: column;
		min-width: 40px;
	}

	.day-name {
		font-size: 14px;
		font-weight: 800;
		color: var(--color-text);
	}

	.day-date {
		font-size: 10px;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.day-main {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.dest {
		font-size: 15px;
		font-weight: 700;
	}

	.day-stats {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.gain {
		color: var(--color-primary);
	}

	.divider {
		color: var(--color-border);
	}

	.warning-tag {
		font-size: 9px;
		font-weight: 800;
		background: #fff4e5;
		color: #d35400;
		padding: 2px 6px;
		border-radius: 4px;
		text-transform: uppercase;
	}
</style>
