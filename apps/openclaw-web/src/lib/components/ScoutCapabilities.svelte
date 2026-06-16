<script lang="ts">
  // Capability deck — what Scout actually does on trail. Honest sub-copy:
  // anything "current" or "live" carries a verify/source receipt note so we
  // don't imply we have a real-time service we haven't actually shipped.
  const capabilities = [
    {
      id: 'next-20',
      kicker: 'On-trail',
      title: 'The next 20 miles',
      copy: 'A scrollable look ahead: climbs, descents, shelters, water, road crossings — all from the calibrated official-mile frame behind the map.',
      receipt: 'Source: at-mile-anchors.yaml → calibrated mileposts'
    },
    {
      id: 'weather',
      kicker: 'Conditions',
      title: 'Weather you can plan against',
      copy: 'Trail-segment forecasts so a 5,000-ft ridge gets its own answer, not the nearest town\'s. Scout flags how stale the read is.',
      receipt: 'Source: NWS gridpoints + cache timestamp'
    },
    {
      id: 'water',
      kicker: 'Hydration',
      title: 'Where the next water is',
      copy: 'Sources ordered by distance ahead with a confidence tag — verified, seasonal, or unverified. Scout asks you to confirm before you bet on a spring.',
      receipt: 'Verification: FarOut/ranger reports cross-checked'
    },
    {
      id: 'shelter',
      kicker: 'Sleep',
      title: 'Shelter and camp options',
      copy: 'Upcoming shelters, tent pads, hostels — plus the honest distance math: can you reach the next one before dark, or do you stop short?',
      receipt: 'Source: ATC shelter list + our own anchor mileage'
    },
    {
      id: 'elevation',
      kicker: 'Effort',
      title: 'Elevation and difficulty',
      copy: 'Whites or Pennsylvania flat? Scout reads the silhouette ahead and gives you climb feet, descent feet, and a difficulty take for the section.',
      receipt: 'Source: USGS elevation per official mile'
    },
    {
      id: 'pack',
      kicker: 'Loadout',
      title: 'Pack and consumables',
      copy: 'Your gear list, base weight, food/water carried, and what should change for the next leg — cold front coming, fuel low, town tomorrow.',
      receipt: 'Source: your own loadout + Dad\'s field guide notes'
    },
    {
      id: 'landmarks',
      kicker: 'Trail culture',
      title: 'Landmarks & traditions',
      copy: 'Half-gallon Challenge, four-state day, the Doyle, the Whites huts, Katahdin sunrise — Scout knows the ritual moments and the miles they live at.',
      receipt: 'Source: Hogg Country field guide, public AT lore'
    },
    {
      id: 'sources',
      kicker: 'Honesty',
      title: 'Source receipts on every answer',
      copy: 'Scout names what it read. When it can\'t verify something current — closures, fresh water, road work — it says so and asks you to confirm before you depend on it.',
      receipt: 'Receipt format: source · timestamp · confidence'
    }
  ];
</script>

<section class="scout-caps" aria-labelledby="scout-caps-title">
  <div class="caps-inner">
    <header class="caps-head">
      <p class="caps-kicker">What Scout does on trail</p>
      <h2 id="scout-caps-title">A field cockpit, not a chatbot.</h2>
      <p class="caps-lede">
        Open Scout and you don't get a blinking cursor. You get the next 20 miles, the next water, the next bed, the
        weather that matters, and a pack check — with the work shown.
      </p>
    </header>

    <ul class="caps-grid">
      {#each capabilities as cap (cap.id)}
        <li class="cap-card">
          <p class="cap-kicker">{cap.kicker}</p>
          <h3>{cap.title}</h3>
          <p class="cap-copy">{cap.copy}</p>
          <p class="cap-receipt">
            <span aria-hidden="true">↳</span>
            <span>{cap.receipt}</span>
          </p>
        </li>
      {/each}
    </ul>

    <p class="caps-footnote">
      Scout works offline-first. On-device models keep it useful when bars drop; it reaches for a stronger cloud model
      only when you have signal and allow it. No current-condition claim is made without a source or a "verify this"
      flag.
    </p>
  </div>
</section>

<style>
  .scout-caps {
    background: linear-gradient(180deg, rgba(245, 242, 232, 0) 0%, rgba(166, 181, 137, 0.08) 40%, rgba(245, 242, 232, 0) 100%);
    padding: clamp(2.5rem, 6vw, 4rem) 0;
  }

  .caps-inner {
    width: min(1120px, calc(100% - 2rem));
    margin: 0 auto;
    display: grid;
    gap: clamp(1.4rem, 3vw, 2rem);
  }

  .caps-head {
    text-align: center;
    display: grid;
    gap: 0.5rem;
    justify-items: center;
  }

  .caps-kicker {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--terra);
  }

  .caps-head h2 {
    margin: 0;
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: clamp(1.8rem, 5.4vw, 2.8rem);
    line-height: 1.04;
    color: var(--ink);
    text-wrap: balance;
  }

  .caps-lede {
    margin: 0;
    max-width: 52ch;
    color: var(--muted);
    line-height: 1.6;
    font-size: clamp(0.95rem, 2.2vw, 1.05rem);
  }

  .caps-grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.85rem;
    grid-template-columns: 1fr;
  }

  .cap-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    padding: 1rem 1.05rem 1.05rem;
    box-shadow: var(--shadow-soft);
    display: grid;
    gap: 0.4rem;
    border-top: 3px solid var(--alpine);
  }

  .cap-kicker {
    margin: 0;
    font-size: 0.62rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--terra);
  }

  .cap-card h3 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.15rem;
    color: var(--ink);
    letter-spacing: 0.005em;
  }

  .cap-copy {
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
    font-size: 0.94rem;
  }

  .cap-receipt {
    margin: 0.35rem 0 0;
    display: flex;
    gap: 0.4rem;
    align-items: flex-start;
    padding: 0.45rem 0.6rem;
    border-radius: 0.55rem;
    background: rgba(77, 89, 74, 0.06);
    border: 1px dashed rgba(77, 89, 74, 0.2);
    font-size: 0.78rem;
    color: rgba(74, 84, 72, 0.85);
    font-weight: 700;
  }

  .cap-receipt span:first-child {
    color: var(--terra);
    font-weight: 900;
  }

  .caps-footnote {
    margin: 0 auto;
    max-width: 58ch;
    text-align: center;
    color: rgba(74, 84, 72, 0.75);
    font-size: 0.85rem;
    line-height: 1.6;
  }

  @media (min-width: 640px) {
    .caps-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (min-width: 960px) {
    .caps-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
</style>
