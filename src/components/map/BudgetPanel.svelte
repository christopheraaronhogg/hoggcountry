<script lang="ts">
  import { character } from '../../stores/character.svelte';
  
  let { onClose } = $props();

  // Mock budget calculations based on character settings
  const dailyBudget = $derived(Math.round((character.finance?.monthlyBudgets?.['2026-04']?.total || 1500) / 30));
  const spent = $derived(character.finance?.expenses?.reduce((s, e) => s + e.amount, 0) || 0);
  const remaining = $derived(5000 - spent); // Assuming 5k total budget for now
</script>

<div class="slidePanel right">
  <div class="panelHeader">
    <h2>Trail Finances</h2>
    <button class="closeBtn" onclick={onClose}>×</button>
  </div>
  <div class="panelContent">
    <div class="statRow">
      <span class="label">Daily Target</span>
      <span class="value">${dailyBudget} / day</span>
    </div>
    <div class="statRow">
      <span class="label">Total Spent</span>
      <span class="value">${spent}</span>
    </div>
    <div class="statRow">
      <span class="label">Remaining</span>
      <span class="value">${remaining}</span>
    </div>

    <div class="divider"></div>
    
    <div class="miniList">
        <h3>Recent Expenses</h3>
        {#if character.finance?.expenses?.length}
            {#each character.finance.expenses.slice(-3) as ex}
                 <div class="item">
                    <span class="ex-amt">${ex.amount}</span> 
                    <span class="ex-cat">{ex.category}</span>
                 </div>
            {/each}
        {:else}
            <div class="item muted">No expenses logged yet.</div>
        {/if}
    </div>

    <a class="panelLink" href="/tools/budget">Open Budget Tool →</a>
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
      display: flex;
      gap: 8px;
  }
  
  .ex-amt {
      font-weight: bold;
      color: #ef4444;
      min-width: 40px;
  }
  
  .muted { opacity: 0.6; font-style: italic; }

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
