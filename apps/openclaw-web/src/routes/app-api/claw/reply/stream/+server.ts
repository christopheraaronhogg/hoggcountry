import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { replyInWorkspaceClaw, ScoutAgentTimeoutError } from '$lib/server/claw-agent';
import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { requireWorkspace } from '$lib/server/workspace-endpoint';

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    message?: unknown;
    documentId?: unknown;
    resourceId?: unknown;
  } | null;
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const documentId = typeof payload?.documentId === 'string' ? payload.documentId.trim() : '';
  const resourceId = typeof payload?.resourceId === 'string' ? payload.resourceId.trim() : '';

  if (!message) {
    return json({ message: 'Message is required.' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const send = (eventName: string, data: unknown) => {
        if (closed) return;

        try {
          controller.enqueue(encoder.encode(encodeSse(eventName, data)));
        } catch {
          closed = true;
        }
      };

      send('status', { status: 'started' });

      const heartbeat = setInterval(() => {
        send('status', { status: 'working' });
      }, 10000);

      void (async () => {
        try {
          const result = await replyInWorkspaceClaw(workspaceId, betaProfile, message, {
            documentId: documentId || null,
            resourceId: resourceId || null,
            onTextDelta: (delta) => send('delta', { delta })
          });
          const connection = getConfiguredClawConnection(result.workspace);

          send('done', {
            reply: result.reply,
            revisedDocument: result.revisedDocument,
            messages: result.workspace.clawMessages,
            documents: result.workspace.documents,
            factCandidates: result.workspace.factCandidates,
            connection
          });
        } catch (caught) {
          if (caught instanceof ScoutAgentTimeoutError) {
            send('error', { message: caught.message, status: 504 });
            return;
          }

          if (caught instanceof Error && (caught.message === 'Document not found.' || caught.message === 'Resource not found.')) {
            send('error', { message: caught.message, status: 404 });
            return;
          }

          if (caught instanceof Error && caught.message.includes('Pi agent did not return an assistant reply')) {
            send('error', {
              message: 'Scout did not return a usable reply. Try again, or ask for a shorter first pass and then continue.',
              status: 502
            });
            return;
          }

          send('error', { message: caught instanceof Error ? caught.message : 'Could not send the cloud prompt.', status: 500 });
        } finally {
          clearInterval(heartbeat);

          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // The browser or proxy may have already closed the stream.
            }
          }
        }
      })();
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
