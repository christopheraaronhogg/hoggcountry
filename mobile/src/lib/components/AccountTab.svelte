<script lang="ts">
</script>

<div class="tab-content">
	<section class="profile card gradient-bg">
		<div class="avatar">CH</div>
		<div class="profile-info">
			<h2>Chris "Hogg"</h2>
			<span class="trail-name">Class of 2026 · NOBO</span>
		</div>
	</section>

	<div class="settings-group">
		<h3>Trail Log</h3>
		<div class="card">
			<div class="setting-item">
				<span>Auto-log mileage</span>
				<span class="value">Enabled</span>
			</div>
			<div class="setting-item">
				<span>Water source alerts</span>
				<span class="value">On</span>
			</div>
			<div class="setting-item">
				<span>Battery Saver Mode</span>
				<span class="value">Off</span>
			</div>
		</div>
	</div>

	<div class="settings-group">
		<h3>Data & Offline</h3>
		<div class="card">
			<div class="setting-item">
				<span>Download Map Region</span>
				<span class="action">VA - Southern</span>
			</div>
			<div class="setting-item">
				<span>Clear Cache</span>
				<span class="value">1.2 GB</span>
			</div>
		</div>
	</div>

	<button class="logout-btn">Sign Out</button>
</div>

<style>
	.tab-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding-bottom: 100px;
	}

	.profile {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
	}

	.avatar {
		width: 60px;
		height: 60px;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-weight: 900;
		border: 4px solid white;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.profile-info h2 { font-size: 20px; }
	.trail-name { font-size: 13px; color: var(--color-text-muted); font-weight: 600; }

	.settings-group h3 {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		margin-bottom: 8px;
		padding-left: 4px;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		padding: 12px 0;
		font-size: 14px;
		font-weight: 600;
	}

	.setting-item:not(:last-child) { border-bottom: 1px solid var(--color-border); }

	.value { color: var(--color-text-muted); }
	.action { color: var(--color-primary); }

	.logout-btn {
		margin-top: 10px;
		color: var(--color-danger);
		font-weight: 700;
		font-size: 14px;
		text-align: center;
		width: 100%;
		padding: 12px;
		background: white;
		border: 1px solid #fdedec;
		border-radius: 12px;
	}
</style>
