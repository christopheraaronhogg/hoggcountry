<script lang="ts">
  import WaitlistSignup from '$lib/components/WaitlistSignup.svelte';
  import ScoutCapabilities from '$lib/components/ScoutCapabilities.svelte';
  import AppLaunchCTA from '$lib/components/AppLaunchCTA.svelte';
  import LiveScoutDemo from '$lib/components/LiveScoutDemo.svelte';

  // Example exchanges are illustrative. The numbers are drawn from the same
  // calibrated AT data the map and journey use, and the Pine Grove plan
  // matches Scout's deterministic route grounding (scripts/eval-scout-grounding).
  const exchanges = [
    {
      q: 'Plan me a 3-day northbound hike from Pine Grove Furnace.',
      a: `Conservative shape, ~33.5 trail miles over 3 days (~11/day), Pine Grove Furnace (mile ~1,106) finishing at Darlington Shelter:\n\n• Day 1 — Pine Grove Furnace → James Fry Shelter side trail\n• Day 2 — James Fry → PA 174 / Boiling Springs (mile 1,125.1) — resupply\n• Day 3 — Boiling Springs → Darlington Shelter\n\nWant more miles? I can stretch it to Duncannon (~44.9 mi). Verify shelter water and legal camping against a current guide before you commit.`
    },
    {
      q: 'Next resupply heading north?',
      a: `From Pine Grove Furnace (~mile 1,106), your next on-trail resupply is Boiling Springs at mile 1,125.1 — about 19 trail miles north. Water on the ridge between is seasonal; carry enough to reach a confirmed source.`
    },
    {
      q: 'Is the water flowing at that shelter?',
      a: `I can't confirm that one is running right now — treat it as unverified until a recent FarOut comment or ranger report says otherwise. Want me to add it to your checklist to confirm before you rely on it?`
    }
  ];

  const principles = [
    { k: 'Grounded', t: 'Real trail miles, not guesses', d: 'Every distance comes from the same calibrated AT data behind the live map — official 2,197.4-mile frame, anchored to the guidebook.' },
    { k: 'Source-first', t: 'Your docs + Dad’s guide', d: 'Scout starts from Dad’s field guide, then layers in the documents and preferences you bring, so its advice is yours — not a generic average.' },
    { k: 'Offline-aware', t: 'Works when signal doesn’t', d: 'On-device models keep Scout useful in the backcountry; it connects to a stronger model when you have bars.' },
    { k: 'Honest', t: 'Tells you what to verify', d: 'Scout flags what it can’t confirm — water, closures, current conditions — instead of inventing a confident answer that gets you hurt.' }
  ];
</script>

<svelte:head>
  <title>Scout — the Appalachian Trail app | Hogg Country</title>
  <meta
    name="description"
    content="Scout is a field-grade Appalachian Trail assistant on your phone — grounded in real calibrated trail miles, source-first from your own documents, offline-aware, and honest about what to verify."
  />
  <link rel="canonical" href="https://hoggcountry.com/scout" />
  <meta property="og:title" content="Scout — a trail dashboard, not a chatbot" />
  <meta property="og:description" content="Grounded in real AT trail data, built from your own sources, useful offline, and honest about what to verify before you rely on it." />
</svelte:head>

<div class="scout">
  <header class="hero">
    <p class="kicker">Scout · The AT app</p>
    <h1>A trail dashboard, not a chatbot.</h1>
    <p class="lede">
      Scout plans your days, watches the weather, finds your next water and shelter, and turns your own documents into
      trail-ready decisions — grounded in the same calibrated Appalachian Trail data behind Dad's live map, and honest
      about what it can't confirm.
    </p>
    <div class="cta-row">
      <a class="btn btn--primary" href="#waitlist">Get early access</a>
      <a class="btn" href="/journey">See the live demo →</a>
    </div>
    <p class="hero-disclaimer">
      App Store and Google Play listings aren't live yet. The waitlist is. We'll email you the day Scout ships.
    </p>
  </header>

  <LiveScoutDemo />

  <section class="principles" aria-label="What makes Scout different">
    {#each principles as p (p.k)}
      <article class="principle">
        <p class="p-kicker">{p.k}</p>
        <h2>{p.t}</h2>
        <p>{p.d}</p>
      </article>
    {/each}
  </section>

  <ScoutCapabilities />

  <section class="demo" aria-label="Example exchanges">
    <h2 class="demo-title">How Scout answers</h2>
    <p class="demo-note">Planning examples — illustrative. The live panel above is Dad's current app data.</p>
    <div class="threads">
      {#each exchanges as x (x.q)}
        <article class="thread">
          <p class="ask"><span class="who">You</span>{x.q}</p>
          <div class="reply"><span class="who who--scout">Scout</span><span class="reply-body">{x.a}</span></div>
        </article>
      {/each}
    </div>
    <p class="demo-foot">
      Want to see the answer keyed to a real position? <a href="/journey">Open Dad's live journey →</a>
    </p>
  </section>

  <section class="signup" id="waitlist" aria-label="Join the waitlist">
    <h2>Scout drops with the app.</h2>
    <p>
      It's in private hardening now. Leave your email and we'll send the App Store and Google Play links the moment
      they go live.
    </p>
    <WaitlistSignup source="scout" />
  </section>
</div>

<AppLaunchCTA source="scout-page-launch" headline="The waitlist is the only line that's open." sub="iOS and Android. Offline-first. Source receipts on every answer. Get told the day the stores light up." />

<style>
  .scout { max-width: 54rem; margin: 0 auto; padding: clamp(1.5rem, 4vw, 3rem) 1rem 3rem; }

  .hero { text-align: center; display: grid; gap: 1rem; justify-items: center; padding-bottom: 1.5rem; }
  .kicker { margin: 0; color: var(--terra); font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.74rem; }
  .hero h1 { margin: 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(2.1rem, 7vw, 3.6rem); line-height: 1.02; color: var(--ink, #1f2937); }
  .lede { margin: 0; max-width: 48ch; color: var(--muted, #4a5448); line-height: 1.65; }
  .cta-row { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-top: 0.3rem; }
  .btn { display: inline-flex; align-items: center; min-height: 2.8rem; padding: 0 1.2rem; border-radius: 999px; border: 1px solid rgba(77,89,74,0.2); background: rgba(255,255,255,0.8); color: var(--pine, #4d594a); font-weight: 800; text-decoration: none; }
  .btn--primary { background: var(--pine); color: #fff; border-color: var(--pine); }
  .hero-disclaimer { margin: 0; max-width: 44ch; font-size: 0.8rem; font-weight: 700; color: rgba(74, 84, 72, 0.7); }

  .principles { display: grid; grid-template-columns: 1fr; gap: 0.8rem; margin-top: 1.5rem; }
  .principle { border: 1px solid var(--border, #e6e1d4); border-radius: 0.9rem; background: rgba(255,255,255,0.7); padding: 1rem 1.1rem; }
  .p-kicker { margin: 0; color: var(--terra); font-weight: 900; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; }
  .principle h2 { margin: 0.2rem 0 0.3rem; font-family: Oswald, sans-serif; font-size: 1.15rem; color: var(--ink); }
  .principle p { margin: 0; color: var(--muted); line-height: 1.55; font-size: 0.92rem; }

  .demo { margin-top: 2.4rem; }
  .demo-title { margin: 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.5rem, 5vw, 2.2rem); color: var(--ink); text-align: center; }
  .demo-note { margin: 0.3rem 0 1.2rem; text-align: center; color: rgba(74,84,72,0.65); font-size: 0.82rem; font-weight: 700; }
  .demo-foot { margin: 1.1rem 0 0; text-align: center; font-size: 0.85rem; color: rgba(74, 84, 72, 0.7); font-weight: 700; }
  .demo-foot a { color: var(--terra); font-weight: 800; }
  .threads { display: grid; gap: 1rem; }
  .thread { border: 1px solid var(--border); border-radius: 1rem; background: var(--card, #fff); padding: 1rem 1.1rem; box-shadow: var(--shadow-soft); display: grid; gap: 0.7rem; }
  .ask { margin: 0; font-weight: 700; color: var(--ink); display: flex; gap: 0.5rem; align-items: baseline; }
  .reply { display: flex; gap: 0.5rem; align-items: baseline; }
  .reply-body { white-space: pre-line; color: var(--muted); line-height: 1.6; }
  .who { flex: none; font-size: 0.62rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(74,84,72,0.55); padding: 0.15rem 0.45rem; border-radius: 999px; background: rgba(77,89,74,0.08); }
  .who--scout { color: #fff; background: var(--pine); }

  .signup { margin-top: 2.6rem; padding: clamp(1.6rem, 4vw, 2.4rem); border-radius: 1.1rem; background: linear-gradient(135deg, var(--pine), #3a4438); color: #fff; text-align: center; display: grid; gap: 0.7rem; justify-items: center; }
  .signup h2 { margin: 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.5rem, 4vw, 2.2rem); }
  .signup p { margin: 0; max-width: 44ch; color: rgba(255,255,255,0.85); line-height: 1.55; }

  @media (min-width: 720px) {
    .principles { grid-template-columns: 1fr 1fr; }
  }
</style>
