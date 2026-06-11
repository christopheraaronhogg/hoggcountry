<script lang="ts">
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'hoggcountry:trail-assistant-profile:v1';

  let profileName = $state('');
  let profileEmail = $state('');
  let profileTrailName = $state('');
  let profileHomeBase = $state('');
  let profileStartDate = $state('');
  let profileDirection = $state('');
  let profileTargetMpd = $state('');
  let profileEmergencyContact = $state('');
  let profileMedicalNotes = $state('');

  let statusMsg = $state('');
  let statusColor = $state('#94a3b8');
  let previewLines: Array<[string, string]> = $state([]);
  let previewEmpty = $state(true);

  function normalizeText(value: unknown, max = 200): string {
    return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().slice(0, max);
  }

  function normalizeNumber(value: unknown, min = 0, max = 100): number | null {
    const parsed = Number.parseFloat(String(value || '').trim());
    if (!Number.isFinite(parsed)) return null;
    const clamped = Math.max(min, Math.min(max, parsed));
    return Number(clamped.toFixed(1));
  }

  interface ProfilePayload {
    profile_name?: unknown;
    profile_email?: unknown;
    profile_trail_name?: unknown;
    profile_home_base?: unknown;
    profile_start_date?: unknown;
    profile_direction?: unknown;
    profile_target_mpd?: unknown;
    profile_emergency_contact?: unknown;
    profile_medical_notes?: unknown;
    updated_at?: unknown;
  }

  interface SanitizedProfile {
    profile_name: string;
    profile_email: string;
    profile_trail_name: string;
    profile_home_base: string;
    profile_start_date: string;
    profile_direction: string;
    profile_target_mpd: string;
    profile_emergency_contact: string;
    profile_medical_notes: string;
    updated_at: string;
  }

  function sanitize(payload: unknown): SanitizedProfile {
    const raw = (payload && typeof payload === 'object' ? payload : {}) as ProfilePayload;
    const targetMpd = normalizeNumber(raw.profile_target_mpd, 0, 40);

    return {
      profile_name: normalizeText(raw.profile_name, 120),
      profile_email: normalizeText(raw.profile_email, 190).toLowerCase(),
      profile_trail_name: normalizeText(raw.profile_trail_name, 80),
      profile_home_base: normalizeText(raw.profile_home_base, 120),
      profile_start_date: normalizeText(raw.profile_start_date, 20),
      profile_direction: normalizeText(raw.profile_direction, 30),
      profile_target_mpd: targetMpd === null ? '' : String(targetMpd),
      profile_emergency_contact: normalizeText(raw.profile_emergency_contact, 190),
      profile_medical_notes: normalizeText(raw.profile_medical_notes, 300),
      updated_at: normalizeText(raw.updated_at, 80),
    };
  }

  function read(): SanitizedProfile | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const profile = sanitize(parsed);
      if (!profile.profile_name && !profile.profile_email && !profile.profile_trail_name) {
        return null;
      }
      return profile;
    } catch {
      return null;
    }
  }

  function apply(profile: SanitizedProfile | null) {
    const clean = sanitize(profile || {});
    profileName = clean.profile_name;
    profileEmail = clean.profile_email;
    profileTrailName = clean.profile_trail_name;
    profileHomeBase = clean.profile_home_base;
    profileStartDate = clean.profile_start_date;
    profileDirection = clean.profile_direction;
    profileTargetMpd = clean.profile_target_mpd;
    profileEmergencyContact = clean.profile_emergency_contact;
    profileMedicalNotes = clean.profile_medical_notes;
  }

  function collect(): SanitizedProfile {
    return sanitize({
      profile_name: profileName,
      profile_email: profileEmail,
      profile_trail_name: profileTrailName,
      profile_home_base: profileHomeBase,
      profile_start_date: profileStartDate,
      profile_direction: profileDirection,
      profile_target_mpd: profileTargetMpd,
      profile_emergency_contact: profileEmergencyContact,
      profile_medical_notes: profileMedicalNotes,
      updated_at: new Date().toISOString(),
    });
  }

  function render(profile: SanitizedProfile | null) {
    const active = profile && (profile.profile_name || profile.profile_email || profile.profile_trail_name);
    if (!active) {
      previewLines = [];
      previewEmpty = true;
      return;
    }

    const rows: Array<[string, string]> = [
      ['Name', profile.profile_name],
      ['Email', profile.profile_email],
      ['Trail name', profile.profile_trail_name],
      ['Home base', profile.profile_home_base],
      ['Start date', profile.profile_start_date],
      ['Direction', profile.profile_direction],
      ['Target miles/day', profile.profile_target_mpd],
      ['Emergency contact', profile.profile_emergency_contact],
      ['Medical notes', profile.profile_medical_notes],
      ['Saved', profile.updated_at],
    ].filter((row): row is [string, string] => Boolean(row[1]));

    previewLines = rows;
    previewEmpty = rows.length === 0;
  }

  function setStatus(message: string, tone: 'muted' | 'error' | 'success' = 'muted') {
    statusMsg = message;
    statusColor = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '#94a3b8';
  }

  function handleSave() {
    const profile = collect();
    if (!profile.profile_name || !profile.profile_email) {
      setStatus('Name and email are required to save profile state.', 'error');
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    render(profile);
    setStatus('Profile state saved for this browser.', 'success');
  }

  function handleClear() {
    window.localStorage.removeItem(STORAGE_KEY);
    apply(null);
    render(null);
    setStatus('Profile state cleared.', 'muted');
  }

  onMount(() => {
    const initial = read();
    apply(initial || null);
    render(initial);
    if (initial) {
      setStatus('Loaded saved profile state.', 'muted');
    }
  });
</script>

<svelte:head>
  <title>Trail Assistant Profile — Demo State</title>
  <meta name="description" content="Local profile state used by the Trail Assistant intake demo flow." />
</svelte:head>

<div class="trail-assistant-profile-page">
  <section class="card">
    <span class="pill">Trail Assistant</span>
    <h1>Profile state (demo)</h1>
    <p class="muted">
      This route gives a visible profile-state path for demo review. Data is stored in browser localStorage
      and reused by <a href="/trail-assistant">/trail-assistant</a> when submitting intake requests.
    </p>

    <div class="grid" style="margin-top: 10px;">
      <div>
        <label for="profile_name">Full name</label>
        <input id="profile_name" autocomplete="name" bind:value={profileName} />
      </div>
      <div>
        <label for="profile_email">Contact email</label>
        <input id="profile_email" type="email" autocomplete="email" bind:value={profileEmail} />
      </div>
      <div>
        <label for="profile_trail_name">Trail name</label>
        <input id="profile_trail_name" bind:value={profileTrailName} />
      </div>
      <div>
        <label for="profile_home_base">Home base</label>
        <input id="profile_home_base" placeholder="City, State" bind:value={profileHomeBase} />
      </div>
      <div>
        <label for="profile_start_date">Start date</label>
        <input id="profile_start_date" type="date" bind:value={profileStartDate} />
      </div>
      <div>
        <label for="profile_direction">Direction</label>
        <select id="profile_direction" bind:value={profileDirection}>
          <option value="">Select one</option>
          <option value="NOBO">NOBO</option>
          <option value="SOBO">SOBO</option>
          <option value="Flip-flop">Flip-flop</option>
          <option value="Section hike">Section hike</option>
        </select>
      </div>
      <div>
        <label for="profile_target_mpd">Target miles/day</label>
        <input id="profile_target_mpd" type="number" min="0" max="40" step="0.5" bind:value={profileTargetMpd} />
      </div>
      <div>
        <label for="profile_emergency_contact">Emergency contact</label>
        <input id="profile_emergency_contact" placeholder="Name + phone" bind:value={profileEmergencyContact} />
      </div>
    </div>

    <div style="margin-top: 12px;">
      <label for="profile_medical_notes">Medical considerations</label>
      <textarea id="profile_medical_notes" placeholder="Allergies, medication reminders, relevant injuries, etc." bind:value={profileMedicalNotes}></textarea>
    </div>

    <div class="actions">
      <button id="save" class="primary" type="button" onclick={handleSave}>Save profile state</button>
      <button id="clear" type="button" onclick={handleClear}>Clear profile state</button>
      <a href="/trail-assistant" style="display:inline-flex;align-items:center;padding:12px 16px;border:1px solid #334155;border-radius:10px;text-decoration:none;color:#dbeafe;">Back to intake</a>
    </div>

    <p id="status" class="small" aria-live="polite" style="margin-top: 10px; color: {statusColor};">{statusMsg}</p>
    <div id="preview" class="preview small">
      {#if previewEmpty}
        No saved profile yet.
      {:else}
        <ul>
          {#each previewLines as [label, value]}
            <li><strong>{label}:</strong> {value}</li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>
</div>

<style>
  .trail-assistant-profile-page {
    --ta-bg: #0f172a;
    --ta-card: #111827;
    --ta-text: #e5e7eb;
    --ta-muted: #9ca3af;
    --ta-line: #334155;
    --ta-accent: #22d3ee;

    max-width: 880px;
    margin: 0 auto;
    padding: 32px 20px 72px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: radial-gradient(circle at top, #1e293b 0%, var(--ta-bg) 52%);
    color: var(--ta-text);
    border-radius: 16px;
  }

  .trail-assistant-profile-page .card {
    border: 1px solid var(--ta-line);
    border-radius: 16px;
    background: linear-gradient(180deg, #0b1220, var(--ta-card));
    padding: 20px;
  }

  .trail-assistant-profile-page .pill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(34, 211, 238, 0.45);
    color: var(--ta-accent);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .trail-assistant-profile-page h1 {
    margin: 10px 0;
    font-size: clamp(1.4rem, 2.5vw, 2rem);
    color: var(--ta-text);
  }

  .trail-assistant-profile-page .muted {
    color: var(--ta-muted);
    line-height: 1.5;
  }

  .trail-assistant-profile-page .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .trail-assistant-profile-page label {
    display: block;
    margin-bottom: 6px;
    color: #d1d5db;
    font-size: 0.92rem;
  }

  .trail-assistant-profile-page input,
  .trail-assistant-profile-page select,
  .trail-assistant-profile-page textarea {
    width: 100%;
    border: 1px solid #475569;
    border-radius: 10px;
    padding: 11px 12px;
    background: #0b1220;
    color: #f8fafc;
    box-sizing: border-box;
  }

  .trail-assistant-profile-page textarea {
    min-height: 120px;
    resize: vertical;
  }

  .trail-assistant-profile-page .actions {
    margin-top: 14px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .trail-assistant-profile-page button {
    appearance: none;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #1e293b;
    color: #dbeafe;
    padding: 12px 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .trail-assistant-profile-page button.primary {
    background: #10b981;
    border-color: transparent;
    color: #052e16;
  }

  .trail-assistant-profile-page .preview {
    margin-top: 12px;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.72);
  }

  .trail-assistant-profile-page .preview ul {
    margin: 0;
    padding-left: 1rem;
    line-height: 1.6;
  }

  .trail-assistant-profile-page .small {
    font-size: 0.84rem;
    color: #94a3b8;
  }

  .trail-assistant-profile-page a {
    color: #67e8f9;
  }
</style>
