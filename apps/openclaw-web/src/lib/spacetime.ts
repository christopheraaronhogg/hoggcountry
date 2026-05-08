import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { createSpacetimeDBProvider } from 'spacetimedb/svelte';
import type { Identity } from 'spacetimedb';
import { DbConnection, type ErrorContext } from '$lib/module_bindings';

export interface SpacetimeStatus {
  readonly enabled: boolean;
  readonly host: string;
  readonly dbName: string;
  readonly connected: boolean;
  readonly identity?: string;
  readonly lastError?: string;
}

const host = import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
const enabled = Boolean(host && dbName);
const tokenKey = enabled ? `${host}/${dbName}/auth_token` : 'spacetime/disabled';

export const spacetimeStatus = writable<SpacetimeStatus>({
  enabled,
  host,
  dbName,
  connected: false
});

let initialized = false;
let currentConnection: DbConnection | null = null;
const connectionListeners = new Set<(connection: DbConnection) => void>();

export function getSpacetimeConnection(): DbConnection | null {
  return currentConnection;
}

export function onSpacetimeConnection(listener: (connection: DbConnection) => void): () => void {
  connectionListeners.add(listener);
  if (currentConnection?.isActive) listener(currentConnection);

  return () => {
    connectionListeners.delete(listener);
  };
}

function handleConnect(connection: DbConnection, identity: Identity, token: string): void {
  if (browser) {
    localStorage.setItem(tokenKey, token);
  }

  currentConnection = connection;

  spacetimeStatus.set({
    enabled,
    host,
    dbName,
    connected: true,
    identity: identity.toHexString()
  });

  for (const listener of connectionListeners) {
    listener(connection);
  }
}

function handleDisconnect(): void {
  currentConnection = null;
  spacetimeStatus.update((current) => ({
    ...current,
    connected: false
  }));
}

function handleConnectError(_ctx: ErrorContext, error: Error): void {
  currentConnection = null;
  spacetimeStatus.set({
    enabled,
    host,
    dbName,
    connected: false,
    lastError: error.message
  });
}

export function initSpacetimeProvider(): void {
  if (!browser || initialized || !enabled) return;

  const connectionBuilder = DbConnection.builder()
    .withUri(host)
    .withDatabaseName(dbName)
    .withToken(localStorage.getItem(tokenKey) || undefined)
    .onConnect(handleConnect)
    .onDisconnect(handleDisconnect)
    .onConnectError(handleConnectError);

  createSpacetimeDBProvider(connectionBuilder);
  initialized = true;
}
