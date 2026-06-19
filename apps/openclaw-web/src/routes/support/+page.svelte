<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Support | Hogg Country</title>
  <meta name="description" content="Support for Hogg Country, Trail Assistant, and Scout planning tools." />
</svelte:head>

<section class="legal-page">
  <article class="legal-card">
    <p class="eyebrow">Hogg Country</p>
    <h1>Support</h1>
    <p class="updated">Last updated: June 19, 2026</p>

    <p>
      Need help with Trail Assistant, Scout, the Hogg Country site, or the Scout ChatGPT app? Email
      <a href="mailto:privacy@hoggcountry.com">privacy@hoggcountry.com</a>. Include your device type, app version if
      available, and the route or screen where the issue happened.
    </p>

    <h2>App Store And Google Play</h2>
    <p>
      Trail Assistant is built as an offline-first Appalachian Trail companion. The app does not require an account, and
      most features work without signing in. If a store review or support request needs a contact URL, use this page.
    </p>

    <h2>Model Download Help</h2>
    <p>
      On-device AI may require a large model download. Use Wi-Fi, keep the app open while the download is running, and
      retry if the connection drops. The rest of the app remains usable before the model is installed.
    </p>

    <h2>Privacy And Deletion</h2>
    <p>
      Trail Assistant has no accounts. To request deletion of a trail-condition report you submitted, email the support
      address with the approximate report date, trail mile, optional trail name, and note text so we can locate it.
      See the <a href={resolve('/privacy')}>privacy policy</a> for details.
    </p>

    <h2>Trail Data Questions</h2>
    <p>
      Hogg Country uses calibrated Appalachian Trail mile data and labels candidate field data honestly. If a distance,
      water source, shelter, town service, or trail note looks wrong, send the source you checked and the correction you
      recommend. See <a href={resolve('/data')}>Data &amp; Sources</a> for the data policy.
    </p>

    <h2>Emergency Notice</h2>
    <p>
      Trail Assistant and Scout are not emergency services. They cannot contact rescuers, monitor you in the background,
      or send distress alerts. In an emergency, call local emergency services or use a dedicated emergency device.
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
