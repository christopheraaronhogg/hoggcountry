<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Privacy Policy | Hogg Country</title>
  <meta name="description" content="Privacy policy for Hogg Country, Trail Assistant, and Scout planning tools." />
</svelte:head>

<section class="legal-page">
  <article class="legal-card">
    <p class="eyebrow">Hogg Country</p>
    <h1>Privacy Policy</h1>
    <p class="updated">Last updated: June 19, 2026</p>

    <p>
      This policy covers Hogg Country public content, the Trail Assistant mobile app, and Scout planning tools,
      including the Scout ChatGPT app. Trail Assistant is built to keep planning, journal, gear, scripture, and AI
      activity on your device unless you choose to send a trail-condition report.
    </p>

    <h2>Accounts, Ads, And Tracking</h2>
    <p>
      Trail Assistant does not require an account. It does not include advertising SDKs, third-party analytics,
      tracking pixels, advertising identifiers, or data-broker sharing.
    </p>

    <h2>Trail Assistant App Data</h2>
    <p>
      Most Trail Assistant data stays on your device, including journal entries, gear lists, settings, KJV reading,
      and on-device AI prompts and answers. If you choose to submit a trail-condition report, the report sends a
      condition tag, your optional note, your optional trail name, an approximate position along the Appalachian Trail
      as a trail-mile, and a timestamp to Hogg Country's real-time trail service.
    </p>
    <p>
      Raw GPS latitude and longitude are not transmitted with trail-condition reports. The shared position is the
      derived trail-mile, not your device coordinates. Current Android builds do not request Android location
      permission; iOS may use location on-device when you choose location-based features.
    </p>

    <h2>On-Device AI</h2>
    <p>
      Trail Assistant's local AI runs on the device. Your prompts, scripture questions, trail questions, and answers
      are not sent to an AI cloud by the mobile app. The optional model download is fetched from Hugging Face over
      HTTPS and is disclosed as a software download, not as personal-data collection.
    </p>

    <h2>Scout ChatGPT App</h2>
    <p>
      When you use Scout inside ChatGPT, OpenAI processes your ChatGPT conversation and app interactions under
      OpenAI's terms and privacy policy. The Scout ChatGPT app receives the planning details you choose to provide in
      ChatGPT, such as trail mile, direction, pace, water capacity, shelter preference, and planning notes. Current
      Scout ChatGPT tools are read-only: they do not save plans to a Scout account, send messages, contact emergency
      services, publish content, or push anything to a device.
    </p>

    <h2>Sources And Safety Caveats</h2>
    <p>
      Scout may return public Hogg Country content and open-reference Appalachian Trail candidate data. Candidate data
      can be incomplete or stale. Always verify live weather, closures, water reliability, permits, fees, town services,
      and safety conditions with current official or local sources before relying on them in the field.
    </p>

    <h2>Deletion Requests</h2>
    <p>
      There are no user accounts to delete. To request deletion of a trail-condition report you submitted, email
      <a href="mailto:privacy@hoggcountry.com">privacy@hoggcountry.com</a> with enough detail for us to locate it,
      such as the approximate date, optional trail name, note text, or trail mile.
    </p>

    <h2>Contact</h2>
    <p>
      For privacy questions or app support, email <a href="mailto:privacy@hoggcountry.com">privacy@hoggcountry.com</a>
      or visit <a href={resolve('/support')}>hoggcountry.com/support</a>.
    </p>
  </article>
</section>

<style>
  .legal-page {
    width: min(100%, 960px);
    margin: 0 auto;
    padding: clamp(2rem, 6vw, 4rem) 1.25rem 5rem;
  }

  .legal-card {
    max-width: 760px;
    color: var(--ink, #243426);
  }

  .eyebrow,
  .updated {
    color: var(--muted, #6a7469);
    margin: 0 0 0.75rem;
  }

  h1 {
    margin: 0 0 0.75rem;
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    color: var(--pine, #2e4334);
  }

  h2 {
    margin: 2rem 0 0.65rem;
    color: var(--pine, #2e4334);
    font-size: 1.15rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  p {
    margin: 0 0 1rem;
    color: var(--muted, #5f6a5f);
    line-height: 1.75;
  }

  a {
    color: var(--pine, #2e4334);
    font-weight: 700;
  }
</style>
