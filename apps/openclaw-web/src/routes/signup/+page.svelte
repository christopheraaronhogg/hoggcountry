<script lang="ts">
  import type { ActionData } from './$types';

  const { form } = $props<{ form: ActionData }>();
</script>

<svelte:head>
  <title>Scout beta access | Hogg Country</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Scout beta</p>
    <h1>Start with Scout. Fill in details later.</h1>
    <p class="lede">
      No prep packet required. Use an email to open a private beta workspace; Scout can ask for pace, gear, health,
      budget, and route details only when they matter.
    </p>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">What opens up</p>
    <ul class="list-clean">
      <li>One ask box for trail decisions, prep, gear, food, and logistics.</li>
      <li>Optional profile and docs when you have them.</li>
      <li>Private workspace memory that can improve over time.</li>
    </ul>
  </article>
</section>

<form method="POST" class="card panel-copy" style="margin-top:1rem; display:grid; gap:0.9rem;">
  <label>
    <span class="eyebrow">Name <small>(optional)</small></span>
    <input name="name" placeholder="Name, or leave blank" />
  </label>

  <label>
    <span class="eyebrow">Email</span>
    <input name="email" type="email" placeholder="you@example.com" />
  </label>

  <label>
    <span class="eyebrow">Trail name <small>(optional)</small></span>
    <input name="trailName" placeholder="Trail name, or leave blank" />
  </label>

  {#if form?.message}
    <p style="margin:0; color:#8a2f2f; font-weight:700;">{form.message}</p>
  {/if}

  <div class="subtle-actions">
    <button class="btn btn-secondary" type="submit">Start asking Scout</button>
  </div>
</form>
