import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace } from '$lib/server/workspace-endpoint';
import { getScoutReplyTurn, scoutReplyTurnEventsSince } from '$lib/server/scout-reply-turns';

function encodeSse(id: number, event: string, data: unknown): string {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const GET: RequestHandler = (event) => {
  const { workspaceId } = requireWorkspace(event);
  const turnId = event.params.turnId;

  if (!getScoutReplyTurn(workspaceId, turnId)) {
    return json({ message: 'Scout turn not found.' }, { status: 404 });
  }

  const lastEventIdHeader = event.request.headers.get('last-event-id');
  let lastEventId = Number.parseInt(lastEventIdHeader ?? '0', 10);
  if (!Number.isFinite(lastEventId)) lastEventId = 0;

  const encoder = new TextEncoder();
  let closeStream: (() => void) | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let cursor = lastEventId;
      let interval: ReturnType<typeof setInterval> | null = null;

      const close = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        try {
          controller.close();
        } catch {
          // The browser or proxy may already have closed the stream.
        }
      };
      closeStream = close;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          close();
        }
      };

      const flush = () => {
        const events = scoutReplyTurnEventsSince(workspaceId, turnId, cursor);
        if (!events) {
          send(encodeSse(cursor + 1, 'error', { message: 'Scout turn not found.', status: 404 }));
          close();
          return;
        }

        for (const turnEvent of events) {
          cursor = turnEvent.id;
          send(encodeSse(turnEvent.id, turnEvent.event, turnEvent.data));
          if (turnEvent.event === 'done' || turnEvent.event === 'error') {
            close();
            return;
          }
        }
      };

      interval = setInterval(() => {
        flush();
        send(`: heartbeat ${Date.now()}\n\n`);
      }, 1000);

      flush();
    },
    cancel() {
      closeStream?.();
      // The model turn keeps running so the client can recover by polling or reconnecting.
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no'
    }
  });
};
