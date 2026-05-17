<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
  const SESSION_KEY = 'hcTrailUpdatesAdminSession';

  interface AdminSession {
    token: string;
    expiresAt: string;
  }

  interface TrailUpdate {
    id: string;
    title?: string;
    body?: string;
    location?: string;
    trailMile?: string;
    status?: string;
    mediaType?: string;
    mediaUrl?: string;
    previewUrl?: string;
    thumbnailUrl?: string;
    mediaSize?: number;
    createdAt?: string;
    publishedAt?: string;
  }

  let session = $state<AdminSession | null>(null);
  let authed = $state(false);
  let passcode = $state('');
  let loginStatus = $state('');
  let formStatus = $state('');
  let updates = $state<TrailUpdate[]>([]);
  let selectedFile = $state<File | null>(null);
  let maxMediaMb = $state(500);
  let uploadBusy = $state(false);
  let uploadPhase = $state('Upload ready');
  let uploadPercent = $state(0);
  let previewUrl = $state('');
  let title = $state('');
  let body = $state('');
  let location = $state('');
  let trailMile = $state('');
  let status = $state<'published' | 'draft'>('published');

  const fileMeta = $derived(selectedFile ? `${describeFileType(selectedFile)} • ${formatBytes(selectedFile.size)} • max ${maxMediaMb} MB` : '');
  const overLimit = $derived(selectedFile ? selectedFile.size > fileLimitBytes() : false);

  onMount(() => {
    session = loadSession();
    if (session) {
      void apiRequest('/admin/session')
        .then((response) => {
          authed = Boolean(response.authenticated);
          if (authed) void loadUpdates();
        })
        .catch(() => {
          saveSession(null);
          authed = false;
        });
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  function loadSession(): AdminSession | null {
    try {
      const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as AdminSession | null;
      if (!parsed?.token || !parsed.expiresAt || new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveSession(nextSession: AdminSession | null) {
    session = nextSession;
    if (nextSession) localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    else localStorage.removeItem(SESSION_KEY);
  }

  async function apiRequest(path = '', options: RequestInit & { auth?: boolean } = {}) {
    const { auth = true, headers: providedHeaders, ...fetchOptions } = options;
    const headers = new Headers(providedHeaders || {});
    if (auth && session?.token) headers.set('Authorization', `Bearer ${session.token}`);

    const response = await fetch(`${data.apiBase}${path}`, { ...fetchOptions, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || `Request failed (${response.status}).`);
    }
    return payload?.data ?? payload;
  }

  async function login() {
    loginStatus = 'Checking...';
    try {
      const response = await apiRequest('/admin/session', {
        auth: false,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      saveSession({ token: response.token, expiresAt: response.expires_at });
      passcode = '';
      loginStatus = '';
      authed = true;
      await loadUpdates();
    } catch {
      loginStatus = 'Wrong passcode.';
    }
  }

  function logout() {
    saveSession(null);
    authed = false;
  }

  async function loadUpdates() {
    formStatus = 'Loading updates...';
    try {
      const response = await apiRequest('?admin=1&limit=50');
      maxMediaMb = Number(response.max_media_mb) || maxMediaMb;
      updates = Array.isArray(response.updates) ? response.updates : [];
      formStatus = '';
    } catch (error) {
      formStatus = error instanceof Error ? error.message : 'Could not load updates.';
      if (formStatus.toLowerCase().includes('admin')) {
        saveSession(null);
        authed = false;
      }
    }
  }

  function onFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    setSelectedFile(input.files?.[0] ?? null);
  }

  function setSelectedFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedFile = file;
    previewUrl = file ? URL.createObjectURL(file) : '';
    resetUploadProgress();
    const tooLarge = file ? file.size > fileLimitBytes() : false;
    formStatus = file
      ? tooLarge
        ? `That file is too large. Max is ${maxMediaMb} MB for now.`
        : `Ready to upload ${formatBytes(file.size)}. Keep this tab open after tapping Post update.`
      : '';
  }

  function clearMediaSelection() {
    setSelectedFile(null);
  }

  function fileLimitBytes(): number {
    return maxMediaMb * 1024 * 1024;
  }

  function inferredContentType(file: File): string {
    const explicit = String(file.type || '').toLowerCase();
    if (explicit && explicit !== 'application/octet-stream') {
      if (explicit === 'image/jpg') return 'image/jpeg';
      if (explicit === 'image/x-heic' || explicit === 'image/heic-sequence') return 'image/heic';
      if (explicit === 'image/x-heif' || explicit === 'image/heif-sequence') return 'image/heif';
      if (explicit === 'video/mov' || explicit === 'video/x-m4v') return 'video/quicktime';
      return explicit;
    }

    const extension = String(file.name || '').split('.').pop()?.toLowerCase() || '';
    const byExtension: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      qt: 'video/quicktime',
      webm: 'video/webm'
    };

    return byExtension[extension] || explicit || 'application/octet-stream';
  }

  function describeFileType(file: File): string {
    const type = inferredContentType(file);
    if (type.startsWith('image/')) return type.includes('hei') ? 'iPhone photo' : 'photo';
    if (type.startsWith('video/')) return 'video';
    return type || 'media file';
  }

  function isVideoFile(file: File): boolean {
    return inferredContentType(file).startsWith('video/');
  }

  function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
  }

  function formatDate(value: string | undefined): string {
    if (!value) return 'Unposted';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unposted';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function mediaUrl(update: TrailUpdate): string {
    return update.thumbnailUrl || update.previewUrl || update.mediaUrl || '';
  }

  function setUploadProgress(percent = 0, label = 'Upload ready') {
    uploadPercent = Math.max(0, Math.min(100, Math.round(percent)));
    uploadPhase = label;
  }

  function resetUploadProgress() {
    setUploadProgress(0, 'Upload ready');
  }

  async function uploadChunk(uploadId: string, chunkIndex: number, chunk: Blob, chunkCount: number, uploadedBytes: number, totalBytes: number) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        if (attempt > 1) {
          setUploadProgress((uploadedBytes / totalBytes) * 100, `Signal hiccup - retrying chunk ${chunkIndex + 1} of ${chunkCount}`);
        }
        return await apiRequest(`/media-uploads/${encodeURIComponent(uploadId)}/chunks/${chunkIndex}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: chunk
        });
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 900));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Could not upload media chunk.');
  }

  async function uploadMedia(file: File) {
    if (file.size > fileLimitBytes()) throw new Error(`That file is ${formatBytes(file.size)}. Current limit is ${maxMediaMb} MB.`);

    uploadBusy = true;
    setUploadProgress(1, `Starting ${formatBytes(file.size)} upload...`);
    const started = await apiRequest('/media-uploads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name || 'trail-upload',
        contentType: inferredContentType(file),
        size: file.size
      })
    });

    const upload = started.upload;
    const chunkSize = Number(upload.chunkSize || 786432);
    const chunkCount = Number(upload.chunkCount || Math.ceil(file.size / chunkSize));

    for (let index = 0; index < chunkCount; index += 1) {
      const start = index * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      setUploadProgress((start / file.size) * 100, `Uploading chunk ${index + 1} of ${chunkCount}`);
      await uploadChunk(upload.uploadId, index, file.slice(start, end), chunkCount, start, file.size);
      setUploadProgress((end / file.size) * 100, `Uploading ${formatBytes(end)} of ${formatBytes(file.size)}`);
    }

    setUploadProgress(100, 'Finalizing media...');
    const completed = await apiRequest(`/media-uploads/${encodeURIComponent(upload.uploadId)}/complete`, { method: 'POST' });
    setUploadProgress(100, 'Media ready - posting update...');
    return completed.media;
  }

  async function captureVideoCover(file: File): Promise<string | null> {
    if (!isVideoFile(file)) return null;

    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      let finished = false;

      const finish = (value: string | null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        video.removeAttribute('src');
        try {
          video.load();
        } catch {
          // The cover is only an enhancement.
        }
        resolve(value);
      };

      const drawCover = () => {
        try {
          const width = video.videoWidth || 0;
          const height = video.videoHeight || 0;
          if (width < 1 || height < 1) {
            finish(null);
            return;
          }
          const scale = Math.min(1, 960 / width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            finish(null);
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          finish(dataUrl.length <= 2500000 ? dataUrl : null);
        } catch {
          finish(null);
        }
      };

      const timeout = setTimeout(() => finish(null), 9000);
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.addEventListener('error', () => finish(null), { once: true });
      video.addEventListener('loadedmetadata', () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const seekTo = duration > 0.5 ? Math.min(1, Math.max(0.1, duration * 0.05)) : 0;
        if (seekTo > 0) {
          video.addEventListener('seeked', drawCover, { once: true });
          try {
            video.currentTime = seekTo;
          } catch {
            drawCover();
          }
        } else {
          drawCover();
        }
      }, { once: true });
      video.src = url;
      video.load();
    });
  }

  async function postUpdate() {
    formStatus = 'Preparing update...';
    uploadBusy = true;
    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('body', body);
      formData.set('location', location);
      formData.set('trailMile', trailMile);
      formData.set('status', status);

      if (selectedFile) {
        const videoCoverDataUrl = isVideoFile(selectedFile) ? await captureVideoCover(selectedFile) : null;
        const media = await uploadMedia(selectedFile);
        if (media?.uploadId) formData.set('mediaUploadId', media.uploadId);
        if (videoCoverDataUrl) formData.set('videoCoverDataUrl', videoCoverDataUrl);
      }

      formStatus = 'Posting update...';
      await apiRequest('', { method: 'POST', body: formData });
      title = '';
      body = '';
      location = '';
      trailMile = '';
      status = 'published';
      clearMediaSelection();
      setUploadProgress(100, 'Posted');
      formStatus = 'Posted. It should show on the public updates page shortly.';
      await loadUpdates();
      setTimeout(resetUploadProgress, 1800);
    } catch (error) {
      formStatus = error instanceof Error ? error.message : 'Could not post update.';
    } finally {
      uploadBusy = false;
    }
  }

  async function deleteUpdate(id: string) {
    if (!confirm('Delete this trail update?')) return;
    try {
      await apiRequest(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
      formStatus = 'Deleted.';
      await loadUpdates();
    } catch (error) {
      formStatus = error instanceof Error ? error.message : 'Could not delete update.';
    }
  }
</script>

<svelte:head>
  <title>Trail Updates Admin | Hogg Country</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="admin-updates">
  <div class="topbar">
    <a href="/">← Site</a>
    <a href="/updates">View updates</a>
  </div>

  <section class="hero card">
    <p class="eyebrow">Admin</p>
    <h1>Trail updates.</h1>
    <p>Post quick photos, videos, and text notes from mobile. Large media uploads in safe chunks so bad trail signal has a better chance.</p>
  </section>

  {#if !authed}
    <section class="panel card stack">
      <div>
        <h2>Enter passcode</h2>
        <p>Use the shared Hogg Country admin passcode.</p>
      </div>
      <form class="stack" onsubmit={(event) => { event.preventDefault(); void login(); }}>
        <label>
          Passcode
          <input bind:value={passcode} type="password" inputmode="numeric" autocomplete="current-password" required />
        </label>
        <button type="submit">Unlock admin</button>
        <div class="status" role="status">{loginStatus}</div>
      </form>
    </section>
  {:else}
    <section class="stack">
      <form class="panel card stack" onsubmit={(event) => { event.preventDefault(); void postUpdate(); }}>
        <div>
          <p class="eyebrow">New post</p>
          <h2>Drop in today's update.</h2>
        </div>

        <label class="upload-field">
          Photo or video
          <span
            class="upload-dropzone"
            role="group"
            ondragover={(event) => event.preventDefault()}
            ondrop={(event) => {
              event.preventDefault();
              setSelectedFile(event.dataTransfer?.files?.[0] ?? null);
            }}
          >
            <strong>Tap to choose a photo or video</strong>
            <small>Max: {maxMediaMb} MB per file. Photos and short videos are stored in Hogg Country R2 storage. Keep this tab open while uploading.</small>
            <input type="file" accept="image/*,video/*" onchange={onFileChange} />
          </span>
        </label>

        {#if selectedFile}
          <div class="file-summary" class:error={overLimit}>
            <div class="media-preview">
              {#if inferredContentType(selectedFile).startsWith('image/')}
                <img src={previewUrl} alt="" />
              {:else if inferredContentType(selectedFile).startsWith('video/')}
                <video src={previewUrl} muted playsinline preload="metadata"></video>
              {:else}
                <span>File</span>
              {/if}
            </div>
            <div class="file-summary-body">
              <strong>{selectedFile.name || 'Selected media'}</strong>
              <small>{fileMeta}</small>
              <button type="button" class="secondary small-button" onclick={clearMediaSelection}>Remove file</button>
            </div>
          </div>
        {/if}

        {#if uploadBusy || uploadPercent > 0}
          <div class="upload-progress" aria-live="polite">
            <div class="progress-meta">
              <span>{uploadPhase}</span>
              <span>{uploadPercent}%</span>
            </div>
            <progress max="100" value={uploadPercent}></progress>
          </div>
        {/if}

        <label>
          Text blip
          <textarea bind:value={body} placeholder="What happened today?"></textarea>
        </label>

        <div class="grid two">
          <label>
            Title
            <input bind:value={title} placeholder="Day 42 - Big climb" maxlength="120" />
          </label>
          <label>
            Location
            <input bind:value={location} placeholder="Damascus, VA" maxlength="120" />
          </label>
        </div>

        <div class="grid two">
          <label>
            Trail mile
            <input bind:value={trailMile} placeholder="470.2" maxlength="40" />
          </label>
          <label>
            Publish status
            <select bind:value={status}>
              <option value="published">Publish now</option>
              <option value="draft">Save draft</option>
            </select>
          </label>
        </div>

        <div class="actions">
          <button type="submit" disabled={uploadBusy}>{uploadBusy ? 'Uploading...' : 'Post update'}</button>
          <button type="button" class="secondary" onclick={() => void loadUpdates()}>Refresh list</button>
          <button type="button" class="secondary" onclick={logout}>Log out</button>
        </div>
        <div class="status" role="status">{formStatus}</div>
      </form>

      <section class="panel card stack">
        <div>
          <p class="eyebrow">Recent</p>
          <h2>Posted updates</h2>
        </div>
        <div class="updates-list">
          {#if updates.length}
            {#each updates as update}
              <article class="update-row">
                {#if mediaUrl(update)}
                  {#if String(update.mediaType || '').startsWith('video/') && mediaUrl(update) === update.mediaUrl}
                    <video src={mediaUrl(update)} controls playsinline preload="metadata">
                      <track kind="captions" />
                    </video>
                  {:else}
                    <img src={mediaUrl(update)} alt={update.title || update.body || 'Trail update'} loading="lazy" />
                  {/if}
                {:else}
                  <div class="no-media"></div>
                {/if}
                <div>
                  <div class="row-meta">
                    <span>{update.status || 'published'}</span><span>•</span><span>{formatDate(update.publishedAt || update.createdAt)}</span>
                    {#if update.location}<span>•</span><span>{update.location}</span>{/if}
                    {#if update.trailMile}<span>•</span><span>Mile {update.trailMile}</span>{/if}
                    {#if update.mediaSize}<span>•</span><span>{formatBytes(Number(update.mediaSize))}</span>{/if}
                  </div>
                  <h3>{update.title || 'Trail update'}</h3>
                  {#if update.body}<p class="row-body">{update.body}</p>{/if}
                  <div class="actions row-actions">
                    <button type="button" class="secondary" onclick={() => navigator.clipboard.writeText(`${location.origin}/updates`)}>Copy link</button>
                    <button type="button" class="danger" onclick={() => void deleteUpdate(update.id)}>Delete</button>
                  </div>
                </div>
              </article>
            {/each}
          {:else}
            <p>No updates yet.</p>
          {/if}
        </div>
      </section>
    </section>
  {/if}
</main>

<style>
  .admin-updates {
    width: min(920px, calc(100% - 1.5rem));
    margin: 0 auto;
    padding: 1rem 0 3rem;
  }

  .topbar,
  .actions,
  .progress-meta,
  .row-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
  }

  .topbar {
    justify-content: space-between;
    padding: 1rem 0;
  }

  a {
    color: var(--pine);
    font-weight: 800;
  }

  h1,
  h2,
  h3 {
    margin: 0;
    line-height: 1.05;
  }

  h1 {
    max-width: 8ch;
    font-size: clamp(2.2rem, 10vw, 4.4rem);
  }

  p {
    color: var(--muted);
    line-height: 1.6;
  }

  .hero,
  .panel {
    padding: 1.1rem;
  }

  .hero {
    margin-bottom: 1rem;
  }

  .stack,
  .grid {
    display: grid;
    gap: 1rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    color: var(--pine);
    font-weight: 850;
  }

  input,
  textarea,
  select,
  button {
    width: 100%;
    min-height: 48px;
    border: 1px solid rgba(48, 65, 54, 0.16);
    border-radius: 16px;
    padding: 0.8rem 0.9rem;
    font: inherit;
  }

  textarea {
    min-height: 132px;
    resize: vertical;
  }

  input,
  textarea,
  select {
    background: rgba(255, 255, 255, 0.9);
    color: var(--ink);
  }

  button {
    border-color: rgba(77, 89, 74, 0.18);
    background: var(--pine);
    color: white;
    cursor: pointer;
    font-weight: 900;
  }

  button.secondary {
    background: white;
    color: var(--pine);
  }

  button.danger {
    background: #9f1239;
  }

  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .small-button {
    width: auto;
    min-height: 40px;
    padding: 0.55rem 0.75rem;
  }

  .status {
    min-height: 1.5rem;
    color: var(--terra);
    font-weight: 800;
  }

  .upload-dropzone {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
    border: 2px dashed rgba(77, 89, 74, 0.26);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.64);
  }

  .upload-dropzone small,
  .file-summary small {
    color: var(--muted);
    font-weight: 800;
  }

  .file-summary {
    display: grid;
    grid-template-columns: 76px 1fr;
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid rgba(77, 89, 74, 0.16);
    border-radius: 20px;
    background: rgba(77, 89, 74, 0.07);
  }

  .file-summary.error {
    border-color: rgba(159, 18, 57, 0.35);
    background: rgba(159, 18, 57, 0.08);
  }

  .file-summary-body {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }

  .file-summary strong {
    overflow-wrap: anywhere;
  }

  .media-preview {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    overflow: hidden;
    border-radius: 16px;
    background: #111827;
    color: white;
  }

  .media-preview img,
  .media-preview video,
  .update-row img,
  .update-row video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-progress {
    display: grid;
    gap: 0.35rem;
    padding: 0.8rem;
    border-radius: 18px;
    background: rgba(155, 90, 46, 0.08);
  }

  .progress-meta,
  .row-meta {
    justify-content: space-between;
    color: var(--terra);
    font-size: 0.84rem;
    font-weight: 900;
  }

  progress {
    width: 100%;
    height: 14px;
    accent-color: var(--terra);
  }

  .updates-list {
    display: grid;
    gap: 0.8rem;
  }

  .update-row {
    display: grid;
    gap: 0.75rem;
    padding: 0.9rem;
    border: 1px solid rgba(48, 65, 54, 0.14);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
  }

  .update-row img,
  .update-row video {
    max-height: 260px;
    border-radius: 18px;
    background: #111827;
  }

  .row-body {
    margin: 0.45rem 0 0;
    white-space: pre-wrap;
  }

  .row-actions {
    margin-top: 0.75rem;
  }

  @media (min-width: 720px) {
    .hero,
    .panel {
      padding: 1.4rem;
    }

    .grid.two {
      grid-template-columns: 1fr 1fr;
    }

    .update-row {
      grid-template-columns: 180px 1fr;
      align-items: start;
    }
  }
</style>
