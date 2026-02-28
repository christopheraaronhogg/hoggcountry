<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantChatController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const URGENCY = ['normal', 'soon', 'urgent'];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'subject' => ['nullable', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:12000'],
            'urgency' => ['nullable', 'string', Rule::in(self::URGENCY)],
            'metadata' => ['nullable', 'array'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'client_event_id' => ['nullable', 'string', 'max:80'],
            'replayed_from_offline' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();

        $idempotencyKey = $this->resolveIdempotencyKey($request, $validated['idempotency_key'] ?? null);
        if ($idempotencyKey) {
            $existingByKey = TrailAssistantIntake::query()->where('idempotency_key', $idempotencyKey)->first();

            if ($existingByKey) {
                if ((int) $existingByKey->user_id === (int) $user->id && (string) $existingByKey->source === 'chat') {
                    return $this->respondWithMessage(
                        $existingByKey,
                        status: 200,
                        idempotentReplay: true,
                        duplicateGuard: 'idempotency_key'
                    );
                }

                return $this->fail(
                    'idempotency_key_conflict',
                    'Idempotency key already used for a different request.',
                    409
                );
            }
        }

        $clientEventId = $this->normalizeClientEventId(
            (string) (
                $validated['client_event_id']
                ?? $request->header('X-Client-Event-Id')
                ?? ''
            )
        );

        $clientEventFingerprint = $clientEventId
            ? $this->buildClientEventFingerprint((int) $user->id, $clientEventId)
            : null;

        if ($clientEventFingerprint) {
            $existingByClientEvent = TrailAssistantIntake::query()
                ->where('user_id', $user->id)
                ->where('source', 'chat')
                ->where('dedupe_fingerprint', $clientEventFingerprint)
                ->first();

            if ($existingByClientEvent) {
                return $this->respondWithMessage(
                    $existingByClientEvent,
                    status: 200,
                    idempotentReplay: true,
                    duplicateGuard: 'client_event_id'
                );
            }
        }

        $metadata = $this->normalizeMetadata($validated['metadata'] ?? []);
        $metadata['urgency'] = (string) ($validated['urgency'] ?? 'normal');
        $metadata['sync_client_event_id'] = $clientEventId;
        $metadata['sync_replayed_from_offline'] = (bool) ($validated['replayed_from_offline'] ?? false);

        try {
            $intake = TrailAssistantIntake::query()->create([
                'intake_id' => 'ta_'.Str::lower(Str::random(12)),
                'idempotency_key' => $idempotencyKey,
                'dedupe_fingerprint' => $clientEventFingerprint,
                'user_id' => $user->id,
                'route_label' => (string) ($validated['route_label'] ?? 'on-trail'),
                'source' => 'chat',
                'name' => $this->nullableText((string) $user->name, 120),
                'email' => $this->nullableEmail((string) $user->email),
                'subject' => $this->normalizeText((string) ($validated['subject'] ?? 'Trail chat request'), 160),
                'message' => $this->normalizeText((string) $validated['message'], 12000),
                'metadata' => $metadata,
                'status' => 'new',
                'received_at' => now(),
            ]);
        } catch (QueryException $exception) {
            if ($idempotencyKey && $this->isIdempotencyConstraintViolation($exception)) {
                $existingByKey = TrailAssistantIntake::query()->where('idempotency_key', $idempotencyKey)->first();
                if ($existingByKey && (int) $existingByKey->user_id === (int) $user->id && (string) $existingByKey->source === 'chat') {
                    return $this->respondWithMessage(
                        $existingByKey,
                        status: 200,
                        idempotentReplay: true,
                        duplicateGuard: 'idempotency_key'
                    );
                }
            }

            throw $exception;
        }

        return $this->respondWithMessage($intake, status: 201);
    }

    private function respondWithMessage(
        TrailAssistantIntake $intake,
        int $status = 200,
        bool $idempotentReplay = false,
        ?string $duplicateGuard = null,
    ): JsonResponse {
        $metadata = is_array($intake->metadata) ? $intake->metadata : [];

        return $this->ok([
            'message_id' => $intake->intake_id,
            'route_label' => $intake->route_label,
            'source' => $intake->source,
            'status' => $intake->status,
            'received_at' => $intake->received_at?->toISOString(),
            'idempotent_replay' => $idempotentReplay,
            'duplicate_guard' => $duplicateGuard,
            'sync' => [
                'client_event_id' => $metadata['sync_client_event_id'] ?? null,
                'replayed_from_offline' => (bool) ($metadata['sync_replayed_from_offline'] ?? false),
            ],
        ], $status);
    }

    public function index(Request $request)
    {
        $limit = max(1, min(100, (int) $request->query('limit', 20)));

        $rows = TrailAssistantIntake::query()
            ->where('user_id', $request->user()->id)
            ->where('source', 'chat')
            ->orderByDesc('received_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function (TrailAssistantIntake $intake): array {
                $metadata = is_array($intake->metadata) ? $intake->metadata : [];

                return [
                    'message_id' => $intake->intake_id,
                    'route_label' => $intake->route_label,
                    'subject' => $intake->subject,
                    'message' => $intake->message,
                    'status' => $intake->status,
                    'urgency' => $metadata['urgency'] ?? null,
                    'sync' => [
                        'client_event_id' => $metadata['sync_client_event_id'] ?? null,
                        'replayed_from_offline' => (bool) ($metadata['sync_replayed_from_offline'] ?? false),
                    ],
                    'received_at' => $intake->received_at?->toISOString(),
                ];
            })
            ->values()
            ->all();

        return $this->ok([
            'messages' => $rows,
        ]);
    }

    private function resolveIdempotencyKey(Request $request, ?string $fallback): ?string
    {
        $raw = $request->header('Idempotency-Key')
            ?? $request->header('X-Idempotency-Key')
            ?? $fallback;

        if (! is_string($raw)) {
            return null;
        }

        $normalized = Str::of($raw)
            ->ascii()
            ->replaceMatches('/[^A-Za-z0-9:_\-.]+/', '-')
            ->trim('-')
            ->limit(120, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeClientEventId(string $value): ?string
    {
        $normalized = Str::of($value)
            ->ascii()
            ->replaceMatches('/[^A-Za-z0-9:_\-.]+/', '-')
            ->trim('-')
            ->limit(80, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function buildClientEventFingerprint(int $userId, string $clientEventId): string
    {
        return hash('sha256', sprintf('chat-client-event:%d:%s', $userId, $clientEventId));
    }

    private function isIdempotencyConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $message = Str::lower($exception->getMessage());

        return $sqlState === '23000' && str_contains($message, 'idempotency_key');
    }

    private function normalizeText(string $value, int $limit = 4000): string
    {
        return Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($limit, '')
            ->toString();
    }

    private function nullableText(string $value, int $limit): ?string
    {
        $normalized = $this->normalizeText($value, $limit);

        return $normalized === '' ? null : $normalized;
    }

    private function nullableEmail(string $value): ?string
    {
        $normalized = Str::of($value)
            ->trim()
            ->lower()
            ->limit(190, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeMetadata(mixed $value, int $depth = 0): mixed
    {
        if ($depth >= 4) {
            return [];
        }

        if (! is_array($value)) {
            if (is_bool($value) || is_int($value) || is_float($value) || is_null($value)) {
                return $value;
            }

            return $this->normalizeText((string) $value, 300);
        }

        if (array_is_list($value)) {
            $normalized = [];
            foreach ($value as $entry) {
                $normalized[] = $this->normalizeMetadata($entry, $depth + 1);
                if (count($normalized) >= 20) {
                    break;
                }
            }

            return $normalized;
        }

        $normalized = [];
        foreach ($value as $key => $entry) {
            $normalizedKey = Str::of((string) $key)
                ->ascii()
                ->replaceMatches('/[^A-Za-z0-9_\-.]+/', '_')
                ->trim('_')
                ->limit(60, '')
                ->toString();

            if ($normalizedKey === '') {
                continue;
            }

            $normalized[$normalizedKey] = $this->normalizeMetadata($entry, $depth + 1);
            if (count($normalized) >= 40) {
                break;
            }
        }

        ksort($normalized);

        return $normalized;
    }
}
