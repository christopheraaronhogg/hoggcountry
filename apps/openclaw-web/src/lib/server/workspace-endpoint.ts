import { error, json, type RequestEvent } from '@sveltejs/kit';

export function requireWorkspace(event: RequestEvent): {
  workspaceId: string;
  betaProfile: NonNullable<App.Locals['betaProfile']>;
} {
  if (!event.locals.betaProfile || !event.locals.workspaceId) {
    throw error(401, 'Beta profile required.');
  }

  return {
    workspaceId: event.locals.workspaceId,
    betaProfile: event.locals.betaProfile
  };
}

export function ok<T>(payload: T) {
  return json(payload, {
    headers: {
      'cache-control': 'no-store'
    }
  });
}
