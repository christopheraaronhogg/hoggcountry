<script>
    import { useForm } from '@inertiajs/svelte';

    let {
        athletes = [],
        lifts = [],
        leaderboard = {},
        recentUpdates = [],
    } = $props();

    const form = useForm({
        athlete: athletes[0] ?? 'Chris',
        lift: lifts[0] ?? 'Bench Press',
        weight: '',
        achieved_at: '',
    });

    const submit = () => {
        form.transform((data) => ({
            ...data,
            weight: Number(data.weight),
            achieved_at: data.achieved_at || null,
        })).post('/pr-ladder', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('weight', 'achieved_at');
            },
        });
    };

    const formatWeight = (value) => (value ? `${value} lb` : '—');

    const formatDate = (value) => {
        if (!value) return 'Just now';

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(new Date(value));
    };
</script>

<svelte:head>
    <title>PR Ladder</title>
    <meta
        name="description"
        content="Track current PRs and recent lift updates for Chris, Terran, and Austin in PR Ladder."
    />
</svelte:head>

<main class="pr-wrap">
    <section class="hero-card">
        <div>
            <p class="eyebrow">Gym tracker</p>
            <h1>PR Ladder</h1>
            <p class="hero-copy">A simple place to log current PRs, compare the big lifts, and keep the crew moving.</p>
        </div>

        <div class="hero-chip-row" aria-label="Tracked lifts">
            {#each lifts as lift}
                <span>{lift}</span>
            {/each}
        </div>
    </section>

    <section class="pr-grid">
        <article class="form-card">
            <div class="section-copy">
                <h2>Log a PR</h2>
                <p>Keep it fast. Pick the lifter, the lift, and the weight. Add a date only if you want it tracked exactly.</p>
            </div>

            <form class="pr-form" onsubmit={submit}>
                <label>
                    Athlete
                    <select bind:value={form.athlete}>
                        {#each athletes as athlete}
                            <option value={athlete}>{athlete}</option>
                        {/each}
                    </select>
                </label>

                <label>
                    Lift
                    <select bind:value={form.lift}>
                        {#each lifts as lift}
                            <option value={lift}>{lift}</option>
                        {/each}
                    </select>
                </label>

                <label>
                    Weight
                    <input bind:value={form.weight} type="number" min="1" step="1" placeholder="225" />
                </label>

                <label>
                    Date achieved
                    <input bind:value={form.achieved_at} type="datetime-local" />
                </label>

                <button type="submit" disabled={form.processing}>
                    {#if form.processing}Saving...{:else}Save PR{/if}
                </button>

                {#if form.errors.athlete || form.errors.lift || form.errors.weight || form.errors.achieved_at}
                    <p class="form-error">Please check the form and try again.</p>
                {/if}
            </form>
        </article>

        <section class="leaderboard-stack" aria-label="Current PRs">
            {#each athletes as athlete}
                <article class="athlete-card">
                    <div class="athlete-header">
                        <h2>{athlete}</h2>
                        <span>{Object.values(leaderboard?.[athlete] ?? {}).filter(Boolean).length} lifts tracked</span>
                    </div>

                    <ul class="lift-list">
                        {#each lifts as lift}
                            <li>
                                <span class="lift-name">{lift}</span>
                                <strong>{formatWeight(leaderboard?.[athlete]?.[lift]?.weight)}</strong>
                            </li>
                        {/each}
                    </ul>
                </article>
            {/each}
        </section>
    </section>

    <section class="history-card">
        <div class="section-copy">
            <h2>Recent updates</h2>
            <p>The freshest PR changes show up here so it stays alive, not static.</p>
        </div>

        {#if recentUpdates.length}
            <ul class="history-list">
                {#each recentUpdates as update}
                    <li>
                        <div>
                            <strong>{update.athlete}</strong>
                            <span>hit</span>
                            <strong>{update.weight} lb</strong>
                            <span>on {update.lift}</span>
                        </div>
                        <time datetime={update.achieved_at}>{formatDate(update.achieved_at)}</time>
                    </li>
                {/each}
            </ul>
        {:else}
            <div class="empty-state">No PR updates yet. Seed the lifts or log the first one.</div>
        {/if}
    </section>
</main>

<style>
    .pr-wrap {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.2rem 1rem 2.8rem;
        display: grid;
        gap: 1rem;
    }

    .hero-card,
    .form-card,
    .athlete-card,
    .history-card {
        border-radius: 20px;
        border: 1px solid rgba(77, 89, 74, 0.22);
        background: rgba(255, 252, 243, 0.94);
        box-shadow: 0 16px 42px rgba(16, 24, 40, 0.08);
    }

    .hero-card {
        padding: 1.1rem;
        background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(252, 250, 242, 0.92)),
            radial-gradient(circle at 12% 14%, rgba(240, 224, 0, 0.16), transparent 36%);
    }

    .eyebrow {
        margin: 0;
        font: 800 0.78rem/1 'Oswald', sans-serif;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #6b3f16;
    }

    h1 {
        margin: 0.4rem 0 0;
        font: 800 clamp(1.8rem, 5vw, 3rem) / 1.02 'Anton', 'Oswald', sans-serif;
        color: #1f2937;
    }

    .hero-copy,
    .section-copy p,
    label,
    .athlete-header span,
    .lift-name,
    .history-list time,
    .empty-state {
        color: #425466;
    }

    .hero-copy {
        margin: 0.65rem 0 0;
        max-width: 42rem;
        line-height: 1.5;
    }

    .hero-chip-row {
        margin-top: 0.9rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .hero-chip-row span {
        padding: 0.38rem 0.72rem;
        border-radius: 999px;
        border: 1px solid rgba(77, 89, 74, 0.24);
        background: rgba(255, 255, 255, 0.84);
        font-size: 0.78rem;
        font-weight: 800;
        color: #30404f;
    }

    .pr-grid {
        display: grid;
        gap: 1rem;
    }

    .form-card,
    .history-card {
        padding: 1rem;
    }

    .section-copy h2,
    .athlete-header h2 {
        margin: 0;
        font: 700 1.06rem/1.15 'Oswald', sans-serif;
        color: #243040;
    }

    .section-copy p {
        margin: 0.42rem 0 0;
        line-height: 1.45;
        font-size: 0.95rem;
    }

    .pr-form {
        margin-top: 1rem;
        display: grid;
        gap: 0.8rem;
    }

    label {
        display: grid;
        gap: 0.38rem;
        font-size: 0.88rem;
        font-weight: 700;
    }

    input,
    select,
    button {
        font: inherit;
    }

    input,
    select {
        width: 100%;
        border-radius: 14px;
        border: 1px solid rgba(77, 89, 74, 0.24);
        background: rgba(255, 255, 255, 0.96);
        color: #1f2937;
        padding: 0.8rem 0.9rem;
    }

    input:focus,
    select:focus {
        outline: 2px solid rgba(217, 119, 6, 0.22);
        border-color: rgba(217, 119, 6, 0.55);
    }

    button {
        border: 0;
        border-radius: 14px;
        background: linear-gradient(135deg, #d97706, #f0e000);
        color: #1f2937;
        font-weight: 900;
        padding: 0.85rem 1rem;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(217, 119, 6, 0.2);
    }

    button:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    .form-error {
        margin: 0;
        color: #b42318;
        font-size: 0.9rem;
    }

    .leaderboard-stack {
        display: grid;
        gap: 0.8rem;
    }

    .athlete-card {
        padding: 0.95rem;
    }

    .athlete-header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: baseline;
        margin-bottom: 0.8rem;
    }

    .lift-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.6rem;
    }

    .lift-list li,
    .history-list li {
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        align-items: center;
        border-radius: 14px;
        padding: 0.82rem 0.9rem;
        background: rgba(166, 181, 137, 0.12);
        border: 1px solid rgba(77, 89, 74, 0.18);
    }

    .lift-list strong {
        font-size: 1.1rem;
        color: #1f2937;
    }

    .history-list {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: grid;
        gap: 0.65rem;
    }

    .history-list li div {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        color: #243040;
    }

    .empty-state {
        margin-top: 1rem;
        border-radius: 14px;
        border: 1px dashed rgba(77, 89, 74, 0.32);
        background: rgba(77, 89, 74, 0.05);
        padding: 1rem;
        text-align: center;
    }

    @media (min-width: 900px) {
        .pr-wrap {
            padding: 1.8rem 1.5rem 3rem;
            gap: 1.1rem;
        }

        .pr-grid {
            grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
            align-items: start;
        }

        .leaderboard-stack {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
</style>
