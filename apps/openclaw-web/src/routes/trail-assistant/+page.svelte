<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  const API_BASE = (env.PUBLIC_API_BASE_URL || 'https://hoggcountry.on-forge.com/api/v1').replace(/\/+$/, '');
  const THANKS_PATH = resolve('/trail-assistant-thanks');

  // Profile state
  let profileName = $state('');
  let profileEmail = $state('');
  let profileTrailName = $state('');
  let profileHomeBase = $state('');
  let profileStartDate = $state('');
  let profileDirection = $state('');
  let profileTargetMpd = $state('');
  let profileEmergencyContact = $state('');
  let profileMedicalNotes = $state('');

  // Intake form state
  let intakeName = $state('');
  let intakeEmail = $state('');
  let intakeTrailStage = $state('');
  let intakeUrgency = $state('');
  let intakeRequest = $state('');
  let intakeContext = $state('');
  let intakeBotField = $state('');

  // Status state
  let profileStatusMsg = $state('');
  let profileStatusColor = $state('#94a3b8');
  let intakeStatusMsg = $state('');
  let intakeStatusColor = $state('#94a3b8');
  let submitDisabled = $state(false);

  // Profile preview state
  let profilePreviewLines: Array<[string, string]> = $state([]);
  let profilePreviewEmpty = $state(true);

  const PROFILE_STORAGE_KEY = 'hoggcountry:trail-assistant-profile:v1';

  function normalizeText(value: unknown, max = 12000): string {
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

  function sanitizeProfile(payload: unknown): SanitizedProfile {
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

  function readProfile(): SanitizedProfile | null {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const profile = sanitizeProfile(parsed);
      if (!profile.profile_name && !profile.profile_email && !profile.profile_trail_name) {
        return null;
      }
      return profile;
    } catch {
      return null;
    }
  }

  function collectProfileFromFields(): SanitizedProfile {
    return sanitizeProfile({
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

  function applyProfileToFields(profile: SanitizedProfile | null) {
    const clean = sanitizeProfile(profile || {});
    profileName = clean.profile_name;
    profileEmail = clean.profile_email;
    profileTrailName = clean.profile_trail_name;
    profileHomeBase = clean.profile_home_base;
    profileStartDate = clean.profile_start_date;
    profileDirection = clean.profile_direction;
    profileTargetMpd = clean.profile_target_mpd;
    profileEmergencyContact = clean.profile_emergency_contact;
    profileMedicalNotes = clean.profile_medical_notes;

    if (clean.profile_name && !intakeName.trim()) {
      intakeName = clean.profile_name;
    }
    if (clean.profile_email && !intakeEmail.trim()) {
      intakeEmail = clean.profile_email;
    }
  }

  function saveProfile(profile: SanitizedProfile) {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  function clearProfile() {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  }

  function renderProfilePreview(profile: SanitizedProfile | null) {
    const hasProfile = profile && (profile.profile_name || profile.profile_email || profile.profile_trail_name);
    if (!hasProfile) {
      profilePreviewLines = [];
      profilePreviewEmpty = true;
      return;
    }

    const lines: Array<[string, string]> = [
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

    profilePreviewLines = lines;
    profilePreviewEmpty = lines.length === 0;
  }

  function setProfileStatus(message: string, tone: 'muted' | 'error' | 'success' = 'muted') {
    profileStatusMsg = message;
    profileStatusColor = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '#94a3b8';
  }

  function setIntakeStatus(message: string, tone: 'muted' | 'error' | 'success' = 'muted') {
    intakeStatusMsg = message;
    intakeStatusColor = tone === 'error' ? '#fca5a5' : tone === 'success' ? '#86efac' : '#94a3b8';
  }

  function profileToMetadata(profile: SanitizedProfile | null) {
    if (!profile) return null;

    const payload = {
      name: profile.profile_name || null,
      email: profile.profile_email || null,
      trail_name: profile.profile_trail_name || null,
      home_base: profile.profile_home_base || null,
      start_date: profile.profile_start_date || null,
      direction: profile.profile_direction || null,
      target_miles_per_day: profile.profile_target_mpd ? Number(profile.profile_target_mpd) : null,
      emergency_contact: profile.profile_emergency_contact || null,
      medical_notes: profile.profile_medical_notes || null,
    };

    if (Object.values(payload).every((value) => value === null || value === '')) {
      return null;
    }

    return payload;
  }

  async function submitToApi(formDataValues: {
    trail_stage: string;
    urgency: string;
    request: string;
    context: string;
    name: string;
    email: string;
  }) {
    const routeLabel = normalizeText(formDataValues.trail_stage, 24);
    const urgency = normalizeText(formDataValues.urgency || 'normal', 20);
    const requestText = normalizeText(formDataValues.request, 12000);
    const contextText = normalizeText(formDataValues.context, 12000);
    const name = normalizeText(formDataValues.name, 120);
    const email = normalizeText(formDataValues.email, 190);
    const profile = readProfile();

    if (!routeLabel || !requestText) {
      throw new Error('Missing required fields for API intake.');
    }

    const subject = `${routeLabel} | ${urgency} | ${requestText.slice(0, 80)}`.slice(0, 160);
    const message = [
      requestText,
      contextText ? `\n\nContext:\n${contextText}` : '',
      `\n\nUrgency: ${urgency}`,
    ].join('');

    const idempotencyKey = `ta-web-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    const response = await fetch(`${API_BASE}/trail-assistant/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        route_label: routeLabel,
        source: 'web_form',
        name,
        email,
        subject,
        message,
        metadata: {
          urgency,
          context: contextText || null,
          route_label_raw: formDataValues.trail_stage || null,
          user_agent: navigator.userAgent || null,
          profile_snapshot: profileToMetadata(profile),
          profile_saved_at: profile?.updated_at || null,
        },
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const hint = (payload as { error?: { message?: string } })?.error?.message || `API intake failed (${response.status}).`;
      throw new Error(hint);
    }
  }

  function handleProfileSave() {
    const profile = collectProfileFromFields();
    if (!profile.profile_name || !profile.profile_email) {
      setProfileStatus('Name and email are required to save profile state.', 'error');
      return;
    }

    saveProfile(profile);
    applyProfileToFields(profile);
    renderProfilePreview(profile);
    setProfileStatus('Profile state saved for this browser.', 'success');
  }

  function handleProfileClear() {
    clearProfile();
    applyProfileToFields(null);
    renderProfilePreview(null);
    setProfileStatus('Saved profile cleared.', 'muted');
  }

  async function handleIntakeSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (intakeBotField) {
      setIntakeStatus('Submission blocked.', 'error');
      return;
    }

    submitDisabled = true;
    setIntakeStatus('Submitting request…');

    try {
      await submitToApi({
        trail_stage: intakeTrailStage,
        urgency: intakeUrgency,
        request: intakeRequest,
        context: intakeContext,
        name: intakeName,
        email: intakeEmail,
      });
      setIntakeStatus('Request sent. Redirecting…', 'success');
      window.location.assign(THANKS_PATH);
      return;
    } catch (apiError) {
      const apiMessage = apiError instanceof Error ? apiError.message : 'API intake failed.';
      setIntakeStatus(`${apiMessage} Request was not queued. Please email support directly.`, 'error');
    } finally {
      submitDisabled = false;
    }
  }

  onMount(() => {
    const initialProfile = readProfile();
    if (initialProfile) {
      applyProfileToFields(initialProfile);
      renderProfilePreview(initialProfile);
      setProfileStatus('Loaded saved profile state.', 'muted');
    } else {
      renderProfilePreview(null);
    }
  });
</script>

<svelte:head>
  <title>Trail Assistant — Appalachian Trail Planning &amp; On-Trail Support</title>
  <meta name="description" content="Get practical help planning your Appalachian Trail hike and handling on-trail logistics." />
</svelte:head>

<div class="trail-assistant-page">
  <h1>Trail Assistant</h1>
  <p class="sub">
    Practical Appalachian Trail support for pre-trail planning and on-trail logistics.
    Ask a question, get a real action plan, and keep moving.
  </p>

  <section class="card">
    <span class="pill">How this works</span>
    <h2>Fast help for real trail decisions</h2>
    <ul>
      <li><strong>Pre-trail:</strong> gear shakedown, pacing, resupply strategy, start-date planning.</li>
      <li><strong>On-trail:</strong> town logistics, weather pivots, schedule adjustments, contingency planning.</li>
      <li><strong>Output:</strong> concise, actionable plan (not generic fluff).</li>
    </ul>
  </section>

  <section class="card" id="profile-state">
    <span class="pill">Profile state</span>
    <h2>Save your hiker profile</h2>
    <p class="muted">
      Keep a simple profile snapshot for repeat requests. For this demo path, profile data is saved only in your browser
      and attached to intake metadata when available.
    </p>

    <div class="grid">
      <div>
        <label for="profile_name">Full name</label>
        <input id="profile_name" name="profile_name" autocomplete="name" bind:value={profileName} />
      </div>
      <div>
        <label for="profile_email">Contact email</label>
        <input id="profile_email" name="profile_email" type="email" autocomplete="email" bind:value={profileEmail} />
      </div>
      <div>
        <label for="profile_trail_name">Trail name (optional)</label>
        <input id="profile_trail_name" name="profile_trail_name" bind:value={profileTrailName} />
      </div>
      <div>
        <label for="profile_home_base">Home base</label>
        <input id="profile_home_base" name="profile_home_base" placeholder="City, State" bind:value={profileHomeBase} />
      </div>
      <div>
        <label for="profile_start_date">Start date</label>
        <input id="profile_start_date" name="profile_start_date" type="date" bind:value={profileStartDate} />
      </div>
      <div>
        <label for="profile_direction">Direction</label>
        <select id="profile_direction" name="profile_direction" bind:value={profileDirection}>
          <option value="">Select one</option>
          <option value="NOBO">NOBO</option>
          <option value="SOBO">SOBO</option>
          <option value="Flip-flop">Flip-flop</option>
          <option value="Section hike">Section hike</option>
        </select>
      </div>
      <div>
        <label for="profile_target_mpd">Target miles/day</label>
        <input id="profile_target_mpd" name="profile_target_mpd" type="number" min="0" max="40" step="0.5" bind:value={profileTargetMpd} />
      </div>
      <div>
        <label for="profile_emergency_contact">Emergency contact</label>
        <input id="profile_emergency_contact" name="profile_emergency_contact" placeholder="Name + phone" bind:value={profileEmergencyContact} />
      </div>
    </div>

    <div style="margin-top: 12px;">
      <label for="profile_medical_notes">Medical considerations (optional)</label>
      <textarea id="profile_medical_notes" name="profile_medical_notes" placeholder="Allergies, medication reminders, relevant injuries, etc." bind:value={profileMedicalNotes}></textarea>
    </div>

    <div class="actions-row">
      <button id="profile-save-button" class="btn btn-secondary" type="button" onclick={handleProfileSave}>Save profile locally</button>
      <button id="profile-clear-button" class="btn btn-ghost" type="button" onclick={handleProfileClear}>Clear saved profile</button>
    </div>

    <p id="profile-status" class="small" aria-live="polite" style="margin: 10px 0 0; color: {profileStatusColor};">{profileStatusMsg}</p>
    <div id="profile-preview" class="profile-preview small">
      {#if profilePreviewEmpty}
        No saved profile yet.
      {:else}
        <ul>
          {#each profilePreviewLines as [label, value] (label)}
            <li><strong>{label}:</strong> {value}</li>
          {/each}
        </ul>
      {/if}
    </div>

    <p class="small" style="margin-top: 12px;">
      Need the dedicated profile path? <a href={resolve('/trail-assistant-profile')}>Open Trail Assistant Profile →</a><br />
      Need BYOS proof for demo? <a href={resolve('/trail-assistant-byos')}>Run BYOS readiness check →</a>
    </p>
  </section>

  <section class="card" id="intake">
    <span class="pill">Request support</span>
    <h2>Send your trail request</h2>
    <p class="muted">
      Fill this out and we'll route your request into the Trail Assistant queue.
    </p>

    <form id="trail-assistant-intake-form" name="trail-assistant-intake" method="POST" action={THANKS_PATH} onsubmit={handleIntakeSubmit}>
      <input type="hidden" name="service" value="trail-assistant" />
      <p style="display:none;">
        <label>Don't fill this out: <input name="bot-field" bind:value={intakeBotField} /></label>
      </p>

      <div class="grid">
        <div>
          <label for="name">Name</label>
          <input id="name" name="name" autocomplete="name" required bind:value={intakeName} />
        </div>
        <div>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required bind:value={intakeEmail} />
        </div>
        <div>
          <label for="trail_stage">Trail stage</label>
          <select id="trail_stage" name="trail_stage" required bind:value={intakeTrailStage}>
            <option value="">Select one</option>
            <option value="pre-trail">Pre-trail planning</option>
            <option value="on-trail">Currently on trail</option>
            <option value="post-finish">Post-finish review</option>
          </select>
        </div>
        <div>
          <label for="urgency">Urgency</label>
          <select id="urgency" name="urgency" required bind:value={intakeUrgency}>
            <option value="">Select one</option>
            <option value="normal">Normal (24–48h)</option>
            <option value="soon">Soon (same day)</option>
            <option value="urgent">Urgent (today)</option>
          </select>
        </div>
      </div>

      <div style="margin-top: 12px;">
        <label for="request">What do you need help with?</label>
        <textarea id="request" name="request" placeholder="Example: Starting NOBO April 2. Need 10-day food strategy, first two resupplies, and backup plan for cold rain week in the Smokies." required bind:value={intakeRequest}></textarea>
      </div>

      <div style="margin-top: 12px;">
        <label for="context">Optional context</label>
        <textarea id="context" name="context" placeholder="Current fitness, injuries, budget constraints, gear you already own, planned start date, etc." bind:value={intakeContext}></textarea>
      </div>

      <div style="margin-top: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <button id="intake-submit-button" class="btn" type="submit" disabled={submitDisabled}>Send Trail Request</button>
        <span class="small">By submitting, you agree to receive a response by email.</span>
      </div>
      <p id="intake-status" class="small" aria-live="polite" style="margin: 10px 0 0; color: {intakeStatusColor};">{intakeStatusMsg}</p>
    </form>
  </section>

  <section class="card">
    <span class="pill">Security note</span>
    <p class="muted">
      We never ask for account passwords, payment credentials, or remote machine access.
      If anyone asks you for those in the name of Trail Assistant, do not share them.
    </p>
  </section>

  <p class="small" style="margin-top: 18px;">
    Need this in plain email? Send details to
    <a href="mailto:christopheraaronhogg@gmail.com?subject=Trail%20Assistant%20Request">christopheraaronhogg@gmail.com</a>
    with subject: <strong>Trail Assistant Request</strong>.
  </p>
</div>

<style>
  .trail-assistant-page {
    --ta-bg: #0f172a;
    --ta-card: #111827;
    --ta-text: #e5e7eb;
    --ta-muted: #9ca3af;
    --ta-line: #334155;
    --ta-accent: #22d3ee;
    --ta-ok: #10b981;

    max-width: 880px;
    margin: 0 auto;
    padding: 32px 20px 72px;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: radial-gradient(circle at top, #1e293b 0%, var(--ta-bg) 50%);
    color: var(--ta-text);
    border-radius: 16px;
  }

  .trail-assistant-page h1 {
    margin: 0 0 10px;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    color: var(--ta-text);
  }

  .trail-assistant-page .sub {
    color: var(--ta-muted);
    line-height: 1.55;
    margin-bottom: 24px;
  }

  .trail-assistant-page .card {
    background: linear-gradient(180deg, #0b1220, var(--ta-card));
    border: 1px solid var(--ta-line);
    border-radius: 16px;
    padding: 20px;
    margin-top: 16px;
  }

  .trail-assistant-page .pill {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(34, 211, 238, 0.45);
    color: var(--ta-accent);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .trail-assistant-page h2 {
    margin: 12px 0;
    font-size: 1.2rem;
    color: var(--ta-text);
  }

  .trail-assistant-page ul {
    margin: 0;
    padding-left: 18px;
    color: #d1d5db;
    line-height: 1.6;
  }

  .trail-assistant-page .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .trail-assistant-page label {
    display: block;
    font-size: 0.92rem;
    color: #d1d5db;
    margin-bottom: 6px;
  }

  .trail-assistant-page input,
  .trail-assistant-page select,
  .trail-assistant-page textarea {
    width: 100%;
    border: 1px solid #475569;
    border-radius: 10px;
    padding: 11px 12px;
    background: #0b1220;
    color: #f8fafc;
    box-sizing: border-box;
  }

  .trail-assistant-page textarea {
    min-height: 120px;
    resize: vertical;
  }

  .trail-assistant-page .btn {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 12px 16px;
    font-weight: 700;
    background: var(--ta-ok);
    color: #052e16;
    cursor: pointer;
  }

  .trail-assistant-page .btn:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }

  .trail-assistant-page .btn-secondary {
    background: #1e293b;
    color: #dbeafe;
    border-color: #334155;
  }

  .trail-assistant-page .btn-ghost {
    background: transparent;
    border-color: #334155;
    color: #cbd5e1;
  }

  .trail-assistant-page .muted {
    color: var(--ta-muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .trail-assistant-page .small {
    font-size: 0.82rem;
    color: #94a3b8;
  }

  .trail-assistant-page .actions-row {
    margin-top: 12px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .trail-assistant-page .profile-preview {
    margin-top: 12px;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.7);
  }

  .trail-assistant-page .profile-preview ul {
    margin: 0;
    padding-left: 1rem;
  }

  .trail-assistant-page .profile-preview li {
    margin: 0 0 0.35rem;
  }

  .trail-assistant-page a {
    color: #67e8f9;
  }
</style>
