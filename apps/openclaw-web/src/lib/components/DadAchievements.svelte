<script lang="ts">
  import { DAD_HIKE_ACHIEVEMENTS } from '$lib/dad-hike';
</script>

<section class="achievements" aria-label="Dad’s achievements">
  <h2>Official certifications</h2>
  <div class="achievement-list">
    {#each DAD_HIKE_ACHIEVEMENTS as achievement}
      <article>
        <span class="symbol" aria-hidden="true">{achievement.symbol}</span>
        <h3>{achievement.title}</h3>
        <p>{achievement.detail}</p>
      </article>
    {/each}
  </div>
</section>

<style>
  .achievements { margin: 2rem auto; max-width: 900px; text-align: center; }
  h2 { color: var(--pine); font-size: 1rem; letter-spacing: .08em; text-transform: uppercase; }
  .achievement-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
  article { padding: 1.1rem .8rem; border: 1px solid var(--border); border-radius: 14px; background: rgba(255,255,255,.72); }
  .symbol { font-size: 1.6rem; color: var(--marker, #df7a00); }
  h3 { margin: .5rem 0; color: var(--pine); font-size: 1rem; line-height: 1.4; }
  p { margin: 0; color: var(--muted); font-size: .85rem; line-height: 1.5; }
  @media (max-width: 600px) { .achievement-list { grid-template-columns: 1fr; } }
</style>
