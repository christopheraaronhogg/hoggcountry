<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Terms of Service | Hogg Country</title>
  <meta name="description" content="Terms for Hogg Country, Trail Assistant, and Scout planning tools." />
</svelte:head>

<section class="legal-page">
  <article class="legal-card">
    <p class="eyebrow">Hogg Country</p>
    <h1>Terms of Service</h1>
    <p class="updated">Last updated: June 19, 2026</p>

    <p>
      These terms apply to Hogg Country public content, the Trail Assistant mobile app, and Scout planning tools,
      including the Scout ChatGPT app. By using these tools, you agree to use them as planning aids, not as a substitute
      for judgment, official sources, or emergency services.
    </p>

    <h2>Planning Aid Only</h2>
    <p>
      Scout provides source leads, candidate trail context, and planning scaffolds for Appalachian Trail conversations.
      It does not guarantee current conditions, route safety, legal camping availability, water reliability, shuttle
      availability, lodging, store hours, permits, fees, or emergency response.
    </p>

    <h2>Field Responsibility</h2>
    <p>
      You are responsible for verifying live weather, closures, water, trail conditions, rules, permits, town services,
      transportation, and safety information before using any plan outdoors. Conditions can change quickly, and the app
      may contain incomplete or outdated information.
    </p>

    <h2>No Emergency Services</h2>
    <p>
      Scout cannot contact emergency responders, monitor your location, send rescue alerts, or provide medical advice.
      In an emergency, contact local emergency services or use your dedicated emergency communication device.
    </p>

    <h2>AI And Source Limits</h2>
    <p>
      Trail Assistant and Scout can generate planning text from local app data, public Hogg Country content, scripture,
      and candidate trail references. Generated output can be wrong or stale. Verify important facts before relying on
      them in the field.
    </p>

    <h2>Read-Only ChatGPT App</h2>
    <p>
      The current Scout ChatGPT app is read-only. It does not save plans to a Scout account, modify Hogg Country
      content, publish content, send messages, make purchases, or push notifications to devices.
    </p>

    <h2>Content And Availability</h2>
    <p>
      Hogg Country may change, remove, or update content and tools at any time. The tools are provided as-is without
      warranties of accuracy, availability, fitness for a particular trip, or uninterrupted service.
    </p>

    <h2>Contact</h2>
    <p>
      For support or questions about these terms, email <a href="mailto:privacy@hoggcountry.com">privacy@hoggcountry.com</a>
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
