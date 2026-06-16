<script lang="ts">
  import WaitlistSignup from './WaitlistSignup.svelte';

  interface Props {
    source?: string;
    headline?: string;
    sub?: string;
  }

  // App Store / Google Play listings do not exist yet — these are honest
  // "not yet" badges that funnel into the waitlist, so we never link to a
  // store URL that 404s or a TestFlight that isn't open.
  const {
    source = 'app-launch-cta',
    headline = 'Want this for your own hike?',
    sub = "Everything above — the mile frame, the elevation profile, the landmarks, the live position — is the foundation we're turning into Scout, the trail app we're shipping for iOS and Android. The waitlist below is the only line that's open today."
  }: Props = $props();
</script>

<section class="app-cta" aria-labelledby="app-cta-title">
  <div class="app-cta-inner">
    <div class="app-cta-copy">
      <p class="app-cta-kicker">The app</p>
      <h2 id="app-cta-title">{headline}</h2>
      <p class="app-cta-sub">{sub}</p>
    </div>

    <div class="app-cta-stores" role="list" aria-label="App store status">
      <span class="store-badge" role="listitem">
        <span class="store-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 1.5c0 1.3-.5 2.5-1.4 3.4-1 1-2.2 1.5-3.4 1.4-.1-1.3.5-2.6 1.3-3.4.9-1 2.2-1.5 3.5-1.4zM20.5 17.2c-.6 1.4-1 2-1.7 3.3-1 1.7-2.3 3.9-4 4-1.5 0-1.9-1-3.9-1-2 0-2.4 1-3.9 1-1.7 0-3-2-4-3.7C.4 17.2-.2 11.7 2 8.8 3.6 6.7 5.9 5.5 8.2 5.5c1.8 0 2.9 1 4.4 1 1.4 0 2.3-1 4.4-1 1.7 0 3.4.9 4.6 2.5-4 2.2-3.4 8 .9 9.2z" />
          </svg>
        </span>
        <span class="store-text">
          <span class="store-pre">Coming to</span>
          <span class="store-name">App Store</span>
          <span class="store-status">Not live yet</span>
        </span>
      </span>

      <span class="store-badge" role="listitem">
        <span class="store-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.5 2.5c-.3.3-.5.7-.5 1.2v16.6c0 .5.2.9.5 1.2L13 12 3.5 2.5zM14.8 13.3l2.3 2.3-11.3 6.6c-.4.2-.8.2-1.2 0l10.2-8.9zM18.4 8.7l-3.6 3.3 3.6 3.3 3.2-1.9c.9-.5.9-1.8 0-2.3l-3.2-2.4zM14.8 10.7L4.6 1.8c.4-.2.8-.2 1.2 0l11.3 6.6-2.3 2.3z" />
          </svg>
        </span>
        <span class="store-text">
          <span class="store-pre">Coming to</span>
          <span class="store-name">Google Play</span>
          <span class="store-status">Not live yet</span>
        </span>
      </span>

      <span class="store-badge store-badge--live" role="listitem">
        <span class="store-glyph" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
        <span class="store-text">
          <span class="store-pre">Live now</span>
          <span class="store-name">Early-access waitlist</span>
          <span class="store-status">Open below</span>
        </span>
      </span>
    </div>

    <div class="app-cta-waitlist">
      <WaitlistSignup {source} compact={false} />
    </div>

    <p class="app-cta-note">
      App Store and Google Play listings aren't live yet. We'll email you the moment they are.
    </p>
  </div>
</section>

<style>
  .app-cta {
    background:
      radial-gradient(circle at 20% 0%, rgba(244, 198, 116, 0.16), transparent 34rem),
      linear-gradient(135deg, #1f2a20 0%, var(--pine) 56%, #2d372d 100%);
    color: #f5f2e8;
    padding: clamp(2.2rem, 5vw, 3.5rem) 0;
    border-top: 3px solid rgba(217, 119, 6, 0.65);
    border-bottom: 3px solid rgba(217, 119, 6, 0.65);
  }

  .app-cta-inner {
    width: min(960px, calc(100% - 2rem));
    margin: 0 auto;
    display: grid;
    gap: 1.4rem;
    text-align: center;
    justify-items: center;
  }

  .app-cta-copy {
    display: grid;
    gap: 0.65rem;
    justify-items: center;
  }

  .app-cta-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #f4c674;
  }

  .app-cta-copy h2 {
    margin: 0;
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: clamp(1.8rem, 5vw, 2.6rem);
    line-height: 1.05;
    color: #f7f3e6;
    text-wrap: balance;
  }

  .app-cta-sub {
    margin: 0;
    max-width: 52ch;
    color: rgba(250, 247, 237, 0.9);
    line-height: 1.6;
    font-size: clamp(0.95rem, 2.2vw, 1.05rem);
  }

  .app-cta-stores {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
  }

  .store-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.55rem 0.85rem;
    border-radius: 0.7rem;
    background: rgba(0, 0, 0, 0.34);
    border: 1px solid rgba(245, 242, 232, 0.28);
    color: rgba(250, 247, 237, 0.9);
    min-width: 11rem;
    text-align: left;
    cursor: not-allowed;
  }

  .store-badge--live {
    background: rgba(217, 119, 6, 0.28);
    border-color: rgba(244, 198, 116, 0.7);
    color: #fbe6c4;
    cursor: default;
  }

  .store-glyph {
    flex: none;
    width: 1.6rem;
    height: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .store-glyph svg {
    width: 1.4rem;
    height: 1.4rem;
  }

  .store-text {
    display: grid;
    gap: 0.05rem;
    line-height: 1.15;
  }

  .store-pre {
    font-size: 0.6rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(250, 247, 237, 0.72);
  }

  .store-badge--live .store-pre {
    color: #f4c674;
  }

  .store-name {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    color: #f7f3e6;
  }

  .store-status {
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(250, 247, 237, 0.72);
  }

  .store-badge--live .store-status {
    color: #fbe6c4;
  }

  .app-cta-waitlist {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: clamp(1rem, 3vw, 1.25rem);
    border: 1px solid rgba(245, 242, 232, 0.2);
    border-radius: 0.8rem;
    background: rgba(6, 12, 7, 0.28);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  }

  .app-cta-waitlist :global(.waitlist-form input[type='email']) {
    background: #fffaf0;
    border-color: rgba(250, 247, 237, 0.75);
    color: #182019;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
  }

  .app-cta-waitlist :global(.waitlist-form input[type='email']::placeholder) {
    color: rgba(24, 32, 25, 0.62);
  }

  .app-cta-waitlist :global(.waitlist-button) {
    background: #d97706;
    color: #fffaf0;
    border: 1px solid rgba(255, 250, 240, 0.25);
    box-shadow: 0 10px 24px rgba(217, 119, 6, 0.24);
  }

  .app-cta-waitlist :global(.waitlist-button:hover:not(:disabled)) {
    background: #f09a1a;
  }

  .app-cta-waitlist :global(.waitlist-kicker) {
    color: #f4c674;
  }

  .app-cta-waitlist :global(.waitlist-copy) {
    color: rgba(250, 247, 237, 0.88);
  }

  .app-cta-waitlist :global(.waitlist-done) {
    color: #f4c674;
  }

  .app-cta-note {
    margin: 0;
    max-width: 50ch;
    font-size: 0.82rem;
    color: rgba(250, 247, 237, 0.78);
    line-height: 1.55;
  }
</style>
