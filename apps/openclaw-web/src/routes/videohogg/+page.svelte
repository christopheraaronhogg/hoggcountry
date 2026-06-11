<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // Resolve API base and allowlists from public env vars (same fallbacks as Astro source)
  const apiBase = (
    import.meta.env.PUBLIC_API_BASE_URL || 'https://hoggcountry.on-forge.com/api/v1'
  ).replace(/\/+$/, '');

  const allowedEmailsCsv = (
    import.meta.env.PUBLIC_VIDEOHOGG_ALLOWED_EMAILS ||
    import.meta.env.PUBLIC_VIDEOHOGG_DAD_EMAIL ||
    'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com,chris.stitchscreen@gmail.com'
  ).trim();

  const youtubeIdeasAllowedEmailsCsv = (
    import.meta.env.PUBLIC_VIDEOHOGG_YOUTUBE_IDEA_EMAILS ||
    'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com,chris.stitchscreen@gmail.com'
  ).trim();

  let appCleanup: (() => void) | undefined;

  onMount(() => {
    // An async onMount callback cannot return a cleanup function, so the
    // browser-only imports run in a detached async block and cleanup is
    // handled by onDestroy below.
    void (async () => {
      // Dynamically import the vanilla-JS app module (browser only)
      const { initVideoHogg } = await import('./videohogg-app.js');
      initVideoHogg(apiBase, allowedEmailsCsv, youtubeIdeasAllowedEmailsCsv);

      // Remotion self-edit editor: React/Remotion resolve from the hoisted root
      // node_modules. The module self-mounts into #remotion-editor-root on import,
      // so it must load after the markup exists and only in the browser.
      try {
        await import('../../../../../src/scripts/videohogg-remotion');
      } catch (err) {
        console.warn('[VideoHogg] Remotion editor unavailable in this build:', err);
      }
    })();
  });

  onDestroy(() => {
    appCleanup?.();
  });
</script>

<svelte:head>
  <title>VideoHogg — Intake</title>
  <meta name="description" content="Upload raw clips and add per-video notes for VideoHogg production runs." />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="videohogg-page">
  <section class="hero">
    <span class="chapter font-chapter">VideoHogg</span>
    <h1 class="font-display">Upload Clips. Send. Done.</h1>
    <p>Phone-first intake for fast trail uploads with minimal typing.</p>
  </section>

  <section class="container intake-wrap">
    <article class="intake-card">
      <header class="intake-head">
        <h2 class="font-display">Gate Check</h2>
        <p id="gate-status" class="gate-status" aria-live="polite">Checking account access...</p>
      </header>

      <div id="gate-actions" class="gate-actions" hidden>
        <section class="coming-soon" aria-labelledby="coming-soon-title">
          <p class="coming-soon-kicker font-chapter">Private Family Beta</p>
          <h3 id="coming-soon-title" class="font-display">VideoHogg is almost ready.</h3>
          <p class="coming-soon-copy">
            We're polishing the self-edit workflow and MiniHogg handoff pipeline.
            For now, this page is only available to Dad + CodeHogg accounts.
          </p>

          <div class="coming-soon-grid" role="list" aria-label="What is coming soon">
            <p class="coming-soon-chip" role="listitem">Timeline trims + smart batch handoff</p>
            <p class="coming-soon-chip" role="listitem">YouTube link → title/description options</p>
            <p class="coming-soon-chip" role="listitem">Channel defaults + deterministic manifests</p>
            <p class="coming-soon-chip" role="listitem">MiniHogg queue processing + return package</p>
          </div>

          <div class="coming-soon-actions">
            <a id="login-link" class="btn btn-primary" href="/login?redirect=%2Fvideohogg">Sign in with Google</a>
            <p class="coming-soon-note">Allowed family emails are currently private-beta only.</p>
          </div>
        </section>
      </div>

      <div id="workspace" class="workspace" hidden>
        <section class="studio-shell" aria-label="VideoHogg studio shell">
          <div class="studio-head">
            <div class="studio-identity">
              <p class="studio-kicker">First-Class Tooling</p>
              <h3 class="font-display">VideoHogg Studio</h3>
              <p class="studio-copy">Fast clip handoff from the trail. Minimal taps, clear status, quick exit.</p>
            </div>
            <div class="studio-meta">
              <p id="studio-account-chip" class="studio-chip studio-chip--account">Account: checking...</p>
              <p class="studio-chip studio-chip--state">Draft autosave: on</p>
              <p class="studio-chip studio-chip--state">Queue handoff: MiniHogg</p>
            </div>
          </div>

          <nav class="studio-nav" aria-label="VideoHogg sections">
            <a class="studio-nav-link" href="#vh-upload">Upload</a>
            <a class="studio-nav-link" href="#vh-clips">Clip Notes</a>
            <a class="studio-nav-link" href="#vh-brief">Editor Brief</a>
            <a class="studio-nav-link" href="#advanced-tools-section">Advanced</a>
            <a class="studio-nav-link" href="#vh-submit">Submit</a>
          </nav>
        </section>

        <section class="simple-flow-intro" aria-label="Quick flow">
          <p class="simple-flow-kicker">Quick Send</p>
          <h3 class="font-display">Upload clips, tag what matters, submit.</h3>
          <p class="simple-flow-copy">
            Standard package returns automatically after processing.
          </p>
        </section>

        <div class="mode-switch" id="flow-mode-switch" data-mode="fast" aria-label="Workflow mode">
          <button id="flow-mode-fast" type="button" class="mode-btn is-active" aria-pressed="true" data-mode-value="fast">Quick Send Mode</button>
          <button id="flow-mode-builder" type="button" class="mode-btn mode-btn-hidden" aria-pressed="false" data-mode-value="builder" hidden aria-hidden="true" tabindex="-1">Builder</button>
        </div>
        <div class="flow-mode-actions">
          <button id="dad-quick-start" type="button" class="btn btn-primary dad-quick-start">Use Dad Defaults</button>
          <p id="flow-mode-copy" class="flow-mode-copy">Optimized for phone upload and fast submission.</p>
        </div>
        <div id="flow-rail" class="flow-rail" aria-label="VideoHogg flow progress">
          <p id="flow-step-upload" class="flow-step" data-state="todo">1. Upload</p>
          <p id="flow-step-notes" class="flow-step" data-state="todo">2. Notes</p>
          <p id="flow-step-submit" class="flow-step" data-state="todo">3. Submit</p>
        </div>
        <p id="flow-rail-status" class="flow-rail-status">Add clips to unlock submit.</p>

        <section id="vh-upload" class="panel panel-upload">
          <div class="panel-head">
            <h3 class="font-display">1) Upload files</h3>
            <button id="clear-files" type="button" class="ghost">Clear All</button>
          </div>

          <label class="dropzone" id="dropzone" for="video-files">
            <input id="video-files" type="file" accept="video/*" multiple />
            <span class="dropzone-title">Drop videos here or click to browse</span>
            <span class="dropzone-sub">Any raw clips are fine (MP4, MOV, M4V, MKV, WEBM, AVI, MPEG).</span>
          </label>

          <p id="file-summary" class="summary">No files selected yet.</p>
        </section>

        <section id="vh-clips" class="panel panel-clips">
          <div class="panel-head">
            <h3 class="font-display">2) Add notes per file</h3>
            <span class="hint">Each file gets its own preview card and notes field</span>
          </div>

          <p id="clip-empty" class="clip-empty">Upload files to start adding per-file notes.</p>
          <div id="clip-board" class="clip-board" aria-live="polite"></div>
        </section>

        <section id="vh-brief" class="panel panel-brief">
          <details class="brief-details">
            <summary>Optional: editing goals</summary>
            <p class="advanced-tools-copy">Skip this unless you want to direct style, pacing, and CTA.</p>

            <p class="brief-presets-label">Quick starter from Dad:</p>
            <div id="editor-brief-presets" class="brief-presets" role="group" aria-label="Quick brief presets">
              <button id="brief-preset-dad" type="button" class="preset-btn" data-preset="dad">Dad on the AT</button>
              <button id="brief-preset-family" type="button" class="preset-btn" data-preset="family">Family recap</button>
              <button id="brief-preset-inspiration" type="button" class="preset-btn" data-preset="inspiration">Inspiration video</button>
            </div>

            <label class="run-notes-label" for="editor-brief-tone">Audience + tone</label>
            <select id="editor-brief-tone">
              <option value="">Pick one</option>
              <option value="dad-on-the-at">Dad on the AT</option>
              <option value="family-recaps">Family recap</option>
              <option value="inspiration-video">Inspiration / motivation</option>
              <option value="training-log">Training log</option>
            </select>

            <label class="run-notes-label" for="editor-brief-intent">Cut feel</label>
            <textarea
              id="editor-brief-intent"
              rows="2"
              placeholder="Hook tone, energy, pacing."
            ></textarea>

            <label class="run-notes-label" for="editor-brief-must-keep">Must keep</label>
            <textarea
              id="editor-brief-must-keep"
              rows="2"
              placeholder="Critical moments or lines."
            ></textarea>

            <label class="run-notes-label" for="editor-brief-skip">Avoid</label>
            <textarea
              id="editor-brief-skip"
              rows="2"
              placeholder="What to skip."
            ></textarea>

            <label class="run-notes-label" for="editor-brief-cta">Final CTA</label>
            <textarea
              id="editor-brief-cta"
              rows="2"
              placeholder="How to end."
            ></textarea>
            <p id="brief-draft-status" class="summary brief-draft-status">Draft: no optional editor brief yet.</p>
          </details>
        </section>

        <section class="advanced-tools" id="advanced-tools-section">
          <details>
            <summary>Advanced tools (optional)</summary>
            <p class="advanced-tools-copy">Skip this unless you want to self-edit timeline details or override defaults.</p>

        <section class="panel panel-remotion">
          <div class="panel-head panel-head--stack">
            <div class="panel-head-title">
              <h3 class="font-display">Advanced: Remotion timeline editor <span class="beta-badge">Beta</span></h3>
              <span class="hint">Optional self-editing before handoff</span>
            </div>
          </div>
          <p class="summary">
            Trim, reorder, and exclude clips in timeline before queue submission.
          </p>
          <div id="remotion-editor-root" class="remotion-editor-root"></div>
        </section>

        <section class="panel panel-settings">
          <div class="panel-head panel-head--stack">
            <div class="panel-head-title">
              <h3 class="font-display">Advanced: output + handoff overrides</h3>
              <span class="hint">Priority: job overrides → channel defaults → system defaults</span>
            </div>
          </div>

          <div class="settings-grid">
            <label class="setting-field" for="channel-profile-select">
              <span>Channel profile</span>
              <select id="channel-profile-select">
                <option value="youtube_longform">YouTube Long Form</option>
                <option value="youtube_short">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram_reel">Instagram Reel</option>
              </select>
            </label>

            <label class="setting-field" for="target-duration-minutes">
              <span>Run target (minutes)</span>
              <input id="target-duration-minutes" type="number" min="1" max="60" step="1" value="9" />
            </label>

            <label class="setting-field" for="title-options-count">
              <span>Title options</span>
              <input id="title-options-count" type="number" min="1" max="8" step="1" value="3" />
            </label>

            <label class="setting-field" for="description-options-count">
              <span>Description options</span>
              <input id="description-options-count" type="number" min="1" max="8" step="1" value="3" />
            </label>

            <label class="setting-field" for="aspect-ratio-override">
              <span>Aspect ratio override</span>
              <select id="aspect-ratio-override">
                <option value="auto">Use channel default</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </label>
          </div>

          <div class="settings-switches">
            <label><input id="chapter-toggle" type="checkbox" checked /> Include chapter timestamps</label>
            <label><input id="transcript-toggle" type="checkbox" checked /> Include transcript</label>
            <label><input id="short-toggle" type="checkbox" checked /> Include short social clip</label>
          </div>

          <label class="run-notes-label" for="handoff-instructions">Editor handoff instructions (optional)</label>
          <textarea
            id="handoff-instructions"
            rows="3"
            placeholder="Tell the editor what matters: hook focus, pacing, must-keep moments, CTA, scripture/theme anchors, etc."
          ></textarea>

          <div class="panel-head panel-head--compact">
            <h4>Thumbnail reference assets</h4>
            <button id="clear-thumbnail-refs" type="button" class="ghost">Clear Refs</button>
          </div>
          <label class="dropzone dropzone--thumb" for="thumbnail-ref-files">
            <input id="thumbnail-ref-files" type="file" accept="image/*" multiple />
            <span class="dropzone-title">Add thumbnail references</span>
            <span class="dropzone-sub">Upload examples of style, framing, and typography to guide output.</span>
          </label>

          <label class="run-notes-label" for="thumbnail-ref-notes">Thumbnail notes (optional)</label>
          <textarea
            id="thumbnail-ref-notes"
            rows="2"
            placeholder="Style notes shared across all thumbnail references (contrast, text hierarchy, logo placement)."
          ></textarea>

          <p id="thumbnail-ref-summary" class="summary">No thumbnail references attached.</p>
          <div id="thumbnail-ref-board" class="thumb-ref-board" aria-live="polite"></div>
        </section>

        <section class="panel panel-youtube-ideas" id="youtube-ideas-panel" hidden>
          <div class="panel-head panel-head--stack">
            <div class="panel-head-title">
              <h3 class="font-display">Advanced: YouTube URL → 3+3 options</h3>
              <span class="hint">MiniHogg queue request for title + description options (YouTube URL only)</span>
            </div>
          </div>

          <label class="run-notes-label" for="youtube-ideas-url">YouTube video URL</label>
          <input id="youtube-ideas-url" class="ideas-input" type="url" placeholder="https://www.youtube.com/watch?v=..." />

          <label class="run-notes-label" for="youtube-ideas-notes">Optional focus notes</label>
          <textarea
            id="youtube-ideas-notes"
            rows="3"
            placeholder="Optional context for better options: audience, hook angle, verse/theme, key moment, CTA..."
          ></textarea>

          <button id="youtube-ideas-start" type="button" class="btn btn-primary start">Queue MiniHogg Ideas</button>

          <p id="youtube-ideas-status" class="status">Ready.</p>

          <div id="youtube-ideas-result" class="result" hidden>
            <p><strong>Request run:</strong> <span id="youtube-ideas-run-id"></span></p>
            <div class="ideas-columns">
              <div>
                <p class="ideas-title">Title options</p>
                <ol id="youtube-ideas-title-list" class="ideas-list"></ol>
              </div>
              <div>
                <p class="ideas-title">Description options</p>
                <ol id="youtube-ideas-description-list" class="ideas-list"></ol>
              </div>
            </div>
          </div>
        </section>
        </details>
        </section>

        <section id="vh-submit" class="panel panel-run">
          <div class="panel-head panel-head--stack">
            <div class="panel-head-title">
              <h3 class="font-display">3) Submit job</h3>
              <span class="hint">We'll return the standard VideoHogg package automatically.</span>
            </div>
          </div>

          <label class="run-notes-label" for="run-notes">Job notes (optional)</label>
          <textarea
            id="run-notes"
            rows="4"
            placeholder="Anything that applies to the whole job: mood, pacing, must-keep moments, call-to-action, scripture/theme anchors, etc."
          ></textarea>

          <button id="start-run" type="button" class="btn btn-primary start">Submit Files for Editing</button>
          <p id="run-readiness-note" class="run-readiness-note">Add clips to unlock submit.</p>

          <div class="progress-wrap" aria-live="polite">
            <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div id="progress-bar" class="progress-bar"></div>
            </div>
            <p id="run-status" class="status">Ready.</p>
          </div>

          <div id="run-result" class="result" hidden>
            <p><strong>Job ID:</strong> <span id="run-id"></span></p>
            <p><strong>Uploaded clips:</strong> <span id="uploaded-count"></span></p>
            <p><strong>Clip notes attached:</strong> <span id="noted-count"></span></p>
            <p id="brief-line" hidden><strong>Editor brief:</strong> <span id="brief-summary"></span></p>
            <p id="edits-line" hidden><strong>Remotion edits:</strong> <span id="edits-summary"></span></p>
            <p id="settings-line" hidden><strong>Resolved settings:</strong> <span id="settings-summary"></span></p>
            <p id="thumbnail-line" hidden><strong>Thumbnail refs:</strong> <span id="thumbnail-summary"></span></p>
          </div>

          <div id="service-status-card" class="service-status-card" hidden>
            <div class="service-status-head">
              <p class="service-kicker">VideoHogg service lifecycle</p>
              <span id="service-status-chip" class="service-status-chip">Submitted</span>
            </div>
            <p id="service-status-message" class="service-status-message">
              Request captured. MiniHogg will move this into active work soon.
            </p>
            <p id="service-status-note-line" class="service-status-note" hidden>
              <strong>Latest note:</strong> <span id="service-status-note"></span>
            </p>

            <ul id="service-status-timeline" class="service-status-timeline" aria-live="polite"></ul>

            <div id="delivery-package" class="delivery-package" hidden>
              <p class="ideas-title">Final delivery package</p>
              <div class="ideas-columns">
                <div>
                  <p class="ideas-title">Title options</p>
                  <ol id="delivery-title-list" class="ideas-list"></ol>
                </div>
                <div>
                  <p class="ideas-title">Description options</p>
                  <ol id="delivery-description-list" class="ideas-list"></ol>
                </div>
              </div>
              <ul id="delivery-links" class="delivery-links"></ul>
            </div>
          </div>
        </section>

        <section class="mobile-submit-dock" aria-label="Mobile submit controls">
          <p id="mobile-submit-meta" class="mobile-submit-meta">Add clips to unlock submit.</p>
          <button id="mobile-submit-button" type="button" class="btn btn-primary mobile-submit-button">Submit Files for Editing</button>
        </section>
      </div>
    </article>
  </section>
</div>

<style>
  /* Root wrapper — all classes below apply within .videohogg-page to avoid global leakage.
     The app also generates DOM at runtime, so we use :global() for dynamically-created classes. */

  .videohogg-page {
    /* intentionally no extra layout: the public layout wraps us in .container.public-page-wrap */
  }

  /* ─── Hero ─────────────────────────────────────────────────────────────── */
  .videohogg-page :global(.hero) {
    /* inherits from site global .hero if present */
  }

  /* ─── Intake shell ───────────────────────────────────────────────────── */
  .videohogg-page :global(.intake-wrap) {
    --vh-ink: #1f2937;
    --vh-muted: #4a5448;
    --vh-pine: #4d594a;
    --vh-lime: #a6b589;
    --vh-gold: #f0e000;
    --vh-panel-bg: rgba(255, 255, 255, 0.88);
    --vh-panel-border: rgba(77, 89, 74, 0.22);
    max-width: 1080px;
    padding-bottom: 4rem;
  }

  .videohogg-page :global(.intake-card) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    border-radius: 18px;
    background:
      radial-gradient(120% 88% at 96% 2%, rgba(166, 181, 137, 0.24), transparent 62%),
      radial-gradient(140% 84% at 0% 100%, rgba(240, 224, 0, 0.16), transparent 64%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.84));
    box-shadow:
      0 24px 44px rgba(34, 33, 29, 0.10),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    overflow: hidden;
  }

  .videohogg-page :global(.intake-head) {
    padding: 1rem 1.1rem 0.6rem;
    border-bottom: 1px dashed rgba(77, 89, 74, 0.25);
    background:
      repeating-linear-gradient(
        -15deg,
        rgba(166, 181, 137, 0.08),
        rgba(166, 181, 137, 0.08) 10px,
        rgba(240, 224, 0, 0.10) 10px,
        rgba(240, 224, 0, 0.10) 20px
      );
  }

  .videohogg-page :global(.intake-head h2) {
    margin: 0;
    font-size: clamp(1.2rem, 2vw, 1.5rem);
  }

  .videohogg-page :global(.gate-status) {
    margin: 0.45rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.92rem;
  }

  .videohogg-page :global(.gate-status[data-type='error']) {
    color: #b91c1c;
  }

  .videohogg-page :global(.gate-status[data-type='success']) {
    color: #166534;
  }

  .videohogg-page :global(.gate-actions) {
    padding: 1rem 1.1rem 1.2rem;
  }

  .videohogg-page :global(.coming-soon) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    border-radius: 14px;
    padding: 1rem;
    background:
      radial-gradient(120% 90% at 5% 0%, rgba(240, 224, 0, 0.16), transparent 56%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.86));
    box-shadow: 0 14px 28px rgba(34, 33, 29, 0.08);
  }

  .videohogg-page :global(.coming-soon-kicker) {
    margin: 0;
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--pine, #4d594a);
  }

  .videohogg-page :global(.coming-soon h3) {
    margin: 0.28rem 0 0;
    font-size: clamp(1.2rem, 2vw, 1.45rem);
    line-height: 1.15;
  }

  .videohogg-page :global(.coming-soon-copy) {
    margin: 0.55rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.9rem;
    max-width: 62ch;
    line-height: 1.55;
  }

  .videohogg-page :global(.coming-soon-grid) {
    margin-top: 0.75rem;
    display: grid;
    gap: 0.45rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .videohogg-page :global(.coming-soon-chip) {
    margin: 0;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    color: #1f2937;
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1.25;
    padding: 0.42rem 0.72rem;
  }

  .videohogg-page :global(.coming-soon-actions) {
    margin-top: 0.85rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem 0.8rem;
  }

  .videohogg-page :global(.coming-soon-note) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.76rem;
    line-height: 1.35;
  }

  .videohogg-page :global(.workspace) {
    display: grid;
    gap: 1rem;
    padding: 1rem 1rem 1.2rem;
  }

  .videohogg-page :global(.studio-shell) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    border-radius: 14px;
    background:
      radial-gradient(145% 120% at 100% 0%, rgba(240, 224, 0, 0.16), transparent 64%),
      radial-gradient(130% 130% at 0% 100%, rgba(166, 181, 137, 0.2), transparent 62%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(252, 251, 245, 0.9));
    box-shadow: 0 12px 26px rgba(31, 41, 55, 0.08);
    padding: 0.85rem;
    display: grid;
    gap: 0.75rem;
  }

  .videohogg-page :global(.studio-head) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .videohogg-page :global(.studio-identity) {
    display: grid;
    gap: 0.28rem;
    min-width: 220px;
    flex: 1;
  }

  .videohogg-page :global(.studio-kicker) {
    margin: 0;
    color: var(--pine, #4d594a);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .videohogg-page :global(.studio-identity h3) {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.15;
  }

  .videohogg-page :global(.studio-copy) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.8rem;
    line-height: 1.45;
    max-width: 60ch;
  }

  .videohogg-page :global(.studio-meta) {
    display: grid;
    gap: 0.35rem;
    min-width: 220px;
    justify-items: end;
  }

  .videohogg-page :global(.studio-chip) {
    margin: 0;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.26);
    background: rgba(255, 255, 255, 0.82);
    color: #374151;
    font-size: 0.7rem;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 0.28rem 0.58rem;
    width: fit-content;
  }

  .videohogg-page :global(.studio-chip--account) {
    border-color: rgba(22, 101, 52, 0.28);
    background: rgba(220, 252, 231, 0.62);
    color: #14532d;
  }

  .videohogg-page :global(.studio-nav) {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.42rem;
    overflow-x: auto;
    scrollbar-width: thin;
    padding-bottom: 0.1rem;
  }

  .videohogg-page :global(.studio-nav-link) {
    text-decoration: none;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.22);
    background: rgba(255, 255, 255, 0.82);
    color: var(--pine, #4d594a);
    font-size: 0.73rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 0.35rem 0.62rem;
    white-space: nowrap;
    transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
  }

  .videohogg-page :global(.studio-nav-link:hover) {
    border-color: rgba(77, 89, 74, 0.42);
    background: rgba(240, 224, 0, 0.18);
    color: #1f2937;
  }

  .videohogg-page :global(.panel) {
    border: 1px solid var(--vh-panel-border);
    border-radius: 14px;
    background: var(--vh-panel-bg);
    box-shadow:
      0 10px 24px rgba(31, 41, 55, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
    padding: 0.9rem;
  }

  .videohogg-page :global(.panel-head) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
  }

  .videohogg-page :global(.panel-head--stack) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .videohogg-page :global(.panel-head-title) {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .videohogg-page :global(.beta-badge) {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(240, 224, 0, 0.35);
    color: #735c00;
    border: 1px solid rgba(240, 224, 0, 0.5);
    vertical-align: middle;
    margin-left: 0.35rem;
  }

  .videohogg-page :global(.panel-head h3) {
    margin: 0;
    font-size: 1rem;
    line-height: 1.2;
  }

  .videohogg-page :global(.hint) {
    color: var(--muted-accessible, #4a5448);
    font-size: 0.78rem;
  }

  .videohogg-page :global(.panel-head--compact) {
    margin-top: 0.8rem;
    margin-bottom: 0.55rem;
    padding-top: 0.45rem;
    border-top: 1px dashed rgba(77, 89, 74, 0.24);
  }

  .videohogg-page :global(.panel-head--compact h4) {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.94rem;
    letter-spacing: 0.01em;
    color: var(--ink, #1f2937);
  }

  .videohogg-page :global(.panel-upload),
  .videohogg-page :global(.panel-clips),
  .videohogg-page :global(.panel-settings),
  .videohogg-page :global(.panel-youtube-ideas),
  .videohogg-page :global(.panel-run) {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.82));
  }

  .videohogg-page :global(.panel-settings) {
    border-style: dashed;
  }

  .videohogg-page :global(#editor-brief-tone),
  .videohogg-page :global(.panel-brief textarea) {
    width: 100%;
    min-height: 38px;
    border: 1px solid rgba(77, 89, 74, 0.3);
    border-radius: 9px;
    background: #fffef8;
    color: #1f2937;
    font: inherit;
    padding: 0.45rem 0.58rem;
    box-sizing: border-box;
  }

  .videohogg-page :global(.panel-brief textarea) {
    min-height: 78px;
    resize: vertical;
  }

  .videohogg-page :global(#editor-brief-tone) {
    background: #fffef8;
  }

  .videohogg-page :global(.simple-flow-intro) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    border-radius: 14px;
    background:
      radial-gradient(120% 130% at 95% 0%, rgba(166, 181, 137, 0.2), transparent 48%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(245, 242, 232, 0.9));
    padding: 0.95rem 1rem;
    margin-bottom: 0.25rem;
  }

  .videohogg-page :global(.mode-switch) {
    display: inline-flex;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.3);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.82);
    max-width: 320px;
  }

  .videohogg-page :global(.mode-btn) {
    border: 0;
    background: transparent;
    padding: 0.52rem 0.9rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    color: #374151;
  }

  .videohogg-page :global(.mode-btn.is-active) {
    background: rgba(166, 181, 137, 0.2);
    color: #1f2937;
  }

  .videohogg-page :global(.flow-mode-copy) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.82rem;
    line-height: 1.45;
  }

  .videohogg-page :global(.flow-mode-actions) {
    display: grid;
    gap: 0.45rem;
    justify-content: start;
  }

  .videohogg-page :global(.dad-quick-start) {
    width: fit-content;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.01em;
    padding: 0.42rem 0.75rem;
  }

  .videohogg-page :global(.brief-details) {
    border: 1px dashed rgba(77, 89, 74, 0.3);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.76);
    padding: 0.55rem 0.6rem;
  }

  .videohogg-page :global(.brief-details > summary) {
    cursor: pointer;
    list-style: none;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.9rem;
    color: var(--pine, #4d594a);
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .videohogg-page :global(.brief-details > summary::-webkit-details-marker) {
    display: none;
  }

  .videohogg-page :global(.brief-details > summary::after) {
    content: '＋';
    font-size: 0.9rem;
    color: var(--pine, #4d594a);
  }

  .videohogg-page :global(.brief-details[open] > summary::after) {
    content: '－';
  }

  .videohogg-page :global(.flow-rail) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.42rem;
    margin-top: 0.1rem;
  }

  .videohogg-page :global(.flow-step) {
    margin: 0;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.22);
    background: rgba(255, 255, 255, 0.8);
    color: #4b5563;
    font-size: 0.74rem;
    line-height: 1.25;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    text-align: center;
    padding: 0.4rem 0.5rem;
  }

  .videohogg-page :global(.flow-step[data-state='active']) {
    border-color: rgba(77, 89, 74, 0.35);
    color: #374151;
    background: rgba(245, 242, 232, 0.9);
  }

  .videohogg-page :global(.flow-step[data-state='done']),
  .videohogg-page :global(.flow-step[data-state='ready']) {
    border-color: rgba(22, 101, 52, 0.35);
    color: #14532d;
    background: rgba(220, 252, 231, 0.72);
  }

  .videohogg-page :global(.flow-rail-status) {
    margin: -0.1rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .videohogg-page :global(.brief-draft-status) {
    margin-top: 0.6rem;
    border-radius: 9px;
    border: 1px dashed rgba(77, 89, 74, 0.3);
    background: rgba(245, 242, 232, 0.62);
    padding: 0.45rem 0.55rem;
    font-size: 0.78rem;
  }

  .videohogg-page :global(.simple-flow-kicker) {
    margin: 0;
    color: var(--pine, #4d594a);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .videohogg-page :global(.simple-flow-intro h3) {
    margin: 0.35rem 0 0;
    font-size: 1.05rem;
    line-height: 1.2;
  }

  .videohogg-page :global(.simple-flow-copy) {
    margin: 0.55rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.84rem;
    line-height: 1.5;
  }

  .videohogg-page :global(.advanced-tools) {
    border: 1px dashed rgba(77, 89, 74, 0.32);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.72);
    padding: 0.72rem;
    margin-top: 0.1rem;
  }

  .videohogg-page :global(.advanced-tools > summary) {
    cursor: pointer;
    list-style: none;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.94rem;
    color: var(--pine, #4d594a);
    letter-spacing: 0.01em;
  }

  .videohogg-page :global(.advanced-tools > summary::-webkit-details-marker) {
    display: none;
  }

  .videohogg-page :global(.advanced-tools > summary::after) {
    content: '＋';
    float: right;
    color: var(--pine, #4d594a);
    font-size: 0.94rem;
  }

  .videohogg-page :global(.advanced-tools[open] > summary::after) {
    content: '－';
  }

  .videohogg-page :global(.advanced-tools-copy) {
    margin: 0.52rem 0 0.72rem;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.8rem;
  }

  .videohogg-page :global(.advanced-tools .panel) {
    margin-top: 0.6rem;
  }

  .videohogg-page :global(.settings-grid) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(172px, 1fr));
    gap: 0.55rem;
    margin-bottom: 0.75rem;
  }

  .videohogg-page :global(.setting-field) {
    display: grid;
    gap: 0.28rem;
    color: var(--pine, #4d594a);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .videohogg-page :global(.setting-field input),
  .videohogg-page :global(.setting-field select) {
    width: 100%;
    min-height: 38px;
    border: 1px solid rgba(77, 89, 74, 0.3);
    border-radius: 9px;
    background: #fffef8;
    color: #1f2937;
    font: inherit;
    font-weight: 600;
    padding: 0.45rem 0.58rem;
    box-sizing: border-box;
  }

  .videohogg-page :global(.setting-field input:focus-visible),
  .videohogg-page :global(.setting-field select:focus-visible) {
    outline: 2px solid rgba(166, 181, 137, 0.65);
    outline-offset: 1px;
  }

  .videohogg-page :global(.settings-switches) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.45rem;
    margin: 0.55rem 0 0.85rem;
  }

  .videohogg-page :global(.settings-switches label) {
    display: inline-flex;
    align-items: center;
    gap: 0.48rem;
    min-height: 36px;
    padding: 0.42rem 0.56rem;
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 9px;
    background: rgba(245, 242, 232, 0.72);
    color: #374151;
    font-size: 0.77rem;
    font-weight: 700;
    line-height: 1.25;
    cursor: pointer;
  }

  .videohogg-page :global(.settings-switches input[type='checkbox']) {
    margin: 0;
    width: 16px;
    height: 16px;
    accent-color: var(--pine, #4d594a);
    flex-shrink: 0;
  }

  .videohogg-page :global(.dropzone--thumb) {
    margin-top: 0.15rem;
    background: rgba(245, 242, 232, 0.82);
  }

  .videohogg-page :global(.thumb-ref-board) {
    margin-top: 0.45rem;
    min-height: 0.25rem;
  }

  .videohogg-page :global(.ghost) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: #fff;
    color: var(--pine, #4d594a);
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
  }

  .videohogg-page :global(.dropzone) {
    display: grid;
    gap: 0.25rem;
    border: 2px dashed rgba(77, 89, 74, 0.35);
    border-radius: 12px;
    background: rgba(245, 242, 232, 0.95);
    padding: 1rem;
    cursor: pointer;
    transition: border-color 120ms ease, background 120ms ease;
  }

  .videohogg-page :global(.dropzone:hover),
  .videohogg-page :global(.dropzone.is-dragover) {
    border-color: rgba(77, 89, 74, 0.7);
    background: rgba(240, 224, 0, 0.14);
  }

  .videohogg-page :global(.dropzone input) {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }

  .videohogg-page :global(.dropzone-title) {
    font-family: Oswald, Impact, sans-serif;
    letter-spacing: 0.01em;
    color: var(--ink, #1f2937);
    font-size: 1rem;
  }

  .videohogg-page :global(.dropzone-sub) {
    color: var(--muted-accessible, #4a5448);
    font-size: 0.82rem;
  }

  .videohogg-page :global(.summary) {
    margin: 0.6rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.84rem;
  }

  .videohogg-page :global(.clip-empty) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.86rem;
  }

  .videohogg-page :global(.clip-board) {
    margin-top: 0.7rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
    gap: 0.75rem;
  }

  .videohogg-page :global(.clip-card) {
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 12px;
    background: #fffef8;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr;
    cursor: default;
    transition: box-shadow 120ms ease, border-color 120ms ease, opacity 120ms ease;
  }

  @media (pointer: fine) {
    .videohogg-page :global(.clip-card) {
      cursor: grab;
    }

    .videohogg-page :global(.clip-card:active) {
      cursor: grabbing;
    }
  }

  .videohogg-page :global(.clip-card.is-dragging) {
    opacity: 0.45;
  }

  .videohogg-page :global(.clip-card.drop-before) {
    border-top: 3px solid rgba(77, 89, 74, 0.9);
  }

  .videohogg-page :global(.clip-card.drop-after) {
    border-bottom: 3px solid rgba(77, 89, 74, 0.9);
  }

  .videohogg-page :global(.clip-preview) {
    position: relative;
    background: #0f172a;
  }

  .videohogg-page :global(.clip-thumb) {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    background: #0f172a;
  }

  .videohogg-page :global(.clip-preview-status) {
    position: absolute;
    right: 8px;
    bottom: 8px;
    max-width: calc(100% - 16px);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.76);
    color: #e5e7eb;
    font-size: 0.67rem;
    line-height: 1.2;
    padding: 0.25rem 0.38rem;
    pointer-events: none;
  }

  .videohogg-page :global(.clip-index) {
    position: absolute;
    top: 8px;
    left: 8px;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: rgba(15, 23, 42, 0.8);
    color: #f8fafc;
  }

  .videohogg-page :global(.clip-body) {
    padding: 0.62rem;
    display: grid;
    gap: 0.5rem;
  }

  .videohogg-page :global(.clip-heading) {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .videohogg-page :global(.clip-title) {
    margin: 0;
    font-size: 0.85rem;
    color: #1f2937;
    line-height: 1.35;
    word-break: break-word;
  }

  .videohogg-page :global(.clip-controls) {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    flex-shrink: 0;
  }

  .videohogg-page :global(.drag-hint) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(77, 89, 74, 0.08);
    color: var(--pine, #4d594a);
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.18rem 0.46rem;
    line-height: 1.2;
    user-select: none;
  }

  .videohogg-page :global(.remove) {
    border: 1px solid rgba(185, 28, 28, 0.25);
    background: rgba(185, 28, 28, 0.07);
    color: #991b1b;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.45rem;
    cursor: pointer;
  }

  .videohogg-page :global(.clip-meta) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.75rem;
  }

  .videohogg-page :global(.note-label) {
    font-size: 0.76rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .videohogg-page :global(textarea) {
    width: 100%;
    resize: vertical;
    border: 1px solid rgba(77, 89, 74, 0.32);
    border-radius: 10px;
    padding: 0.7rem;
    font: inherit;
    line-height: 1.45;
    background: #fffef8;
    color: #1f2937;
    box-sizing: border-box;
  }

  .videohogg-page :global(.note-input) {
    min-height: 84px;
    font-size: 0.84rem;
  }

  .videohogg-page :global(.chip-row) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.36rem;
  }

  .videohogg-page :global(.chip) {
    border: 1px solid rgba(77, 89, 74, 0.22);
    background: #fff;
    color: var(--pine, #4d594a);
    border-radius: 999px;
    padding: 0.3rem 0.62rem;
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
  }

  .videohogg-page :global(.run-notes-label) {
    display: inline-block;
    margin-bottom: 0.35rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .videohogg-page :global(.start) {
    width: 100%;
    justify-content: center;
    margin-top: 0.65rem;
  }

  .videohogg-page :global(.run-readiness-note) {
    margin: 0.5rem 0 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .videohogg-page :global(.mobile-submit-dock) {
    display: none;
  }

  .videohogg-page :global(.progress-wrap) {
    margin-top: 0.65rem;
    display: grid;
    gap: 0.4rem;
  }

  .videohogg-page :global(.progress-track) {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.18);
    overflow: hidden;
  }

  .videohogg-page :global(.progress-bar) {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, #4d594a, #a6b589);
    transition: width 120ms linear;
  }

  .videohogg-page :global(.status) {
    margin: 0;
    font-size: 0.84rem;
    color: var(--muted-accessible, #4a5448);
  }

  .videohogg-page :global(.status[data-type='error']) {
    color: #991b1b;
  }

  .videohogg-page :global(.status[data-type='success']) {
    color: #166534;
  }

  .videohogg-page :global(.result) {
    margin-top: 0.65rem;
    border: 1px solid rgba(22, 101, 52, 0.25);
    border-radius: 10px;
    background: rgba(22, 101, 52, 0.08);
    padding: 0.55rem 0.6rem;
    color: #14532d;
  }

  .videohogg-page :global(.ideas-input) {
    width: 100%;
    border: 1px solid rgba(77, 89, 74, 0.32);
    border-radius: 10px;
    padding: 0.62rem 0.7rem;
    font: inherit;
    line-height: 1.4;
    background: #fffef8;
    color: #1f2937;
    box-sizing: border-box;
    margin-bottom: 0.55rem;
  }

  .videohogg-page :global(.ideas-columns) {
    margin-top: 0.5rem;
    display: grid;
    gap: 0.7rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .videohogg-page :global(.ideas-title) {
    margin: 0 0 0.24rem;
    font-size: 0.78rem;
    font-weight: 800;
    color: #14532d;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .videohogg-page :global(.ideas-list) {
    margin: 0;
    padding-left: 1.05rem;
    display: grid;
    gap: 0.26rem;
    color: #14532d;
    font-size: 0.84rem;
    line-height: 1.35;
  }

  .videohogg-page :global(.result p) {
    margin: 0;
    line-height: 1.45;
    font-size: 0.86rem;
  }

  .videohogg-page :global(.service-status-card) {
    margin-top: 0.75rem;
    border: 1px solid rgba(77, 89, 74, 0.26);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 242, 232, 0.86));
    padding: 0.7rem;
    display: grid;
    gap: 0.55rem;
  }

  .videohogg-page :global(.service-status-head) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .videohogg-page :global(.service-kicker) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .videohogg-page :global(.service-status-chip) {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgba(77, 89, 74, 0.28);
    border-radius: 999px;
    padding: 0.22rem 0.6rem;
    font-size: 0.76rem;
    font-weight: 800;
    line-height: 1.2;
    color: #1f2937;
    background: rgba(255, 255, 255, 0.84);
  }

  .videohogg-page :global(.service-status-chip[data-status='submitted']) {
    background: rgba(30, 64, 175, 0.10);
    border-color: rgba(30, 64, 175, 0.3);
    color: #1e3a8a;
  }

  .videohogg-page :global(.service-status-chip[data-status='in_hands']) {
    background: rgba(29, 78, 216, 0.14);
    border-color: rgba(29, 78, 216, 0.35);
    color: #1e40af;
  }

  .videohogg-page :global(.service-status-chip[data-status='in_progress']) {
    background: rgba(22, 101, 52, 0.15);
    border-color: rgba(22, 101, 52, 0.33);
    color: #166534;
  }

  .videohogg-page :global(.service-status-chip[data-status='packaging']) {
    background: rgba(120, 53, 15, 0.14);
    border-color: rgba(120, 53, 15, 0.35);
    color: #7c2d12;
  }

  .videohogg-page :global(.service-status-chip[data-status='delivered']),
  .videohogg-page :global(.service-status-chip[data-status='completed']) {
    background: rgba(21, 128, 61, 0.16);
    border-color: rgba(21, 128, 61, 0.36);
    color: #14532d;
  }

  .videohogg-page :global(.service-status-chip[data-status='revision_requested']) {
    background: rgba(146, 64, 14, 0.16);
    border-color: rgba(146, 64, 14, 0.35);
    color: #9a3412;
  }

  .videohogg-page :global(.service-status-chip[data-status='blocked']) {
    background: rgba(185, 28, 28, 0.16);
    border-color: rgba(185, 28, 28, 0.35);
    color: #991b1b;
  }

  .videohogg-page :global(.service-status-message) {
    margin: 0;
    color: #1f2937;
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .videohogg-page :global(.service-status-note) {
    margin: 0;
    color: #374151;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .videohogg-page :global(.service-status-timeline) {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.3rem;
  }

  .videohogg-page :global(.service-status-row) {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.55rem;
    align-items: baseline;
    border: 1px dashed rgba(77, 89, 74, 0.24);
    border-radius: 9px;
    padding: 0.38rem 0.5rem;
    background: rgba(255, 255, 255, 0.76);
  }

  .videohogg-page :global(.service-status-row[data-tone='done']) {
    border-color: rgba(22, 101, 52, 0.28);
    background: rgba(22, 101, 52, 0.08);
  }

  .videohogg-page :global(.service-status-row[data-tone='current']) {
    border-color: rgba(29, 78, 216, 0.38);
    background: rgba(29, 78, 216, 0.10);
  }

  .videohogg-page :global(.service-status-row[data-tone='upcoming']) {
    opacity: 0.78;
  }

  .videohogg-page :global(.service-status-row-title) {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 800;
    color: #1f2937;
    line-height: 1.25;
  }

  .videohogg-page :global(.service-status-row-time) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.72rem;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
  }

  .videohogg-page :global(.delivery-package) {
    border-top: 1px dashed rgba(77, 89, 74, 0.3);
    padding-top: 0.55rem;
    display: grid;
    gap: 0.45rem;
  }

  .videohogg-page :global(.delivery-links) {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.24rem;
    color: #14532d;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .videohogg-page :global(.delivery-links a) {
    color: #14532d;
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-all;
  }

  .videohogg-page :global(.panel-remotion) {
    border-style: dashed;
  }

  .videohogg-page :global(.remotion-editor-root) {
    margin-top: 0.65rem;
    min-height: 220px;
  }

  .videohogg-page :global(.vh-remotion-empty) {
    margin: 0;
    border: 1px dashed rgba(77, 89, 74, 0.32);
    border-radius: 12px;
    padding: 1rem;
    color: var(--muted-accessible, #4a5448);
    background: rgba(255, 255, 255, 0.62);
    font-size: 0.86rem;
  }

  .videohogg-page :global(.vh-remotion-shell) {
    display: grid;
    gap: 0.8rem;
  }

  .videohogg-page :global(.vh-remotion-grid) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .videohogg-page :global(.vh-remotion-player-wrap) {
    display: grid;
    gap: 0.4rem;
  }

  .videohogg-page :global(.vh-remotion-status-bar) {
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.82);
    padding: 0.45rem 0.55rem;
  }

  .videohogg-page :global(.vh-remotion-meta) {
    margin: 0;
    color: var(--muted-accessible, #4a5448);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .videohogg-page :global(.vh-remotion-meta strong) {
    color: #1f2937;
    font-weight: 800;
  }

  .videohogg-page :global(.vh-remotion-meta-dim) {
    color: #64748b;
  }

  .videohogg-page :global(.vh-remotion-timeline-shell) {
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.88));
    padding: 0.6rem;
    display: grid;
    gap: 0.45rem;
  }

  .videohogg-page :global(.vh-remotion-ruler) {
    position: relative;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(255, 255, 255, 0.84);
    padding: 0.3rem 0.45rem 0.45rem;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .videohogg-page :global(.vh-remotion-ruler-ticks) {
    position: relative;
    height: 20px;
    min-width: 100%;
  }

  .videohogg-page :global(.vh-remotion-ruler-tick) {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    display: grid;
    justify-items: center;
    gap: 0.08rem;
    color: #64748b;
    font-size: 0.66rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .videohogg-page :global(.vh-remotion-ruler-tick::before) {
    content: '';
    width: 1px;
    height: 7px;
    background: rgba(100, 116, 139, 0.38);
    border-radius: 999px;
  }

  .videohogg-page :global(.vh-remotion-scrub) {
    width: 100%;
    margin-top: 0.1rem;
    accent-color: #4d594a;
    cursor: ew-resize;
    min-height: 28px;
  }

  .videohogg-page :global(.vh-remotion-track-scroll) {
    overflow-x: auto;
    overflow-y: hidden;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.16);
    background: linear-gradient(180deg, #172033, #111827);
    scrollbar-width: thin;
  }

  .videohogg-page :global(.vh-remotion-track) {
    position: relative;
    min-height: 92px;
  }

  .videohogg-page :global(.vh-remotion-playhead) {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(240, 224, 0, 0.95);
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.35);
    z-index: 4;
    pointer-events: auto;
    cursor: ew-resize;
  }

  .videohogg-page :global(.vh-remotion-playhead-cap) {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -30%);
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: 1px solid rgba(15, 23, 42, 0.36);
    background: #facc15;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.25);
  }

  .videohogg-page :global(.vh-remotion-playhead.is-scrubbing) {
    background: rgba(253, 224, 71, 1);
  }

  .videohogg-page :global(.vh-remotion-segment) {
    position: absolute;
    top: 24px;
    height: 48px;
    display: grid;
    grid-template-columns: 14px 1fr 14px;
    align-items: stretch;
    border-radius: 9px;
    border: 1px solid rgba(134, 239, 172, 0.42);
    background: linear-gradient(120deg, rgba(22, 101, 52, 0.78), rgba(21, 128, 61, 0.58));
    color: #f8fafc;
    box-shadow: 0 8px 18px rgba(2, 44, 34, 0.26);
    overflow: hidden;
    user-select: none;
    cursor: grab;
  }

  .videohogg-page :global(.vh-remotion-segment:active) {
    cursor: grabbing;
  }

  .videohogg-page :global(.vh-remotion-segment.is-dragging) {
    opacity: 0.55;
  }

  .videohogg-page :global(.vh-remotion-segment.is-selected) {
    border-color: rgba(250, 204, 21, 0.78);
    box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.26), 0 10px 20px rgba(2, 44, 34, 0.28);
  }

  .videohogg-page :global(.vh-remotion-segment.is-drop-before::before),
  .videohogg-page :global(.vh-remotion-segment.is-drop-after::after) {
    content: '';
    position: absolute;
    top: -6px;
    bottom: -6px;
    width: 3px;
    border-radius: 999px;
    background: #facc15;
    box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.45);
  }

  .videohogg-page :global(.vh-remotion-segment.is-drop-before::before) {
    left: -2px;
  }

  .videohogg-page :global(.vh-remotion-segment.is-drop-after::after) {
    right: -2px;
  }

  .videohogg-page :global(.vh-remotion-segment-body) {
    min-width: 0;
    display: grid;
    align-content: center;
    gap: 0.05rem;
    padding: 0 0.32rem;
  }

  .videohogg-page :global(.vh-remotion-segment-title) {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .videohogg-page :global(.vh-remotion-segment-meta) {
    margin: 0;
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
    color: rgba(226, 232, 240, 0.95);
    line-height: 1.1;
  }

  .videohogg-page :global(.vh-remotion-trim-handle) {
    border: 0;
    margin: 0;
    padding: 0;
    font-size: 0.72rem;
    line-height: 1;
    color: rgba(226, 232, 240, 0.95);
    background: rgba(15, 23, 42, 0.26);
    cursor: ew-resize;
  }

  .videohogg-page :global(.vh-remotion-trim-handle:hover) {
    background: rgba(15, 23, 42, 0.42);
  }

  .videohogg-page :global(.vh-remotion-trim-handle--start) {
    border-right: 1px solid rgba(226, 232, 240, 0.18);
  }

  .videohogg-page :global(.vh-remotion-trim-handle--end) {
    border-left: 1px solid rgba(226, 232, 240, 0.18);
  }

  .videohogg-page :global(.vh-remotion-excluded-rack) {
    border: 1px dashed rgba(100, 116, 139, 0.4);
    border-radius: 9px;
    background: rgba(248, 250, 252, 0.82);
    padding: 0.45rem 0.55rem;
    display: grid;
    gap: 0.35rem;
  }

  .videohogg-page :global(.vh-remotion-excluded-label) {
    margin: 0;
    font-size: 0.68rem;
    color: #64748b;
    font-weight: 700;
  }

  .videohogg-page :global(.vh-remotion-excluded-list) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .videohogg-page :global(.vh-remotion-excluded-chip) {
    border: 1px solid rgba(148, 163, 184, 0.45);
    border-radius: 999px;
    background: #fff;
    color: #334155;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.2;
    padding: 0.28rem 0.6rem;
    cursor: pointer;
  }

  .videohogg-page :global(.vh-remotion-excluded-chip:hover) {
    border-color: rgba(22, 101, 52, 0.45);
    color: #166534;
    background: rgba(22, 101, 52, 0.08);
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-nav) {
    display: flex;
    flex-wrap: wrap;
    overflow-x: auto;
    scrollbar-width: thin;
    gap: 0.4rem;
    padding-bottom: 0.12rem;
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill) {
    border: 1px solid rgba(148, 163, 184, 0.42);
    background: rgba(255, 255, 255, 0.92);
    border-radius: 10px;
    padding: 0.4rem 0.56rem;
    min-width: 154px;
    max-width: 220px;
    color: #1f2937;
    display: grid;
    justify-items: flex-start;
    gap: 0.14rem;
    cursor: pointer;
    text-align: left;
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill.is-selected) {
    border-color: rgba(22, 101, 52, 0.45);
    background: rgba(236, 253, 245, 0.84);
    box-shadow: 0 0 0 1px rgba(22, 101, 52, 0.18);
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill.is-excluded) {
    opacity: 0.8;
    background: rgba(241, 245, 249, 0.94);
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill-num) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.28);
    background: rgba(77, 89, 74, 0.08);
    font-size: 0.64rem;
    font-weight: 800;
    line-height: 1;
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill-name) {
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .videohogg-page :global(.vh-remotion-mobile-clip-pill-flag) {
    font-size: 0.62rem;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .videohogg-page :global(.vh-remotion-mobile-inspector) {
    display: grid;
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 0.65rem;
    gap: 0.55rem;
  }

  .videohogg-page :global(.vh-remotion-mobile-head) {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.55rem;
  }

  .videohogg-page :global(.vh-remotion-mobile-kicker) {
    margin: 0;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    font-weight: 800;
  }

  .videohogg-page :global(.vh-remotion-mobile-title) {
    margin: 0.1rem 0 0;
    font-size: 0.82rem;
    line-height: 1.35;
    color: #1f2937;
    font-weight: 800;
    word-break: break-word;
  }

  .videohogg-page :global(.vh-remotion-mobile-sub) {
    margin: 0.15rem 0 0;
    font-size: 0.7rem;
    color: var(--muted-accessible, #4a5448);
    font-variant-numeric: tabular-nums;
  }

  .videohogg-page :global(.vh-remotion-mobile-reorder) {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .videohogg-page :global(.vh-remotion-mobile-actions) {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .videohogg-page :global(.vh-remotion-controls) {
    display: none;
  }

  .videohogg-page :global(.vh-remotion-clip) {
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.86);
    padding: 0.55rem;
    display: grid;
    gap: 0.42rem;
    transition: border-color 120ms ease, background 120ms ease, opacity 120ms ease;
  }

  .videohogg-page :global(.vh-remotion-clip--included) {
    border-color: rgba(22, 101, 52, 0.28);
    background: rgba(236, 253, 245, 0.65);
  }

  .videohogg-page :global(.vh-remotion-clip--excluded) {
    border-color: rgba(148, 163, 184, 0.34);
    background: rgba(248, 250, 252, 0.9);
    opacity: 0.78;
  }

  .videohogg-page :global(.vh-remotion-clip--active) {
    box-shadow: 0 0 0 2px rgba(77, 89, 74, 0.16);
  }

  .videohogg-page :global(.vh-remotion-clip-head) {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .videohogg-page :global(.vh-remotion-clip-info) {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .videohogg-page :global(.vh-remotion-clip-title-row) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .videohogg-page :global(.vh-remotion-clip-num) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.45rem;
    height: 1.45rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.3);
    background: rgba(77, 89, 74, 0.09);
    color: #1f2937;
    font-size: 0.68rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .videohogg-page :global(.vh-remotion-clip-title) {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.35;
    color: #1f2937;
    word-break: break-word;
  }

  .videohogg-page :global(.vh-remotion-clip-sub) {
    margin: 0;
    font-size: 0.72rem;
    color: var(--muted-accessible, #4a5448);
  }

  .videohogg-page :global(.vh-remotion-clip-sub--trimmed) {
    color: #166534;
    font-weight: 700;
  }

  .videohogg-page :global(.vh-remotion-clip-title--excluded) {
    color: #64748b;
    text-decoration: line-through;
    text-decoration-color: #94a3b8;
    text-decoration-thickness: 1px;
  }

  .videohogg-page :global(.vh-remotion-clip-num--excluded) {
    border-color: rgba(148, 163, 184, 0.4);
    background: rgba(148, 163, 184, 0.12);
    color: #64748b;
  }

  .videohogg-page :global(.vh-remotion-status-badge) {
    display: inline-flex;
    align-items: center;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .videohogg-page :global(.vh-remotion-status-badge--excluded) {
    background: rgba(148, 163, 184, 0.18);
    color: #475569;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .videohogg-page :global(.vh-remotion-time) {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: #1f2937;
    margin-left: 0.25rem;
  }

  .videohogg-page :global(.vh-remotion-badge) {
    display: inline-flex;
    align-items: center;
    padding: 0.08rem 0.4rem;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-left: 0.35rem;
  }

  .videohogg-page :global(.vh-remotion-badge--trim) {
    background: rgba(22, 101, 52, 0.12);
    color: #166534;
    border: 1px solid rgba(22, 101, 52, 0.25);
  }

  .videohogg-page :global(.vh-remotion-field--disabled) {
    opacity: 0.55;
  }

  .videohogg-page :global(.vh-remotion-actions) {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .videohogg-page :global(.vh-remotion-btn) {
    border: 1px solid rgba(77, 89, 74, 0.26);
    border-radius: 8px;
    background: #fff;
    color: var(--pine, #4d594a);
    font-weight: 800;
    min-width: 32px;
    height: 32px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    line-height: 1;
    transition: transform 80ms ease, box-shadow 120ms ease, background 120ms ease;
  }

  .videohogg-page :global(.vh-remotion-btn:hover:not(:disabled)) {
    border-color: rgba(77, 89, 74, 0.5);
    background: rgba(240, 224, 0, 0.18);
  }

  .videohogg-page :global(.vh-remotion-btn:active:not(:disabled)) {
    transform: translateY(1px);
  }

  .videohogg-page :global(.vh-remotion-btn:disabled) {
    opacity: 0.4;
    cursor: not-allowed;
    background: rgba(241, 245, 249, 0.8);
  }

  .videohogg-page :global(.vh-remotion-clip-body) {
    display: grid;
    gap: 0.35rem;
  }

  .videohogg-page :global(.vh-remotion-field) {
    display: grid;
    gap: 0.18rem;
    font-size: 0.72rem;
    color: var(--pine, #4d594a);
    font-weight: 700;
  }

  .videohogg-page :global(.vh-remotion-field span) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .videohogg-page :global(.vh-remotion-field-badge) {
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 999px;
    padding: 0.05rem 0.35rem;
    font-size: 0.62rem;
    line-height: 1.3;
    background: rgba(240, 224, 0, 0.2);
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .videohogg-page :global(.vh-remotion-field input[type='range']) {
    width: 100%;
    accent-color: #4d594a;
    height: 24px;
    cursor: pointer;
  }

  .videohogg-page :global(.vh-remotion-field input[type='range']:disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .videohogg-page :global(.vh-remotion-clip-footer) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.2rem;
  }

  .videohogg-page :global(.vh-remotion-include-btn),
  .videohogg-page :global(.vh-remotion-reset-btn) {
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 800;
    line-height: 1.2;
    padding: 0.35rem 0.7rem;
    cursor: pointer;
    transition: transform 80ms ease, box-shadow 120ms ease;
  }

  .videohogg-page :global(.vh-remotion-include-btn:active),
  .videohogg-page :global(.vh-remotion-reset-btn:active) {
    transform: translateY(1px);
  }

  .videohogg-page :global(.vh-remotion-include-btn) {
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: #fff;
    color: #1f2937;
  }

  .videohogg-page :global(.vh-remotion-include-btn--active) {
    border-color: rgba(22, 101, 52, 0.45);
    background: rgba(22, 101, 52, 0.14);
    color: #166534;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .videohogg-page :global(.vh-remotion-include-btn--inactive) {
    border-color: rgba(148, 163, 184, 0.4);
    background: rgba(241, 245, 249, 0.95);
    color: #64748b;
  }

  .videohogg-page :global(.vh-remotion-reset-btn) {
    border: 1px solid rgba(77, 89, 74, 0.18);
    background: rgba(255, 255, 255, 0.95);
    color: #4b5563;
  }

  .videohogg-page :global(.vh-remotion-reset-btn:hover:not(:disabled)) {
    background: #fff;
    border-color: rgba(77, 89, 74, 0.35);
  }

  @keyframes vh-panel-enter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .videohogg-page :global(.workspace > .simple-flow-intro),
  .videohogg-page :global(.workspace > .mode-switch),
  .videohogg-page :global(.workspace > .flow-mode-actions),
  .videohogg-page :global(.workspace > .flow-rail),
  .videohogg-page :global(.workspace > .flow-rail-status),
  .videohogg-page :global(.workspace > .panel),
  .videohogg-page :global(.workspace > .advanced-tools) {
    animation: vh-panel-enter 260ms ease both;
  }

  @media (max-width: 760px) {
    .videohogg-page :global(.workspace) {
      padding: 0.75rem 0.75rem calc(7.2rem + env(safe-area-inset-bottom));
      gap: 0.85rem;
    }

    .videohogg-page :global(.studio-shell) {
      padding: 0.8rem 0.75rem;
      gap: 0.62rem;
    }

    .videohogg-page :global(.studio-head) {
      gap: 0.72rem;
    }

    .videohogg-page :global(.studio-meta) {
      justify-items: flex-start;
      min-width: 0;
      width: 100%;
      grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
      align-items: center;
      gap: 0.38rem;
    }

    .videohogg-page :global(.studio-chip) {
      font-size: 0.66rem;
      padding: 0.3rem 0.52rem;
    }

    .videohogg-page :global(.simple-flow-intro) {
      padding: 0.9rem 0.85rem;
      margin-bottom: 0;
    }

    .videohogg-page :global(.mode-switch) {
      width: 100%;
      max-width: none;
    }

    .videohogg-page :global(.mode-btn) {
      min-height: 44px;
    }

    .videohogg-page :global(.dad-quick-start) {
      min-height: 44px;
      width: 100%;
      font-size: 0.84rem;
    }

    .videohogg-page :global(.flow-step) {
      font-size: 0.68rem;
      padding: 0.38rem 0.36rem;
      min-height: 36px;
      display: grid;
      place-items: center;
    }

    .videohogg-page :global(.flow-rail-status) {
      font-size: 0.77rem;
    }

    .videohogg-page :global(.coming-soon) {
      padding: 0.85rem;
    }

    .videohogg-page :global(.coming-soon-grid) {
      grid-template-columns: 1fr;
    }

    .videohogg-page :global(.coming-soon-actions) {
      align-items: stretch;
    }

    .videohogg-page :global(.coming-soon-actions .btn) {
      width: 100%;
      justify-content: center;
    }

    .videohogg-page :global(.settings-grid) {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }

    .videohogg-page :global(.settings-switches) {
      grid-template-columns: 1fr;
      gap: 0.42rem;
    }

    .videohogg-page :global(.panel-head--compact) {
      margin-top: 0.65rem;
    }

    .videohogg-page :global(.panel) {
      padding: 0.85rem;
      border-radius: 13px;
    }

    .videohogg-page :global(.clip-board) {
      grid-template-columns: 1fr;
    }

    .videohogg-page :global(.panel-run .start),
    .videohogg-page :global(.run-readiness-note) {
      display: none;
    }

    .videohogg-page :global(.mobile-submit-dock) {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 55;
      display: grid;
      gap: 0.46rem;
      padding: 0.58rem 0.75rem calc(0.58rem + env(safe-area-inset-bottom));
      border-top: 1px solid rgba(77, 89, 74, 0.24);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(245, 242, 232, 0.97));
      backdrop-filter: blur(8px);
      box-shadow: 0 -12px 26px rgba(31, 41, 55, 0.12);
    }

    .videohogg-page :global(.mobile-submit-meta) {
      margin: 0;
      color: #374151;
      font-size: 0.74rem;
      line-height: 1.35;
      text-align: center;
    }

    .videohogg-page :global(.mobile-submit-button) {
      width: 100%;
      min-height: 46px;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 800;
    }

    .videohogg-page :global(.vh-remotion-grid) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .videohogg-page :global(.vh-remotion-mobile-clip-nav) {
      display: flex;
      padding-bottom: 0.2rem;
    }

    .videohogg-page :global(.vh-remotion-mobile-inspector) {
      display: grid;
    }

    .videohogg-page :global(.vh-remotion-controls) {
      display: none;
    }

    .videohogg-page :global(.vh-remotion-timeline-shell) {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .videohogg-page :global(.vh-remotion-ruler) {
      padding: 0.25rem 0.35rem 0.38rem;
    }

    .videohogg-page :global(.vh-remotion-track) {
      min-height: 96px;
    }

    .videohogg-page :global(.vh-remotion-segment) {
      top: 26px;
      height: 50px;
      grid-template-columns: 18px 1fr 18px;
    }

    .videohogg-page :global(.vh-remotion-segment-title) {
      font-size: 0.72rem;
    }

    .videohogg-page :global(.vh-remotion-segment-meta) {
      font-size: 0.64rem;
    }

    .videohogg-page :global(.vh-remotion-trim-handle) {
      font-size: 0.84rem;
    }

    .videohogg-page :global(.vh-remotion-playhead-cap) {
      width: 14px;
      height: 14px;
    }

    .videohogg-page :global(.vh-remotion-clip) {
      padding: 0.85rem;
      gap: 0.55rem;
    }

    .videohogg-page :global(.vh-remotion-clip-head) {
      flex-direction: column;
      gap: 0.65rem;
    }

    .videohogg-page :global(.vh-remotion-actions) {
      width: 100%;
      justify-content: flex-start;
      gap: 0.5rem;
    }

    .videohogg-page :global(.vh-remotion-btn) {
      min-width: 44px;
      height: 44px;
      font-size: 1rem;
      border-radius: 10px;
    }

    .videohogg-page :global(.vh-remotion-field) {
      gap: 0.35rem;
    }

    .videohogg-page :global(.vh-remotion-field input[type='range']) {
      height: 36px;
      padding: 0.25rem 0;
    }

    .videohogg-page :global(.vh-remotion-clip-footer) {
      flex-direction: column;
      align-items: stretch;
      gap: 0.55rem;
      margin-top: 0.35rem;
    }

    .videohogg-page :global(.vh-remotion-include-btn),
    .videohogg-page :global(.vh-remotion-reset-btn) {
      width: 100%;
      padding: 0.55rem 0.75rem;
      font-size: 0.85rem;
      min-height: 44px;
    }

    .videohogg-page :global(.vh-remotion-mobile-actions .vh-remotion-include-btn),
    .videohogg-page :global(.vh-remotion-mobile-actions .vh-remotion-reset-btn) {
      width: auto;
      flex: 1 1 0;
      min-width: 0;
    }
  }

  @media (min-width: 761px) {
    .videohogg-page :global(.mobile-submit-dock) {
      display: none !important;
    }
  }
</style>
