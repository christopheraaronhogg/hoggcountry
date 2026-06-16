<script lang="ts">
  interface Props {
    id: string;
    name: string;
    icon: string;
    description: string;
    href: string;
    isEmergency?: boolean;
  }

  let { id, name, icon, description, href, isEmergency = false }: Props = $props();
</script>

<a
  class="tool-card"
  class:emergency={isEmergency}
  {href}
  data-tool-id={id}
>
  <span class="card-icon" aria-hidden="true">{icon}</span>
  <span class="card-name">{name}</span>
  <span class="card-desc">{description}</span>
</a>

<style>
  .tool-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    padding: 0.85rem 0.85rem 0.9rem;
    background: #fff;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.18s ease;
    min-height: 100%;
    overflow: hidden;
  }

  .tool-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--alpine, #7b9e6b), var(--pine, #4a5a44));
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .tool-card:hover {
    border-color: var(--alpine, #7b9e6b);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  .tool-card:hover::before {
    opacity: 1;
  }

  .tool-card:focus-visible {
    outline: 3px solid var(--alpine, #7b9e6b);
    outline-offset: 2px;
  }

  .tool-card.emergency {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.05), rgba(220, 38, 38, 0.02));
    border-color: rgba(220, 38, 38, 0.3);
  }

  .tool-card.emergency::before {
    background: #dc2626;
  }

  .tool-card.emergency:hover {
    border-color: rgba(220, 38, 38, 0.6);
  }

  .card-icon {
    font-size: 1.4rem;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .card-name {
    font-family: Oswald, sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--pine, #4a5a44);
    margin-bottom: 0.2rem;
    line-height: 1.15;
  }

  .tool-card.emergency .card-name {
    color: #dc2626;
  }

  .card-desc {
    font-size: 0.74rem;
    color: var(--muted, #888);
    line-height: 1.35;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .tool-card {
      padding: 0.7rem 0.65rem 0.75rem;
      border-radius: 10px;
    }

    .card-icon {
      font-size: 1.2rem;
      margin-bottom: 0.35rem;
    }

    .card-name {
      font-size: 0.8rem;
    }

    .card-desc {
      font-size: 0.68rem;
      line-height: 1.3;
    }
  }
</style>
