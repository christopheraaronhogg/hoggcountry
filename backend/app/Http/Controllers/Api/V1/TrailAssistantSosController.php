<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantSosEscalation;
use App\Support\TrailAssistantModeratorGate;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantSosController extends ApiController
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'mile_marker' => ['nullable', 'numeric', 'between:0,3000'],
            'message' => ['required', 'string', 'min:10', 'max:600'],
            'contact_method' => ['nullable', 'string', Rule::in($this->allowedContactMethods())],
            'observed_at' => ['nullable', 'date'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'metadata' => ['nullable', 'array'],
            'confirm_emergency' => ['required', 'accepted'],
        ]);

        $idempotencyKey = $this->resolveIdempotencyKey($request, $validated['idempotency_key'] ?? null);
        if ($idempotencyKey) {
            $existingByKey = TrailAssistantSosEscalation::query()
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingByKey) {
                return $this->ok([
                    'escalation' => $this->payload($existingByKey),
                    'idempotent_replay' => true,
                    'duplicate_guard' => 'idempotency_key',
                ]);
            }
        }

        $normalizedMessage = $this->normalizeText((string) $validated['message'], 600);
        $dedupeFingerprint = $this->buildDedupeFingerprint(
            (float) $validated['lat'],
            (float) $validated['lon'],
            $normalizedMessage
        );

        $duplicateWindowMinutes = max(5, (int) config('trail_assistant.sos.duplicate_window_minutes', 180));

        $recentDuplicate = TrailAssistantSosEscalation::query()
            ->where('user_id', $request->user()->id)
            ->where('dedupe_fingerprint', $dedupeFingerprint)
            ->where('created_at', '>=', now()->subMinutes($duplicateWindowMinutes))
            ->latest('id')
            ->first();

        if ($recentDuplicate) {
            return $this->ok([
                'escalation' => $this->payload($recentDuplicate),
                'idempotent_replay' => false,
                'duplicate_guard' => 'fingerprint_window',
            ]);
        }

        $cooldownMinutes = max(1, (int) config('trail_assistant.sos.cooldown_minutes', 15));

        $activeWithinCooldown = TrailAssistantSosEscalation::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending_review', 'acknowledged'])
            ->where('created_at', '>=', now()->subMinutes($cooldownMinutes))
            ->latest('id')
            ->first();

        if ($activeWithinCooldown) {
            return $this->fail(
                'sos_cooldown_active',
                'SOS escalation already open recently. Please wait for responder acknowledgment.',
                429,
                [
                    'existing_escalation_id' => $activeWithinCooldown->escalation_id,
                    'retry_after' => $activeWithinCooldown->created_at?->addMinutes($cooldownMinutes)?->toISOString(),
                ]
            );
        }

        $maxPer24Hours = max(1, (int) config('trail_assistant.sos.max_requests_per_24h', 4));
        $requestsLast24h = TrailAssistantSosEscalation::query()
            ->where('user_id', $request->user()->id)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        if ($requestsLast24h >= $maxPer24Hours) {
            return $this->fail(
                'sos_rate_limited',
                'SOS escalation limit reached for now. Contact 911/local emergency services immediately if danger is present.',
                429,
                [
                    'max_requests_per_24h' => $maxPer24Hours,
                ]
            );
        }

        $triggeredAt = isset($validated['observed_at'])
            ? CarbonImmutable::parse((string) $validated['observed_at'])->utc()
            : CarbonImmutable::now('UTC');

        $abuseFlags = [];
        if (! $request->user()->hasVerifiedEmail()) {
            $abuseFlags[] = 'email_unverified';
        }

        if ($this->looksLikeTestMessage($normalizedMessage)) {
            $abuseFlags[] = 'possible_test_keyword';
        }

        if ($requestsLast24h >= max(1, $maxPer24Hours - 1)) {
            $abuseFlags[] = 'near_daily_limit';
        }

        $escalation = TrailAssistantSosEscalation::query()->create([
            'escalation_id' => 'sos_'.Str::lower(Str::random(12)),
            'user_id' => $request->user()->id,
            'idempotency_key' => $idempotencyKey,
            'dedupe_fingerprint' => $dedupeFingerprint,
            'lat' => (float) $validated['lat'],
            'lon' => (float) $validated['lon'],
            'mile_marker' => isset($validated['mile_marker']) ? (float) $validated['mile_marker'] : null,
            'message' => $normalizedMessage,
            'contact_method' => (string) ($validated['contact_method'] ?? 'in_app'),
            'status' => 'pending_review',
            'severity' => 'emergency',
            'requires_manual_dispatch' => true,
            'triggered_at' => $triggeredAt,
            'cooldown_until' => CarbonImmutable::now('UTC')->addMinutes($cooldownMinutes),
            'abuse_flags' => $abuseFlags,
            'metadata' => $this->normalizeMetadata($validated['metadata'] ?? []),
        ]);

        return $this->ok([
            'escalation' => $this->payload($escalation),
            'idempotent_replay' => false,
            'duplicate_guard' => null,
            'next_steps' => [
                'If immediate danger exists, call 911/local emergency services now.',
                'Trail Assistant escalation is queued for manual responder review.',
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'scope' => ['nullable', 'string', Rule::in(['mine', 'queue'])],
            'status' => ['nullable', 'string', Rule::in(['pending_review', 'acknowledged', 'resolved'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $scope = (string) ($validated['scope'] ?? 'mine');
        $limit = (int) ($validated['limit'] ?? 50);

        $query = TrailAssistantSosEscalation::query()
            ->with('user:id,name,email');

        if ($scope === 'mine') {
            $query->where('user_id', $request->user()->id);
        } else {
            if (! $this->isModerator($request)) {
                return $this->fail('forbidden', 'Only moderators can access SOS queue scope.', 403);
            }

            $query->whereIn('status', ['pending_review', 'acknowledged']);
        }

        $query
            ->when(isset($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->orderByDesc('triggered_at')
            ->orderByDesc('id')
            ->limit($limit);

        $rows = $query->get()->map(fn (TrailAssistantSosEscalation $escalation): array => $this->payload($escalation, includeReporter: $scope === 'queue'))->all();

        return $this->ok([
            'scope' => $scope,
            'escalations' => $rows,
        ]);
    }

    public function updateStatus(Request $request, string $escalationId)
    {
        if (! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can update SOS escalation status.', 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['acknowledged', 'resolved'])],
            'note' => ['nullable', 'string', 'max:280'],
        ]);

        $escalation = TrailAssistantSosEscalation::query()->where('escalation_id', $escalationId)->firstOrFail();

        $status = (string) $validated['status'];
        $escalation->status = $status;

        if ($status === 'acknowledged' && $escalation->acknowledged_at === null) {
            $escalation->acknowledged_at = now();
        }

        if ($status === 'resolved') {
            $escalation->resolved_at = now();
            if ($escalation->acknowledged_at === null) {
                $escalation->acknowledged_at = now();
            }
        }

        $metadata = is_array($escalation->metadata) ? $escalation->metadata : [];
        if (isset($validated['note'])) {
            $metadata['moderation_note'] = $this->normalizeText((string) $validated['note'], 280);
        }

        $metadata['last_moderated_by'] = [
            'id' => (string) $request->user()->id,
            'email' => $request->user()->email,
            'at' => now()->toISOString(),
        ];

        $escalation->metadata = $metadata;
        $escalation->save();

        return $this->ok([
            'escalation' => $this->payload($escalation, includeReporter: true),
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function allowedContactMethods(): array
    {
        $methods = config('trail_assistant.sos.contact_methods', ['in_app', 'sms', 'satellite']);

        if (! is_array($methods) || $methods === []) {
            return ['in_app', 'sms', 'satellite'];
        }

        return array_values(array_filter($methods, fn (mixed $method): bool => is_string($method) && trim($method) !== ''));
    }

    private function isModerator(Request $request): bool
    {
        return TrailAssistantModeratorGate::canModerate($request->user());
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

    private function buildDedupeFingerprint(float $lat, float $lon, string $message): string
    {
        $payload = [
            'lat' => number_format($lat, 4, '.', ''),
            'lon' => number_format($lon, 4, '.', ''),
            'message' => Str::of($message)->lower()->replaceMatches('/\s+/', ' ')->trim()->toString(),
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function looksLikeTestMessage(string $message): bool
    {
        return (bool) preg_match('/\b(test|drill|practice)\b/i', $message);
    }

    private function normalizeText(string $value, int $max): string
    {
        return Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($max, '')
            ->toString();
    }

    private function payload(TrailAssistantSosEscalation $escalation, bool $includeReporter = false): array
    {
        $payload = [
            'escalation_id' => $escalation->escalation_id,
            'lat' => $escalation->lat,
            'lon' => $escalation->lon,
            'mile_marker' => $escalation->mile_marker,
            'message' => $escalation->message,
            'contact_method' => $escalation->contact_method,
            'status' => $escalation->status,
            'severity' => $escalation->severity,
            'requires_manual_dispatch' => $escalation->requires_manual_dispatch,
            'triggered_at' => $escalation->triggered_at?->toISOString(),
            'cooldown_until' => $escalation->cooldown_until?->toISOString(),
            'acknowledged_at' => $escalation->acknowledged_at?->toISOString(),
            'resolved_at' => $escalation->resolved_at?->toISOString(),
            'created_at' => $escalation->created_at?->toISOString(),
            'abuse_flags' => $escalation->abuse_flags,
        ];

        if ($includeReporter) {
            $payload['reporter'] = $escalation->user ? [
                'id' => (string) $escalation->user->id,
                'name' => $escalation->user->name,
                'email' => $escalation->user->email,
            ] : [
                'id' => (string) $escalation->user_id,
                'name' => null,
                'email' => null,
            ];
        }

        return $payload;
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
