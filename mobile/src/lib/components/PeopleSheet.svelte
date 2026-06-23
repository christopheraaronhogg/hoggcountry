<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isDadPilot } from '$lib/scout/hike-profile';
	import {
		people,
		AVATAR_TINTS,
		personInitial,
		personStatus,
		type Person
	} from '$lib/people/people.svelte';

	// The one real on-trail position is the device hiker (Dad in pilot mode, or
	// the self-tracked user). Everyone else is "following" until live sharing lands.
	const liveHiker = $derived<Person>({
		id: 'self',
		name: isDadPilot(trailAssistant.hikeProfile)
			? 'Dad'
			: trailAssistant.hikeProfile.trailName?.trim() || 'You',
		tint: 0,
		mile: trailAssistant.currentMile,
		lastSeen: null,
		self: true
	});

	const activeMembers = $derived<Person[]>(
		people.activeGroup.id === 'family'
			? [liveHiker, ...people.activeGroup.members]
			: people.activeGroup.members
	);
	const sharingCount = $derived(activeMembers.filter((m) => m.mile != null).length);

	let newName = $state('');
	function addPerson() {
		const name = newName.trim();
		if (!name) return;
		people.addPerson(people.activeGroupId, name);
		newName = '';
	}

	function statusLine(p: Person): string {
		const s = personStatus(p);
		if (s === 'on-trail') return `On trail · mile ${(p.mile ?? 0).toFixed(1)}`;
		if (s === 'following') return 'Following · location off';
		return 'Invited · not sharing location yet';
	}
</script>

{#if people.sheetOpen}
	<div class="sheet-backdrop" role="presentation" onclick={() => people.closeSheet()}></div>
	<div class="people-sheet card" role="dialog" aria-modal="true" aria-label="Your people">
		<div class="sheet-grip" aria-hidden="true"></div>

		<div class="group-tabs" role="tablist" aria-label="Group">
			{#each people.groups as g (g.id)}
				<button
					class="group-tab"
					class:active={people.activeGroupId === g.id}
					role="tab"
					aria-selected={people.activeGroupId === g.id}
					onclick={() => people.setActiveGroup(g.id)}
				>
					{g.name}
				</button>
			{/each}
		</div>

		<p class="people-sub">
			{#if sharingCount > 0}
				{sharingCount} sharing live · approximate trail mile only
			{:else}
				No one sharing live yet — invite your {people.activeGroup.name.toLowerCase()}.
			{/if}
		</p>

		{#if activeMembers.length}
			<div class="member-list">
				{#each activeMembers as m (m.id)}
					<div class="member-row" class:live={m.mile != null}>
						<span class="member-avatar" style="--tint:{AVATAR_TINTS[m.tint % AVATAR_TINTS.length]}">
							{personInitial(m.name)}
						</span>
						<div class="member-copy">
							<strong>{m.name}{#if m.self}<span class="you-tag">you</span>{/if}</strong>
							<span>{statusLine(m)}</span>
						</div>
						{#if !m.self}
							<button
								class="member-remove"
								type="button"
								onclick={() => people.removePerson(people.activeGroupId, m.id)}
								aria-label={`Remove ${m.name}`}>✕</button
							>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="people-empty">
				Add the people hiking or following along. They'll appear on the map once they join and
				share their location.
			</p>
		{/if}

		<form
			class="add-row"
			onsubmit={(e) => {
				e.preventDefault();
				addPerson();
			}}
		>
			<input
				class="add-input"
				bind:value={newName}
				placeholder={`Add to ${people.activeGroup.name}…`}
				aria-label="New person's name"
			/>
			<button class="add-btn" type="submit" disabled={!newName.trim()}>Add</button>
		</form>

		<button class="sheet-done" type="button" onclick={() => people.closeSheet()}>Done</button>
	</div>
{/if}

<style>
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(20, 25, 18, 0.42);
		backdrop-filter: blur(2px);
	}
	.people-sheet {
		position: fixed;
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
		width: min(100vw, var(--app-width));
		z-index: 41;
		display: grid;
		gap: 12px;
		padding: 8px 16px calc(env(safe-area-inset-bottom) + 18px);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: var(--surface-strong);
		box-shadow: var(--shadow-ridge);
		animation: people-rise var(--dur-slow) var(--ease-spring) both;
	}
	@keyframes people-rise {
		from {
			transform: translate(-50%, 16px);
			opacity: 0;
		}
		to {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}
	.sheet-grip {
		width: 38px;
		height: 4px;
		border-radius: 999px;
		background: var(--line);
		margin: 0 auto 2px;
	}
	.group-tabs {
		display: grid;
		grid-auto-flow: column;
		gap: 6px;
		background: var(--ink-soft);
		border-radius: var(--radius-control);
		padding: 4px;
	}
	.group-tab {
		min-height: 40px;
		border-radius: var(--radius-xs);
		font-weight: 800;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.group-tab.active {
		background: var(--surface-strong);
		color: var(--forest);
		box-shadow: var(--shadow-soft);
	}
	.people-sub {
		font-size: 0.84rem;
		color: var(--muted);
	}
	.member-list {
		display: grid;
		gap: 8px;
		max-height: 46vh;
		overflow-y: auto;
	}
	.member-row {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 12px;
		padding: 9px 11px;
		border-radius: 14px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	.member-row.live {
		border-color: color-mix(in srgb, var(--forest) 45%, transparent);
		background: var(--forest-soft);
	}
	.member-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--tint);
		color: #f4efe4;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1rem;
		border: 2px solid var(--surface-strong);
		box-shadow: 0 0 0 1px var(--line);
	}
	.member-copy {
		display: grid;
		gap: 1px;
		min-width: 0;
	}
	.member-copy strong {
		font-size: 0.96rem;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.you-tag {
		font-size: 0.6rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--forest);
		background: var(--forest-soft);
		padding: 1px 6px;
		border-radius: 999px;
	}
	.member-copy span {
		font-size: var(--text-floor);
		color: var(--muted);
	}
	.member-remove {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--ink-soft);
		color: var(--muted);
		font-weight: 800;
		font-size: 0.78rem;
	}
	.people-empty {
		font-size: 0.86rem;
		line-height: 1.45;
		color: var(--muted);
		padding: 4px 2px;
	}
	.add-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
	}
	.add-input {
		min-height: 44px;
		padding: 0 14px;
		border-radius: var(--radius-control);
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.92rem;
	}
	.add-input:focus-visible {
		outline: 2px solid var(--forest);
		outline-offset: 1px;
	}
	.add-btn {
		min-height: 44px;
		padding: 0 18px;
		border-radius: var(--radius-control);
		background: var(--forest);
		color: var(--on-accent);
		font-weight: 800;
	}
	.add-btn:disabled {
		opacity: 0.5;
	}
	.sheet-done {
		min-height: 44px;
		border-radius: var(--radius-control);
		background: var(--ink-soft);
		color: var(--ink);
		font-weight: 800;
	}
</style>
