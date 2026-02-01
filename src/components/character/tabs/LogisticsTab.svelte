<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  const resupply = $derived(character.logistics.resupply);
  const mail = $derived(character.logistics.mail);
  const drops = $derived(Object.values(mail.dropsById || {}));

  const enabledCount = $derived.by(() => drops.filter((d: any) => !!d?.enabled).length);
  const shippedCount = $derived.by(() => drops.filter((d: any) => !!d?.shipped).length);
  const receivedCount = $derived.by(() => drops.filter((d: any) => !!d?.received).length);

  function setResupplyPatch(patch: Partial<typeof character.logistics.resupply>) {
    updateCharacter({ logistics: { resupply: patch } } as any);
  }

  function setMailPatch(patch: Partial<typeof character.logistics.mail>) {
    updateCharacter({ logistics: { mail: patch } } as any);
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Resupply</h2>
    <p class="p">Preferences that drive resupply filtering and carry windows.</p>

    <div class="mini" aria-label="Resupply summary">
      <div class="mini-card">
        <div class="mini-k">Carry days</div>
        <div class="mini-v">{resupply.carryDays}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Mail-drop only</div>
        <div class="mini-v">{resupply.mailDropOnly ? 'YES' : 'NO'}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Require grocery</div>
        <div class="mini-v">{resupply.requireGrocery ? 'YES' : 'NO'}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Require outfitter</div>
        <div class="mini-v">{resupply.requireOutfitter ? 'YES' : 'NO'}</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem;">
      <label class="field">
        <span class="k">Carry days</span>
        <input
          class="in"
          type="number"
          min="1"
          max="10"
          step="1"
          value={resupply.carryDays}
          onchange={(e) => setResupplyPatch({ carryDays: toNumber((e.currentTarget as HTMLInputElement).value, resupply.carryDays) })}
        />
      </label>

      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Filters</span>
        <div class="checks">
          <label class="check">
            <input type="checkbox" checked={resupply.mailDropOnly} onchange={(e) => setResupplyPatch({ mailDropOnly: (e.currentTarget as HTMLInputElement).checked })} />
            <span>Mail drop only</span>
          </label>
          <label class="check">
            <input type="checkbox" checked={resupply.requireGrocery} onchange={(e) => setResupplyPatch({ requireGrocery: (e.currentTarget as HTMLInputElement).checked })} />
            <span>Require grocery</span>
          </label>
          <label class="check">
            <input type="checkbox" checked={resupply.requireOutfitter} onchange={(e) => setResupplyPatch({ requireOutfitter: (e.currentTarget as HTMLInputElement).checked })} />
            <span>Require outfitter</span>
          </label>
        </div>
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/resupply/">Open Resupply Tool</a>
    </div>
  </div>

  <div class="card">
    <h2 class="h">Mail Drops</h2>
    <p class="p">Addressing and default shipping assumptions. Manage individual drops in the tool.</p>

    <div class="mini" aria-label="Mail drop summary">
      <div class="mini-card">
        <div class="mini-k">Enabled</div>
        <div class="mini-v">{enabledCount}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Shipped</div>
        <div class="mini-v">{shippedCount}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Received</div>
        <div class="mini-v">{receivedCount}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Defaults</div>
        <div class="mini-v">{mail.triggerLeadMiles} mi</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem;">
      <label class="field">
        <span class="k">Hiker name</span>
        <input class="in" value={mail.hikerName} onchange={(e) => setMailPatch({ hikerName: (e.currentTarget as HTMLInputElement).value })} />
      </label>

      <label class="field">
        <span class="k">Support name</span>
        <input class="in" value={mail.supportName} onchange={(e) => setMailPatch({ supportName: (e.currentTarget as HTMLInputElement).value })} />
      </label>

      <label class="field">
        <span class="k">Support phone</span>
        <input class="in" value={mail.supportPhone} onchange={(e) => setMailPatch({ supportPhone: (e.currentTarget as HTMLInputElement).value })} />
      </label>

      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Return address</span>
        <textarea class="ta" rows="3" onchange={(e) => setMailPatch({ returnAddress: (e.currentTarget as HTMLTextAreaElement).value })}>{mail.returnAddress}</textarea>
      </label>

      <label class="field">
        <span class="k">Trigger lead miles</span>
        <input
          class="in"
          type="number"
          min="0"
          max="400"
          step="5"
          value={mail.triggerLeadMiles}
          onchange={(e) => setMailPatch({ triggerLeadMiles: toNumber((e.currentTarget as HTMLInputElement).value, mail.triggerLeadMiles) })}
        />
      </label>

      <label class="field">
        <span class="k">Default hold time (days)</span>
        <input
          class="in"
          type="number"
          min="1"
          max="60"
          step="1"
          value={mail.defaultHoldTimeDays}
          onchange={(e) => setMailPatch({ defaultHoldTimeDays: toNumber((e.currentTarget as HTMLInputElement).value, mail.defaultHoldTimeDays) })}
        />
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/mail/">Open Mail Drops Tool</a>
    </div>
  </div>
</div>
