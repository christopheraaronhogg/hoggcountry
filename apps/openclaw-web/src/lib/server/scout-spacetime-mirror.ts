import { DbConnection } from '$lib/module_bindings';
import type { ScoutThinkingEffort } from '$lib/server/claw-agent';
import type { TurnEvent } from '$lib/server/scout-reply-turns';

const host = process.env.PUBLIC_SPACETIMEDB_HOST ?? import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = process.env.PUBLIC_SPACETIMEDB_DB_NAME ?? import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
const enabled = Boolean(host && dbName);

let connectionPromise: Promise<DbConnection | null> | null = null;
const joinedWorkspaces = new Set<string>();

function connectToSpacetime(): Promise<DbConnection | null> {
  if (!enabled) return Promise.resolve(null);
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise((resolve) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 2500);

    try {
      DbConnection.builder()
        .withUri(host)
        .withDatabaseName(dbName)
        .onConnect((connection) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          resolve(connection);
        })
        .onDisconnect(() => {
          joinedWorkspaces.clear();
          connectionPromise = null;
        })
        .onConnectError((_ctx, error) => {
          console.warn('Scout SpacetimeDB mirror connection failed:', error.message);
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          connectionPromise = null;
          resolve(null);
        })
        .build();
    } catch (caught) {
      console.warn('Scout SpacetimeDB mirror is unavailable:', caught instanceof Error ? caught.message : caught);
      settled = true;
      clearTimeout(timeout);
      connectionPromise = null;
      resolve(null);
    }
  });

  return connectionPromise;
}

async function ensureJoined(connection: DbConnection, workspaceId: string): Promise<void> {
  if (joinedWorkspaces.has(workspaceId)) return;
  await connection.reducers.joinScoutWorkspace({ workspaceId });
  joinedWorkspaces.add(workspaceId);
}

export async function mirrorScoutTurnToSpacetime(input: {
  readonly workspaceId: string;
  readonly turnId: string;
  readonly status: 'running' | 'done' | 'error';
  readonly thinkingEffort: ScoutThinkingEffort;
}): Promise<void> {
  const connection = await connectToSpacetime();
  if (!connection) return;

  await ensureJoined(connection, input.workspaceId);
  await connection.reducers.mirrorScoutTurn({
    workspaceId: input.workspaceId,
    turnId: input.turnId,
    status: input.status,
    thinkingEffort: input.thinkingEffort
  });
}

export async function mirrorScoutTurnEventToSpacetime(input: {
  readonly workspaceId: string;
  readonly turnId: string;
  readonly event: TurnEvent;
}): Promise<void> {
  const connection = await connectToSpacetime();
  if (!connection) return;

  await ensureJoined(connection, input.workspaceId);
  await connection.reducers.mirrorScoutTurnEvent({
    workspaceId: input.workspaceId,
    turnId: input.turnId,
    eventSeq: BigInt(input.event.id),
    kind: input.event.event,
    payloadJson: JSON.stringify(input.event.data)
  });
}

export function mirrorScoutTurnToSpacetimeSoon(input: Parameters<typeof mirrorScoutTurnToSpacetime>[0]): void {
  void mirrorScoutTurnToSpacetime(input).catch((caught) => {
    console.warn('Scout SpacetimeDB turn mirror failed:', caught instanceof Error ? caught.message : caught);
  });
}

export function mirrorScoutTurnEventToSpacetimeSoon(input: Parameters<typeof mirrorScoutTurnEventToSpacetime>[0]): void {
  void mirrorScoutTurnEventToSpacetime(input).catch((caught) => {
    console.warn('Scout SpacetimeDB event mirror failed:', caught instanceof Error ? caught.message : caught);
  });
}
