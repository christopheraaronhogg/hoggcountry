<script lang="ts">
	import { trailAssistant } from '$lib/trailState.svelte';
	import { isDadPilot } from '$lib/scout/hike-profile';
	import {
		people,
		AVATAR_TINTS,
		buildPeopleInviteSmsHref,
		buildPeopleInviteText,
		buildPeopleInviteUrl,
		personInitial,
		personStatus,
		dialString,
		type Person
	} from '$lib/people/people.svelte';
	import { memberLocation } from '$lib/people/memberLocation.svelte';
	import Icon from './Icon.svelte';

	// Live location sharing (Phase 3) for the active group.
	const activeGroup = $derived(people.activeGroup);
	const liveCount = $derived(memberLocation.positionsForGroup(activeGroup.shareCode).length);
	const inviteUrl = $derived(
		activeGroup.shareCode
			? buildPeopleInviteUrl({ groupId: activeGroup.id, shareCode: activeGroup.shareCode })
			: ''
	);
	let joinOpen = $state(false);
	let joinCode = $state('');
	let copied = $state(false);
	let shared = $state(false);
	let shareError = $state<string | null>(null);

	function shareErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : 'A private share code could not be created.';
	}

	function ensureInvite(): { url: string; text: string } | null {
		shareError = null;
		try {
			if (!activeGroup.sharing) people.setSharing(activeGroup.id, true);
			const code = people.ensureShareCode(activeGroup.id);
			if (!code) return null;
			const url = buildPeopleInviteUrl({ groupId: activeGroup.id, shareCode: code });
			return {
				url,
				text: buildPeopleInviteText({ groupName: activeGroup.name, shareCode: code, inviteUrl: url })
			};
		} catch (error) {
			shareError = shareErrorMessage(error);
			return null;
		}
	}

	function setLiveSharing(on: boolean): void {
		shareError = null;
		try {
			people.setSharing(activeGroup.id, on);
		} catch (error) {
			shareError = shareErrorMessage(error);
		}
	}

	function copyInviteLink() {
		const invite = ensureInvite();
		if (!invite || !navigator.clipboard) return;
		navigator.clipboard.writeText(invite.url).then(
			() => {
				copied = true;
				setTimeout(() => (copied = false), 1500);
			},
			() => {}
		);
	}

	async function shareInvite() {
		const invite = ensureInvite();
		if (!invite) return;
		if (navigator.share) {
			try {
				await navigator.share({ title: `${activeGroup.name} map invite`, text: invite.text, url: invite.url });
				shared = true;
				setTimeout(() => (shared = false), 1500);
				return;
			} catch {
				// Share cancellation is a normal user choice; leave the sheet as-is.
			}
		}
		copyInviteLink();
	}

	function textInvite(phone?: string) {
		const invite = ensureInvite();
		if (!invite) return;
		window.location.href = buildPeopleInviteSmsHref({ phone, message: invite.text });
	}

	function submitJoin() {
		if (people.joinWithCode(activeGroup.id, joinCode)) {
			joinCode = '';
			joinOpen = false;
		}
	}

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
	// "Sharing live" = real positions arriving over SpacetimeDB for this group.
	const sharingCount = $derived(liveCount);

	let newName = $state('');
	let newPhone = $state('');
	function addPerson() {
		const name = newName.trim();
		if (!name) return;
		people.addPerson(people.activeGroupId, name, newPhone);
		newName = '';
		newPhone = '';
	}

	// Inline "add a number" editor for a member who has none yet.
	let editingPhoneId = $state<string | null>(null);
	let editPhone = $state('');
	function startEditPhone(p: Person) {
		editingPhoneId = p.id;
		editPhone = p.phone ?? '';
	}
	function saveEditPhone(p: Person) {
		people.setPhone(people.activeGroupId, p.id, editPhone);
		editingPhoneId = null;
		editPhone = '';
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

		<div class="live-share">
			<div class="live-share-row">
				<div class="live-copy">
					<strong>Share my live location</strong>
					<span>{activeGroup.name} members see your trail mile. Private to this group.</span>
				</div>
				<button
					class="toggle"
					class:on={activeGroup.sharing}
					role="switch"
					aria-checked={activeGroup.sharing ?? false}
					aria-label="Share my live location with {activeGroup.name}"
					type="button"
					onclick={() => setLiveSharing(!activeGroup.sharing)}
				></button>
			</div>

			{#if shareError}
				<p class="share-error" role="alert">{shareError}</p>
			{/if}

			{#if activeGroup.sharing && activeGroup.shareCode}
				<div class="invite-code">
					<div class="ic-label">Invite link — send it to {activeGroup.name.toLowerCase()}</div>
					<div class="ic-row invite-link">
						<code>{inviteUrl}</code>
					</div>
					<div class="invite-actions">
						<button class="ic-copy" type="button" onclick={shareInvite}>{shared ? 'Shared' : 'Share'}</button>
						<button class="ic-copy secondary" type="button" onclick={copyInviteLink}>
							{copied ? 'Copied' : 'Copy link'}
						</button>
						<button class="ic-copy secondary" type="button" onclick={() => textInvite()}>Text</button>
					</div>
					<div class="manual-code">Code: <code>{activeGroup.shareCode}</code></div>
				</div>
			{/if}

			{#if joinOpen}
				<form
					class="join-form"
					onsubmit={(e) => {
						e.preventDefault();
						submitJoin();
					}}
				>
					<input
						class="join-input"
						bind:value={joinCode}
						placeholder="Paste a code you were sent…"
						aria-label="Group invite code"
						autocapitalize="off"
						autocomplete="off"
					/>
					<button class="join-go" type="submit" disabled={joinCode.trim().length < 8}>Join</button>
				</form>
			{:else}
				<button class="join-toggle" type="button" onclick={() => (joinOpen = true)}>
					Have a code from family? Join their group
				</button>
			{/if}

			{#if !memberLocation.available}
				<p class="live-note">Live positions start syncing once live sharing is enabled on your account.</p>
			{/if}
		</div>

		{#if activeMembers.length}
			<div class="member-list">
				{#each activeMembers as m (m.id)}
					<div class="member-row" class:live={m.mile != null}>
						<span class="member-avatar" style="--tint:{AVATAR_TINTS[m.tint % AVATAR_TINTS.length]}">
							{personInitial(m.name)}
						</span>
						{#if editingPhoneId === m.id}
							<input
								class="phone-edit"
								type="tel"
								inputmode="tel"
								bind:value={editPhone}
								placeholder="Phone number"
								aria-label={`Phone number for ${m.name}`}
							/>
							<button class="phone-save" type="button" onclick={() => saveEditPhone(m)}>Save</button>
						{:else}
							<div class="member-copy">
								<strong>{m.name}{#if m.self}<span class="you-tag">you</span>{/if}</strong>
								<span>{statusLine(m)}</span>
							</div>
							<div class="member-actions">
								{#if m.phone}
									<!-- Hand off to the phone's own dialer / Messages — no in-app messaging. -->
									<a
										class="contact-btn call"
										href="tel:{dialString(m.phone)}"
										aria-label={`Call ${m.name}`}><Icon name="phone" size={16} stroke={2} /></a
									>
									<button
										class="contact-btn msg"
										type="button"
										onclick={() => textInvite(m.phone)}
										aria-label={`Text map invite to ${m.name}`}
									>
										<Icon name="message" size={16} stroke={2} />
									</button>
								{:else if !m.self}
									<button class="contact-btn add" type="button" onclick={() => startEditPhone(m)}>
										+ number
									</button>
								{/if}
								{#if !m.self}
									<button
										class="member-remove"
										type="button"
										onclick={() => people.removePerson(people.activeGroupId, m.id)}
										aria-label={`Remove ${m.name}`}>✕</button
									>
								{/if}
							</div>
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
				class="add-input add-name"
				bind:value={newName}
				placeholder={`Add to ${people.activeGroup.name}…`}
				aria-label="New person's name"
			/>
			<input
				class="add-input"
				type="tel"
				inputmode="tel"
				bind:value={newPhone}
				placeholder="Phone (optional · for call/text)"
				aria-label="Phone number"
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
		box-sizing: border-box;
		width: min(100vw, var(--app-width));
		z-index: 41;
		display: grid;
		gap: 12px;
		padding: 8px 16px calc(env(safe-area-inset-bottom) + 18px);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: var(--surface-strong);
		box-shadow: var(--shadow-ridge);
		overflow-x: hidden;
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

	/* Live location sharing */
	.live-share {
		display: grid;
		gap: 10px;
		min-width: 0;
		padding: 12px;
		border-radius: var(--radius-control, 12px);
		background: var(--forest-soft);
		border: 1px solid var(--line);
	}
	.live-share-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.live-copy {
		display: grid;
		gap: 2px;
	}
	.live-copy strong {
		font-size: 0.92rem;
		color: var(--ink);
	}
	.live-copy span {
		font-size: 0.74rem;
		color: var(--muted);
		line-height: 1.35;
	}
	.toggle {
		flex: none;
		width: 46px;
		height: 28px;
		border-radius: 999px;
		background: var(--line);
		position: relative;
		transition: background var(--dur-fast, 0.15s) var(--ease-out, ease);
	}
	.toggle::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--surface-strong, #fff);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		transition: transform var(--dur-fast, 0.15s) var(--ease-out, ease);
	}
	.toggle.on {
		background: var(--forest);
	}
	.toggle.on::after {
		transform: translateX(18px);
	}
	.invite-code {
		display: grid;
		gap: 5px;
		min-width: 0;
		width: 100%;
		overflow: hidden;
	}
	.ic-label {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--muted);
	}
	.ic-row {
		display: flex;
		align-items: stretch;
		gap: 8px;
		min-width: 0;
		width: 100%;
	}
	.ic-row code {
		flex: 1;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
		padding: 9px 12px;
		border-radius: var(--radius-control, 10px);
		background: var(--surface-strong);
		border: 1px solid var(--line);
		font-family: ui-monospace, monospace;
		font-size: 0.86rem;
		letter-spacing: 0.04em;
		color: var(--ink);
		overflow-x: auto;
		white-space: nowrap;
	}
	.invite-link code {
		font-size: 0.74rem;
		letter-spacing: 0;
	}
	.invite-actions {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		min-width: 0;
		width: 100%;
	}
	.ic-copy {
		flex: none;
		min-height: 38px;
		padding: 0 12px;
		border-radius: var(--radius-control, 10px);
		background: var(--forest);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 0.82rem;
	}
	.ic-copy.secondary {
		background: var(--surface-strong);
		border: 1px solid var(--line);
		color: var(--forest);
	}
	.manual-code {
		font-size: 0.72rem;
		color: var(--muted);
	}
	.manual-code code {
		font-family: ui-monospace, monospace;
		color: var(--ink);
	}
	.join-toggle {
		justify-self: start;
		padding: 0;
		font-size: 0.8rem;
		font-weight: 800;
		color: var(--forest);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.join-form {
		display: flex;
		gap: 8px;
	}
	.join-input {
		flex: 1;
		min-width: 0;
		min-height: 40px;
		padding: 0 12px;
		border-radius: var(--radius-control, 10px);
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.86rem;
	}
	.join-go {
		flex: none;
		padding: 0 16px;
		border-radius: var(--radius-control, 10px);
		background: var(--forest);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 0.84rem;
	}
	.join-go:disabled {
		opacity: 0.5;
	}
	.live-note {
		font-size: 0.72rem;
		color: var(--muted);
		line-height: 1.4;
		margin: 0;
	}
	.share-error {
		margin: 0;
		padding: 8px 10px;
		border-radius: var(--radius-control, 10px);
		background: var(--danger-soft);
		color: var(--danger);
		font-size: 0.76rem;
		font-weight: 700;
		line-height: 1.35;
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
		min-width: 0;
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
	/* One-tap call / text — hands off to the phone's own apps (tel:/sms:). */
	.member-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.contact-btn {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		border: 1px solid transparent;
		transition: transform var(--dur-fast, 0.12s) ease;
	}
	.contact-btn.call {
		background: var(--forest-soft);
		color: var(--forest);
	}
	.contact-btn.msg {
		background: var(--sky-soft);
		color: var(--sky);
	}
	.contact-btn.add {
		width: auto;
		height: 34px;
		padding: 0 12px;
		border-radius: 999px;
		background: var(--bg);
		border-color: var(--line);
		color: var(--muted);
		font-size: 0.72rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.contact-btn:active {
		transform: scale(0.94);
	}
	.phone-edit {
		min-height: 40px;
		padding: 0 12px;
		border-radius: var(--radius-control);
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		font-size: 0.9rem;
		min-width: 0;
	}
	.phone-edit:focus-visible {
		outline: 2px solid var(--forest);
		outline-offset: 1px;
	}
	.phone-save {
		min-height: 40px;
		padding: 0 14px;
		border-radius: var(--radius-control);
		background: var(--forest);
		color: var(--on-accent);
		font-weight: 800;
		font-size: 0.85rem;
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
	.add-row .add-name {
		grid-column: 1 / -1;
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
