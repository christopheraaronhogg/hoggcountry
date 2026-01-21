<script lang="ts">
  let { href, icon, name, desc } = $props<{
    href: string;
    icon: string;
    name: string;
    desc: string;
  }>();
</script>

<a class="card tool-card" href={href}>
  <div class="icon" aria-hidden="true">{icon}</div>
  <div class="body">
    <div class="name">{name}</div>
    <div class="desc">{desc}</div>
  </div>
</a>

<style>
  .tool-card {
    display: flex;
    gap: 0.9rem;
    padding: 1rem;
    text-decoration: none;
    color: inherit;
  }

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: rgba(166, 181, 137, 0.2);
    border: 1px solid var(--border);
    font-size: 1.4rem;
    flex: 0 0 auto;
  }

  .name {
    font-weight: 800;
    color: var(--ink);
    margin-bottom: 0.15rem;
  }

  .desc {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }
</style>

