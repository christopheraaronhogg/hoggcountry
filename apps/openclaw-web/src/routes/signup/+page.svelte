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
      No prep packet required. Use the beta passcode and an email to open a private workspace; Scout can ask for pace,
      gear, health, budget, and route details only when they matter.
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
  <div>
    <p class="eyebrow">Trail beta quick login</p>
    <div class="quick-login-grid">
      <button class="quick-login-option" type="submit" name="quickUsername" value="chris" formnovalidate>Chris</button>
      <button class="quick-login-option" type="submit" name="quickUsername" value="dad" formnovalidate>Dad</button>
    </div>
  </div>

  <label>
    <span class="eyebrow">Shared password</span>
    <input name="quickPassword" type="password" inputmode="numeric" autocomplete="current-password" placeholder="Password" value="0721" />
  </label>

  <div class="form-divider" aria-hidden="true"></div>

  <label>
    <span class="eyebrow">Beta passcode</span>
    <input name="passcode" type="password" inputmode="numeric" autocomplete="off" placeholder="Enter passcode" required />
  </label>

  <label>
    <span class="eyebrow">Name <small>(optional)</small></span>
    <input name="name" placeholder="Name, or leave blank" value={form?.name ?? ''} />
  </label>

  <label>
    <span class="eyebrow">Email</span>
    <input name="email" type="email" placeholder="you@example.com" value={form?.email ?? ''} />
  </label>

  <label>
    <span class="eyebrow">Trail name <small>(optional)</small></span>
    <input name="trailName" placeholder="Trail name, or leave blank" value={form?.trailName ?? ''} />
  </label>

  {#if form?.message}
    <p style="margin:0; color:#8a2f2f; font-weight:700;">{form.message}</p>
  {/if}

  <div class="subtle-actions">
    <button class="btn btn-secondary" type="submit">Start asking Scout</button>
  </div>
</form>

<style>
  .quick-login-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
    margin-top: 0.45rem;
  }

  .quick-login-option {
    min-height: 3rem;
    border: 1px solid rgba(89, 68, 43, 0.2);
    border-radius: 0.5rem;
    background: #fff8ed;
    color: #312417;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .quick-login-option:focus-visible {
    outline: 3px solid rgba(40, 104, 89, 0.35);
    outline-offset: 2px;
  }

  .form-divider {
    height: 1px;
    background: rgba(89, 68, 43, 0.16);
    margin: 0.15rem 0;
  }
</style>
