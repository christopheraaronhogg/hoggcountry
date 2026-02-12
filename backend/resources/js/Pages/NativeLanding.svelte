<script>
    let { tagline = 'Trail-native operations', build = { platforms: [], release_channel: 'alpha' } } = $props();

    const priorities = [
        {
            title: 'Capture Fast',
            detail: 'One-thumb upload flow with offline queue and codec-safe proxy previews.',
        },
        {
            title: 'Map Live',
            detail: 'Presence defaults to private. Hikers can opt into public map visibility.',
        },
        {
            title: 'Ship Clean',
            detail: 'Deterministic run payloads for remotion and editor-agent automation.',
        },
    ];
</script>

<main class="native-wrap">
    <section class="native-hero">
        <p class="hero-kicker">HoggCountry Native</p>
        <h1>Trail app core is now live in Laravel + Inertia + Svelte.</h1>
        <p class="hero-copy">{tagline}</p>
        <div class="hero-chips">
            <span>Channel: {build.release_channel}</span>
            <span>Platforms: {build.platforms.join(' / ') || 'pending'}</span>
            <span>Mode: local-first sync</span>
        </div>
    </section>

    <section class="native-grid" aria-label="Native app priorities">
        {#each priorities as item (item.title)}
            <article class="native-card">
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
            </article>
        {/each}
    </section>

    <section class="native-status">
        <h2>Next build target</h2>
        <p>Wire authenticated media intake, map overlay state, and background sync heartbeat into a single mobile shell.</p>
    </section>
</main>

<style>
    .native-wrap {
        max-width: 980px;
        margin: 0 auto;
        padding: 1.2rem 1rem 2.4rem;
        display: grid;
        gap: 1rem;
    }

    .native-hero {
        border: 1px solid rgba(77, 89, 74, 0.25);
        border-radius: 20px;
        padding: 1rem;
        background:
            linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(252, 250, 242, 0.88)),
            radial-gradient(circle at 12% 14%, rgba(240, 224, 0, 0.18), transparent 40%);
        box-shadow: 0 16px 42px rgba(16, 24, 40, 0.08);
    }

    .hero-kicker {
        margin: 0;
        font: 800 0.77rem/1 'Oswald', sans-serif;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #6b3f16;
    }

    h1 {
        margin: 0.4rem 0 0;
        font: 800 clamp(1.65rem, 6vw, 2.8rem) / 1.04 'Anton', 'Oswald', sans-serif;
        letter-spacing: 0.02em;
        color: #1f2937;
    }

    .hero-copy {
        margin: 0.62rem 0 0;
        font-size: 1rem;
        color: #364152;
        line-height: 1.45;
    }

    .hero-chips {
        margin-top: 0.75rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
    }

    .hero-chips span {
        border-radius: 999px;
        border: 1px solid rgba(77, 89, 74, 0.25);
        background: rgba(255, 255, 255, 0.84);
        padding: 0.33rem 0.6rem;
        font-size: 0.76rem;
        font-weight: 700;
        color: #374151;
    }

    .native-grid {
        display: grid;
        gap: 0.75rem;
    }

    .native-card {
        border-radius: 16px;
        border: 1px solid rgba(77, 89, 74, 0.25);
        background: rgba(255, 255, 255, 0.92);
        padding: 0.85rem;
    }

    .native-card h2 {
        margin: 0;
        font: 700 1.07rem/1.2 'Oswald', sans-serif;
        color: #243040;
    }

    .native-card p {
        margin: 0.45rem 0 0;
        color: #3f4d5e;
        line-height: 1.45;
        font-size: 0.92rem;
    }

    .native-status {
        border-radius: 16px;
        border: 1px dashed rgba(77, 89, 74, 0.42);
        background: rgba(77, 89, 74, 0.07);
        padding: 0.9rem;
    }

    .native-status h2 {
        margin: 0;
        font: 700 1rem/1.2 'Oswald', sans-serif;
        color: #213241;
    }

    .native-status p {
        margin: 0.45rem 0 0;
        color: #374151;
        line-height: 1.45;
        font-size: 0.9rem;
    }

    @media (min-width: 760px) {
        .native-wrap {
            padding: 1.8rem 1.5rem 2.8rem;
            gap: 1.1rem;
        }

        .native-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
</style>
