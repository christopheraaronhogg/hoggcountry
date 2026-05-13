import { randomUUID } from 'node:crypto';
import { replyInWorkspaceClaw, ScoutAgentTimeoutError, type ScoutThinkingEffort } from '$lib/server/claw-agent';
import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { mirrorScoutTurnEventToSpacetimeSoon, mirrorScoutTurnToSpacetimeSoon } from '$lib/server/scout-spacetime-mirror';
import type { BetaProfileCookie } from '$lib/beta';

const TURN_TTL_MS = 30 * 60 * 1000;
const TURN_CLEANUP_MS = 2 * 60 * 1000;

type TurnStatus = 'running' | 'done' | 'error';

export type TurnEvent = {
  readonly id: number;
  readonly event: 'status' | 'phase' | 'source_receipts' | 'thinking' | 'delta' | 'done' | 'error';
  readonly data: Record<string, unknown>;
};

type TurnEventListener = (events: TurnEvent[]) => void;

type TurnRecord = {
  readonly id: string;
  readonly workspaceId: string;
  readonly createdAt: number;
  readonly thinkingEffort: ScoutThinkingEffort;
  readonly listeners: Set<TurnEventListener>;
  updatedAt: number;
  status: TurnStatus;
  events: TurnEvent[];
  result: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
};

const turns = new Map<string, TurnRecord>();

function pushEvent(turn: TurnRecord, event: TurnEvent['event'], data: Record<string, unknown>) {
  const next: TurnEvent = {
    id: turn.events.length + 1,
    event,
    data
  };
  turn.events.push(next);
  turn.updatedAt = Date.now();
  mirrorScoutTurnEventToSpacetimeSoon({ workspaceId: turn.workspaceId, turnId: turn.id, event: next });
  for (const listener of turn.listeners) {
    listener([next]);
  }
  return next;
}

function pruneTurns() {
  const cutoff = Date.now() - TURN_TTL_MS;
  for (const [id, turn] of turns.entries()) {
    if (turn.updatedAt < cutoff) turns.delete(id);
  }
}

setInterval(pruneTurns, TURN_CLEANUP_MS).unref?.();

export function startScoutReplyTurn(input: {
  readonly workspaceId: string;
  readonly betaProfile: BetaProfileCookie;
  readonly message: string;
  readonly documentId: string | null;
  readonly resourceId: string | null;
  readonly thinkingEffort: ScoutThinkingEffort;
}) {
  pruneTurns();

  const turn: TurnRecord = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    createdAt: Date.now(),
    thinkingEffort: input.thinkingEffort,
    listeners: new Set(),
    updatedAt: Date.now(),
    status: 'running',
    events: [],
    result: null,
    error: null
  };

  turns.set(turn.id, turn);
  mirrorScoutTurnToSpacetimeSoon({
    workspaceId: turn.workspaceId,
    turnId: turn.id,
    status: turn.status,
    thinkingEffort: turn.thinkingEffort
  });
  pushEvent(turn, 'status', { status: 'started' });
  pushEvent(turn, 'phase', { phase: 'starting', label: 'Starting Scout turn', detail: 'Opening the realtime turn and preparing workspace context.' });

  void (async () => {
    const heartbeat = setInterval(() => {
      if (turn.status === 'running') pushEvent(turn, 'status', { status: 'working' });
    }, 10000);

    try {
      const result = await replyInWorkspaceClaw(input.workspaceId, input.betaProfile, input.message, {
        documentId: input.documentId,
        resourceId: input.resourceId,
        thinkingEffort: input.thinkingEffort,
        onPhase: (phase) => {
          pushEvent(turn, 'phase', phase);
        },
        onSourceReceipts: (receipts) => {
          pushEvent(turn, 'source_receipts', { receipts });
        },
        onTextDelta: (delta) => {
          if (delta) pushEvent(turn, 'delta', { delta });
        },
        onThinkingActivity: (activity) => {
          pushEvent(turn, 'thinking', activity);
        }
      });
      const connection = getConfiguredClawConnection(result.workspace);
      const payload = {
        reply: result.reply,
        revisedDocument: result.revisedDocument,
        messages: result.workspace.clawMessages,
        documents: result.workspace.documents,
        factCandidates: result.workspace.factCandidates,
        connection
      } satisfies Record<string, unknown>;

      turn.status = 'done';
      turn.result = payload;
      mirrorScoutTurnToSpacetimeSoon({
        workspaceId: turn.workspaceId,
        turnId: turn.id,
        status: turn.status,
        thinkingEffort: turn.thinkingEffort
      });
      pushEvent(turn, 'done', payload);
    } catch (caught) {
      let payload: Record<string, unknown>;

      if (caught instanceof ScoutAgentTimeoutError) {
        payload = { message: caught.message, status: 504 };
      } else if (caught instanceof Error && (caught.message === 'Document not found.' || caught.message === 'Resource not found.')) {
        payload = { message: caught.message, status: 404 };
      } else if (caught instanceof Error && caught.message.includes('Pi agent did not return an assistant reply')) {
        payload = {
          message: caught.message,
          status: 502
        };
      } else {
        payload = { message: caught instanceof Error ? caught.message : 'Could not send the cloud prompt.', status: 500 };
      }

      turn.status = 'error';
      turn.error = payload;
      mirrorScoutTurnToSpacetimeSoon({
        workspaceId: turn.workspaceId,
        turnId: turn.id,
        status: turn.status,
        thinkingEffort: turn.thinkingEffort
      });
      pushEvent(turn, 'error', payload);
    } finally {
      clearInterval(heartbeat);
    }
  })();

  return turn;
}

export function getScoutReplyTurn(workspaceId: string, turnId: string) {
  const turn = turns.get(turnId);
  if (!turn || turn.workspaceId !== workspaceId) return null;
  turn.updatedAt = Date.now();
  return turn;
}

export function scoutReplyTurnSnapshot(workspaceId: string, turnId: string) {
  const turn = getScoutReplyTurn(workspaceId, turnId);
  if (!turn) return null;

  return {
    id: turn.id,
    status: turn.status,
    result: turn.result,
    error: turn.error,
    events: turn.events
  };
}

export function scoutReplyTurnEventsSince(workspaceId: string, turnId: string, lastEventId: number) {
  const turn = getScoutReplyTurn(workspaceId, turnId);
  if (!turn) return null;
  return turn.events.filter((event) => event.id > lastEventId);
}

export function watchScoutReplyTurnEvents(
  workspaceId: string,
  turnId: string,
  lastEventId: number,
  listener: TurnEventListener
) {
  const turn = getScoutReplyTurn(workspaceId, turnId);
  if (!turn) return null;

  turn.listeners.add(listener);
  queueMicrotask(() => {
    const existing = turn.events.filter((event) => event.id > lastEventId);
    if (existing.length > 0) listener(existing);
  });

  return () => {
    turn.listeners.delete(listener);
  };
}
