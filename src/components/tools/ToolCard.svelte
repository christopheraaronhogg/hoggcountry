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
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .tool-card:hover {
    border-color: var(--alpine, #7b9e6b);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .tool-card:focus-visible {
    outline: 3px solid var(--alpine, #7b9e6b);
    outline-offset: 2px;
  }

  .tool-card.emergency {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.05), rgba(220, 38, 38, 0.02));
    border-color: rgba(220, 38, 38, 0.3);
  }

  .tool-card.emergency:hover {
    border-color: rgba(220, 38, 38, 0.6);
  }

  .card-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .card-name {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--pine, #4a5a44);
    margin-bottom: 0.25rem;
  }

  .tool-card.emergency .card-name {
    color: #dc2626;
  }

  .card-desc {
    font-size: 0.7rem;
    color: var(--muted, #888);
    line-height: 1.3;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .tool-card {
      padding: 0.75rem 0.5rem;
    }

    .card-icon {
      font-size: 1.25rem;
    }

    .card-name {
      font-size: 0.8rem;
    }

    .card-desc {
      font-size: 0.65rem;
    }
  }
</style>
