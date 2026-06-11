<svelte:head>
  <title>Trail Assistant — Request received</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="trail-assistant-thanks-page">
  <div class="card">
    <h1>Request received</h1>
    <p>Thanks — your trail request is now in queue.</p>
    <p>
      If your request is time-sensitive, email
      <a href="mailto:christopheraaronhogg@gmail.com?subject=Trail%20Assistant%20Urgent">christopheraaronhogg@gmail.com</a>
      with subject line <strong>Trail Assistant Urgent</strong>.
    </p>
    <p><a href="/trail-assistant">← Back to Trail Assistant</a></p>
    <p><a href="/trail-assistant-profile">View your saved profile state →</a></p>
  </div>
</div>

<style>
  .trail-assistant-thanks-page {
    max-width: 720px;
    margin: 6rem auto;
    padding: 1.25rem;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 16px;
  }

  .trail-assistant-thanks-page .card {
    border: 1px solid #334155;
    border-radius: 16px;
    background: #111827;
    padding: 1.5rem;
  }

  .trail-assistant-thanks-page h1 {
    color: #e2e8f0;
  }

  .trail-assistant-thanks-page p {
    color: #e2e8f0;
  }

  .trail-assistant-thanks-page a {
    color: #67e8f9;
  }
</style>
