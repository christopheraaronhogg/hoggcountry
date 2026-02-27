<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantIntakeController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const SOURCES = ['web_form', 'email', 'chat'];

    private const DUPLICATE_WINDOW_MINUTES = 10;

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_label' => ['required', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:12000'],
            'metadata' => ['nullable', 'array'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
        ]);

        $normalized = [
            'route_label' => $validated['route_label'],
            'source' => (string) ($validated['source'] ?? 'web_form'),
            'name' => $this->nullableText((string) ($validated['name'] ?? ''), 120),
            'email' => $this->nullableEmail((string) ($validated['email'] ?? '')),
            'subject' => $this->normalizeText((string) $validated['subject'], 160),
            'message' => $this->normalizeText((string) $validated['message'], 12000),
            'metadata' => $this->normalizeMetadata($validated['metadata'] ?? []),
        ];

        $idempotencyKey = $this->resolveIdempotencyKey($request, $validated['idempotency_key'] ?? null);
        $dedupeFingerprint = $this->buildDedupeFingerprint($normalized);

        if ($idempotencyKey) {
            $existingByKey = TrailAssistantIntake::query()
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingByKey) {
                return $this->respondWithIntake(
                    $existingByKey,
                    status: 200,
                    idempotentReplay: true,
                    duplicateGuard: 'idempotency_key'
                );
            }
        }

        $recentDuplicate = $this->findRecentDuplicate($dedupeFingerprint);
        if ($recentDuplicate) {
            return $this->respondWithIntake(
                $recentDuplicate,
                status: 200,
                idempotentReplay: false,
                duplicateGuard: 'fingerprint_window'
            );
        }

        try {
            $intake = TrailAssistantIntake::query()->create([
                'intake_id' => 'ta_'.Str::lower(Str::random(12)),
                'idempotency_key' => $idempotencyKey,
                'dedupe_fingerprint' => $dedupeFingerprint,
                'user_id' => $request->user('sanctum')?->id,
                'route_label' => $normalized['route_label'],
                'source' => $normalized['source'],
                'name' => $normalized['name'],
                'email' => $normalized['email'],
                'subject' => $normalized['subject'],
                'message' => $normalized['message'],
                'metadata' => $normalized['metadata'],
                'status' => 'new',
                'received_at' => now(),
            ]);
        } catch (QueryException $exception) {
            if ($idempotencyKey && $this->isIdempotencyConstraintViolation($exception)) {
                $existingByKey = TrailAssistantIntake::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingByKey) {
                    return $this->respondWithIntake(
                        $existingByKey,
                        status: 200,
                        idempotentReplay: true,
                        duplicateGuard: 'idempotency_key'
                    );
                }
            }

            throw $exception;
        }

        return $this->respondWithIntake($intake, status: 201);
    }

    private function respondWithIntake(
        TrailAssistantIntake $intake,
        int $status = 200,
        bool $idempotentReplay = false,
        ?string $duplicateGuard = null,
    ): JsonResponse {
        return $this->ok([
            'intake_id' => $intake->intake_id,
            'route_label' => $intake->route_label,
            'source' => $intake->source,
            'status' => $intake->status,
            'received_at' => $intake->received_at?->toISOString(),
            'routing_labels' => self::ROUTE_LABELS,
            'idempotent_replay' => $idempotentReplay,
            'duplicate_guard' => $duplicateGuard,
        ], $status);
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

    /**
     * @param array{route_label:string,source:string,name:?string,email:?string,subject:string,message:string,metadata:mixed} $normalized
     */
    private function buildDedupeFingerprint(array $normalized): string
    {
        $compressedMessage = Str::of($normalized['message'])
            ->lower()
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();

        $payload = [
            'route_label' => $normalized['route_label'],
            'source' => $normalized['source'],
            'email' => Str::lower((string) ($normalized['email'] ?? '')),
            'subject' => Str::lower($normalized['subject']),
            'message' => $compressedMessage,
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function findRecentDuplicate(string $dedupeFingerprint): ?TrailAssistantIntake
    {
        return TrailAssistantIntake::query()
            ->where('dedupe_fingerprint', $dedupeFingerprint)
            ->where('created_at', '>=', Carbon::now()->subMinutes(self::DUPLICATE_WINDOW_MINUTES))
            ->orderByDesc('id')
            ->first();
    }

    private function isIdempotencyConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $message = Str::lower($exception->getMessage());

        return $sqlState === '23000' && str_contains($message, 'idempotency_key');
    }
}
