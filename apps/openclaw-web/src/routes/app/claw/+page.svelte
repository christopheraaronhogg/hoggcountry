<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { buildClawLanes } from '$lib/claw';
  import { inferStandardDocumentSlotKey, isStandardDocumentSlotKey, STANDARD_DOCUMENT_SLOTS, standardDocumentSlotForKey, type ImportedDocument, type ManualProfile, type ManualSection, type StandardDocumentSlotKey, type WorkspaceResource, type WorkspaceTool } from '@hoggcountry/manual-core';
  import type { ClawLane } from '$lib/claw';

  interface WorkspaceSnapshot {
    readonly profile: ManualProfile | null;
    readonly sections: ManualSection[];
    readonly documents: ImportedDocument[];
    readonly resources: WorkspaceResource[];
    readonly tools: WorkspaceTool[];
    readonly locationHistory?: unknown[];
  }

  interface ProviderConnection {
    readonly providerId: 'openai-codex' | 'opencode-go';
    readonly label: string;
    readonly status: 'connected';
    readonly accountId: string | null;
    readonly expiresAt: string | null;
    readonly model?: string;
  }

  interface ClawMessage {
    readonly id: string;
    readonly role: 'user' | 'assistant';
    readonly text: string;
    readonly createdAt: string;
    readonly model: string | null;
    readonly error: boolean;
  }

  interface MessageBlock {
    readonly kind: 'paragraph' | 'heading' | 'list' | 'table' | 'rule';
    readonly text?: string;
    readonly items?: string[];
  }

  interface FactCandidate {
    readonly id: string;
    readonly kind: 'hostel' | 'resupply' | 'shuttle' | 'water' | 'closure' | 'weather_pattern' | 'gear' | 'medical' | 'other';
    readonly claimText: string;
    readonly regionSlug: string | null;
    readonly mileRangeStart: number | null;
    readonly mileRangeEnd: number | null;
    readonly confidence: number;
    readonly status: 'pending' | 'needs_review' | 'approved' | 'rejected' | 'stale';
    readonly createdAt: string;
  }

  interface ExamplePrompt {
    readonly title: string;
    readonly text: string;
    readonly icon?: string;
  }

  interface ExamplePromptGroup {
    readonly title: string;
    readonly prompts: ExamplePrompt[];
  }

  interface DadTrailUpdateSummary {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly publishedAt: string | null;
    readonly location: string | null;
    readonly trailMile: number | null;
    readonly mediaType: string | null;
  }

  interface DadTrailLocationSummary {
    readonly nearestMile: number;
    readonly scaledTrailMiles: number | null;
    readonly trailLatitude: number;
    readonly trailLongitude: number;
    readonly distanceToTrailMiles: number;
    readonly label: string;
  }

  interface DadPilotSummary {
    readonly latestFixLabel: string;
    readonly latestFixAt: string | null;
    readonly latestFixIsPreview: boolean;
    readonly latestTrailLocation: DadTrailLocationSummary | null;
    readonly dispatchCount: number;
    readonly latestDispatchTitle: string | null;
    readonly latestDispatchPublished: string | null;
    readonly trailUpdateCount: number;
    readonly latestTrailUpdate: DadTrailUpdateSummary | null;
  }

  interface ScoutDailyBriefItem {
    readonly label: string;
    readonly detail: string;
    readonly source: string;
    readonly severity: 'info' | 'watch' | 'urgent';
    readonly href?: string | null;
  }

  interface ScoutDailyBriefSourceReceipt {
    readonly label: string;
    readonly status: string;
    readonly href?: string | null;
  }

  interface ScoutDailyBrief {
    readonly generatedAt: string;
    readonly title: string;
    readonly summary: string;
    readonly snapshot: string[];
    readonly risks: ScoutDailyBriefItem[];
    readonly actions: string[];
    readonly sourceReceipts: ScoutDailyBriefSourceReceipt[];
    readonly scoutPrompt: string;
  }

  interface ScoutLocationPayload {
    readonly latitude: number;
    readonly longitude: number;
    readonly accuracyMeters: number | null;
    readonly nearestMile: number;
    readonly scaledTrailMiles: number | null;
    readonly distanceToTrailMiles: number;
    readonly trailLatitude: number;
    readonly trailLongitude: number;
  }

  interface ScoutLocationUpdatePayload {
    readonly location: ScoutLocationPayload;
    readonly profileUpdated: boolean;
    readonly profileUpdateReason: string | null;
    readonly workspace: WorkspaceSnapshot;
  }

  let profile = $state<ManualProfile | null>(null);
  let lanes = $state<ClawLane[]>([]);
  let connection = $state<ProviderConnection | null>(null);
  let dadPilot = $state<DadPilotSummary | null>(null);
  let dailyBrief = $state<ScoutDailyBrief | null>(null);
  let dailyBriefLoading = $state(false);
  let dailyBriefError = $state('');
  let locationBusy = $state(false);
  let locationTracking = $state(false);
  let locationNotice = $state('');
  let locationError = $state('');
  let locationWatchId: number | null = null;
  let documents = $state<ImportedDocument[]>([]);
  let resources = $state<WorkspaceResource[]>([]);
  let selectedDocumentId = $state<string>('');
  let selectedResourceId = $state<string>('');
  let targetStandardSlotKey = $state<StandardDocumentSlotKey | ''>('');
  let messages = $state<ClawMessage[]>([]);
  let factCandidates = $state<FactCandidate[]>([]);
  let loading = $state(true);
  let error = $state('');
  let sendBusy = $state(false);
  let streamingReplyVisible = $state(false);
  let newThreadBusy = $state(false);
  let connectBusy = $state(false);
  let disconnectBusy = $state(false);
  let seedBusy = $state(false);
  let savingMessageId = $state<string | null>(null);
  let savedMessageIds = $state<string[]>([]);
  let saveNotice = $state('');
  let saveError = $state('');
  let savedDocumentHref = $state('');
  let replyInput = $state('');
  let authorizeUrl = $state('');
  let connectMode = $state<'cloud_callback' | 'manual_callback' | ''>('');
  let connectRedirectUri = $state('');
  let connectInstructions = $state<string[]>([]);
  let connectInput = $state('');
  let connectError = $state('');
  let connectNotice = $state('');
  let pendingPrompt = $state('');
  let historyOpen = $state(false);
  let docsOpen = $state(false);
  let threadCard: HTMLElement | null = null;
  let threadMessages: HTMLDivElement | null = null;
  let promptTextarea: HTMLTextAreaElement | null = null;

  async function jsonOrThrow(response: Response) {
    if (response.ok) {
      return response.json();
    }

    const contentType = response.headers.get('content-type') ?? '';
    const message = await response.text().catch(() => 'Request failed.');

    if (contentType.includes('application/json')) {
      let payloadMessage = '';
      try {
        const payload = JSON.parse(message) as { message?: unknown };
        payloadMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
      } catch {
        payloadMessage = '';
      }

      if (payloadMessage) {
        throw new Error(payloadMessage);
      }
    }

    if (response.status === 504 || message.includes('Gateway time-out')) {
      throw new Error('Scout took too long to finish that reply. I kept the thread intact — try again, or ask Scout to continue with a shorter first pass while I keep improving the long-reply path.');
    }

    const cleaned = message.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(cleaned || 'Request failed.');
  }

  async function readScoutReplyStream(
    response: Response,
    handlers: {
      readonly onDelta: (delta: string) => void | Promise<void>;
      readonly onDone: (payload: Record<string, unknown>) => void | Promise<void>;
    }
  ) {
    if (!response.ok || !response.body) {
      await jsonOrThrow(response);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const dispatchEventBlock = async (block: string) => {
      const eventLine = block.split('\n').find((line) => line.startsWith('event:'));
      const dataLines = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).trimStart());
      const eventName = eventLine ? eventLine.slice('event:'.length).trim() : 'message';
      const rawData = dataLines.join('\n');
      const payload = rawData ? JSON.parse(rawData) as Record<string, unknown> : {};

      if (eventName === 'delta') {
        const delta = typeof payload.delta === 'string' ? payload.delta : '';
        if (delta) await handlers.onDelta(delta);
        return;
      }

      if (eventName === 'done') {
        await handlers.onDone(payload);
        return;
      }

      if (eventName === 'error') {
        const message = typeof payload.message === 'string' && payload.message.trim()
          ? payload.message.trim()
          : 'Could not send the cloud prompt.';
        throw new Error(message);
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary).trimEnd();
        buffer = buffer.slice(boundary + 2);
        if (block) await dispatchEventBlock(block);
        boundary = buffer.indexOf('\n\n');
      }

      if (done) break;
    }

    const trailing = buffer.trim();
    if (trailing) await dispatchEventBlock(trailing);
  }

  function consumeConnectQueryState() {
    const url = new URL(window.location.href);
    const connected = url.searchParams.get('chatgpt_connected');
    const connectErrorMessage = url.searchParams.get('chatgpt_connect_error');

    if (!connected && !connectErrorMessage) {
      return;
    }

    if (connected) {
      connectNotice = 'ChatGPT connected to this workspace.';
      connectError = '';
      authorizeUrl = '';
      connectInstructions = [];
      connectInput = '';
    }

    if (connectErrorMessage) {
      connectError = connectErrorMessage;
      connectNotice = '';
    }

    url.searchParams.delete('chatgpt_connected');
    url.searchParams.delete('chatgpt_connect_error');
    window.history.replaceState({}, '', url);
  }

  function severityLabel(severity: ScoutDailyBriefItem['severity']): string {
    if (severity === 'urgent') return 'Urgent';
    if (severity === 'watch') return 'Watch';
    return 'Info';
  }

  function routePillLabel(currentProfile: ManualProfile | null): string {
    if (currentProfile && currentProfile.currentMile > 0) {
      return `AT - ${currentProfile.direction} • MILE ${currentProfile.currentMile.toFixed(0)}`;
    }

    return 'AT - TRAIL PLAN • MILE --';
  }

  function dailyBriefTime(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return value;
    return new Date(parsed).toLocaleString();
  }

  function useDailyBriefPrompt() {
    if (!dailyBrief) return;
    replyInput = dailyBrief.scoutPrompt;
    void focusPromptComposer();
  }

  function buildExamplePromptGroups(currentProfile: ManualProfile | null): ExamplePromptGroup[] {
    const mileText = currentProfile ? `mile ${currentProfile.currentMile.toFixed(0)}` : 'my current mile';
    const paceText = currentProfile && currentProfile.targetPace > 0
      ? `${currentProfile.targetPace.toFixed(0)} miles per day`
      : 'my real pace';
    const trailStatus = currentProfile && currentProfile.currentMile > 0 ? 'on-trail' : 'preparing';

    const onTrail: ExamplePromptGroup = {
      title: 'On trail',
      prompts: [
        {
          title: 'Today',
          icon: '🥾',
          text: `Build today's trail plan from ${mileText}. Use my profile, saved docs, and today's checked sources if available. Give me the target miles, likely stop, food/water assumptions, body risk, bailout option, and which details are estimated vs worth confirming before I depend on them.`
        },
        {
          title: 'Next 7 days',
          icon: '🗓️',
          text: `Draft my next 7 days from ${mileText}. Keep it conservative, maintain monotonic trail order, flag food-carry pressure, body risk, likely town access, and label what is baseline estimate vs confirmed source-backed detail.`
        },
        {
          title: 'Next resupply',
          icon: '🥫',
          text: `Plan my next food carry from ${mileText}. Use ${paceText}, keep food carries under 4 days, and show likely sleep targets, town access options, and the few assumptions that matter before leaving town.`
        },
        {
          title: 'Body check',
          icon: '🦵',
          text: `Check the weakest body or safety risk in my next 24-48 hours from ${mileText}. Use my profile and private notes first. Tell me the conservative mileage cap, when to stop, and what symptom or trail condition would change the plan.`
        },
        {
          title: 'Update home',
          icon: '🏠',
          text: `Draft a simple trail update I could share with family from my current situation. Keep private details out unless I explicitly included them here. Separate what is confirmed from what is just a plan.`
        }
      ]
    };

    const preparing: ExamplePromptGroup = {
      title: 'Preparing',
      prompts: [
        {
          title: 'First week',
          icon: '⛺',
          text: 'Build my first-week trail plan. Include daily mileage, food carry, likely weather checks, gear shakeout priorities, and ask me only for the details that would materially change the plan.'
        },
        {
          title: 'Gear shakedown',
          icon: '🎒',
          text: 'Review my gear and clothing system for the next section or start date. Flag missing items, overkill weight, weather risks, and the three changes that would most improve comfort and safety.'
        },
        {
          title: 'Budget + logistics',
          icon: '🧾',
          text: 'Help me prepare the practical logistics: permits, travel, resupply rhythm, town budget, communication plan, and what documents or screenshots I should import so Scout can help me better later.'
        }
      ]
    };

    return trailStatus === 'on-trail' ? [onTrail, preparing] : [preparing, onTrail];
  }

  function composerPromptStarters(currentProfile: ManualProfile | null, currentDailyBrief: ScoutDailyBrief | null): ExamplePrompt[] {
    const starters = buildExamplePromptGroups(currentProfile).flatMap((group) => group.prompts);
    const briefStarter = currentDailyBrief
      ? [{ title: 'Use brief', icon: '🧭', text: currentDailyBrief.scoutPrompt }] satisfies ExamplePrompt[]
      : [];

    return [...briefStarter, ...starters];
  }

  function syncPromptHeight(textarea = promptTextarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }

  async function resetPromptHeight() {
    await tick();
    syncPromptHeight();
  }

  function useExamplePrompt(example: ExamplePrompt) {
    replyInput = example.text;
    void focusPromptComposer();
  }

  function clearPrompt() {
    replyInput = '';
    void resetPromptHeight();
  }

  function isMobileWorkspace(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches;
  }

  function closeMobilePanels() {
    if (isMobileWorkspace()) {
      historyOpen = false;
      docsOpen = false;
    }
  }

  function toggleHistoryPanel() {
    const nextOpen = !historyOpen;
    historyOpen = nextOpen;
    if (nextOpen) docsOpen = false;
  }

  function toggleDocsPanel() {
    const nextOpen = !docsOpen;
    docsOpen = nextOpen;
    if (nextOpen) {
      historyOpen = false;
      if (!dailyBrief && !dailyBriefLoading && !dailyBriefError) void loadDailyBrief();
    }
  }

  async function focusPromptComposer() {
    await tick();
    syncPromptHeight();
    promptTextarea?.focus();
  }

  function recentThreadMessages(): ClawMessage[] {
    return messages.slice(-6);
  }

  function assistantMessageCount(): number {
    return messages.filter((message) => message.role === 'assistant').length;
  }

  function userMessageCount(): number {
    return messages.filter((message) => message.role === 'user').length;
  }

  function messageDisplayText(message: ClawMessage): string {
    return message.text;
  }

  function cleanInlineMarkdown(value: string): string {
    return value
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .trim();
  }

  function parseMessageBlocks(text: string): MessageBlock[] {
    const blocks: MessageBlock[] = [];
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    let paragraph: string[] = [];
    let listItems: string[] = [];
    let tableLines: string[] = [];

    function flushParagraph() {
      if (paragraph.length === 0) return;
      blocks.push({ kind: 'paragraph', text: cleanInlineMarkdown(paragraph.join(' ')) });
      paragraph = [];
    }

    function flushList() {
      if (listItems.length === 0) return;
      blocks.push({ kind: 'list', items: listItems });
      listItems = [];
    }

    function flushTable() {
      if (tableLines.length === 0) return;
      blocks.push({ kind: 'table', text: tableLines.join('\n') });
      tableLines = [];
    }

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        flushTable();
        continue;
      }

      const heading = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        flushTable();
        blocks.push({ kind: 'heading', text: cleanInlineMarkdown(heading[1]) });
        continue;
      }

      if (/^-{3,}$/.test(trimmed)) {
        flushParagraph();
        flushList();
        flushTable();
        blocks.push({ kind: 'rule' });
        continue;
      }

      if (/^\|.+\|$/.test(trimmed)) {
        flushParagraph();
        flushList();
        tableLines.push(trimmed);
        continue;
      }

      const listItem = trimmed.match(/^(?:[-*+]\s+|\d+\.\s+)(.+)$/);
      if (listItem) {
        flushParagraph();
        flushTable();
        listItems.push(cleanInlineMarkdown(listItem[1]));
        continue;
      }

      flushList();
      flushTable();
      paragraph.push(trimmed);
    }

    flushParagraph();
    flushList();
    flushTable();

    return blocks.length > 0 ? blocks : [{ kind: 'paragraph', text: text.trim() }];
  }

  function messageBlocks(message: ClawMessage): MessageBlock[] {
    return parseMessageBlocks(messageDisplayText(message));
  }

  function messageHistory(): ClawMessage[] {
    return [...messages].reverse();
  }

  function threadPreview(message: ClawMessage): string {
    return shortText(message.text, 76);
  }

  function messageTime(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return '';

    if (Date.now() - parsed < 60_000) {
      return 'Just now';
    }

    return new Date(parsed).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function shortText(value: string, limit = 220): string {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= limit) return normalized;
    return `${normalized.slice(0, limit).trimEnd()}...`;
  }

  function buildTrailUpdateLine(update: DadTrailUpdateSummary | null): string {
    if (!update) return 'No public Trail Update is available yet.';

    const parts = [
      `Latest public Trail Update: ${update.title}`,
      update.publishedAt ? `posted ${new Date(update.publishedAt).toLocaleDateString()}` : '',
      update.location ? `near ${update.location}` : '',
      update.trailMile !== null ? `mile ${update.trailMile.toFixed(1)}` : '',
      update.mediaType ? `media ${update.mediaType}` : '',
      update.body ? `note: ${shortText(update.body)}` : ''
    ].filter(Boolean);

    return `${parts.join('; ')}.`;
  }

  function buildDadPilotPrompts(summary: DadPilotSummary | null): ExamplePrompt[] {
    if (!summary) return [];

    const trailLocationLine = summary.latestTrailLocation
      ? `Snapped AT position: ${summary.latestTrailLocation.label}; Garmin fix is ${summary.latestTrailLocation.distanceToTrailMiles.toFixed(1)} miles from that AT milepost.`
      : 'Snapped AT mile unavailable; use the raw Garmin fix conservatively.';
    const fixLine = `Latest public Garmin fix: ${summary.latestFixLabel}${summary.latestFixAt ? ` at ${new Date(summary.latestFixAt).toLocaleString()}` : ''}. ${trailLocationLine}`;
    const dispatchLine = summary.latestDispatchTitle
      ? `Latest public YouTube dispatch: ${summary.latestDispatchTitle}${summary.latestDispatchPublished ? ` (${new Date(summary.latestDispatchPublished).toLocaleDateString()})` : ''}.`
      : `Recent YouTube dispatch count: ${summary.dispatchCount}.`;
    const trailUpdateLine = buildTrailUpdateLine(summary.latestTrailUpdate);
    const context = `${fixLine} ${trailUpdateLine} ${dispatchLine} Treat this as public pilot context only. Weight Trail Updates as the freshest hiker signal. If the exact AT mile is unclear, say so and estimate conservatively.`;

    return [
      {
        title: 'Dad next 7 days',
        text: `${context} Draft Dad's next 7 days with conservative daily mileage, max 4-day food carries, likely town or hostel timing, and the assumptions that need checking next.`
      },
      {
        title: 'Dad next food carry',
        text: `${context} Plan Dad's next food carry. Keep it practical, show likely sleep targets, and name the next realistic town, hostel, or shuttle options instead of vague optimism.`
      },
      {
        title: 'Latest update check',
        text: `${context} Use the latest Trail Update as the freshest signal. Tell me what changed, what Chris should ask Dad next, and what part of the plan should be revised first.`
      },
      {
        title: 'Dad weakest link',
        text: `${context} Tell me the weakest link in Dad's next week and what note, checklist, or plan revision would tighten it fastest.`
      }
    ];
  }

  function savedPlans(currentDocs: ImportedDocument[]): ImportedDocument[] {
    return [...currentDocs]
      .filter((document) => document.rights === 'assistant-generated')
      .sort((a, b) => Date.parse(b.updatedAt ?? b.importedAt) - Date.parse(a.updatedAt ?? a.importedAt));
  }

  function slotKeyForDocument(document: ImportedDocument): StandardDocumentSlotKey | null {
    return document.slotKey ?? inferStandardDocumentSlotKey(document.title);
  }

  function standardSlotDocument(slotKey: StandardDocumentSlotKey): ImportedDocument | null {
    return documents.find((document) => slotKeyForDocument(document) === slotKey) ?? null;
  }

  function startedStandardDocumentCount(): number {
    return STANDARD_DOCUMENT_SLOTS.filter((slot) => standardSlotDocument(slot.key)).length;
  }

  function extraDocumentCount(): number {
    return documents.filter((document) => !slotKeyForDocument(document) && document.status !== 'archived').length;
  }

  function targetStandardSlot() {
    return targetStandardSlotKey ? standardDocumentSlotForKey(targetStandardSlotKey) : null;
  }

  function findDocument(documentId: string): ImportedDocument | null {
    return documents.find((document) => document.id === documentId) ?? null;
  }

  function activeDocument(): ImportedDocument | null {
    return selectedDocumentId ? findDocument(selectedDocumentId) : null;
  }

  function findResource(resourceId: string): WorkspaceResource | null {
    return resources.find((resource) => resource.id === resourceId) ?? null;
  }

  const currentDocument = $derived(selectedDocumentId ? findDocument(selectedDocumentId) : null);
  const currentResource = $derived(selectedResourceId ? findResource(selectedResourceId) : null);

  function resourcePreview(resource: WorkspaceResource): string {
    const source = resource.extractedText || resource.summary || resource.sourceUri || resource.title;
    const normalized = source.replace(/\s+/g, ' ').trim();
    return normalized.length > 1200 ? `${normalized.slice(0, 1200).trimEnd()}…` : normalized;
  }

  function buildResourcePrompt(resource: WorkspaceResource, action: 'ask' | 'document' = 'ask'): string {
    const sourceContext = `Resource type: ${resource.kind}. Sensitivity: ${resource.sensitivity}. Source: ${resource.sourceUri || resource.originalFileName || 'pasted note'}. Relevant extracted context: ${resourcePreview(resource)}.`;

    if (action === 'document') {
      return `Use my private resource "${resource.title}" as source context and draft a reviewable Scout Doc from it. ${sourceContext} Structure the Doc with a title, source-backed facts, assumptions, trail impact, next actions, and missing checks. Keep it ready for me to save into Docs; do not overwrite the source resource.`;
    }

    return `Use my private resource "${resource.title}" as source context. ${sourceContext} Tell me what this changes about my trail plan, what is source-backed vs assumption, and whether this should become a maintained Doc.`;
  }

  function focusResource(resource: WorkspaceResource, action: 'ask' | 'document' = 'ask') {
    selectedResourceId = resource.id;
    selectedDocumentId = '';
    targetStandardSlotKey = '';
    replyInput = buildResourcePrompt(resource, action);
    saveNotice = action === 'document'
      ? `Drafting a Doc from "${resource.title}". Save Scout's reply when it looks right.`
      : `Using "${resource.title}" as private resource context.`;
    savedDocumentHref = `/app/resources#resource-${encodeURIComponent(resource.id)}`;
    void focusPromptComposer();
  }

  function buildDocumentUpdatePrompt(document: ImportedDocument): string {
    if (document.rights === 'assistant-generated') {
      return `Update my ${document.title}. Ask me only for the missing facts you need first, then keep this document current as we talk. If you already have enough context, rewrite it into a practical current version with a current snapshot, known facts, open questions, next actions, and change history.`;
    }

    return `Use my private document "${document.title}" as context. Tell me what it changes about my trail plan, what looks source-backed, what is assumption, and the one or two questions that would tighten the next decision.`;
  }

  function focusDocument(document: ImportedDocument) {
    selectedDocumentId = document.id;
    selectedResourceId = '';
    targetStandardSlotKey = '';
    replyInput = buildDocumentUpdatePrompt(document);
    void focusPromptComposer();
  }

  function focusStandardSlot(slotKey: StandardDocumentSlotKey) {
    const slot = standardDocumentSlotForKey(slotKey);
    if (!slot) return;

    const existing = standardSlotDocument(slotKey);
    if (existing) {
      focusDocument(existing);
      return;
    }

    selectedDocumentId = '';
    selectedResourceId = '';
    targetStandardSlotKey = slotKey;
    replyInput = slot.starterPrompt;
    saveNotice = `Drafting ${slot.title}. Save Scout's reply back to this standard doc when it looks right.`;
    savedDocumentHref = '';
    void focusPromptComposer();
  }

  function ensureSelectedDocument(currentDocs: ImportedDocument[]) {
    if (selectedDocumentId && !currentDocs.some((document) => document.id === selectedDocumentId)) {
      selectedDocumentId = '';
    }
  }

  function ensureSelectedResource(currentResources: WorkspaceResource[]) {
    if (selectedResourceId && !currentResources.some((resource) => resource.id === selectedResourceId)) {
      selectedResourceId = '';
    }
  }

  function applyWorkspaceSnapshot(workspace: WorkspaceSnapshot) {
    profile = workspace.profile;
    documents = Array.isArray(workspace.documents) ? workspace.documents : [];
    resources = Array.isArray(workspace.resources) ? workspace.resources : [];
    ensureSelectedDocument(documents);
    ensureSelectedResource(resources);
    lanes = workspace.profile ? buildClawLanes(workspace.profile, workspace.sections, workspace.documents, workspace.tools, workspace.resources) : [];
  }

  function formatLocationDistance(miles: number): string {
    if (!Number.isFinite(miles)) return 'unknown distance';
    if (miles < 0.1) return 'on the AT corridor';
    if (miles < 1) return `${(miles * 5280).toFixed(0)} ft from the AT`;
    return `${miles.toFixed(1)} mi from the AT`;
  }

  function formatAccuracy(meters: number | null): string {
    if (meters === null || !Number.isFinite(meters)) return '';
    if (meters < 1609.344) return `, ±${meters.toFixed(0)}m`;
    return `, ±${(meters / 1609.344).toFixed(1)}mi`;
  }

  function locationPromptLine(payload: ScoutLocationUpdatePayload): string {
    const location = payload.location;
    const coordinates = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
    const trailDistance = formatLocationDistance(location.distanceToTrailMiles);
    const profileLine = payload.profileUpdated
      ? `Profile current mile updated to ${location.nearestMile.toFixed(1)}.`
      : `Profile current mile not changed: ${payload.profileUpdateReason ?? 'GPS fix was not close enough to the AT corridor.'}`;

    return `Scout GPS context: browser fix ${coordinates}${formatAccuracy(location.accuracyMeters)}; nearest AT mile ${location.nearestMile.toFixed(1)} (${trailDistance}). ${profileLine} Use this as my current-position context unless I correct it.`;
  }

  function mergeLocationIntoPrompt(prompt: string, line: string): string {
    const withoutPreviousLocation = prompt
      .split('\n')
      .filter((part) => !part.trim().startsWith('Scout GPS context:'))
      .join('\n')
      .trim();

    if (!withoutPreviousLocation) {
      return `Use my current location for the next trail decision.\n\n${line}`;
    }

    return `${withoutPreviousLocation}\n\n${line}`;
  }

  function geolocationErrorMessage(caught: unknown): string {
    const maybePositionError = caught as { code?: unknown } | null;
    if (maybePositionError && typeof maybePositionError.code === 'number') {
      if (maybePositionError.code === 1) return 'GPS permission was denied. Enable location for this site, then try again.';
      if (maybePositionError.code === 2) return 'GPS is unavailable right now. Try again with clearer signal.';
      if (maybePositionError.code === 3) return 'GPS timed out before the browser returned a fix. Try again.';
    }

    return caught instanceof Error ? caught.message : 'Could not add your current GPS location.';
  }

  function currentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolvePosition, rejectPosition) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        rejectPosition(new Error('GPS is not available in this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolvePosition, rejectPosition, {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 15_000
      });
    });
  }

  async function postLocationFix(position: GeolocationPosition): Promise<ScoutLocationUpdatePayload> {
    return await jsonOrThrow(
      await fetch('/app-api/workspace/profile/current-location', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy
        })
      })
    ) as ScoutLocationUpdatePayload;
  }

  async function logBackgroundLocation(position: GeolocationPosition) {
    try {
      const payload = await postLocationFix(position);
      applyWorkspaceSnapshot(payload.workspace);
      if (payload.location.distanceToTrailMiles <= 2) {
        locationNotice = `Trail GPS tracking on · latest useful fix near mile ${payload.location.nearestMile.toFixed(1)}.`;
      }
    } catch (caught) {
      console.error(caught);
      locationError = geolocationErrorMessage(caught);
    }
  }

  function startTrailLocationTracking() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator) || locationWatchId !== null) return;

    locationWatchId = navigator.geolocation.watchPosition(
      (position) => { void logBackgroundLocation(position); },
      (caught) => {
        locationTracking = false;
        locationError = geolocationErrorMessage(caught);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60_000,
        timeout: 20_000
      }
    );
    locationTracking = true;
  }

  async function attachCurrentLocation() {
    locationBusy = true;
    locationNotice = '';
    locationError = '';
    saveNotice = '';
    saveError = '';

    try {
      const position = await currentPosition();
      const payload = await postLocationFix(position);

      applyWorkspaceSnapshot(payload.workspace);
      replyInput = mergeLocationIntoPrompt(replyInput, locationPromptLine(payload));
      locationNotice = payload.profileUpdated
        ? `GPS added · profile is now mile ${payload.location.nearestMile.toFixed(1)}. Trail GPS tracking is on while this page is open.`
        : `GPS added · nearest AT mile ${payload.location.nearestMile.toFixed(1)} (${formatLocationDistance(payload.location.distanceToTrailMiles)}). Profile unchanged. Trail GPS tracking is on while this page is open.`;
      startTrailLocationTracking();
      await focusPromptComposer();
    } catch (caught) {
      console.error(caught);
      locationError = geolocationErrorMessage(caught);
    } finally {
      locationBusy = false;
    }
  }

  async function consumeStandardDocumentQueryState() {
    const url = new URL(window.location.href);
    const slotKey = url.searchParams.get('standardDocSlot');
    if (!isStandardDocumentSlotKey(slotKey)) return;

    focusStandardSlot(slotKey);
    url.searchParams.delete('standardDocSlot');
    url.searchParams.delete('documentAction');
    window.history.replaceState({}, '', url);
  }

  async function consumeDocumentQueryState() {
    const url = new URL(window.location.href);
    const documentId = url.searchParams.get('documentId');
    const documentAction = url.searchParams.get('documentAction');
    if (!documentId) return;

    const document = documents.find((item) => item.id === documentId) ?? null;
    if (!document) {
      saveError = 'That document was not found in this workspace.';
    } else {
      selectedDocumentId = document.id;
      targetStandardSlotKey = '';
      if (documentAction === 'review' || !replyInput.trim()) {
        replyInput = buildDocumentUpdatePrompt(document);
      }
      saveNotice = `Using "${document.title}" as Scout context.`;
      savedDocumentHref = `/app/docs/${encodeURIComponent(document.id)}`;
      await focusPromptComposer();
    }

    url.searchParams.delete('documentId');
    url.searchParams.delete('documentAction');
    window.history.replaceState({}, '', url);
  }

  async function consumeResourceQueryState() {
    const url = new URL(window.location.href);
    const resourceId = url.searchParams.get('resourceId');
    const resourceAction = url.searchParams.get('resourceAction') === 'document' ? 'document' : 'ask';
    if (!resourceId) return;

    const resource = resources.find((item) => item.id === resourceId) ?? null;
    if (!resource) {
      saveError = 'That resource was not found in this workspace.';
    } else {
      focusResource(resource, resourceAction);
      await focusPromptComposer();
    }

    url.searchParams.delete('resourceId');
    url.searchParams.delete('resourceAction');
    window.history.replaceState({}, '', url);
  }

  async function consumePromptQueryState() {
    const url = new URL(window.location.href);
    const prompt = url.searchParams.get('prompt')?.trim();
    if (!prompt) return;

    replyInput = prompt.slice(0, 4000);
    url.searchParams.delete('prompt');
    window.history.replaceState({}, '', url);
    await focusPromptComposer();
  }

  async function focusCloudThread() {
    await tick();
    threadCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function scrollCloudThreadToLatest() {
    await tick();
    const latest = threadMessages?.lastElementChild;
    if (latest instanceof HTMLElement) {
      latest.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  async function loadDailyBrief() {
    dailyBriefLoading = true;
    dailyBriefError = '';

    try {
      dailyBrief = await jsonOrThrow(await fetch('/app-api/claw/daily-brief', { cache: 'no-store' })) as ScoutDailyBrief;
    } catch (caught) {
      console.error(caught);
      dailyBriefError = caught instanceof Error ? caught.message : 'Could not load the Daily Trail Brief.';
    } finally {
      dailyBriefLoading = false;
    }
  }

  async function loadDadPilot() {
    try {
      const payload = await fetch('/app-api/dad', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null);
      dadPilot = payload ? (payload as DadPilotSummary) : null;
    } catch {
      dadPilot = null;
    }
  }

  async function loadState() {
    loading = true;
    error = '';

    try {
      const [workspacePayload, clawPayload] = await Promise.all([
        jsonOrThrow(await fetch('/app-api/workspace', { cache: 'no-store' })),
        jsonOrThrow(await fetch('/app-api/claw', { cache: 'no-store' }))
      ]);

      applyWorkspaceSnapshot(workspacePayload as WorkspaceSnapshot);
      connection = (clawPayload.connection ?? null) as ProviderConnection | null;
      messages = Array.isArray(clawPayload.messages) ? (clawPayload.messages as ClawMessage[]) : [];
      factCandidates = Array.isArray(clawPayload.factCandidates) ? (clawPayload.factCandidates as FactCandidate[]) : [];
      void loadDadPilot();
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not load the Scout console.';
    } finally {
      loading = false;
    }
  }

  async function startConnect() {
    connectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/claw/connect/openai-codex/start', {
          method: 'POST'
        })
      );

      authorizeUrl = String(payload.authorizeUrl ?? '');
      connectMode = payload.mode === 'cloud_callback' || payload.mode === 'manual_callback' ? payload.mode : '';
      connectRedirectUri = typeof payload.redirectUri === 'string' ? payload.redirectUri : '';
      connectInstructions = Array.isArray(payload.instructions) ? payload.instructions.map(String) : [];

      if (authorizeUrl) {
        window.open(authorizeUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not start ChatGPT connect.';
    } finally {
      connectBusy = false;
    }
  }

  async function finishConnect() {
    connectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      await jsonOrThrow(
        await fetch('/app-api/claw/connect/openai-codex/complete', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            authorizationInput: connectInput
          })
        })
      );

      authorizeUrl = '';
      connectMode = '';
      connectRedirectUri = '';
      connectInstructions = [];
      connectInput = '';
      connectNotice = 'ChatGPT connected to this workspace.';
      await loadState();
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not finish ChatGPT connect.';
    } finally {
      connectBusy = false;
    }
  }

  async function disconnect() {
    disconnectBusy = true;
    connectError = '';
    connectNotice = '';

    try {
      await jsonOrThrow(
        await fetch('/app-api/claw/connect/openai-codex/disconnect', {
          method: 'POST'
        })
      );

      authorizeUrl = '';
      connectMode = '';
      connectRedirectUri = '';
      connectInstructions = [];
      connectInput = '';
      await loadState();
    } catch (caught) {
      console.error(caught);
      connectError = caught instanceof Error ? caught.message : 'Could not disconnect ChatGPT.';
    } finally {
      disconnectBusy = false;
    }
  }

  async function startNewThread() {
    if (newThreadBusy || sendBusy || messages.length === 0) return;

    newThreadBusy = true;
    error = '';
    saveNotice = '';
    saveError = '';
    pendingPrompt = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/claw/thread', {
          method: 'DELETE'
        })
      );

      messages = Array.isArray(payload.messages) ? (payload.messages as ClawMessage[]) : [];
      factCandidates = Array.isArray(payload.factCandidates) ? (payload.factCandidates as FactCandidate[]) : factCandidates;
      connection = (payload.connection ?? connection) as ProviderConnection | null;
      historyOpen = false;
      await focusPromptComposer();
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not start a new Scout thread.';
    } finally {
      newThreadBusy = false;
    }
  }

  async function applyScoutReplyPayload(payload: Record<string, unknown>) {
    messages = Array.isArray(payload.messages) ? (payload.messages as ClawMessage[]) : messages;
    documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
    ensureSelectedDocument(documents);
    factCandidates = Array.isArray(payload.factCandidates) ? (payload.factCandidates as FactCandidate[]) : factCandidates;
    connection = (payload.connection ?? null) as ProviderConnection | null;
    const revisedDocument = (payload.revisedDocument ?? null) as ImportedDocument | null;
    if (revisedDocument) {
      savedDocumentHref = `/app/docs/${encodeURIComponent(revisedDocument.id)}`;
      saveNotice = `Saved a new review version for "${revisedDocument.title}" in Docs.`;
    }
  }

  async function fetchJsonScoutReply(message: string) {
    return jsonOrThrow(
      await fetch('/app-api/claw/reply', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          message,
          documentId: selectedDocumentId || null,
          resourceId: selectedResourceId || null
        })
      })
    ) as Promise<Record<string, unknown>>;
  }

  async function sendMessage() {
    const message = replyInput.trim();
    if (!message) return;

    const now = Date.now();
    const pendingUserMessage: ClawMessage = {
      id: `pending-user-${now}`,
      role: 'user',
      text: message,
      createdAt: new Date(now).toISOString(),
      model: null,
      error: false
    };
    const streamingAssistantMessage: ClawMessage = {
      id: `pending-assistant-${now}`,
      role: 'assistant',
      text: '',
      createdAt: new Date(now + 1).toISOString(),
      model: null,
      error: false
    };
    let receivedAssistantText = false;
    let streamStarted = false;

    sendBusy = true;
    streamingReplyVisible = false;
    pendingPrompt = message;
    error = '';
    saveNotice = '';
    saveError = '';
    replyInput = '';
    await resetPromptHeight();
    messages = [...messages, pendingUserMessage];
    await focusCloudThread();
    await scrollCloudThreadToLatest();

    try {
      const response = await fetch('/app-api/claw/reply/stream', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          message,
          documentId: selectedDocumentId || null,
          resourceId: selectedResourceId || null
        })
      });
      streamStarted = response.ok && !!response.body;

      await readScoutReplyStream(response, {
        onDelta: async (delta) => {
          if (!receivedAssistantText) {
            receivedAssistantText = true;
            streamingReplyVisible = true;
            messages = [...messages, { ...streamingAssistantMessage, text: delta }];
          } else {
            messages = messages.map((threadMessage) => threadMessage.id === streamingAssistantMessage.id
              ? { ...threadMessage, text: `${threadMessage.text}${delta}` }
              : threadMessage);
          }

          await scrollCloudThreadToLatest();
        },
        onDone: applyScoutReplyPayload
      });
    } catch (caught) {
      if (!receivedAssistantText && !streamStarted) {
        try {
          const payload = await fetchJsonScoutReply(message);
          await applyScoutReplyPayload(payload);
          error = '';
        } catch (fallbackCaught) {
          console.error(fallbackCaught);
          replyInput = message;
          await resetPromptHeight();
          error = fallbackCaught instanceof Error ? fallbackCaught.message : 'Could not send the cloud prompt.';
        }
      } else {
        console.error(caught);
        if (!receivedAssistantText) replyInput = message;
        await resetPromptHeight();
        error = caught instanceof Error ? caught.message : 'Could not finish the Scout reply stream.';
      }
    } finally {
      pendingPrompt = '';
      sendBusy = false;
      streamingReplyVisible = false;
      await focusCloudThread();
      await scrollCloudThreadToLatest();
    }
  }

  async function seedScoutDocuments() {
    seedBusy = true;
    saveNotice = '';
    saveError = '';

    try {
      const workspace = await jsonOrThrow(
        await fetch('/app-api/workspace/scout-docs/seed', {
          method: 'POST'
        })
      ) as WorkspaceSnapshot;

      documents = Array.isArray(workspace.documents) ? workspace.documents : documents;
      ensureSelectedDocument(documents);
      saveNotice = 'Starter Scout documents are ready. Pick one and talk to Scout to fill it in.';
    } catch (caught) {
      console.error(caught);
      saveError = caught instanceof Error ? caught.message : 'Could not create starter Scout documents.';
    } finally {
      seedBusy = false;
    }
  }

  async function saveReplyAsDocument(messageId: string, slotKey: StandardDocumentSlotKey | null = targetStandardSlotKey || null) {
    savingMessageId = messageId;
    saveNotice = '';
    saveError = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/claw/save-document', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ messageId, slotKey })
        })
      );

      const document = (payload.document ?? null) as ImportedDocument | null;
      documents = Array.isArray(payload.documents) ? (payload.documents as ImportedDocument[]) : documents;
      ensureSelectedDocument(documents);
      if (document) {
        savedMessageIds = savedMessageIds.includes(messageId) ? savedMessageIds : [...savedMessageIds, messageId];
        selectedDocumentId = document.id;
        selectedResourceId = '';
        targetStandardSlotKey = '';
        savedDocumentHref = `/app/docs/${encodeURIComponent(document.id)}`;
        saveNotice = slotKey ? `Saved a review version for "${document.title}".` : `Saved "${document.title}" to Docs.`;
      }
    } catch (caught) {
      console.error(caught);
      saveError = caught instanceof Error ? caught.message : 'Could not save that Scout reply.';
    } finally {
      savingMessageId = null;
    }
  }

  onMount(() => {
    consumeConnectQueryState();
    loadState()
      .then(async () => {
        await consumeStandardDocumentQueryState();
        await consumeDocumentQueryState();
        await consumeResourceQueryState();
        await consumePromptQueryState();
      })
      .catch(() => undefined);
  });

  onDestroy(() => {
    if (locationWatchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
  });
</script>

<section class="scout-workspace" class:history-open={historyOpen} class:docs-open={docsOpen}>
  <header class="workspace-commandbar">
    <button
      class="command-icon"
      class:active={historyOpen}
      type="button"
      aria-label="Open conversations"
      aria-expanded={historyOpen}
      aria-controls="history-panel"
      onclick={toggleHistoryPanel}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="command-label">Chats</span>
    </button>

    <div class="scout-title" class:scout-title--warn={!connection} aria-live="polite">
      <span aria-hidden="true"></span>
      <strong>Scout</strong>
    </div>

    <button
      class="command-icon"
      class:active={docsOpen}
      type="button"
      aria-label="Open resources"
      aria-expanded={docsOpen}
      aria-controls="docs-panel"
      onclick={toggleDocsPanel}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="command-label">Sources</span>
    </button>
  </header>

  {#if loading}
    <article class="workspace-alert workspace-alert--quiet">Loading Scout…</article>
  {/if}

  {#if error}
    <article class="workspace-alert">{error}</article>
  {/if}

  {#if !connection && !loading && messages.length > 0}
    <section class="connect-strip">
      <div>
        <strong>Connect Scout to send prompts.</strong>
        <span>Setup is only needed once.</span>
      </div>
      <button class="primary-button" type="button" onclick={startConnect} disabled={connectBusy}>
        {connectBusy ? 'Starting…' : 'Connect Scout'}
      </button>
      {#if authorizeUrl}
        <a class="secondary-button" href={authorizeUrl} target="_blank" rel="noreferrer">Open auth</a>
      {/if}
      {#if connectInstructions.length > 0}
        <details>
          <summary>Manual fallback</summary>
          <ol>
            {#each connectInstructions as instruction}
              <li>{instruction}</li>
            {/each}
          </ol>
          <textarea
            bind:value={connectInput}
            rows="3"
            placeholder={connectMode === 'cloud_callback' && connectRedirectUri ? `${connectRedirectUri}?code=...&state=...` : 'Paste the callback URL here'}
          ></textarea>
          <button class="primary-button" type="button" onclick={finishConnect} disabled={connectBusy || !connectInput.trim()}>
            {connectBusy ? 'Finishing…' : 'Finish connect'}
          </button>
        </details>
      {/if}
      {#if connectNotice}<p class="success-note">{connectNotice}</p>{/if}
      {#if connectError}<p class="workspace-alert">{connectError}</p>{/if}
    </section>
  {/if}

  {#if historyOpen || docsOpen}
    <button class="workspace-scrim" type="button" aria-label="Close side panels" onclick={() => { historyOpen = false; docsOpen = false; }}></button>
  {/if}

  <div class="workspace-grid">
    <aside id="history-panel" class="workspace-panel history-panel" class:panel-open={historyOpen} aria-label="Conversation history">
      <div class="panel-head">
        <h2>Conversations</h2>
        <button class="icon-button" type="button" aria-label="Close conversations" onclick={() => (historyOpen = false)}>×</button>
      </div>

      <section class="thread-summary-card" aria-label="Current Scout conversation summary">
        <strong>Current thread</strong>
        <span>{userMessageCount()} asks · {assistantMessageCount()} Scout replies</span>
        <button class="secondary-button" type="button" onclick={() => { closeMobilePanels(); void focusPromptComposer(); }}>Ask next</button>
      </section>

      <div class="drawer-section-label">Recent turns</div>

      {#if messages.length === 0}
        <p class="small-note">No chats yet. Start with one practical trail question.</p>
      {:else}
        <div class="history-list" aria-label="Recent Scout thread turns">
          {#each messageHistory() as message}
            <button type="button" class:history-item={true} class:history-item--assistant={message.role === 'assistant'} onclick={() => { closeMobilePanels(); void focusCloudThread(); }}>
              <span>
                <strong>{message.role === 'assistant' ? 'Scout' : 'You'}</strong>
                <small>{messageTime(message.createdAt)}</small>
              </span>
              <em>{threadPreview(message)}</em>
            </button>
          {/each}
        </div>
      {/if}
    </aside>

    <main class="conversation-shell" aria-label="Scout conversation">
      <div class="conversation-topline">
        <button class="rail-toggle" type="button" onclick={toggleHistoryPanel} aria-expanded={historyOpen} aria-controls="history-panel">☰ Conversations</button>
        <div>
          <strong>Plan thread</strong>
          <span>{messages.length} turn{messages.length === 1 ? '' : 's'}</span>
        </div>
        <div class="conversation-topline-actions">
          {#if messages.length > 0}
            <button class="rail-toggle" type="button" onclick={startNewThread} disabled={newThreadBusy || sendBusy} title="Clear Scout chat history for this workspace">
              {newThreadBusy ? 'Starting…' : 'New thread'}
            </button>
          {/if}
          <button class="rail-toggle" type="button" onclick={toggleDocsPanel} aria-expanded={docsOpen} aria-controls="docs-panel">Sources ▸</button>
        </div>
      </div>

      <section class="message-viewport" class:message-viewport--empty={messages.length === 0 && !sendBusy} bind:this={threadCard}>
        <div class="route-pill">{routePillLabel(profile)}</div>
        <div class="message-list" bind:this={threadMessages}>
          {#if messages.length === 0 && !sendBusy}
            <article class="empty-thread">
              <span class="empty-kicker">Start here</span>
              <strong>What do you need to decide next?</strong>
              <span>Ask one practical trail question. Scout will keep the answer grounded and brief.</span>
              {#if connection}
                <div class="empty-actions" aria-label="Quick Scout questions">
                  {#each composerPromptStarters(profile, dailyBrief).slice(0, 4) as starter}
                    <button type="button" onclick={() => useExamplePrompt(starter)} disabled={sendBusy} title={starter.text}>
                      <span aria-hidden="true">{starter.icon ?? '✦'}</span>
                      {starter.title}
                    </button>
                  {/each}
                </div>
              {:else}
                <div class="empty-connect">
                  <span>Connect once, then ask Scout from here.</span>
                  <button class="primary-button" type="button" onclick={startConnect} disabled={connectBusy}>
                    {connectBusy ? 'Starting…' : 'Connect Scout'}
                  </button>
                </div>
              {/if}
            </article>
          {:else}
            {#each messages as message}
              <article class:message={true} class:message--assistant={message.role === 'assistant'} class:message--user={message.role === 'user'}>
                <div class="message-label">
                  <strong>{message.role === 'assistant' ? 'Scout' : 'You'}</strong>
                  <span>{messageTime(message.createdAt)}</span>
                </div>
                <div class="message-body">
                  {#each messageBlocks(message) as block}
                    {#if block.kind === 'heading'}
                      <h3>{block.text}</h3>
                    {:else if block.kind === 'list'}
                      <ul>
                        {#each block.items ?? [] as item}
                          <li>{item}</li>
                        {/each}
                      </ul>
                    {:else if block.kind === 'table'}
                      <pre>{block.text}</pre>
                    {:else if block.kind === 'rule'}
                      <hr />
                    {:else}
                      <p>{block.text}</p>
                    {/if}
                  {/each}
                </div>
                <div class="message-footer">
                  {#if message.model}<span>{message.model}</span>{/if}
                  {#if message.error}<span>error</span>{/if}
                  {#if message.role === 'assistant' && !message.error}
                    {#if targetStandardSlot()}
                      <button type="button" onclick={() => saveReplyAsDocument(message.id, targetStandardSlotKey || null)} disabled={savingMessageId === message.id || savedMessageIds.includes(message.id)}>
                        {savingMessageId === message.id ? 'Saving…' : savedMessageIds.includes(message.id) ? 'Saved' : `Save to ${targetStandardSlot()?.shortTitle}`}
                      </button>
                      <button type="button" onclick={() => saveReplyAsDocument(message.id, null)} disabled={savingMessageId === message.id || savedMessageIds.includes(message.id)}>Save extra</button>
                    {:else}
                      <button type="button" onclick={() => saveReplyAsDocument(message.id)} disabled={savingMessageId === message.id || savedMessageIds.includes(message.id)}>
                        {savingMessageId === message.id ? 'Saving…' : savedMessageIds.includes(message.id) ? 'Saved' : 'Save to Docs'}
                      </button>
                    {/if}
                  {/if}
                </div>
              </article>
            {/each}
            {#if sendBusy && !streamingReplyVisible}
              <article class="checking-card" aria-live="polite">
                <span class="checking-icon" aria-hidden="true">◎</span>
                <em>Scout is checking trail notes…</em>
                <span class="checking-dots" aria-hidden="true">
                  <span>•</span><span>•</span><span>•</span>
                </span>
              </article>
            {/if}
          {/if}
        </div>
      </section>

      {#if connection || messages.length > 0 || replyInput.trim() || currentDocument || currentResource || targetStandardSlot() || locationNotice || locationError || saveNotice || saveError}
      <section id="ask-scout" class="composer-shell" aria-label="Ask Scout">
        {#if currentDocument}
          <div class="document-context-pill">
            <span>{slotKeyForDocument(currentDocument) ? 'Updating standard doc' : currentDocument.rights === 'assistant-generated' ? 'Updating living doc' : 'Using private doc'}</span>
            <strong>{currentDocument.title}</strong>
            <a href={`/app/docs/${encodeURIComponent(currentDocument.id)}`}>Open doc</a>
            <button type="button" onclick={() => (selectedDocumentId = '')}>Clear</button>
          </div>
        {:else if currentResource}
          <div class="document-context-pill">
            <span>Using private resource</span>
            <strong>{currentResource.title}</strong>
            <a href={`/app/resources#resource-${encodeURIComponent(currentResource.id)}`}>Open resource</a>
            <button type="button" onclick={() => (selectedResourceId = '')}>Clear</button>
          </div>
        {:else if targetStandardSlot()}
          <div class="document-context-pill">
            <span>Drafting standard doc</span>
            <strong>{targetStandardSlot()?.title}</strong>
            <button type="button" onclick={() => { targetStandardSlotKey = ''; replyInput = ''; }}>Clear</button>
          </div>
        {/if}

        {#if messages.length > 0}
          <div class="thread-actions" aria-label="Scout thread actions">
            <button class="tiny-button" type="button" onclick={startNewThread} disabled={newThreadBusy || sendBusy} title="Clear Scout chat history for this workspace">
              {newThreadBusy ? 'Starting new thread…' : 'New thread'}
            </button>
            <span>Clears this chat only. Profile, docs, resources, and saved plans stay put.</span>
          </div>
          <div class="composer-starters" aria-label="Prompt starters">
            {#each composerPromptStarters(profile, dailyBrief).slice(0, 3) as starter}
              <button type="button" onclick={() => useExamplePrompt(starter)} disabled={!connection || sendBusy} title={starter.text}>
                <span aria-hidden="true">{starter.icon ?? '✦'}</span>
                {starter.title}
              </button>
            {/each}
          </div>
        {/if}

        <div class="prompt-box">
          <label class="sr-only" for="scout-prompt">Ask Scout</label>
          <button
            class="location-button"
            class:active={locationTracking}
            type="button"
            onclick={attachCurrentLocation}
            disabled={sendBusy || locationBusy || !connection}
            aria-label={locationTracking ? 'Trail GPS tracking is on' : 'Add current GPS location'}
            title={locationTracking ? 'Trail GPS tracking is on while this page is open' : 'Add current GPS location'}
          >
            {#if locationBusy}
              <span aria-hidden="true">◎</span>
            {:else}
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            {/if}
          </button>
          <textarea
            id="scout-prompt"
            bind:this={promptTextarea}
            bind:value={replyInput}
            rows="1"
            disabled={sendBusy || !connection}
            placeholder={connection ? 'Ask Scout about the trail…' : 'Connect Scout to ask…'}
            oninput={(event) => syncPromptHeight(event.currentTarget as HTMLTextAreaElement)}
          ></textarea>
          <button
            class="send-button prompt-send"
            type="button"
            onclick={sendMessage}
            disabled={sendBusy || !connection || !replyInput.trim()}
            aria-label="Send to Scout"
            title="Send to Scout"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M3.7 20.3 21 12 3.7 3.7l-.2 6.4 10.1 1.9-10.1 1.9.2 6.4Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        {#if locationNotice}
          <p class="location-note">{locationNotice}</p>
        {/if}
        {#if locationError}
          <p class="workspace-alert">{locationError}</p>
        {/if}

        {#if saveNotice}
          <p class="success-note">
            {saveNotice}
            {#if savedDocumentHref}
              <a href={savedDocumentHref}>Open doc</a>
            {/if}
          </p>
        {/if}
        {#if saveError}
          <p class="workspace-alert">{saveError}</p>
        {/if}
      </section>
      {/if}
    </main>

    <aside id="docs-panel" class="workspace-panel docs-panel" class:panel-open={docsOpen} aria-label="Resources and trail context">
      <div class="panel-head">
        <h2>Resources</h2>
        <button class="icon-button" type="button" aria-label="Close resources panel" onclick={() => (docsOpen = false)}>×</button>
      </div>

      <section class="thread-summary-card doc-summary-card" aria-label="Resource navigation summary">
        <strong>Scout context</strong>
        <span>Brief · docs · uploaded sources</span>
      </section>

      <nav class="resource-nav" aria-label="Resource navigation">
        <button class="resource-nav-item" type="button" onclick={loadDailyBrief} disabled={dailyBriefLoading}>
          <strong>{dailyBriefLoading ? 'Refreshing brief…' : 'Trail brief'}</strong>
          <small>Today’s route, weather, and trail signals</small>
        </button>
        <a class="resource-nav-item" href="/app/docs">
          <strong>Docs</strong>
          <small>Saved plans and Scout notes</small>
        </a>
        <a class="resource-nav-item" href="/app/resources">
          <strong>Sources</strong>
          <small>Files, URLs, and pasted notes</small>
        </a>
      </nav>

      {#if currentDocument}
        <section class="panel-card selected-doc-card" aria-label="Attached document">
          <div class="mini-head">
            <strong>Attached now</strong>
            <button class="tiny-button" type="button" onclick={() => (selectedDocumentId = '')}>Clear</button>
          </div>
          <p>{currentDocument.title}</p>
          <a href={`/app/docs/${encodeURIComponent(currentDocument.id)}`}>Open doc</a>
        </section>
      {:else if currentResource}
        <section class="panel-card selected-doc-card" aria-label="Attached source">
          <div class="mini-head">
            <strong>Attached now</strong>
            <button class="tiny-button" type="button" onclick={() => (selectedResourceId = '')}>Clear</button>
          </div>
          <p>{currentResource.title}</p>
          <a href={`/app/resources#resource-${encodeURIComponent(currentResource.id)}`}>Open source</a>
        </section>
      {/if}

      {#if dailyBrief}
        <section class="panel-card brief-card">
          <div class="mini-head">
            <strong>Trail brief</strong>
            <button class="tiny-button" type="button" onclick={useDailyBriefPrompt} disabled={!connection || sendBusy}>Use</button>
          </div>
          <p class="brief-summary">{dailyBrief.summary}</p>
        </section>
      {:else if dailyBriefError}
        <p class="workspace-alert">{dailyBriefError}</p>
      {/if}

      <details class="panel-card context-details">
        <summary>Choose active resource</summary>
        <div class="context-stack">
          <section class="panel-card panel-card--nested">
            <div class="mini-head">
              <strong>Standard docs</strong>
              <a href="/app/docs">Open all</a>
            </div>
            <div class="doc-list standard-slot-list">
              {#each STANDARD_DOCUMENT_SLOTS as slot}
                {@const doc = standardSlotDocument(slot.key)}
                <button class:active={targetStandardSlotKey === slot.key || selectedDocumentId === doc?.id} type="button" onclick={() => focusStandardSlot(slot.key)} title={doc ? doc.title : slot.purpose}>
                  <span>{slot.title}</span>
                  <small>{doc ? `${doc.status ?? 'active'} · ${doc.versions?.length ?? 1}v` : 'empty · draftable'}</small>
                </button>
              {/each}
            </div>
          </section>

          <section class="panel-card panel-card--nested">
            <div class="mini-head">
              <strong>Sources</strong>
              <a href="/app/resources">Add</a>
            </div>
            {#if resources.length === 0}
              <p class="small-note">No sources yet. Add files, URLs, or pasted notes.</p>
            {:else}
              <div class="doc-list">
                {#each resources.slice(0, 6) as resource}
                  <button class:active={selectedResourceId === resource.id} type="button" onclick={() => focusResource(resource)} title={resource.title}>
                    <span>{resource.title}</span>
                    <small>{resource.kind} · {resource.sensitivity}</small>
                  </button>
                {/each}
              </div>
            {/if}
          </section>
        </div>
      </details>
    </aside>
  </div>
</section>

<style>
  :global(html),
  :global(body) {
    height: 100%;
  }

  :global(body) {
    overflow: hidden !important;
    background-color: var(--bg, #f5f2e8) !important;
    background-image:
      url('/default-background.svg'),
      radial-gradient(1200px 800px at 15% -5%, rgba(0, 0, 0, 0.03), transparent 65%),
      radial-gradient(1000px 600px at 85% 15%, rgba(0, 0, 0, 0.025), transparent 60%),
      radial-gradient(800px 500px at 50% 90%, rgba(0, 0, 0, 0.02), transparent 50%) !important;
    background-position: center 20%, center, center, center !important;
    background-repeat: no-repeat !important;
    background-size: 2400px 1600px, auto, auto, auto !important;
    background-attachment: fixed !important;
  }

  :global(.site-shell) {
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
    background:
      url('/default-background.svg') center 20% / 2400px 1600px no-repeat fixed,
      radial-gradient(1200px 800px at 15% -5%, rgba(0, 0, 0, 0.03), transparent 65%),
      radial-gradient(1000px 600px at 85% 15%, rgba(0, 0, 0, 0.025), transparent 60%),
      radial-gradient(800px 500px at 50% 90%, rgba(0, 0, 0, 0.02), transparent 50%),
      var(--bg, #f5f2e8);
  }

  :global(.site-header) {
    display: none;
  }

  :global(.site-main) {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    padding: 0 !important;
  }

  :global(.site-main > .container) {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    max-width: none;
    min-height: 0;
    margin: 0;
    padding: 0;
  }

  :global(.app-topbar) {
    display: none !important;
  }

  .scout-workspace {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.55rem;
    box-sizing: border-box;
    overflow: hidden;
    padding: 0.55rem 0.55rem max(0.55rem, env(safe-area-inset-bottom));
  }

  .workspace-commandbar,
  .connect-strip,
  .workspace-panel,
  .conversation-shell {
    border: 1px solid rgba(39, 51, 43, 0.14);
    background: rgba(247, 244, 235, 0.92);
    box-shadow: 0 14px 36px rgba(31, 41, 55, 0.06);
    backdrop-filter: blur(10px);
  }

  .workspace-commandbar {
    z-index: 25;
    display: grid;
    grid-template-columns: minmax(6.4rem, auto) minmax(0, 1fr) minmax(6.4rem, auto);
    align-items: center;
    min-height: 3.25rem;
    border-radius: 20px;
    border-color: rgba(77, 89, 74, 0.12);
    background: rgba(255, 253, 248, 0.92);
    box-shadow: 0 8px 22px rgba(31, 41, 55, 0.05);
    padding: 0.32rem;
  }

  .command-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-width: 0;
    min-height: 2.45rem;
    border: 1px solid transparent;
    border-radius: 14px;
    background: transparent;
    color: #40503f;
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    padding: 0 0.72rem;
    text-transform: uppercase;
  }

  .command-icon svg {
    flex: 0 0 auto;
    width: 1.18rem;
    height: 1.18rem;
  }

  .command-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .command-icon.active,
  .command-icon:hover {
    border-color: rgba(77, 89, 74, 0.18);
    background: rgba(237, 243, 229, 0.78);
    color: #26372d;
  }

  .scout-title {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    color: var(--pine, #4d594a);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.04rem;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .scout-title span {
    width: 0.52rem;
    height: 0.52rem;
    border-radius: 999px;
    background: #72e6a2;
    box-shadow: 0 0 0 5px rgba(114, 230, 162, 0.12);
  }

  .scout-title--warn span {
    background: #d97706;
    box-shadow: 0 0 0 5px rgba(217, 119, 6, 0.13);
  }

  .rail-toggle,
  .icon-button,
  .tiny-button,
  .message-footer button,
  .doc-list button {
    border: 1px solid rgba(77, 89, 74, 0.16);
    background: rgba(255, 255, 255, 0.88);
    color: #394638;
    cursor: pointer;
    font-weight: 850;
  }

  .rail-toggle,
  .tiny-button {
    min-height: 2.25rem;
    border-radius: 999px;
    padding: 0 0.72rem;
  }

  .rail-toggle:hover,
  .doc-list button.active {
    background: #28382f;
    border-color: #28382f;
    color: #fff;
  }

  .workspace-grid {
    display: grid;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'conversation';
    gap: 0.55rem;
    align-items: stretch;
    min-height: 0;
    height: 100%;
  }

  .conversation-shell {
    grid-area: conversation;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    min-width: 0;
    min-height: 0;
    height: 100%;
    max-height: none;
    overflow: hidden;
    border: 1px solid rgba(230, 225, 212, 0.72);
    border-radius: 26px;
    background:
      url('/default-background.svg') center 20% / 2400px 1600px no-repeat,
      radial-gradient(1200px 800px at 15% -5%, rgba(0, 0, 0, 0.03), transparent 65%),
      radial-gradient(1000px 600px at 85% 15%, rgba(0, 0, 0, 0.025), transparent 60%),
      radial-gradient(800px 500px at 50% 90%, rgba(0, 0, 0, 0.02), transparent 50%),
      var(--bg, #f5f2e8);
    box-shadow: var(--shadow-soft, 0 10px 22px rgba(0, 0, 0, 0.06));
  }

  .conversation-topline {
    display: none;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid rgba(77, 89, 74, 0.11);
    padding: 0.55rem 0.7rem;
  }

  .conversation-topline div {
    min-width: 0;
    text-align: center;
  }

  .conversation-topline-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;
  }

  .conversation-topline-actions .rail-toggle {
    white-space: nowrap;
  }

  .conversation-topline strong,
  .conversation-topline span {
    display: block;
  }

  .conversation-topline span {
    color: #6a7566;
    font-size: 0.78rem;
    font-weight: 750;
  }

  .message-viewport {
    min-height: 0;
    overflow-y: auto;
    padding: 1.4rem 1rem 0.95rem;
    scroll-behavior: smooth;
  }

  .message-viewport--empty {
    display: grid;
    align-content: center;
    padding-bottom: 1.4rem;
  }

  .route-pill {
    width: fit-content;
    max-width: min(100%, 24rem);
    margin: 0 auto 1.15rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.68);
    color: #52604d;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.055em;
    padding: 0.42rem 0.82rem;
    text-align: center;
  }

  .message-list {
    display: grid;
    gap: 1.35rem;
    max-width: 920px;
    margin: 0 auto;
  }

  .message {
    width: fit-content;
    max-width: min(88%, 48rem);
    border: 1px solid rgba(230, 225, 212, 0.95);
    border-radius: 20px 20px 20px 8px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: var(--shadow-soft, 0 10px 22px rgba(0, 0, 0, 0.06));
    padding: 1rem;
  }

  .message--user {
    justify-self: end;
    border-color: rgba(39, 51, 43, 0.28);
    border-radius: 20px 20px 6px 20px;
    background: #24362c;
    color: #fffdf8;
    box-shadow: 0 12px 26px rgba(36, 54, 44, 0.16);
  }

  .message--user .message-label,
  .message--user .message-footer {
    color: rgba(255, 253, 248, 0.72);
  }

  .message--assistant {
    justify-self: start;
  }

  .checking-card {
    justify-self: start;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: min(26rem, 92%);
    border: 1px solid rgba(39, 51, 43, 0.12);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.74);
    color: rgba(51, 51, 51, 0.62);
    box-shadow: 0 10px 22px rgba(31, 41, 55, 0.05);
    padding: 0.95rem 1rem;
  }

  .checking-card em {
    font-size: 1.05rem;
    font-style: italic;
    font-weight: 650;
    line-height: 1.3;
  }

  .checking-icon {
    display: grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.72);
    color: #fffdf8;
    font-weight: 900;
  }

  .checking-dots {
    display: inline-flex;
    align-items: center;
    gap: 0.08em;
    color: rgba(77, 89, 74, 0.38);
    font-size: 1.4rem;
    letter-spacing: 0.04em;
  }

  .checking-dots span {
    display: inline-block;
    animation: checking-dot-dance 1.05s ease-in-out infinite;
    transform-origin: center bottom;
  }

  .checking-dots span:nth-child(2) {
    animation-delay: 0.14s;
  }

  .checking-dots span:nth-child(3) {
    animation-delay: 0.28s;
  }

  @keyframes checking-dot-dance {
    0%, 72%, 100% {
      opacity: 0.42;
      transform: translateY(0) scale(0.9);
    }

    28% {
      opacity: 1;
      transform: translateY(-0.28rem) scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .checking-dots span {
      animation: none;
      opacity: 0.72;
      transform: none;
    }
  }

  .message-body {
    display: grid;
    gap: 0.58rem;
    margin-top: 0.45rem;
    line-height: 1.48;
  }

  .message-body p,
  .message-body h3,
  .message-body ul,
  .message-body pre {
    margin: 0;
  }

  .message-body h3 {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0.035em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .message-body ul {
    display: grid;
    gap: 0.35rem;
    padding-left: 1.08rem;
  }

  .message-body pre {
    max-width: 100%;
    overflow-x: auto;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 12px;
    background: rgba(245, 242, 232, 0.82);
    color: #27332b;
    font: 0.78rem/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    padding: 0.65rem;
    white-space: pre;
  }

  .message-body hr {
    width: 100%;
    border: 0;
    border-top: 1px solid rgba(77, 89, 74, 0.14);
    margin: 0.1rem 0;
  }

  .message-label,
  .message-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
    color: #6a7168;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .message-label strong {
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .message-footer {
    margin-top: 0.62rem;
  }

  .message-footer button {
    border-radius: 999px;
    padding: 0.26rem 0.5rem;
  }

  .empty-thread {
    display: grid;
    gap: 0.58rem;
    width: min(100%, 34rem);
    box-sizing: border-box;
    margin: 0 auto;
    border: 1px solid rgba(39, 51, 43, 0.12);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.9);
    color: #667064;
    box-shadow: 0 14px 30px rgba(31, 41, 55, 0.055);
    padding: 1.2rem;
    text-align: left;
  }

  .empty-kicker {
    width: fit-content;
    border-radius: 999px;
    background: rgba(237, 243, 229, 0.9);
    color: #394638;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    padding: 0.28rem 0.55rem;
    text-transform: uppercase;
  }

  .empty-thread strong {
    color: #27332b;
    font-size: clamp(1.45rem, 3vw, 2.15rem);
    letter-spacing: -0.045em;
    line-height: 1.02;
  }

  .empty-thread > span:not(.empty-kicker) {
    max-width: 28rem;
    font-size: 0.98rem;
    font-weight: 750;
    line-height: 1.45;
  }

  .empty-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 0.2rem;
  }

  .empty-actions button {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    min-height: 2.7rem;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 14px;
    background: rgba(245, 242, 232, 0.72);
    color: #27332b;
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.055em;
    padding: 0 0.72rem;
    text-align: left;
    text-transform: uppercase;
  }

  .empty-actions button:first-child {
    border-color: rgba(77, 89, 74, 0.32);
    background: #24362c;
    color: #fffdf8;
  }

  .empty-actions button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .empty-connect {
    display: grid;
    gap: 0.62rem;
    margin-top: 0.15rem;
  }

  .empty-connect span {
    color: #52604d;
    font-size: 0.9rem;
    font-weight: 850;
  }

  .empty-connect .primary-button {
    min-height: 2.78rem;
    width: fit-content;
    padding-inline: 1rem;
  }

  .composer-shell {
    position: relative;
    z-index: 10;
    display: grid;
    gap: 0.45rem;
    border-top: 1px solid rgba(230, 225, 212, 0.98);
    background: rgba(245, 242, 232, 0.97);
    padding: 0.46rem 0.5rem 0.5rem;
    box-shadow: 0 -10px 24px rgba(31, 41, 55, 0.05);
  }

  .document-context-pill {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.42rem;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 16px;
    background: #edf3e5;
    color: #394638;
    padding: 0.45rem 0.55rem;
    font-size: 0.82rem;
  }

  .document-context-pill span {
    color: #52604d;
    font-weight: 850;
  }

  .document-context-pill a,
  .document-context-pill button {
    margin-left: auto;
  }

  .document-context-pill button {
    border: 0;
    background: transparent;
    color: #394638;
    cursor: pointer;
    font-weight: 900;
    text-decoration: underline;
    text-underline-offset: 0.16rem;
  }

  .thread-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 0.75rem;
    color: #6a7566;
    font-size: 0.78rem;
    font-weight: 750;
  }

  .thread-actions span {
    min-width: 0;
  }

  .composer-starters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.38rem;
    max-height: 4.65rem;
    overflow: hidden;
    padding-bottom: 0.02rem;
    scrollbar-width: none;
  }

  .composer-starters::-webkit-scrollbar {
    display: none;
  }

  .composer-starters button {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 0.34rem;
    min-height: 2.05rem;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
    color: var(--pine, #4d594a);
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.055em;
    padding: 0 0.68rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .composer-starters button:first-child {
    background: var(--pine, #4d594a);
    border-color: var(--pine, #4d594a);
    color: #fff;
  }

  .composer-starters button:disabled,
  .send-button:disabled,
  .secondary-button:disabled,
  .primary-button:disabled,
  .tiny-button:disabled,
  .doc-list button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .prompt-box {
    position: relative;
    display: block;
  }

  .location-button {
    position: absolute;
    left: 0.42rem;
    bottom: 0.42rem;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 2.05rem;
    height: 2.05rem;
    border: 0;
    border-radius: 999px;
    background: rgba(237, 243, 229, 0.88);
    color: #394638;
    cursor: pointer;
    padding: 0;
  }

  .location-button:hover,
  .location-button.active {
    background: rgba(166, 181, 137, 0.28);
    color: #24362c;
  }

  .location-button.active {
    box-shadow: 0 0 0 2px rgba(77, 89, 74, 0.18);
  }

  .location-button svg {
    width: 1.08rem;
    height: 1.08rem;
  }

  .location-button span {
    font-size: 1.12rem;
    font-weight: 900;
  }

  .location-button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .prompt-box textarea {
    display: block;
    width: 100%;
    min-height: 2.7rem;
    max-height: 10.5rem;
    border: 1.5px solid rgba(77, 89, 74, 0.18);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.94);
    box-sizing: border-box;
    color: #27332b;
    font: inherit;
    font-size: 0.98rem;
    line-height: 1.38;
    overflow-y: auto;
    padding: 0.72rem 3.3rem 0.72rem 3rem;
    resize: none;
  }

  .prompt-box textarea:focus {
    border-color: rgba(77, 89, 74, 0.46);
    box-shadow: 0 0 0 4px rgba(166, 181, 137, 0.22);
    outline: none;
  }

  .send-button,
  .secondary-button,
  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.35rem;
    border-radius: 999px;
    font-weight: 900;
    padding: 0 0.86rem;
    text-decoration: none;
  }

  .send-button,
  .primary-button {
    border: 0;
    background: linear-gradient(135deg, #24362c, #4d594a);
    color: white;
    cursor: pointer;
  }

  .prompt-send {
    position: absolute;
    right: 0.42rem;
    bottom: 0.42rem;
    width: 2.05rem;
    min-width: 2.05rem;
    height: 2.05rem;
    min-height: 0;
    padding: 0;
    border-radius: 999px;
    box-shadow: 0 8px 16px rgba(36, 54, 44, 0.18);
  }

  .prompt-send svg {
    width: 1rem;
    height: 1rem;
    transform: translateX(0.04rem);
  }

  .prompt-send:disabled {
    background: #a8afa2;
    box-shadow: none;
  }

  .secondary-button {
    border: 1px solid rgba(77, 89, 74, 0.16);
    background: #fff;
    color: #394638;
    cursor: pointer;
  }

  .workspace-panel {
    position: fixed;
    z-index: 35;
    top: 0;
    bottom: 0;
    width: min(25rem, calc(100vw - 4.2rem));
    max-width: 100%;
    min-width: 0;
    display: grid;
    grid-auto-rows: max-content;
    gap: 0.78rem;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    border-width: 0 1px 0 0;
    border-radius: 0 22px 22px 0;
    background: rgba(255, 253, 248, 0.94);
    box-shadow: 14px 0 30px rgba(31, 41, 55, 0.12);
    padding: max(0.95rem, env(safe-area-inset-top)) 0.9rem max(0.9rem, env(safe-area-inset-bottom));
    transition: transform 190ms ease;
  }

  .history-panel {
    grid-area: history;
    left: 0;
    transform: translateX(calc(-100% - 1rem));
  }

  .docs-panel {
    grid-area: docs;
    right: 0;
    border-width: 0 0 0 1px;
    border-radius: 22px 0 0 22px;
    box-shadow: -14px 0 30px rgba(31, 41, 55, 0.12);
    transform: translateX(calc(100% + 1rem));
  }

  .workspace-panel.panel-open {
    transform: translateX(0);
  }

  .workspace-panel > *,
  .workspace-panel details,
  .workspace-panel summary,
  .panel-card,
  .thread-summary-card,
  .resource-nav-item,
  .history-item,
  .doc-list button,
  .mini-head,
  .panel-head {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .workspace-panel p,
  .workspace-panel a,
  .workspace-panel strong,
  .workspace-panel span,
  .workspace-panel small,
  .workspace-panel em,
  .workspace-panel summary,
  .resource-nav-item,
  .history-item,
  .doc-list button {
    overflow-wrap: anywhere;
  }

  .workspace-scrim {
    position: fixed;
    inset: 0;
    z-index: 30;
    border: 0;
    background: rgba(39, 51, 43, 0.22);
    backdrop-filter: blur(1px) saturate(0.75);
  }

  .panel-head,
  .mini-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
  }

  .panel-head {
    position: sticky;
    top: 0;
    z-index: 6;
    margin: -0.15rem -0.1rem 0;
    border-bottom: 1px solid rgba(39, 51, 43, 0.1);
    background: rgba(255, 253, 248, 0.94);
    padding: 0.15rem 0 0.72rem;
    backdrop-filter: blur(10px);
  }

  .panel-head h2 {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.08rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 999px;
    background: rgba(245, 242, 232, 0.76);
    font-size: 1.12rem;
    line-height: 1;
  }


  .resource-nav {
    display: grid;
    gap: 0.5rem;
  }

  .resource-nav-item {
    display: grid;
    gap: 0.16rem;
    width: 100%;
    min-height: 3.2rem;
    border: 1px solid rgba(77, 89, 74, 0.13);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.72);
    box-sizing: border-box;
    color: #394638;
    cursor: pointer;
    font: inherit;
    padding: 0.68rem 0.75rem;
    text-align: left;
    text-decoration: none;
  }

  .resource-nav-item:hover,
  .resource-nav-item:focus-visible {
    border-color: rgba(77, 89, 74, 0.24);
    background: rgba(237, 243, 229, 0.78);
    outline: none;
  }

  .resource-nav-item strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.98rem;
    font-weight: 900;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  }

  .resource-nav-item small {
    color: #52604d;
    font-size: 0.82rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .resource-nav-item:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  .thread-summary-card {
    display: grid;
    gap: 0.42rem;
    border: 1px solid rgba(77, 89, 74, 0.13);
    border-radius: 16px;
    background: rgba(237, 243, 229, 0.7);
    color: #394638;
    padding: 0.7rem;
  }

  .thread-summary-card strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .thread-summary-card span {
    color: #52604d;
    font-size: 0.9rem;
    font-weight: 750;
  }

  .thread-summary-card .secondary-button {
    justify-self: start;
    min-height: 2rem;
    padding-inline: 0.7rem;
  }

  .doc-summary-card {
    background: rgba(255, 255, 255, 0.74);
  }

  .drawer-section-label {
    border-top: 1px solid rgba(39, 51, 43, 0.14);
    color: #7b7f76;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    padding-top: 1.15rem;
    text-transform: uppercase;
  }

  .history-list,
  .doc-list {
    display: grid;
    gap: 0;
  }

  .history-item,
  .doc-list button {
    width: 100%;
    display: grid;
    gap: 0.34rem;
    border-width: 0 0 1px;
    border-color: rgba(39, 51, 43, 0.1);
    border-radius: 10px;
    background: transparent;
    padding: 0.82rem 0.45rem;
    text-align: left;
  }

  .history-item:hover,
  .doc-list button:hover,
  .doc-list button.active {
    background: rgba(237, 243, 229, 0.56);
  }

  .history-item span {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    color: #7b7f76;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .history-item em,
  .doc-list span {
    overflow: hidden;
    color: #27332b;
    font-style: normal;
    font-weight: 850;
    line-height: 1.28;
    text-overflow: ellipsis;
  }

  .history-item--assistant {
    background: transparent;
  }

  .panel-card {
    display: grid;
    gap: 0.56rem;
    border: 1px solid rgba(230, 225, 212, 0.95);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.68);
    padding: 0.68rem;
  }

  .context-details {
    background: rgba(255, 255, 255, 0.52);
  }

  .context-details > summary {
    cursor: pointer;
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.9rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .context-stack {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.7rem;
  }

  .panel-card--nested {
    border-color: rgba(77, 89, 74, 0.1);
    background: rgba(255, 253, 248, 0.68);
    box-shadow: none;
    padding: 0.62rem;
  }

  .selected-doc-card {
    border-color: rgba(77, 89, 74, 0.2);
    background: rgba(237, 243, 229, 0.78);
  }

  .selected-doc-card a {
    color: #394638;
    font-weight: 900;
    text-underline-offset: 0.16rem;
  }

  .brief-summary,
  .small-note,
  .success-note,
  .location-note,
  .panel-card p {
    margin: 0;
    color: #52604d;
    line-height: 1.45;
  }

  .success-note {
    color: #166534;
    font-weight: 850;
  }

  .location-note {
    color: #394638;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .doc-list small {
    color: #6a7566;
    font-weight: 800;
  }

  .connect-strip {
    position: absolute;
    top: 4.35rem;
    left: 50%;
    z-index: 28;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem;
    width: min(34rem, calc(100% - 2rem));
    border-radius: 18px;
    background: rgba(255, 253, 248, 0.94);
    padding: 0.58rem 0.68rem;
    transform: translateX(-50%);
  }

  .connect-strip div {
    display: grid;
    flex: 1 1 13rem;
    gap: 0.05rem;
  }

  .connect-strip span {
    color: #52604d;
    font-size: 0.82rem;
    font-weight: 750;
  }

  .connect-strip .primary-button,
  .connect-strip .secondary-button {
    min-height: 2.05rem;
    padding-inline: 0.7rem;
  }

  .workspace-alert {
    border: 1px solid rgba(138, 47, 47, 0.18);
    border-radius: 16px;
    background: #fff0ed;
    color: #8a2f2f;
    padding: 0.75rem;
    font-weight: 750;
  }

  .workspace-alert--quiet {
    border-color: rgba(77, 89, 74, 0.12);
    background: rgba(255, 255, 255, 0.75);
    color: #52604d;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (min-width: 900px) {
    .workspace-panel {
      top: 4.45rem;
      bottom: 0.75rem;
      width: min(18.75rem, calc(100vw - 3rem));
      max-height: calc(100dvh - 5.2rem);
      border-radius: 22px;
    }

    .history-panel {
      left: 0.75rem;
      transform: translateX(calc(-100% - 1.5rem));
    }

    .docs-panel {
      right: 0.75rem;
      transform: translateX(calc(100% + 1.5rem));
    }

    .workspace-scrim {
      background: rgba(39, 51, 43, 0.12);
      backdrop-filter: none;
    }
  }

  @media (max-width: 680px) {
    .scout-workspace {
      gap: 0;
      padding: 0 0 calc(3.75rem + env(safe-area-inset-bottom));
    }

    .workspace-commandbar {
      grid-template-columns: 5.7rem minmax(0, 1fr) 5.7rem;
      min-height: 3.05rem;
      border-radius: 0;
      border-width: 0 0 1px;
      border-color: rgba(39, 51, 43, 0.14);
      background: rgba(255, 253, 248, 0.96);
      box-shadow: none;
      padding: 0 0.38rem;
    }

    .scout-title {
      color: #24362c;
      font-family: Lato, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 1.38rem;
      font-weight: 900;
      letter-spacing: -0.035em;
      line-height: 1;
      text-transform: none;
    }

    .scout-title span {
      display: none;
    }

    .command-icon {
      justify-self: stretch;
      gap: 0.28rem;
      min-height: 2.44rem;
      border-radius: 12px;
      color: #24362c;
      font-size: 0.68rem;
      letter-spacing: 0.04em;
      padding-inline: 0.42rem;
    }

    .command-icon svg {
      width: 1.18rem;
      height: 1.18rem;
    }

    .conversation-shell {
      min-height: 0;
      height: 100%;
      max-height: none;
      border: 0;
      border-radius: 0;
      background:
        url('/default-background.svg') center 20% / 2400px 1600px no-repeat,
        radial-gradient(1200px 800px at 15% -5%, rgba(0, 0, 0, 0.03), transparent 65%),
        radial-gradient(1000px 600px at 85% 15%, rgba(0, 0, 0, 0.025), transparent 60%),
        radial-gradient(800px 500px at 50% 90%, rgba(0, 0, 0, 0.02), transparent 50%),
        var(--bg, #f5f2e8);
      box-shadow: none;
    }

    .message-viewport {
      padding: 1.72rem 1.25rem 0.85rem;
    }

    .message-viewport--empty {
      padding-bottom: 1.72rem;
    }

    .route-pill {
      margin-bottom: 1.95rem;
      border-color: rgba(51, 51, 51, 0.28);
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.76);
      color: #303531;
      font-family: Lato, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 0.78rem;
      letter-spacing: 0.095em;
      padding: 0.42rem 1.02rem;
    }

    .message-list {
      gap: 1.88rem;
      max-width: none;
    }
    .empty-thread {
      width: 100%;
      padding: 1rem;
    }

    .empty-thread strong {
      font-size: 1.46rem;
    }

    .empty-actions {
      grid-template-columns: 1fr;
    }

    .empty-actions button {
      width: 100%;
      min-height: 2.55rem;
    }


    .message {
      max-width: 92%;
      padding: 1.05rem 1.1rem;
    }

    .message--user {
      position: relative;
      max-width: 76%;
      border-radius: 18px 18px 5px 18px;
      background: #213729;
      font-size: 0.94rem;
      line-height: 1.5;
      margin-bottom: 1rem;
      padding: 0.78rem 0.98rem;
    }

    .message--user .message-body {
      margin-top: 0;
    }

    .message--user .message-label {
      position: absolute;
      right: 0.16rem;
      bottom: -1.18rem;
      display: block;
      color: #303531;
      font-family: Lato, system-ui, sans-serif;
      font-size: 0.62rem;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: none;
    }

    .message--user .message-label strong {
      display: none;
    }

    .message--user .message-footer {
      display: none;
    }

    .checking-card {
      width: min(78%, 17rem);
      gap: 0.66rem;
      border-color: rgba(51, 51, 51, 0.14);
      border-radius: 17px;
      background: rgba(243, 243, 243, 0.92);
      color: #737970;
      padding: 0.76rem 0.8rem;
    }

    .checking-card em {
      font-size: 0.92rem;
      line-height: 1.36;
    }

    .checking-icon {
      width: 1.85rem;
      height: 1.85rem;
      background: #8c9a90;
    }

    .connect-strip {
      display: none;
    }

    .composer-shell {
      gap: 0;
      border-top-color: rgba(39, 51, 43, 0.18);
      background: #fffdf8;
      box-shadow: none;
      padding: 0.56rem 1.25rem max(0.56rem, env(safe-area-inset-bottom));
    }

    .composer-starters {
      display: none;
    }

    .location-button {
      left: 0.45rem;
      bottom: 0.42rem;
      width: 2.35rem;
      height: 2.62rem;
      border-radius: 8px;
      background: #f4f4f2;
      color: #24362c;
    }

    .location-button svg {
      width: 1.08rem;
      height: 1.08rem;
    }

    .prompt-box textarea {
      min-height: 3.45rem;
      border: 1.5px solid rgba(51, 51, 51, 0.28);
      border-radius: 11px;
      background: rgba(255, 255, 255, 0.92);
      color: #27332b;
      font-size: 0.95rem;
      line-height: 1.35;
      padding: 0.96rem 3.1rem 0.78rem 3rem;
    }

    .prompt-box textarea::placeholder {
      color: #3f4740;
    }

    .prompt-send {
      right: 0.45rem;
      bottom: 0.42rem;
      width: 2.35rem;
      min-width: 2.35rem;
      height: 2.62rem;
      border-radius: 8px;
      background: #f4f4f2;
      color: #24362c;
      box-shadow: none;
    }

    .prompt-send svg {
      width: 1.08rem;
      height: 1.08rem;
    }

    .prompt-send:disabled {
      background: #f4f4f2;
      color: rgba(36, 54, 44, 0.4);
    }

    .workspace-panel {
      width: min(25.5rem, calc(100vw - 4rem));
      padding-inline: 1.05rem;
    }
  }
</style>
