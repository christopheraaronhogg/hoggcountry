<script lang="ts">
  import { useSpacetimeDB, useTable } from 'spacetimedb/svelte';
  import { tables } from '$lib/module_bindings';

  const connection = useSpacetimeDB();
  const [announcements] = useTable(tables.publicAnnouncement);
  const [dadUpdates] = useTable(tables.dadUpdate);
</script>

<article class="card panel-copy">
  <p class="eyebrow">Spacetime preview</p>
  <h3>Realtime surface</h3>
  <p class="meta-line">
    {$connection.isActive
      ? 'Connected to the configured SpacetimeDB module.'
      : 'Provider is mounted, but the module is not connected yet.'}
  </p>

  <div class="badge-row" style="margin-top:0.8rem;">
    <span class="badge">Announcements {$announcements.length}</span>
    <span class="badge">Dad updates {$dadUpdates.length}</span>
  </div>
</article>
