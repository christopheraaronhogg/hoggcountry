// @ts-nocheck
// Faithful mechanical port of the inline <script is:inline> from src/pages/videohogg.astro
// @ts-nocheck is intentional — fidelity over typing for this 2k-line vanilla-JS module.

export function initVideoHogg(
  API_BASE: string,
  allowedEmailsCsv: string,
  youtubeIdeasAllowedEmailsCsv: string,
) {
  const ALLOWED_EMAILS = String(allowedEmailsCsv || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const YOUTUBE_IDEA_EMAILS = String(youtubeIdeasAllowedEmailsCsv || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const AUTH_KEY = 'hcApiAuth.v1';
  const MAX_FILES = 120;

  const NOTE_TEMPLATES = [
    { key: 'intro', label: 'Intro', snippet: 'Use this clip as intro. Keep first 8-12 seconds.' },
    { key: 'outro', label: 'Outro', snippet: 'Use this clip as outro. Favor final 8-12 seconds.' },
    { key: 'stabilize-heavy', label: 'Stabilize Heavy', snippet: 'Apply heavy stabilization to this clip.' },
    { key: 'stabilize-light', label: 'Stabilize Light', snippet: 'Apply light stabilization to this clip.' },
    { key: 'highlight', label: 'Highlight', snippet: 'Prioritize this clip as a highlight moment.' },
    { key: 'skip', label: 'Skip', snippet: 'Skip this clip unless needed for continuity.' },
  ];

  const CHANNEL_PROFILES = {
    youtube_longform: {
      id: 'youtube_longform',
      name: 'YouTube Long Form',
      defaults: {
        output: {
          target_platform: 'youtube',
          aspect_ratio: '16:9',
          duration_target_minutes: 9,
          deliverables: {
            final_video: true,
            transcript: true,
            title_options: 3,
            description_options: 3,
            chapter_timestamps: true,
            social_short_clip: true,
          },
        },
        handoff: {
          mode: 'self-edit-then-batch',
        },
      },
    },
    youtube_short: {
      id: 'youtube_short',
      name: 'YouTube Shorts',
      defaults: {
        output: {
          target_platform: 'youtube_shorts',
          aspect_ratio: '9:16',
          duration_target_minutes: 1,
          deliverables: {
            final_video: true,
            transcript: true,
            title_options: 3,
            description_options: 2,
            chapter_timestamps: false,
            social_short_clip: true,
          },
        },
        handoff: {
          mode: 'self-edit-then-batch',
        },
      },
    },
    tiktok: {
      id: 'tiktok',
      name: 'TikTok',
      defaults: {
        output: {
          target_platform: 'tiktok',
          aspect_ratio: '9:16',
          duration_target_minutes: 1,
          deliverables: {
            final_video: true,
            transcript: true,
            title_options: 3,
            description_options: 1,
            chapter_timestamps: false,
            social_short_clip: true,
          },
        },
        handoff: {
          mode: 'self-edit-then-batch',
        },
      },
    },
    instagram_reel: {
      id: 'instagram_reel',
      name: 'Instagram Reel',
      defaults: {
        output: {
          target_platform: 'instagram_reel',
          aspect_ratio: '9:16',
          duration_target_minutes: 1,
          deliverables: {
            final_video: true,
            transcript: true,
            title_options: 3,
            description_options: 2,
            chapter_timestamps: false,
            social_short_clip: true,
          },
        },
        handoff: {
          mode: 'self-edit-then-batch',
        },
      },
    },
  };

  const gateStatus = document.getElementById('gate-status');
  const gateActions = document.getElementById('gate-actions');
  const loginLink = document.getElementById('login-link');
  const workspace = document.getElementById('workspace');
  const studioAccountChip = document.getElementById('studio-account-chip');
  const flowModeSwitch = document.getElementById('flow-mode-switch');
  const flowModeFastButton = document.getElementById('flow-mode-fast');
  const flowModeBuilderButton = document.getElementById('flow-mode-builder');
  const flowModeCopy = document.getElementById('flow-mode-copy');
  const dadQuickStartButton = document.getElementById('dad-quick-start');
  const flowRail = document.getElementById('flow-rail');
  const flowStepUpload = document.getElementById('flow-step-upload');
  const flowStepNotes = document.getElementById('flow-step-notes');
  const flowStepSubmit = document.getElementById('flow-step-submit');
  const flowRailStatus = document.getElementById('flow-rail-status');
  const advancedToolsSection = document.getElementById('advanced-tools-section');
  const briefPresetDad = document.getElementById('brief-preset-dad');
  const briefPresetFamily = document.getElementById('brief-preset-family');
  const briefPresetInspiration = document.getElementById('brief-preset-inspiration');

  const fileInput = document.getElementById('video-files');
  const dropzone = document.getElementById('dropzone');
  const clearFiles = document.getElementById('clear-files');
  const fileSummary = document.getElementById('file-summary');

  const clipEmpty = document.getElementById('clip-empty');
  const clipBoard = document.getElementById('clip-board');

  const channelProfileSelect = document.getElementById('channel-profile-select');
  const targetDurationMinutes = document.getElementById('target-duration-minutes');
  const titleOptionsCount = document.getElementById('title-options-count');
  const descriptionOptionsCount = document.getElementById('description-options-count');
  const aspectRatioOverride = document.getElementById('aspect-ratio-override');
  const chapterToggle = document.getElementById('chapter-toggle');
  const transcriptToggle = document.getElementById('transcript-toggle');
  const shortToggle = document.getElementById('short-toggle');
  const handoffInstructions = document.getElementById('handoff-instructions');
  const thumbnailRefFiles = document.getElementById('thumbnail-ref-files');
  const clearThumbnailRefs = document.getElementById('clear-thumbnail-refs');
  const thumbnailRefSummary = document.getElementById('thumbnail-ref-summary');
  const thumbnailRefBoard = document.getElementById('thumbnail-ref-board');
  const thumbnailRefNotes = document.getElementById('thumbnail-ref-notes');

  const runNotes = document.getElementById('run-notes');
  const startRun = document.getElementById('start-run');
  const runReadinessNote = document.getElementById('run-readiness-note');
  const mobileSubmitMeta = document.getElementById('mobile-submit-meta');
  const mobileSubmitButton = document.getElementById('mobile-submit-button');
  const runStatus = document.getElementById('run-status');
  const progressBar = document.getElementById('progress-bar');
  const progressTrack = document.querySelector('.progress-track');

  const runResult = document.getElementById('run-result');
  const runId = document.getElementById('run-id');
  const uploadedCount = document.getElementById('uploaded-count');
  const notedCount = document.getElementById('noted-count');
  const briefLine = document.getElementById('brief-line');
  const briefSummary = document.getElementById('brief-summary');
  const editsLine = document.getElementById('edits-line');
  const editsSummary = document.getElementById('edits-summary');
  const settingsLine = document.getElementById('settings-line');
  const settingsSummary = document.getElementById('settings-summary');
  const thumbnailLine = document.getElementById('thumbnail-line');
  const thumbnailSummary = document.getElementById('thumbnail-summary');

  const serviceStatusCard = document.getElementById('service-status-card');
  const serviceStatusChip = document.getElementById('service-status-chip');
  const serviceStatusMessage = document.getElementById('service-status-message');
  const serviceStatusNoteLine = document.getElementById('service-status-note-line');
  const serviceStatusNote = document.getElementById('service-status-note');
  const serviceStatusTimeline = document.getElementById('service-status-timeline');
  const deliveryPackage = document.getElementById('delivery-package');
  const deliveryTitleList = document.getElementById('delivery-title-list');
  const deliveryDescriptionList = document.getElementById('delivery-description-list');
  const deliveryLinks = document.getElementById('delivery-links');

  const youtubeIdeasPanel = document.getElementById('youtube-ideas-panel');
  const youtubeIdeasUrl = document.getElementById('youtube-ideas-url');
  const youtubeIdeasNotes = document.getElementById('youtube-ideas-notes');
  const youtubeIdeasStart = document.getElementById('youtube-ideas-start');
  const youtubeIdeasStatus = document.getElementById('youtube-ideas-status');
  const youtubeIdeasResult = document.getElementById('youtube-ideas-result');
  const youtubeIdeasRunId = document.getElementById('youtube-ideas-run-id');
  const youtubeIdeasTitleList = document.getElementById('youtube-ideas-title-list');
  const youtubeIdeasDescriptionList = document.getElementById('youtube-ideas-description-list');

  const briefTone = document.getElementById('editor-brief-tone');
  const briefIntent = document.getElementById('editor-brief-intent');
  const briefMustKeep = document.getElementById('editor-brief-must-keep');
  const briefSkip = document.getElementById('editor-brief-skip');
  const briefCta = document.getElementById('editor-brief-cta');
  const briefDraftStatus = document.getElementById('brief-draft-status');

  if (
    !(gateStatus instanceof HTMLElement) ||
    !(gateActions instanceof HTMLElement) ||
    !(loginLink instanceof HTMLAnchorElement) ||
    !(workspace instanceof HTMLElement) ||
    !(studioAccountChip instanceof HTMLElement) ||
    !(flowModeSwitch instanceof HTMLElement) ||
    !(flowModeFastButton instanceof HTMLButtonElement) ||
    !(flowModeBuilderButton instanceof HTMLButtonElement) ||
    !(dadQuickStartButton instanceof HTMLButtonElement) ||
    !(flowRail instanceof HTMLElement) ||
    !(flowStepUpload instanceof HTMLElement) ||
    !(flowStepNotes instanceof HTMLElement) ||
    !(flowStepSubmit instanceof HTMLElement) ||
    !(flowRailStatus instanceof HTMLElement) ||
    !(flowModeCopy instanceof HTMLElement) ||
    !(advancedToolsSection instanceof HTMLElement) ||
    !(briefPresetDad instanceof HTMLButtonElement) ||
    !(briefPresetFamily instanceof HTMLButtonElement) ||
    !(briefPresetInspiration instanceof HTMLButtonElement) ||
    !(fileInput instanceof HTMLInputElement) ||
    !(dropzone instanceof HTMLElement) ||
    !(clearFiles instanceof HTMLButtonElement) ||
    !(fileSummary instanceof HTMLElement) ||
    !(clipEmpty instanceof HTMLElement) ||
    !(clipBoard instanceof HTMLElement) ||
    !(channelProfileSelect instanceof HTMLSelectElement) ||
    !(targetDurationMinutes instanceof HTMLInputElement) ||
    !(titleOptionsCount instanceof HTMLInputElement) ||
    !(descriptionOptionsCount instanceof HTMLInputElement) ||
    !(aspectRatioOverride instanceof HTMLSelectElement) ||
    !(chapterToggle instanceof HTMLInputElement) ||
    !(transcriptToggle instanceof HTMLInputElement) ||
    !(shortToggle instanceof HTMLInputElement) ||
    !(handoffInstructions instanceof HTMLTextAreaElement) ||
    !(thumbnailRefFiles instanceof HTMLInputElement) ||
    !(clearThumbnailRefs instanceof HTMLButtonElement) ||
    !(thumbnailRefSummary instanceof HTMLElement) ||
    !(thumbnailRefBoard instanceof HTMLElement) ||
    !(thumbnailRefNotes instanceof HTMLTextAreaElement) ||
    !(runNotes instanceof HTMLTextAreaElement) ||
    !(startRun instanceof HTMLButtonElement) ||
    !(runReadinessNote instanceof HTMLElement) ||
    !(mobileSubmitMeta instanceof HTMLElement) ||
    !(mobileSubmitButton instanceof HTMLButtonElement) ||
    !(runStatus instanceof HTMLElement) ||
    !(progressBar instanceof HTMLElement) ||
    !(progressTrack instanceof HTMLElement) ||
    !(runResult instanceof HTMLElement) ||
    !(runId instanceof HTMLElement) ||
    !(uploadedCount instanceof HTMLElement) ||
    !(notedCount instanceof HTMLElement) ||
    !(editsLine instanceof HTMLElement) ||
    !(editsSummary instanceof HTMLElement) ||
    !(settingsLine instanceof HTMLElement) ||
    !(settingsSummary instanceof HTMLElement) ||
    !(thumbnailLine instanceof HTMLElement) ||
    !(thumbnailSummary instanceof HTMLElement) ||
    !(serviceStatusCard instanceof HTMLElement) ||
    !(serviceStatusChip instanceof HTMLElement) ||
    !(serviceStatusMessage instanceof HTMLElement) ||
    !(serviceStatusNoteLine instanceof HTMLElement) ||
    !(serviceStatusNote instanceof HTMLElement) ||
    !(serviceStatusTimeline instanceof HTMLElement) ||
    !(deliveryPackage instanceof HTMLElement) ||
    !(deliveryTitleList instanceof HTMLOListElement) ||
    !(deliveryDescriptionList instanceof HTMLOListElement) ||
    !(deliveryLinks instanceof HTMLUListElement) ||
    !(youtubeIdeasPanel instanceof HTMLElement) ||
    !(youtubeIdeasUrl instanceof HTMLInputElement) ||
    !(youtubeIdeasNotes instanceof HTMLTextAreaElement) ||
    !(youtubeIdeasStart instanceof HTMLButtonElement) ||
    !(youtubeIdeasStatus instanceof HTMLElement) ||
    !(youtubeIdeasResult instanceof HTMLElement) ||
    !(youtubeIdeasRunId instanceof HTMLElement) ||
    !(youtubeIdeasTitleList instanceof HTMLOListElement) ||
    !(youtubeIdeasDescriptionList instanceof HTMLOListElement) ||
    !(briefTone instanceof HTMLSelectElement) ||
    !(briefIntent instanceof HTMLTextAreaElement) ||
    !(briefMustKeep instanceof HTMLTextAreaElement) ||
    !(briefSkip instanceof HTMLTextAreaElement) ||
    !(briefCta instanceof HTMLTextAreaElement) ||
    !(briefDraftStatus instanceof HTMLElement) ||
    !(briefLine instanceof HTMLElement) ||
    !(briefSummary instanceof HTMLElement)
  ) {
    return;
  }

  let clips = [];
  let thumbnailRefs = [];
  let auth = null;
  let draggingClipId = null;
  let remotionEdits = [];
  let youtubeIdeasPollTimer = null;
  let youtubeIdeasPollAttempts = 0;
  let serviceRunPollTimer = null;
  let serviceRunPollAttempts = 0;
  let activeServiceRunId = '';
  let currentFlowMode = 'fast';
  let isUploadingRun = false;
  const canDragReorder = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: fine)').matches
    : true;

  const SERVICE_STATUS_ORDER = ['submitted', 'in_hands', 'in_progress', 'packaging', 'delivered', 'revision_requested', 'completed', 'blocked'];
  const SERVICE_STATUS_META = {
    submitted: {
      label: 'Submitted',
      message: 'Request captured. MiniHogg will move this into active work soon.',
    },
    in_hands: {
      label: 'In Our Hands',
      message: 'Your request is accepted and officially in our hands.',
    },
    in_progress: {
      label: 'In Progress',
      message: 'Active editing is underway right now.',
    },
    packaging: {
      label: 'Packaging',
      message: 'Final files and metadata are being packaged for delivery.',
    },
    delivered: {
      label: 'Delivered',
      message: 'Final package is ready with title/description options.',
    },
    revision_requested: {
      label: 'Revision Requested',
      message: 'A revision is requested and queued for another pass.',
    },
    completed: {
      label: 'Completed',
      message: 'Delivery accepted. This request is complete.',
    },
    blocked: {
      label: 'Blocked',
      message: 'Work is blocked. Check the latest note for details.',
    },
  };

  const FLOW_MODE_FAST = 'fast';
  const FLOW_MODE_BUILDER = 'builder';
  const DRAFT_KEY = 'videohogg-intake-draft.v1';
  const BRIEF_PRESETS = {
    dad: {
      tone: 'dad-on-the-at',
      intent: 'Start with the best "hook" for trail energy, then keep momentum and cut for flow.',
      must_keep: 'Strong emotion, strongest hike moments, and any key learning.',
      avoid: 'Long pauses, gear checks, repeated scenery unless it carries emotion.',
      cta: 'End with what happens next on the trail.',
    },
    family: {
      tone: 'family-recaps',
      intent: 'Capture the people, laughter, and campfire moments with a warm, easy story arc.',
      must_keep: 'Family interaction, shared jokes, and the best finish.',
      avoid: 'Overly technical voiceover without emotional context.',
      cta: 'Invite the group to share their best photo or moment.',
    },
    inspiration: {
      tone: 'inspiration-video',
      intent: 'Motivating and practical energy: show the path, obstacle, and breakthrough.',
      must_keep: 'The obstacle beat and the comeback beat.',
      avoid: 'Noisy transitions, overly chaotic cuts, repeated long shots.',
      cta: 'Ask a quick challenge question for the audience.',
    },
  };

  function setFlowMode(mode) {
    if (mode !== FLOW_MODE_FAST && mode !== FLOW_MODE_BUILDER) {
      mode = FLOW_MODE_FAST;
    }

    currentFlowMode = mode;
    flowModeSwitch.dataset.mode = mode;
    flowModeFastButton.classList.toggle('is-active', mode === FLOW_MODE_FAST);
    flowModeBuilderButton.classList.toggle('is-active', mode === FLOW_MODE_BUILDER);
    advancedToolsSection.hidden = false;
    flowModeFastButton.setAttribute('aria-pressed', mode === FLOW_MODE_FAST ? 'true' : 'false');
    flowModeBuilderButton.setAttribute('aria-pressed', mode === FLOW_MODE_BUILDER ? 'true' : 'false');

    flowModeCopy.textContent = 'Optimized for phone upload and fast submission.';

    persistDraft();
    updateFlowProgress();
  }

  function setFlowStepState(node, state) {
    node.dataset.state = state;
  }

  function countNotedClips() {
    return clips.reduce((count, clip) => {
      return clip?.note && clip.note.trim() !== '' ? count + 1 : count;
    }, 0);
  }

  function updateFlowProgress() {
    const clipCount = clips.length;
    const notedClipCount = countNotedClips();
    const brief = buildEditorBriefPayload();
    const hasBrief = Boolean(brief);
    const hasJobNotes = runNotes.value.trim() !== '';
    const hasAnyNotes = notedClipCount > 0 || hasBrief || hasJobNotes;
    const canSubmit = clipCount > 0 && !isUploadingRun;

    setFlowStepState(flowStepUpload, clipCount > 0 ? 'done' : 'todo');
    setFlowStepState(flowStepNotes, hasAnyNotes ? 'done' : (clipCount > 0 ? 'active' : 'todo'));
    setFlowStepState(flowStepSubmit, canSubmit ? 'ready' : (clipCount > 0 ? 'active' : 'todo'));

    const buttonText = isUploadingRun ? 'Uploading...' : 'Submit Files for Editing';
    startRun.textContent = buttonText;
    mobileSubmitButton.textContent = buttonText;
    startRun.disabled = !canSubmit;
    mobileSubmitButton.disabled = !canSubmit;

    const statusText = clipCount === 0
      ? 'Add clips to unlock submit.'
      : hasAnyNotes
        ? `${clipCount} clip${clipCount === 1 ? '' : 's'} • ${notedClipCount} note${notedClipCount === 1 ? '' : 's'} • Ready`
        : `${clipCount} clip${clipCount === 1 ? '' : 's'} • Ready`;

    flowRailStatus.textContent = statusText;
    runReadinessNote.textContent = statusText;
    mobileSubmitMeta.textContent = statusText;
  }

  function applyDadQuickStart() {
    setFlowMode(FLOW_MODE_FAST);

    if (channelProfileSelect.value !== 'youtube_longform') {
      channelProfileSelect.value = 'youtube_longform';
    }
    syncSettingsFromProfile(getSelectedChannelProfile());

    applyBriefPreset('dad');

    if (runNotes.value.trim() === '') {
      runNotes.value = 'Keep the strongest moments first. Focus on trail story arc, fatigue, weather, and emotional beat.';
    }

    if (handoffInstructions.value.trim() === '') {
      handoffInstructions.value = 'Open with a strong hook in the first 10 seconds. Keep momentum, cut out dead spots, and finish with one clear next step for viewers.';
    }

    if (thumbnailRefNotes.value.trim() === '') {
      thumbnailRefNotes.value = 'Use warm outdoor tones, readable text, bold subject-first framing, and clear callout contrast.';
    }

    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  }

  function buildEditorBriefPayload() {
    const payload = {
      version: 1,
      tone: briefTone.value,
      intent: briefIntent.value.trim(),
      must_keep: briefMustKeep.value.trim(),
      avoid: briefSkip.value.trim(),
      cta: briefCta.value.trim(),
    };

    const entries = Object.entries(payload)
      .filter(([_, value]) => value !== '' && value !== null)
      .filter(([, value]) => typeof value === 'string' && value.trim() !== '');

    if (entries.length === 0) {
      return null;
    }

    const clean = {};
    entries.forEach(([key, value]) => {
      clean[key] = value.trim();
    });

    return clean;
  }

  function applyBriefPreset(key) {
    const preset = BRIEF_PRESETS[key];
    if (!preset) {
      return;
    }

    if (preset.tone) {
      briefTone.value = preset.tone;
    }
    if (Object.hasOwn(preset, 'intent')) {
      briefIntent.value = preset.intent;
    }
    if (Object.hasOwn(preset, 'must_keep')) {
      briefMustKeep.value = preset.must_keep;
    }
    if (Object.hasOwn(preset, 'avoid')) {
      briefSkip.value = preset.avoid;
    }
    if (Object.hasOwn(preset, 'cta')) {
      briefCta.value = preset.cta;
    }

    persistDraft();
    refreshDraftSummary();
  }

  function collectDraftSnapshot() {
    return {
      version: 1,
      flow_mode: currentFlowMode,
      channel_profile: channelProfileSelect.value,
      target_duration_minutes: targetDurationMinutes.value,
      title_options_count: titleOptionsCount.value,
      description_options_count: descriptionOptionsCount.value,
      aspect_ratio_override: aspectRatioOverride.value,
      chapter_timestamps: chapterToggle.checked,
      transcript: transcriptToggle.checked,
      short_clip: shortToggle.checked,
      handoff_instructions: handoffInstructions.value.trim(),
      editor_brief: {
        tone: briefTone.value,
        intent: briefIntent.value.trim(),
        must_keep: briefMustKeep.value.trim(),
        avoid: briefSkip.value.trim(),
        cta: briefCta.value.trim(),
      },
      thumbnail_ref_notes: thumbnailRefNotes.value.trim(),
      run_notes: runNotes.value.trim(),
    };
  }

  function persistDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraftSnapshot()));
    } catch {
      // best effort only
    }
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = parseJson(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function refreshDraftSummary() {
    if (briefDraftStatus instanceof HTMLElement) {
      const brief = buildEditorBriefPayload();
      if (!brief) {
        briefDraftStatus.textContent = 'Draft: no optional editor brief yet.';
        return;
      }

      const parts = [];
      if (brief.tone) parts.push(`tone ${brief.tone}`);
      if (brief.intent) parts.push('intent set');
      if (brief.must_keep) parts.push('must-keep moments');
      if (brief.avoid) parts.push('avoid list');
      if (brief.cta) parts.push('CTA');
      briefDraftStatus.textContent = `Draft: ${parts.join(' · ')}`;
    }
  }

  function hydrateDraft() {
    const draft = readDraft();
    if (!draft || typeof draft !== 'object') return false;

    if (typeof draft.flow_mode === 'string' && draft.flow_mode === FLOW_MODE_BUILDER) {
      setFlowMode(FLOW_MODE_BUILDER);
    }
    if (typeof draft.channel_profile === 'string' && CHANNEL_PROFILES[draft.channel_profile]) {
      channelProfileSelect.value = draft.channel_profile;
      syncSettingsFromProfile(getSelectedChannelProfile());
    }
    if (typeof draft.target_duration_minutes === 'string') {
      targetDurationMinutes.value = draft.target_duration_minutes;
    } else if (typeof draft.target_duration_minutes === 'number') {
      targetDurationMinutes.value = String(draft.target_duration_minutes);
    }
    if (typeof draft.title_options_count === 'string') {
      titleOptionsCount.value = draft.title_options_count;
    } else if (typeof draft.title_options_count === 'number') {
      titleOptionsCount.value = String(draft.title_options_count);
    }
    if (typeof draft.description_options_count === 'string') {
      descriptionOptionsCount.value = draft.description_options_count;
    } else if (typeof draft.description_options_count === 'number') {
      descriptionOptionsCount.value = String(draft.description_options_count);
    }
    if (typeof draft.aspect_ratio_override === 'string') {
      aspectRatioOverride.value = draft.aspect_ratio_override;
    }
    if (typeof draft.chapter_timestamps === 'boolean') {
      chapterToggle.checked = draft.chapter_timestamps;
    }
    if (typeof draft.transcript === 'boolean') {
      transcriptToggle.checked = draft.transcript;
    }
    if (typeof draft.short_clip === 'boolean') {
      shortToggle.checked = draft.short_clip;
    }
    if (typeof draft.handoff_instructions === 'string') {
      handoffInstructions.value = draft.handoff_instructions;
    }
    if (typeof draft.run_notes === 'string') {
      runNotes.value = draft.run_notes;
    }
    if (typeof draft.thumbnail_ref_notes === 'string') {
      thumbnailRefNotes.value = draft.thumbnail_ref_notes;
    }
    if (typeof draft.editor_brief === 'object' && draft.editor_brief !== null) {
      if (typeof draft.editor_brief.tone === 'string') {
        briefTone.value = draft.editor_brief.tone;
      }
      if (typeof draft.editor_brief.intent === 'string') {
        briefIntent.value = draft.editor_brief.intent;
      }
      if (typeof draft.editor_brief.must_keep === 'string') {
        briefMustKeep.value = draft.editor_brief.must_keep;
      }
      if (typeof draft.editor_brief.avoid === 'string') {
        briefSkip.value = draft.editor_brief.avoid;
      }
      if (typeof draft.editor_brief.cta === 'string') {
        briefCta.value = draft.editor_brief.cta;
      }
    }

    refreshDraftSummary();
    const draftMode = String(draft.flow_mode || '').trim();
    if (draftMode !== '') {
      setFlowMode(draftMode === FLOW_MODE_BUILDER ? FLOW_MODE_BUILDER : FLOW_MODE_FAST);
    }

    return true;
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // best effort only
    }
    if (briefDraftStatus instanceof HTMLElement) {
      briefDraftStatus.textContent = 'Draft reset.';
    }
  }

  function parseJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function readAuth() {
    const payload = parseJson(localStorage.getItem(AUTH_KEY));
    if (!payload || typeof payload !== 'object' || typeof payload.token !== 'string' || !payload.token) {
      return null;
    }
    return payload;
  }

  function setGate(message, type = 'info') {
    gateStatus.textContent = message;
    gateStatus.dataset.type = type;
  }

  function showLogin(options = {}) {
    gateActions.hidden = false;
    workspace.hidden = true;
    const redirect = encodeURIComponent('/videohogg');
    loginLink.href = `/login?redirect=${redirect}`;
    const cta = typeof options?.cta === 'string' && options.cta.trim() !== ''
      ? options.cta.trim()
      : 'Sign in with Google';
    loginLink.textContent = cta;
  }

  function showWorkspace() {
    gateActions.hidden = true;
    workspace.hidden = false;
  }

  async function fetchMe(token) {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.data || null;
  }

  function bytesToHuman(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    const total = Math.round(seconds);
    const minutes = Math.floor(total / 60);
    const remainder = total % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
  }

  function describeMediaError(error, fileType = '') {
    const code = Number(error?.code || 0);
    const type = String(fileType || '').toLowerCase();
    if (code === 1) return 'Preview aborted before load completed.';
    if (code === 2) return 'Network error while reading local file preview.';
    if (code === 3) return 'Preview decode failed (codec not supported in this browser).';
    if (code === 4) {
      if (type.includes('quicktime') || type.includes('hevc') || type.includes('h265') || type.includes('hvc1')) {
        return 'This QuickTime/HEVC clip may not preview in this browser. Upload still works.';
      }
      return 'Preview format is not supported in this browser.';
    }
    return 'Preview failed in this browser for this clip.';
  }

  function createAssetId(file, prefix = 'asset') {
    const base = `${file?.name || prefix}-${file?.size || 0}-${file?.lastModified || Date.now()}`;
    const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
    return `${base}-${suffix}`;
  }

  function createClipId(file) {
    return createAssetId(file, 'clip');
  }

  function createThumbnailRefId(file) {
    return createAssetId(file, 'thumb');
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampInt(value, fallback, min = 1, max = 60) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(min, Math.min(max, Math.round(numeric)));
  }

  function summarizeThumbnailRefs() {
    return `refs=${thumbnailRefs.length} (notes: ${thumbnailRefNotes.value.trim() ? 'yes' : 'no'})`;
  }

  function buildThumbnailRefsPayload() {
    const note = thumbnailRefNotes.value.trim();
    if (thumbnailRefs.length === 0) {
      return [];
    }

    return thumbnailRefs.map((entry, index) => ({
      index,
      name: entry.name,
      note,
    }));
  }

  // Keep request composition isolated so this can move to Inertia/Svelte stores with minimal change.
  function buildRunRequestSnapshot() {
    const fileNotesPayload = clips.map((clip, index) => ({
      index,
      name: clip.file.name,
      note: (clip.note || '').trim(),
    }));

    const channelProfilePayload = buildChannelProfilePayload();
    const jobOverridesPayload = buildJobOverridesPayload(channelProfilePayload);
    const thumbnailRefsPayload = buildThumbnailRefsPayload();
    const editorBrief = buildEditorBriefPayload();
    const editsPayload = Array.isArray(remotionEdits) && remotionEdits.length > 0 ? remotionEdits : null;

    return {
      files: clips.map((clip) => clip.file),
      notes: runNotes.value.trim(),
      fileNotesPayload,
      channelProfilePayload,
      jobOverridesPayload,
      editorBrief,
      editsPayload,
      thumbnailRefsPayload,
    };
  }

  function buildRunFormData(snapshot) {
    const formData = new FormData();
    snapshot.files.forEach((file) => {
      formData.append('files[]', file, file.name);
    });
    formData.append('file_notes_json', JSON.stringify(snapshot.fileNotesPayload));
    formData.append('notes', snapshot.notes);
    formData.append('channel_profile_json', JSON.stringify(snapshot.channelProfilePayload));
    formData.append('job_overrides_json', JSON.stringify(snapshot.jobOverridesPayload));

    if (snapshot.editorBrief) {
      formData.append('editor_brief_json', JSON.stringify(snapshot.editorBrief));
    }

    if (snapshot.editsPayload) {
      formData.append('remotion_edits_json', JSON.stringify(snapshot.editsPayload));
    }

    if (snapshot.thumbnailRefsPayload.length > 0) {
      formData.append('thumbnail_refs_json', JSON.stringify(snapshot.thumbnailRefsPayload));
      thumbnailRefs.forEach((entry) => {
        formData.append('thumbnail_refs[]', entry.file, entry.name);
      });
    }

    return formData;
  }

  function removeThumbnailRef(refId) {
    const index = thumbnailRefs.findIndex((entry) => entry.id === refId);
    if (index < 0) {
      return;
    }

    const [removed] = thumbnailRefs.splice(index, 1);
    releaseThumbnailRefUrl(removed);
    renderThumbnailRefs();
    persistDraft();
  }

  function getSelectedChannelProfile() {
    const selected = CHANNEL_PROFILES[channelProfileSelect.value] || CHANNEL_PROFILES.youtube_longform;
    return deepClone(selected);
  }

  function syncSettingsFromProfile(profile) {
    const defaults = profile?.defaults?.output?.deliverables || {};
    const outputDefaults = profile?.defaults?.output || {};

    if (Number.isFinite(outputDefaults.duration_target_minutes)) {
      targetDurationMinutes.value = String(outputDefaults.duration_target_minutes);
    }

    if (Number.isFinite(defaults.title_options)) {
      titleOptionsCount.value = String(defaults.title_options);
    }

    if (Number.isFinite(defaults.description_options)) {
      descriptionOptionsCount.value = String(defaults.description_options);
    }

    chapterToggle.checked = Boolean(defaults.chapter_timestamps);
    transcriptToggle.checked = Boolean(defaults.transcript);
    shortToggle.checked = Boolean(defaults.social_short_clip);
    aspectRatioOverride.value = 'auto';
  }

  function buildChannelProfilePayload() {
    const profile = getSelectedChannelProfile();
    return {
      id: profile.id,
      name: profile.name,
      defaults: profile.defaults,
    };
  }

  function buildJobOverridesPayload(channelProfile) {
    const outputDefaults = channelProfile?.defaults?.output || {};
    const deliverableDefaults = outputDefaults.deliverables || {};

    const duration = clampInt(
      targetDurationMinutes.value,
      clampInt(outputDefaults.duration_target_minutes, 9, 1, 60),
      1,
      60,
    );
    const titles = clampInt(
      titleOptionsCount.value,
      clampInt(deliverableDefaults.title_options, 3, 1, 8),
      1,
      8,
    );
    const descriptions = clampInt(
      descriptionOptionsCount.value,
      clampInt(deliverableDefaults.description_options, 3, 1, 8),
      1,
      8,
    );

    const overrides = {
      output: {
        deliverables: {},
      },
    };

    if (duration !== outputDefaults.duration_target_minutes) {
      overrides.output.duration_target_minutes = duration;
    }

    if (titles !== deliverableDefaults.title_options) {
      overrides.output.deliverables.title_options = titles;
    }

    if (descriptions !== deliverableDefaults.description_options) {
      overrides.output.deliverables.description_options = descriptions;
    }

    if (chapterToggle.checked !== Boolean(deliverableDefaults.chapter_timestamps)) {
      overrides.output.deliverables.chapter_timestamps = chapterToggle.checked;
    }

    if (transcriptToggle.checked !== Boolean(deliverableDefaults.transcript)) {
      overrides.output.deliverables.transcript = transcriptToggle.checked;
    }

    if (shortToggle.checked !== Boolean(deliverableDefaults.social_short_clip)) {
      overrides.output.deliverables.social_short_clip = shortToggle.checked;
    }

    if (aspectRatioOverride.value !== 'auto') {
      overrides.output.aspect_ratio = aspectRatioOverride.value;
    }

    const instructions = handoffInstructions.value.trim();
    if (instructions) {
      overrides.handoff = {
        instructions,
      };
    }

    if (Object.keys(overrides.output.deliverables).length === 0) {
      delete overrides.output.deliverables;
    }

    if (Object.keys(overrides.output).length === 0) {
      delete overrides.output;
    }

    if (!overrides.handoff && !overrides.output) {
      return {};
    }

    return overrides;
  }

  function summarizeResolvedSettings(payload) {
    const resolved = payload?.output || {};
    const deliverables = resolved?.deliverables || {};
    const platform = resolved?.target_platform || 'default';
    const aspect = resolved?.aspect_ratio || 'default';
    const duration = Number.isFinite(Number(resolved?.duration_target_minutes))
      ? `${resolved.duration_target_minutes}m`
      : 'n/a';
    const titles = Number.isFinite(Number(deliverables?.title_options)) ? deliverables.title_options : 'n/a';
    const descriptions = Number.isFinite(Number(deliverables?.description_options)) ? deliverables.description_options : 'n/a';

    return `${platform} · ${aspect} · ${duration} · ${titles} titles · ${descriptions} desc`;
  }

  function releaseClipUrl(clip) {
    if (clip && typeof clip.url === 'string' && clip.url.startsWith('blob:')) {
      URL.revokeObjectURL(clip.url);
    }
    if (clip && typeof clip.thumbUrl === 'string' && clip.thumbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(clip.thumbUrl);
    }
  }

  function releaseThumbnailRefUrl(ref) {
    if (ref && typeof ref.url === 'string' && ref.url.startsWith('blob:')) {
      URL.revokeObjectURL(ref.url);
    }
  }

  function renderThumbnailRefs() {
    thumbnailRefBoard.innerHTML = '';
    if (thumbnailRefs.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'summary';
      empty.textContent = 'Add reference images so the editor can follow your visual preferences.';
      thumbnailRefBoard.appendChild(empty);
      thumbnailRefSummary.textContent = 'No thumbnail references attached.';
      return;
    }

    const fragment = document.createDocumentFragment();
    const heading = document.createElement('p');
    heading.className = 'summary';
    heading.textContent = `Attached ${thumbnailRefs.length} reference image${thumbnailRefs.length === 1 ? '' : 's'}.`;
    fragment.appendChild(heading);

    const note = thumbnailRefNotes.value.trim();
    thumbnailRefs.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'clip-card';
      card.dataset.refId = entry.id;

      const preview = document.createElement('div');
      preview.className = 'clip-preview';
      const image = document.createElement('img');
      image.className = 'clip-thumb';
      image.src = entry.url;
      image.alt = `${entry.name} reference`;
      image.loading = 'lazy';
      preview.append(image);

      const body = document.createElement('div');
      body.className = 'clip-body';

      const title = document.createElement('p');
      title.className = 'clip-title';
      title.textContent = entry.name;

      const details = document.createElement('p');
      details.className = 'clip-meta';
      details.textContent = note || 'No shared note.';

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'remove';
      clearBtn.textContent = 'Remove';
      clearBtn.dataset.removeThumbnailRefId = entry.id;

      body.append(title, details, clearBtn);
      card.append(preview, body);
      fragment.appendChild(card);
    });

    thumbnailRefBoard.appendChild(fragment);
    thumbnailRefSummary.textContent = summarizeThumbnailRefs();
  }

  function addThumbnailRefs(fileListLike) {
    const incoming = Array.from(fileListLike || []);
    if (incoming.length === 0) return;

    const seen = new Set(thumbnailRefs.map((item) => `${item.file.name}::${item.file.size}::${item.file.lastModified}`));

    for (const file of incoming) {
      if (!(file instanceof File)) continue;
      const key = `${file.name}::${file.size}::${file.lastModified}`;
      if (seen.has(key)) continue;
      if (thumbnailRefs.length >= 12) break;

      seen.add(key);
      thumbnailRefs.push({
        id: createThumbnailRefId(file),
        file,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }

    renderThumbnailRefs();
    persistDraft();
  }

  function clearThumbnailRefsState() {
    thumbnailRefs.forEach((entry) => releaseThumbnailRefUrl(entry));
    thumbnailRefs = [];
    renderThumbnailRefs();
    persistDraft();
  }

  function setProgress(percent) {
    const bounded = Math.max(0, Math.min(100, Math.round(percent)));
    progressBar.style.width = `${bounded}%`;
    progressTrack.setAttribute('aria-valuenow', String(bounded));
  }

  function totalBytes() {
    return clips.reduce((sum, clip) => sum + (clip.file?.size || 0), 0);
  }

  function requestThumbnail(clip) {
    if (!clip || clip.thumbStatus === 'loading' || clip.thumbStatus === 'ready' || clip.thumbStatus === 'failed') {
      return;
    }

    clip.thumbStatus = 'loading';

    const probe = document.createElement('video');
    probe.preload = 'auto';
    probe.muted = true;
    probe.playsInline = true;
    probe.src = clip.url;

    const clipId = clip.id;
    let closed = false;
    let captureInFlight = false;
    let captureComplete = false;
    let drawFailures = 0;
    const maxDrawFailures = 5;
    const timeoutId = window.setTimeout(() => fail(), 18000);

    function clipStillExists() {
      return clips.some((entry) => entry.id === clipId);
    }

    function cleanup() {
      if (closed) return;
      closed = true;
      window.clearTimeout(timeoutId);
      probe.pause();
      probe.removeAttribute('src');
      try {
        probe.load();
      } catch {
        // no-op
      }
    }

    function fail() {
      if (!clipStillExists()) {
        cleanup();
        return;
      }

      clip.thumbStatus = 'failed';
      cleanup();
      renderClips();
    }

    function finalize(blob) {
      if (!clipStillExists()) {
        cleanup();
        return;
      }

      if (!(blob instanceof Blob)) {
        drawFailures += 1;
        captureInFlight = false;
        if (drawFailures >= maxDrawFailures) {
          fail();
          return;
        }
        scheduleCapture(260);
        return;
      }

      if (typeof clip.thumbUrl === 'string' && clip.thumbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(clip.thumbUrl);
      }

      clip.thumbUrl = URL.createObjectURL(blob);
      clip.thumbStatus = 'ready';
      captureComplete = true;
      cleanup();
      renderClips();
    }

    function captureFrame() {
      if (!clipStillExists()) {
        cleanup();
        return;
      }

      if (!Number.isFinite(probe.videoWidth) || probe.videoWidth < 2 || !Number.isFinite(probe.videoHeight) || probe.videoHeight < 2) {
        scheduleCapture(220);
        return;
      }

      captureInFlight = true;

      const targetWidth = Math.max(320, Math.min(640, probe.videoWidth));
      const targetHeight = Math.max(1, Math.round((probe.videoHeight / probe.videoWidth) * targetWidth));
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        captureInFlight = false;
        fail();
        return;
      }

      try {
        context.drawImage(probe, 0, 0, targetWidth, targetHeight);
      } catch {
        captureInFlight = false;
        drawFailures += 1;
        if (drawFailures >= maxDrawFailures) {
          fail();
          return;
        }
        scheduleCapture(260);
        return;
      }

      canvas.toBlob((blob) => finalize(blob || null), 'image/jpeg', 0.82);
    }

    function scheduleCapture(delay = 0) {
      if (closed || captureComplete || captureInFlight) return;

      window.setTimeout(() => {
        if (closed || captureComplete || captureInFlight) return;
        if (!clipStillExists()) {
          cleanup();
          return;
        }

        if (!Number.isFinite(probe.videoWidth) || probe.videoWidth < 2 || !Number.isFinite(probe.videoHeight) || probe.videoHeight < 2 || probe.readyState < 2) {
          scheduleCapture(250);
          return;
        }

        captureFrame();
      }, delay);
    }

    probe.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        clip.durationSeconds = probe.duration;
      }

      const seekTarget = Number.isFinite(probe.duration) && probe.duration > 0.4
        ? Math.min(1.2, Math.max(0.08, probe.duration * 0.2))
        : 0.08;

      try {
        probe.currentTime = seekTarget;
      } catch {
        // Fallback to current decoded frame if seek is blocked.
      }

      scheduleCapture(120);
    }, { once: true });

    probe.addEventListener('loadeddata', () => scheduleCapture(0));
    probe.addEventListener('canplay', () => scheduleCapture(0));
    probe.addEventListener('seeked', () => scheduleCapture(0));
    probe.addEventListener('error', fail, { once: true });

    try {
      probe.load();
    } catch {
      // no-op
    }
  }

  function buildTemplateButtons(clipId) {
    const row = document.createElement('div');
    row.className = 'chip-row';

    NOTE_TEMPLATES.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip';
      button.dataset.clipId = clipId;
      button.dataset.snippet = item.snippet;
      button.textContent = item.label;
      row.appendChild(button);
    });

    return row;
  }

  function appendSnippetToClip(clipId, snippet) {
    const clip = clips.find((entry) => entry.id === clipId);
    if (!clip) return;

    const text = String(snippet || '').trim();
    if (!text) return;

    if (!clip.note || clip.note.trim() === '') {
      clip.note = text;
    } else {
      clip.note = `${clip.note.trimEnd()}\n${text}`;
    }

    renderClips();
    const textarea = Array.from(clipBoard.querySelectorAll('textarea[data-clip-id]')).find(
      (element) => element instanceof HTMLTextAreaElement && element.dataset.clipId === clipId
    );
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }

  function publishRemotionState() {
    const payload = clips.map((clip, index) => ({
      id: clip.id,
      name: clip.file?.name || `clip-${index + 1}`,
      url: clip.url,
      note: clip.note || '',
      durationSeconds: Number.isFinite(clip.durationSeconds) ? clip.durationSeconds : null,
      order: index,
    }));

    window.dispatchEvent(
      new CustomEvent('videohogg:clips-changed', {
        detail: {
          clips: payload,
        },
      }),
    );
  }

  function renderClips() {
    clipBoard.innerHTML = '';

    if (clips.length === 0) {
      clipEmpty.hidden = false;
      fileSummary.textContent = 'No files selected yet.';
      publishRemotionState();
      updateFlowProgress();
      return;
    }

    clipEmpty.hidden = true;
    fileSummary.textContent = `${clips.length} clip${clips.length === 1 ? '' : 's'} • ${bytesToHuman(totalBytes())}`;

    const fragment = document.createDocumentFragment();

    clips.forEach((clip, index) => {
      const card = document.createElement('article');
      card.className = 'clip-card';
      card.dataset.clipId = clip.id;
      card.draggable = canDragReorder;

      const preview = document.createElement('div');
      preview.className = 'clip-preview';

      const badge = document.createElement('span');
      badge.className = 'clip-index';
      badge.textContent = `Clip ${index + 1}`;

      const meta = document.createElement('p');
      meta.className = 'clip-meta';
      meta.textContent = `${bytesToHuman(clip.file.size || 0)} • ${formatDuration(clip.durationSeconds)}`;

      const video = document.createElement('video');
      video.className = 'clip-thumb';
      video.src = clip.url;
      video.preload = 'auto';
      video.muted = false;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.controls = true;
      video.disablePictureInPicture = true;
      video.setAttribute('controlsList', 'nodownload noplaybackrate');
      if (clip.thumbStatus === 'ready' && clip.thumbUrl) {
        video.poster = clip.thumbUrl;
      }

      video.addEventListener('loadedmetadata', () => {
        clip.durationSeconds = Number.isFinite(video.duration) ? video.duration : clip.durationSeconds;
        meta.textContent = `${bytesToHuman(clip.file.size || 0)} • ${formatDuration(clip.durationSeconds)}`;
      }, { once: true });

      video.addEventListener('loadeddata', () => {
        if (clip.previewError) {
          clip.previewError = '';
          renderClips();
        }
      }, { once: true });

      video.addEventListener('error', () => {
        const message = describeMediaError(video.error, clip.file?.type || '');
        if (clip.previewError !== message) {
          clip.previewError = message;
          renderClips();
        }
      }, { once: true });

      preview.append(video, badge);

      if (clip.previewError) {
        const previewStatus = document.createElement('span');
        previewStatus.className = 'clip-preview-status';
        previewStatus.textContent = clip.previewError;
        preview.append(previewStatus);
      } else if (clip.thumbStatus === 'failed') {
        const previewStatus = document.createElement('span');
        previewStatus.className = 'clip-preview-status';
        previewStatus.textContent = 'Preview image failed. Video playback still available below.';
        preview.append(previewStatus);
      }

      if (clip.thumbStatus === 'idle') {
        requestThumbnail(clip);
      }

      const body = document.createElement('div');
      body.className = 'clip-body';

      const heading = document.createElement('div');
      heading.className = 'clip-heading';

      const title = document.createElement('p');
      title.className = 'clip-title';
      title.textContent = clip.file.name;

      const controls = document.createElement('div');
      controls.className = 'clip-controls';

      const dragHint = document.createElement('span');
      dragHint.className = 'drag-hint';
      dragHint.textContent = 'Drag';
      dragHint.hidden = !canDragReorder;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = 'Remove';
      remove.dataset.removeClipId = clip.id;

      controls.append(dragHint, remove);
      heading.append(title, controls);

      const noteLabel = document.createElement('label');
      noteLabel.className = 'note-label';
      noteLabel.textContent = 'Notes for this video';

      const noteInput = document.createElement('textarea');
      noteInput.className = 'note-input';
      noteInput.rows = 4;
      noteInput.dataset.clipId = clip.id;
      noteInput.placeholder = 'Example: stabilize heavily, use first 12 seconds, add in middle section.';
      noteInput.value = clip.note;

      body.append(heading, meta, noteLabel, noteInput, buildTemplateButtons(clip.id));

      card.append(preview, body);
      fragment.appendChild(card);
    });

    clipBoard.appendChild(fragment);
    publishRemotionState();
    updateFlowProgress();
  }

  function clearClips() {
    clips.forEach(releaseClipUrl);
    clips = [];
    renderClips();
  }

  function addFiles(fileListLike) {
    const incoming = Array.from(fileListLike || []);
    if (incoming.length === 0) return;

    const seen = new Set(clips.map((clip) => `${clip.file.name}::${clip.file.size}::${clip.file.lastModified}`));

    for (const file of incoming) {
      if (!(file instanceof File)) continue;

      const key = `${file.name}::${file.size}::${file.lastModified}`;
      if (seen.has(key)) continue;
      if (clips.length >= MAX_FILES) break;

      seen.add(key);
      clips.push({
        id: createClipId(file),
        file,
        url: URL.createObjectURL(file),
        thumbUrl: '',
        thumbStatus: 'idle',
        previewError: '',
        note: '',
        durationSeconds: null,
      });
    }

    renderClips();
  }

  function removeClip(clipId) {
    const index = clips.findIndex((entry) => entry.id === clipId);
    if (index < 0) return;

    const [removed] = clips.splice(index, 1);
    releaseClipUrl(removed);
    renderClips();
  }

  function reorderClips(sourceId, targetId, insertBefore) {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const sourceIndex = clips.findIndex((entry) => entry.id === sourceId);
    const targetIndex = clips.findIndex((entry) => entry.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = clips.splice(sourceIndex, 1);

    let destination = targetIndex;
    if (sourceIndex < targetIndex) {
      destination -= 1;
    }
    if (!insertBefore) {
      destination += 1;
    }

    destination = Math.max(0, Math.min(clips.length, destination));
    clips.splice(destination, 0, moved);
    renderClips();
  }

  function clearDropIndicators() {
    clipBoard.querySelectorAll('.clip-card').forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      node.classList.remove('drop-before', 'drop-after', 'is-dragging');
    });
  }

  function setUploadingState(isUploading) {
    isUploadingRun = isUploading;
    fileInput.disabled = isUploading;
    clearFiles.disabled = isUploading;
    runNotes.disabled = isUploading;
    mobileSubmitButton.disabled = isUploading;
    updateFlowProgress();
  }

  function setYoutubeIdeasStatus(message, type = 'info') {
    youtubeIdeasStatus.textContent = message;
    youtubeIdeasStatus.dataset.type = type;
  }

  function clearYoutubeIdeasResult() {
    youtubeIdeasTitleList.innerHTML = '';
    youtubeIdeasDescriptionList.innerHTML = '';
    youtubeIdeasResult.hidden = true;
  }

  function normalizeOptionList(values, maxCount = 3, maxLength = 240) {
    if (!Array.isArray(values)) return [];
    return values
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .map((entry) => entry.replace(/\s+/g, ' ').slice(0, maxLength))
      .slice(0, maxCount);
  }

  function renderYoutubeIdeas(ideas) {
    const titles = normalizeOptionList(ideas?.title_options, 6, 140);
    const descriptions = normalizeOptionList(ideas?.description_options, 6, 600);

    if (titles.length === 0 || descriptions.length === 0) {
      setYoutubeIdeasStatus('MiniHogg finished, but no valid options were returned. Try one more time with extra notes.', 'error');
      clearYoutubeIdeasResult();
      return;
    }

    youtubeIdeasTitleList.innerHTML = '';
    youtubeIdeasDescriptionList.innerHTML = '';

    titles.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      youtubeIdeasTitleList.appendChild(item);
    });

    descriptions.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      youtubeIdeasDescriptionList.appendChild(item);
    });

    youtubeIdeasResult.hidden = false;
    setYoutubeIdeasStatus('Done. MiniHogg generated title and description options.', 'success');
  }

  function stopServiceRunPolling() {
    if (serviceRunPollTimer) {
      window.clearInterval(serviceRunPollTimer);
      serviceRunPollTimer = null;
    }
    serviceRunPollAttempts = 0;
  }

  function formatRunTimestamp(iso) {
    if (typeof iso !== 'string' || iso.trim() === '') return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function setServiceStatusChip(status) {
    const meta = SERVICE_STATUS_META[status] || SERVICE_STATUS_META.submitted;
    serviceStatusChip.textContent = meta.label;
    serviceStatusChip.dataset.status = status;
    serviceStatusMessage.textContent = meta.message;
  }

  function getRunServiceStatus(run) {
    const raw = typeof run?.service_status === 'string' ? run.service_status.trim() : '';
    if (!raw) return 'submitted';
    return SERVICE_STATUS_META[raw] ? raw : 'submitted';
  }

  function normalizeOutputPackage(run) {
    const extra = run && typeof run === 'object' ? run.extra : null;
    if (!extra || typeof extra !== 'object') return null;

    if (extra.output_package && typeof extra.output_package === 'object' && !Array.isArray(extra.output_package)) {
      return extra.output_package;
    }

    if (extra.youtube_ideas && typeof extra.youtube_ideas === 'object' && !Array.isArray(extra.youtube_ideas)) {
      return {
        title_options: extra.youtube_ideas.title_options,
        description_options: extra.youtube_ideas.description_options,
      };
    }

    return null;
  }

  function renderDeliveryPackage(run) {
    const outputPackage = normalizeOutputPackage(run);
    if (!outputPackage) {
      deliveryPackage.hidden = true;
      deliveryTitleList.innerHTML = '';
      deliveryDescriptionList.innerHTML = '';
      deliveryLinks.innerHTML = '';
      return;
    }

    const titles = normalizeOptionList(outputPackage.title_options, 8, 180);
    const descriptions = normalizeOptionList(outputPackage.description_options, 8, 1200);

    if (titles.length === 0 && descriptions.length === 0) {
      deliveryPackage.hidden = true;
      deliveryTitleList.innerHTML = '';
      deliveryDescriptionList.innerHTML = '';
      deliveryLinks.innerHTML = '';
      return;
    }

    deliveryTitleList.innerHTML = '';
    deliveryDescriptionList.innerHTML = '';
    deliveryLinks.innerHTML = '';

    titles.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      deliveryTitleList.appendChild(item);
    });

    descriptions.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      deliveryDescriptionList.appendChild(item);
    });

    const linkCandidates = [
      { label: 'Final video', value: outputPackage.final_video_url || outputPackage.final_video_path },
      { label: 'Short clip', value: outputPackage.short_clip_url || outputPackage.social_short_clip_url },
      { label: 'Transcript', value: outputPackage.transcript_url || outputPackage.transcript_path },
    ];

    linkCandidates.forEach((candidate) => {
      const value = String(candidate.value || '').trim();
      if (!value) return;

      const item = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = `${candidate.label}: `;
      item.appendChild(label);

      if (/^https?:\/\//i.test(value)) {
        const anchor = document.createElement('a');
        anchor.href = value;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = value;
        item.appendChild(anchor);
      } else {
        const text = document.createElement('span');
        text.textContent = value;
        item.appendChild(text);
      }

      deliveryLinks.appendChild(item);
    });

    deliveryPackage.hidden = false;
  }

  function renderServiceTimeline(run) {
    const status = getRunServiceStatus(run);
    const currentIndex = SERVICE_STATUS_ORDER.indexOf(status);
    const timestamps = run && typeof run.service_timestamps === 'object' ? run.service_timestamps : {};
    const serviceStatusChangedAt = typeof run?.service_status_changed_at === 'string' ? run.service_status_changed_at : '';
    const createdAt = typeof run?.created_at === 'string' ? run.created_at : '';

    const eventMap = {
      submitted: createdAt,
      in_hands: timestamps?.in_hands_at,
      in_progress: timestamps?.in_progress_at,
      packaging: timestamps?.packaging_at,
      delivered: timestamps?.delivered_at,
      revision_requested: timestamps?.revision_requested_at,
      completed: timestamps?.service_completed_at,
      blocked: timestamps?.blocked_at,
    };

    if (!eventMap[status] && serviceStatusChangedAt) {
      eventMap[status] = serviceStatusChangedAt;
    }

    serviceStatusTimeline.innerHTML = '';

    SERVICE_STATUS_ORDER.forEach((step, index) => {
      const row = document.createElement('li');
      row.className = 'service-status-row';

      const tone = index < currentIndex ? 'done' : (index === currentIndex ? 'current' : 'upcoming');
      row.dataset.tone = tone;
      if (status === 'blocked' && step !== 'blocked') {
        row.dataset.tone = index < currentIndex ? 'done' : 'upcoming';
      }

      const title = document.createElement('p');
      title.className = 'service-status-row-title';
      title.textContent = (SERVICE_STATUS_META[step] || SERVICE_STATUS_META.submitted).label;

      const stamp = document.createElement('p');
      stamp.className = 'service-status-row-time';
      const prettyTime = formatRunTimestamp(eventMap[step]);
      stamp.textContent = prettyTime || '—';

      row.appendChild(title);
      row.appendChild(stamp);
      serviceStatusTimeline.appendChild(row);
    });
  }

  function renderServiceRunStatus(run, runIdValue) {
    serviceStatusCard.hidden = false;

    const status = getRunServiceStatus(run);
    const meta = SERVICE_STATUS_META[status] || SERVICE_STATUS_META.submitted;
    setServiceStatusChip(status);

    const note = typeof run?.service_status_note === 'string' ? run.service_status_note.trim() : '';
    if (note) {
      serviceStatusMessage.textContent = note;
      serviceStatusNote.textContent = note;
      serviceStatusNoteLine.hidden = false;
    } else {
      serviceStatusMessage.textContent = meta.message;
      serviceStatusNote.textContent = '';
      serviceStatusNoteLine.hidden = true;
    }

    renderServiceTimeline(run || {});
    renderDeliveryPackage(run || {});

    const serviceLabel = (SERVICE_STATUS_META[status] || SERVICE_STATUS_META.submitted).label;
    runStatus.textContent = `Run ${runIdValue} · ${serviceLabel}`;
  }

  async function pollServiceRun(runIdValue) {
    if (!runIdValue) return;
    serviceRunPollAttempts += 1;

    try {
      const run = await fetchRunById(runIdValue);
      if (!run) return;

      renderServiceRunStatus(run, runIdValue);

      const serviceStatus = getRunServiceStatus(run);
      if (['completed', 'blocked'].includes(serviceStatus)) {
        stopServiceRunPolling();
        return;
      }

      if (serviceRunPollAttempts >= 180) {
        stopServiceRunPolling();
        serviceStatusMessage.textContent = 'Still processing. This run stays in queue history and can be checked again shortly.';
      }
    } catch (error) {
      stopServiceRunPolling();
      serviceStatusMessage.textContent = error instanceof Error
        ? error.message
        : 'Could not refresh service status right now.';
    }
  }

  function startServiceRunPolling(runIdValue) {
    stopServiceRunPolling();
    activeServiceRunId = String(runIdValue || '').trim();
    if (!activeServiceRunId) return;

    serviceStatusCard.hidden = false;
    setServiceStatusChip('submitted');
    serviceStatusMessage.textContent = `Tracking ${activeServiceRunId}...`;
    serviceStatusNote.textContent = '';
    serviceStatusNoteLine.hidden = true;
    serviceStatusTimeline.innerHTML = '';
    deliveryPackage.hidden = true;

    pollServiceRun(activeServiceRunId);
    serviceRunPollTimer = window.setInterval(() => {
      pollServiceRun(activeServiceRunId);
    }, 8000);
  }

  function resetServiceRunStatus() {
    stopServiceRunPolling();
    activeServiceRunId = '';
    serviceStatusCard.hidden = true;
    serviceStatusTimeline.innerHTML = '';
    deliveryPackage.hidden = true;
    deliveryTitleList.innerHTML = '';
    deliveryDescriptionList.innerHTML = '';
    deliveryLinks.innerHTML = '';
    serviceStatusNote.textContent = '';
    serviceStatusNoteLine.hidden = true;
    setServiceStatusChip('submitted');
  }

  function stopYoutubeIdeasPolling() {
    if (youtubeIdeasPollTimer) {
      window.clearInterval(youtubeIdeasPollTimer);
      youtubeIdeasPollTimer = null;
    }
    youtubeIdeasPollAttempts = 0;
  }

  function setYoutubeIdeasSubmitting(isSubmitting) {
    youtubeIdeasStart.disabled = isSubmitting;
    youtubeIdeasUrl.disabled = isSubmitting;
    youtubeIdeasNotes.disabled = isSubmitting;
    youtubeIdeasStart.textContent = isSubmitting ? 'Queuing...' : 'Queue MiniHogg Ideas';
  }

  function looksLikeYouTubeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(raw);
  }

  async function fetchRunById(runId) {
    if (!auth?.token) return null;
    const response = await fetch(`${API_BASE}/videohogg/runs/${encodeURIComponent(runId)}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Unable to fetch run status (${response.status}).`);
    }

    return payload?.data?.run || null;
  }

  async function pollYoutubeIdeasRun(runId) {
    if (!runId) return;

    youtubeIdeasPollAttempts += 1;

    try {
      const run = await fetchRunById(runId);
      if (!run) return;

      if (run.status === 'done') {
        stopYoutubeIdeasPolling();
        const ideas = run?.extra?.youtube_ideas || null;
        if (ideas) {
          renderYoutubeIdeas(ideas);
        } else {
          setYoutubeIdeasStatus('Done, but no options were attached. Try again or check watcher logs.', 'error');
        }
        return;
      }

      if (run.status === 'failed') {
        stopYoutubeIdeasPolling();
        const reason = String(run?.failure_message || 'MiniHogg worker failed this request.');
        setYoutubeIdeasStatus(reason, 'error');
        return;
      }

      if (youtubeIdeasPollAttempts >= 90) {
        stopYoutubeIdeasPolling();
        setYoutubeIdeasStatus('Still processing. You can leave this page open, or check back in a few minutes.', 'info');
        return;
      }

      setYoutubeIdeasStatus(`Queued with MiniHogg (run ${runId}). Checking status...`, 'info');
    } catch (error) {
      stopYoutubeIdeasPolling();
      setYoutubeIdeasStatus(error instanceof Error ? error.message : 'Could not check request status.', 'error');
    }
  }

  function startYoutubeIdeasPolling(runId) {
    stopYoutubeIdeasPolling();
    pollYoutubeIdeasRun(runId);
    youtubeIdeasPollTimer = window.setInterval(() => {
      pollYoutubeIdeasRun(runId);
    }, 7000);
  }

  async function submitYoutubeIdeas() {
    if (!auth?.token) {
      setYoutubeIdeasStatus('Session expired. Please sign in again.', 'error');
      showLogin({ cta: 'Sign in again' });
      return;
    }

    const youtubeUrl = youtubeIdeasUrl.value.trim();
    if (!looksLikeYouTubeUrl(youtubeUrl)) {
      setYoutubeIdeasStatus('Paste a full YouTube video URL (youtube.com or youtu.be).', 'error');
      return;
    }

    const notes = youtubeIdeasNotes.value.trim();
    clearYoutubeIdeasResult();
    stopYoutubeIdeasPolling();
    setYoutubeIdeasSubmitting(true);
    setYoutubeIdeasStatus('Queuing request with MiniHogg...', 'info');

    try {
      const response = await fetch(`${API_BASE}/videohogg/youtube-ideas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          notes,
          title_options: 3,
          description_options: 3,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message || `Could not queue request (${response.status}).`);
      }

      const run = payload?.data || {};
      const id = String(run.run_id || '').trim();
      if (!id) {
        throw new Error('Run ID missing from API response.');
      }

      youtubeIdeasRunId.textContent = id;
      setYoutubeIdeasStatus(`Queued as ${id}. Waiting on MiniHogg...`, 'info');
      startYoutubeIdeasPolling(id);
    } catch (error) {
      setYoutubeIdeasStatus(error instanceof Error ? error.message : 'Could not queue YouTube ideas request.', 'error');
    } finally {
      setYoutubeIdeasSubmitting(false);
    }
  }

  async function guardAccess() {
    studioAccountChip.textContent = 'Account: checking...';
    auth = readAuth();
    if (!auth) {
      studioAccountChip.textContent = 'Account: not signed in';
      setGate('Private beta: sign in with an approved family account to continue.', 'error');
      showLogin({ cta: 'Sign in with Google' });
      return false;
    }

    setGate('Verifying account...', 'info');
    const me = await fetchMe(auth.token);
    if (!me || typeof me.email !== 'string') {
      localStorage.removeItem(AUTH_KEY);
      studioAccountChip.textContent = 'Account: session expired';
      setGate('Session expired. Please sign in again.', 'error');
      showLogin({ cta: 'Sign in again' });
      return false;
    }

    const email = me.email.trim().toLowerCase();
    const localhostBypass = window.location.hostname === 'localhost' && ALLOWED_EMAILS.length === 0;

    if (!localhostBypass && ALLOWED_EMAILS.length === 0) {
      studioAccountChip.textContent = `Account: ${me.email}`;
      setGate('VideoHogg allowlist is not configured yet.', 'error');
      showLogin({ cta: 'Sign in with Google' });
      return false;
    }

    if (!localhostBypass && !ALLOWED_EMAILS.includes(email)) {
      studioAccountChip.textContent = `Account: ${me.email} (restricted)`;
      setGate(`Signed in as ${me.email}. VideoHogg remains in private family beta for now.`, 'error');
      showLogin({ cta: 'Switch Google account' });
      return false;
    }

    const youtubeIdeasAllowed = localhostBypass || YOUTUBE_IDEA_EMAILS.includes(email);
    youtubeIdeasPanel.hidden = !youtubeIdeasAllowed;
    if (youtubeIdeasAllowed) {
      setYoutubeIdeasStatus('Ready. Paste a YouTube URL to queue 3 title + 3 description options.', 'info');
    } else {
      setYoutubeIdeasStatus('This quick feature is restricted to Dad + CodeHogg emails.', 'error');
    }

    setGate(`Access granted for ${me.email}.`, 'success');
    studioAccountChip.textContent = `Account: ${me.email}`;
    showWorkspace();
    return true;
  }

  async function submitRun() {
    if (!auth?.token) {
      setGate('Session missing. Please sign in again.', 'error');
      showLogin({ cta: 'Sign in again' });
      return;
    }

    if (clips.length === 0) {
      runStatus.textContent = 'Add at least one video file before submitting.';
      return;
    }

    const snapshot = buildRunRequestSnapshot();
    const fileNotesPayload = snapshot.fileNotesPayload;
    const editorBrief = snapshot.editorBrief;
    const thumbnailRefsPayload = snapshot.thumbnailRefsPayload;
    const formData = buildRunFormData(snapshot);

    editsLine.hidden = true;
    briefLine.hidden = true;
    settingsLine.hidden = true;
    thumbnailLine.hidden = true;
    const hasEdits = Array.isArray(remotionEdits) && remotionEdits.length > 0;
    const editCount = hasEdits ? remotionEdits.length : 0;
    const trimCount = hasEdits ? remotionEdits.filter((e) => e.trim_start_seconds > 0 || e.trim_end_seconds < e.source_duration_seconds).length : 0;
    const excludeCount = hasEdits ? remotionEdits.filter((e) => !e.include).length : 0;

    setUploadingState(true);
    runResult.hidden = true;
    resetServiceRunStatus();
    setProgress(0);
    runStatus.textContent = hasEdits
      ? `Uploading ${clips.length} clip${clips.length === 1 ? '' : 's'} with edits...`
      : `Uploading ${clips.length} clip${clips.length === 1 ? '' : 's'}...`;

    try {
      const payload = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/videohogg/runs`);
        xhr.setRequestHeader('Authorization', `Bearer ${auth.token}`);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = (event.loaded / event.total) * 100;
          setProgress(percent);
        };

        xhr.onload = () => {
          const parsed = parseJson(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(parsed);
          } else {
            reject(parsed?.error?.message || `Upload failed with status ${xhr.status}.`);
          }
        };

        xhr.onerror = () => reject('Network error while uploading files.');
        xhr.onabort = () => reject('Upload was aborted.');
        xhr.send(formData);
      });

      const run = payload?.data || {};
      const noted = fileNotesPayload.filter((entry) => entry.note.length > 0).length;

      setProgress(100);
      runStatus.textContent = 'Done. Job submitted.';
      runId.textContent = run.run_id || '—';
      uploadedCount.textContent = String(run.uploaded_count || clips.length);
      notedCount.textContent = String(run.noted_count ?? noted);

      if (hasEdits) {
        const parts = [];
        if (excludeCount > 0) parts.push(`${excludeCount} excluded`);
        if (trimCount > 0) parts.push(`${trimCount} trimmed`);
        editsSummary.textContent = parts.length ? parts.join(' · ') : `${editCount} clips`;
        editsLine.hidden = false;
      } else {
        editsLine.hidden = true;
      }

      if (editorBrief) {
        const details = [];
        if (editorBrief.tone) details.push(`tone: ${editorBrief.tone}`);
        if (editorBrief.intent) details.push('intent');
        if (editorBrief.must_keep) details.push('must-keep');
        if (editorBrief.avoid) details.push('avoid');
        if (editorBrief.cta) details.push('CTA');
        briefSummary.textContent = details.join(' · ');
        briefLine.hidden = false;
      } else {
        briefLine.hidden = true;
        briefSummary.textContent = '';
      }

      const settingsResolution = run?.settings_resolution || null;
      if (settingsResolution) {
        settingsSummary.textContent = summarizeResolvedSettings(settingsResolution);
        settingsLine.hidden = false;
      }

      const thumbCount = Number(run?.thumbnail_ref_count ?? thumbnailRefsPayload.length ?? 0);
      if (Number.isFinite(thumbCount) && thumbCount > 0) {
        const thumbNoted = Number(run?.thumbnail_ref_noted_count ?? 0);
        thumbnailSummary.textContent = `${thumbCount} refs attached${thumbNoted > 0 ? ` · ${thumbNoted} with notes` : ''}`;
        thumbnailLine.hidden = false;
      }

      runResult.hidden = false;

      const createdRunId = String(run.run_id || '').trim();
      if (createdRunId) {
        startServiceRunPolling(createdRunId);
      }
    } catch (error) {
      setProgress(0);
      runStatus.textContent = typeof error === 'string' ? error : 'Upload failed. Try again.';
    } finally {
      setUploadingState(false);
    }
  }

  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });

  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
    addFiles(event.dataTransfer?.files || []);
  });

  clearFiles.addEventListener('click', () => {
    clearClips();
    runStatus.textContent = 'Ready.';
    runResult.hidden = true;
    setProgress(0);
    resetServiceRunStatus();
  });

  clipBoard.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const clipId = target.dataset.clipId;
    if (!clipId) return;

    const clip = clips.find((entry) => entry.id === clipId);
    if (!clip) return;
    clip.note = target.value;
    publishRemotionState();
    updateFlowProgress();
  });

  clipBoard.addEventListener('dragstart', (event) => {
    if (!canDragReorder) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('video, textarea, input, button, select, label')) return;

    const card = target.closest('.clip-card[data-clip-id]');
    if (!(card instanceof HTMLElement)) return;

    const clipId = card.dataset.clipId;
    if (!clipId) return;

    draggingClipId = clipId;
    card.classList.add('is-dragging');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', clipId);
    }
  });

  clipBoard.addEventListener('dragover', (event) => {
    if (!canDragReorder) return;
    if (!draggingClipId) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const card = target.closest('.clip-card[data-clip-id]');
    if (!(card instanceof HTMLElement)) return;

    const targetId = card.dataset.clipId;
    if (!targetId || targetId === draggingClipId) return;

    event.preventDefault();
    clearDropIndicators();

    const rect = card.getBoundingClientRect();
    const insertBefore = event.clientY < rect.top + rect.height / 2;
    card.classList.add(insertBefore ? 'drop-before' : 'drop-after');

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  });

  clipBoard.addEventListener('drop', (event) => {
    if (!canDragReorder) return;
    if (!draggingClipId) return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      draggingClipId = null;
      clearDropIndicators();
      return;
    }

    const card = target.closest('.clip-card[data-clip-id]');
    if (!(card instanceof HTMLElement)) {
      draggingClipId = null;
      clearDropIndicators();
      return;
    }

    const targetId = card.dataset.clipId;
    if (!targetId) {
      draggingClipId = null;
      clearDropIndicators();
      return;
    }

    event.preventDefault();

    const rect = card.getBoundingClientRect();
    const insertBefore = event.clientY < rect.top + rect.height / 2;
    reorderClips(draggingClipId, targetId, insertBefore);

    draggingClipId = null;
    clearDropIndicators();
  });

  clipBoard.addEventListener('dragend', () => {
    if (!canDragReorder) return;
    draggingClipId = null;
    clearDropIndicators();
  });

  clipBoard.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const removeButton = target.closest('button[data-remove-clip-id]');
    if (removeButton instanceof HTMLButtonElement) {
      const clipId = removeButton.dataset.removeClipId;
      if (clipId) removeClip(clipId);
      return;
    }

    const chipButton = target.closest('button.chip[data-clip-id][data-snippet]');
    if (chipButton instanceof HTMLButtonElement) {
      const clipId = chipButton.dataset.clipId;
      const snippet = chipButton.dataset.snippet;
      if (clipId && snippet) {
        appendSnippetToClip(clipId, snippet);
      }
    }
  });

  window.addEventListener('videohogg:remotion-edits-changed', (event) => {
    const payload = event instanceof CustomEvent ? event.detail : null;
    const edits = Array.isArray(payload?.edits) ? payload.edits : [];
    remotionEdits = edits;
  });

  window.addEventListener('videohogg:clips-request', publishRemotionState);

  briefPresetDad.addEventListener('click', () => {
    applyBriefPreset('dad');
  });

  briefPresetFamily.addEventListener('click', () => {
    applyBriefPreset('family');
  });

  briefPresetInspiration.addEventListener('click', () => {
    applyBriefPreset('inspiration');
  });

  dadQuickStartButton.addEventListener('click', applyDadQuickStart);

  channelProfileSelect.addEventListener('change', () => {
    syncSettingsFromProfile(getSelectedChannelProfile());
    persistDraft();
  });

  targetDurationMinutes.addEventListener('input', persistDraft);
  titleOptionsCount.addEventListener('input', persistDraft);
  descriptionOptionsCount.addEventListener('input', persistDraft);
  aspectRatioOverride.addEventListener('change', persistDraft);
  chapterToggle.addEventListener('change', persistDraft);
  transcriptToggle.addEventListener('change', persistDraft);
  shortToggle.addEventListener('change', persistDraft);
  handoffInstructions.addEventListener('input', persistDraft);

  briefTone.addEventListener('change', () => {
    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  });
  briefIntent.addEventListener('input', () => {
    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  });
  briefMustKeep.addEventListener('input', () => {
    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  });
  briefSkip.addEventListener('input', () => {
    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  });
  briefCta.addEventListener('input', () => {
    persistDraft();
    refreshDraftSummary();
    updateFlowProgress();
  });

  thumbnailRefFiles.addEventListener('change', () => {
    addThumbnailRefs(thumbnailRefFiles.files);
    thumbnailRefFiles.value = '';
  });

  clearThumbnailRefs.addEventListener('click', clearThumbnailRefsState);

  thumbnailRefNotes.addEventListener('input', () => {
    renderThumbnailRefs();
    persistDraft();
  });

  thumbnailRefBoard.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const removeButton = target.closest('button[data-remove-thumbnail-ref-id]');
    if (removeButton instanceof HTMLButtonElement) {
      const refId = removeButton.dataset.removeThumbnailRefId;
      if (refId) {
        removeThumbnailRef(refId);
      }
    }
  });

  runNotes.addEventListener('input', () => {
    persistDraft();
    updateFlowProgress();
  });

  youtubeIdeasStart.addEventListener('click', submitYoutubeIdeas);
  youtubeIdeasUrl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitYoutubeIdeas();
    }
  });

  flowModeFastButton.addEventListener('click', () => {
    setFlowMode(FLOW_MODE_FAST);
  });

  flowModeBuilderButton.addEventListener('click', () => {
    setFlowMode(FLOW_MODE_BUILDER);
  });

  startRun.addEventListener('click', submitRun);
  mobileSubmitButton.addEventListener('click', submitRun);

  window.addEventListener('beforeunload', () => {
    stopServiceRunPolling();
    stopYoutubeIdeasPolling();
  });

  resetServiceRunStatus();
  setFlowMode(FLOW_MODE_FAST);
  const hasDraft = hydrateDraft();
  if (!hasDraft) {
    applyDadQuickStart();
  }
  renderThumbnailRefs();
  renderClips();
  void guardAccess();
}
