<script lang="ts">
  import { character } from '../../stores/character.svelte';

  let { onClose } = $props();

  const baseWeight = $derived.by(() => {
    const items = character.equipment.inventory.items || [];
    const oz = items.filter(i => !i.worn).reduce((s, i) => s + (Number(i.weightOz) || 0), 0);
    return (oz / 16).toFixed(1);
  });
  
  const packWeight = $derived.by(() => {
     // Approx pack weight: Base + (2L water * 2.2) + (4 days food * 1.75)
     // This is just a rough estimate for the HUD
     const base = Number(baseWeight);
     const water = 2 * 2.2; 
     const food = 4 * 1.75;
     return (base + water + food).toFixed(1);
  });

  // Warmth derived from character sheet logic would be better, but we'll simplify for now
  // or import the computeWarmthStats if we want real data. 
  // For the HUD, let's just show base weight which is the most critical number.
</script>

<div class="slidePanel right">
  <div class="panelHeader">
    <h2>Gear Snapshot</h2>
    <button class="closeBtn" onclick={onClose}>×</button>
  </div>
  <div class="panelContent">
    <div class="statRow">
      <span class="label">Base Weight</span>
      <span class="value">{baseWeight} lb</span>
    </div>
    <div class="statRow">
      <span class="label">Total (Est.)</span>
      <span class="value">{packWeight} lb</span>
    </div>
    
    <div class="divider"></div>
    
    <div class="miniList">
        <h3>Big Three</h3>
        <div class="item">🎒 {character.equipment.slots.overridesByCategory?.pack || 'Pack'}</div>
        <div class="item">⛺ {character.equipment.slots.overridesByCategory?.shelter || 'Shelter'}</div>
        <div class="item">😴 {character.equipment.slots.overridesByCategory?.sleep || 'Sleep System'}</div>
    </div>

    <a class="panelLink" href="/tools/character">Manage Gear & My Profile →</a>
  </div>
</div>

<style>
  .slidePanel {
    position: absolute;
    top: 12px;
    bottom: 12px;
    right: 12px;
    width: 280px;
    max-width: 85%;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideIn {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .panelHeader {
    padding: 16px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    text-transform: uppercase;
    color: #374151;
  }

  .closeBtn {
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #6b7280;
    cursor: pointer;
    padding: 0 4px;
  }

  .panelContent {
    padding: 16px;
    flex: 1;
    overflow-y: auto;
  }

  .statRow {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.95rem;
  }

  .label {
    color: #6b7280;
  }

  .value {
    font-weight: 700;
    color: #1f2937;
    font-family: Oswald, sans-serif;
  }
  
  .divider {
      height: 1px;
      background: rgba(0,0,0,0.1);
      margin: 16px 0;
  }
  
  .miniList h3 {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #9ca3af;
      margin: 0 0 8px 0;
  }
  
  .item {
      font-size: 0.9rem;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }

  .panelLink {
    display: block;
    margin-top: 24px;
    text-align: center;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
  }
</style>
