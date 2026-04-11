<script lang="ts">
  import type { ActionData } from './$types';

  const { form } = $props<{ form: ActionData }>();
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Join beta</p>
    <h1>Get past the public porch and into the manual workspace.</h1>
    <p class="lede">
      This is a light beta gate, not a full account system. The goal is to make sure the product feels like a real
      hiker workspace before harder auth and sync work.
    </p>
  </div>

  <article class="card card-soft panel-copy">
    <p class="eyebrow">What opens up</p>
    <ul class="list-clean">
      <li>The setup flow that seeds your manual from Dad’s guide.</li>
      <li>Docs upload for private source material.</li>
      <li>The OpenClaw console that keeps telling you what the manual still needs.</li>
    </ul>
  </article>
</section>

<form method="POST" class="card panel-copy" style="margin-top:1rem; display:grid; gap:0.9rem;">
  <label>
    <span class="eyebrow">Name</span>
    <input name="name" placeholder="Christopher Hogg" />
  </label>

  <label>
    <span class="eyebrow">Email</span>
    <input name="email" type="email" placeholder="you@example.com" />
  </label>

  <label>
    <span class="eyebrow">Trail name</span>
    <input name="trailName" placeholder="HoggCountry" />
  </label>

  {#if form?.message}
    <p style="margin:0; color:#8a2f2f; font-weight:700;">{form.message}</p>
  {/if}

  <div class="subtle-actions">
    <button class="btn btn-secondary" type="submit">Enter the beta</button>
  </div>
</form>
