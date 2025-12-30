<script>
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  // Props from parent
  let {
    isOpen = false,
    currentMile = 0,
    onClose = () => {},
    onSave = () => {}
  } = $props();

  // Form state
  let endMile = $state(0);
  let expenseAmount = $state('');
  let expenseCategory = $state('food');
  let notes = $state('');
  let campsite = $state('');

  // Categories matching BudgetCalculator
  const categories = [
    { id: 'food', name: 'Food & Resupply', icon: '🛒' },
    { id: 'lodging', name: 'Lodging', icon: '🏨' },
    { id: 'gear', name: 'Gear & Repairs', icon: '🎒' },
    { id: 'services', name: 'Town Services', icon: '🧺' },
    { id: 'transport', name: 'Transportation', icon: '🚗' },
    { id: 'entertainment', name: 'Entertainment', icon: '🍺' },
    { id: 'other', name: 'Other', icon: '📦' },
  ];

  // Trail landmarks for context
  const landmarks = [
    { mile: 0, name: 'Springer Mountain' },
    { mile: 31, name: 'Neels Gap' },
    { mile: 78, name: 'NC Border' },
    { mile: 110, name: 'Franklin' },
    { mile: 166, name: 'Fontana Dam' },
    { mile: 206, name: 'Newfound Gap' },
    { mile: 274, name: 'Hot Springs' },
    { mile: 386, name: 'Damascus' },
    { mile: 550, name: 'Pearisburg' },
    { mile: 702, name: 'Waynesboro' },
    { mile: 1025, name: 'Harpers Ferry' },
    { mile: 1099, name: 'Halfway Point' },
    { mile: 1290, name: 'Delaware Water Gap' },
    { mile: 1525, name: 'CT Border' },
    { mile: 1630, name: 'VT Border' },
    { mile: 1791, name: 'White Mountains' },
    { mile: 1912, name: 'Maine Border' },
    { mile: 2090, name: 'Monson' },
    { mile: 2198, name: 'Katahdin' },
  ];

  // Initialize endMile when modal opens
  $effect(() => {
    if (isOpen) {
      endMile = currentMile;
    }
  });

  // Get nearest landmark
  function getNearestLandmark(mile) {
    let closest = landmarks[0];
    let minDist = Math.abs(mile - landmarks[0].mile);
    for (const lm of landmarks) {
      const dist = Math.abs(mile - lm.mile);
      if (dist < minDist) {
        minDist = dist;
        closest = lm;
      }
    }
    const direction = mile >= closest.mile ? 'past' : 'before';
    const distance = Math.abs(mile - closest.mile);
    return { ...closest, direction, distance };
  }

  // Get next landmark
  function getNextLandmark(mile) {
    for (const lm of landmarks) {
      if (lm.mile > mile) return lm;
    }
    return landmarks[landmarks.length - 1];
  }

  let nearestLandmark = $derived(getNearestLandmark(endMile));
  let nextLandmark = $derived(getNextLandmark(endMile));
  let milesHikedToday = $derived(Math.max(0, endMile - currentMile));
  let percentComplete = $derived(((endMile / 2198) * 100).toFixed(1));

  // Quick mile adjustments
  function adjustMile(delta) {
    endMile = Math.max(0, Math.min(2198, endMile + delta));
  }

  // Save the log entry
  function saveEntry() {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      previousMile: currentMile,
      mile: endMile,
      milesHiked: milesHikedToday,
      expense: expenseAmount ? {
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        note: notes || undefined
      } : null,
      notes: notes || undefined,
      campsite: campsite || undefined,
    };

    // Save to daily logs
    const logs = JSON.parse(localStorage.getItem('at-daily-logs') || '[]');
    logs.unshift(entry);
    localStorage.setItem('at-daily-logs', JSON.stringify(logs));

    // If there's an expense, also add it to budget tracker
    if (entry.expense) {
      const budgetData = JSON.parse(localStorage.getItem('at-budget-data') || '{}');
      const expenses = budgetData.expenses || [];
      expenses.unshift({
        id: Date.now(),
        amount: entry.expense.amount,
        category: entry.expense.category,
        note: entry.expense.note || `Day log - Mile ${endMile}`,
        date: new Date().toISOString(),
      });
      budgetData.expenses = expenses;
      localStorage.setItem('at-budget-data', JSON.stringify(budgetData));
    }

    // Notify parent to update currentMile
    onSave(endMile);

    // Reset form
    expenseAmount = '';
    notes = '';
    campsite = '';

    // Close modal
    onClose();
  }

  // Close on escape
  function handleKeydown(e) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div class="backdrop" transition:fade={{ duration: 200 }} onclick={onClose}></div>

  <!-- Modal -->
  <div class="quick-log-modal" transition:fly={{ y: 100, duration: 300 }}>
    <div class="modal-header">
      <h2>End of Day Log</h2>
      <button class="close-btn" onclick={onClose}>×</button>
    </div>

    <div class="modal-body">
      <!-- Mile Input -->
      <div class="mile-section">
        <label class="section-label">Where are you now?</label>
        <div class="mile-input-row">
          <button class="mile-adjust" onclick={() => adjustMile(-5)}>−5</button>
          <button class="mile-adjust" onclick={() => adjustMile(-1)}>−1</button>
          <div class="mile-display">
            <input
              type="number"
              bind:value={endMile}
              min="0"
              max="2198"
              class="mile-input"
            />
            <span class="mile-label">miles</span>
          </div>
          <button class="mile-adjust" onclick={() => adjustMile(1)}>+1</button>
          <button class="mile-adjust" onclick={() => adjustMile(5)}>+5</button>
        </div>

        <div class="mile-context">
          <div class="context-item">
            <span class="context-icon">📍</span>
            <span>Near <strong>{nearestLandmark.name}</strong></span>
          </div>
          {#if milesHikedToday > 0}
            <div class="context-item hiked">
              <span class="context-icon">🥾</span>
              <span><strong>{milesHikedToday.toFixed(1)} mi</strong> today</span>
            </div>
          {/if}
          <div class="context-item">
            <span class="context-icon">📊</span>
            <span><strong>{percentComplete}%</strong> complete</span>
          </div>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: {percentComplete}%"></div>
          <div class="progress-marker" style="left: {percentComplete}%"></div>
        </div>
      </div>

      <!-- Quick Expense -->
      <div class="expense-section">
        <label class="section-label">Any spending today? <span class="optional">(optional)</span></label>
        <div class="expense-row">
          <div class="expense-amount-wrap">
            <span class="dollar-sign">$</span>
            <input
              type="number"
              bind:value={expenseAmount}
              placeholder="0"
              min="0"
              step="0.01"
              class="expense-input"
            />
          </div>
          <select bind:value={expenseCategory} class="category-select">
            {#each categories as cat}
              <option value={cat.id}>{cat.icon} {cat.name}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Campsite -->
      <div class="campsite-section">
        <label class="section-label">Where are you staying? <span class="optional">(optional)</span></label>
        <input
          type="text"
          bind:value={campsite}
          placeholder="Shelter name or campsite"
          class="text-input"
        />
      </div>

      <!-- Notes -->
      <div class="notes-section">
        <label class="section-label">Notes <span class="optional">(optional)</span></label>
        <textarea
          bind:value={notes}
          placeholder="How was today? Weather, highlights, thoughts..."
          class="notes-input"
          rows="3"
        ></textarea>
      </div>
    </div>

    <div class="modal-footer">
      <button class="cancel-btn" onclick={onClose}>Cancel</button>
      <button class="save-btn" onclick={saveEntry}>
        <span class="save-icon">✓</span>
        Log Day
      </button>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .quick-log-modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  @media (min-width: 600px) {
    .quick-log-modal {
      bottom: auto;
      top: 50%;
      left: 50%;
      right: auto;
      transform: translate(-50%, -50%);
      max-width: 480px;
      width: 90%;
      border-radius: 20px;
      max-height: 85vh;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, var(--pine), #3a4538);
    color: #fff;
  }

  .modal-header h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine);
    margin-bottom: 0.75rem;
  }

  .optional {
    font-weight: 400;
    text-transform: none;
    color: var(--muted);
    font-size: 0.75rem;
  }

  /* Mile Section */
  .mile-section {
    background: var(--bg);
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .mile-input-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .mile-adjust {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine);
    cursor: pointer;
    transition: all 0.15s;
  }

  .mile-adjust:hover {
    background: var(--alpine);
    color: #fff;
    border-color: var(--alpine);
  }

  .mile-adjust:active {
    transform: scale(0.95);
  }

  .mile-display {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .mile-input {
    width: 100px;
    padding: 0.75rem;
    border: 2px solid var(--pine);
    border-radius: 10px;
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--pine);
    text-align: center;
    background: #fff;
  }

  .mile-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .mile-label {
    font-size: 1rem;
    color: var(--muted);
  }

  .mile-context {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .context-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--muted);
    background: #fff;
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    border: 1px solid var(--border);
  }

  .context-item.hiked {
    background: rgba(166, 181, 137, 0.15);
    border-color: var(--alpine);
    color: var(--pine);
  }

  .context-icon {
    font-size: 0.9rem;
  }

  .progress-bar {
    height: 8px;
    background: #e0ddd4;
    border-radius: 4px;
    position: relative;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    border-radius: 4px;
    transition: width 0.3s;
  }

  .progress-marker {
    position: absolute;
    top: -4px;
    width: 4px;
    height: 16px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.3s;
  }

  /* Expense Section */
  .expense-row {
    display: flex;
    gap: 0.75rem;
  }

  .expense-amount-wrap {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    flex: 0 0 120px;
  }

  .dollar-sign {
    padding: 0.75rem;
    background: var(--bg);
    color: var(--muted);
    font-weight: 600;
    border-right: 1px solid var(--border);
  }

  .expense-input {
    flex: 1;
    padding: 0.75rem;
    border: none;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    width: 100%;
    min-width: 0;
  }

  .expense-input:focus {
    outline: none;
  }

  .category-select {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--ink);
    background: #fff;
    cursor: pointer;
    min-width: 0;
  }

  /* Text inputs */
  .text-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  .text-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .notes-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    resize: vertical;
    min-height: 80px;
    box-sizing: border-box;
  }

  .notes-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  /* Footer */
  .modal-footer {
    display: flex;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    border-top: 1px solid var(--border);
  }

  .cancel-btn {
    flex: 1;
    padding: 0.875rem 1.5rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background: var(--bg);
  }

  .save-btn {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 10px;
    background: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: var(--ink);
    transform: translateY(-1px);
  }

  .save-icon {
    font-size: 1.1rem;
  }
</style>
