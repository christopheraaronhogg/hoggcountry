<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantMapReport;
use App\Models\TrailAssistantMapReportAudit;
use App\Support\TrailAssistantGovernanceConfig;
use App\Support\TrailAssistantModeratorGate;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantMapReportController extends ApiController
{
    /**
     * @return array<int, string>
     */
    private function allowedKinds(): array
    {
        $kinds = config('trail_assistant.map_reports.kinds', []);

        if (! is_array($kinds) || $kinds === []) {
            return ['tree_down', 'water_issue', 'bridge_out', 'trail_closed', 'injury_assist', 'wildlife', 'weather_hazard', 'other'];
        }

        return array_values(array_filter($kinds, fn (mixed $v): bool => is_string($v) && trim($v) !== ''));
    }

    /**
     * @return array<int, string>
     */
    private function allowedSeverity(): array
    {
        $levels = config('trail_assistant.map_reports.severity', []);

        if (! is_array($levels) || $levels === []) {
            return ['info', 'caution', 'danger', 'emergency'];
        }

        return array_values(array_filter($levels, fn (mixed $v): bool => is_string($v) && trim($v) !== ''));
    }

    /**
     * @return array<int, string>
     */
    private function allowedVerificationTargets(): array
    {
        return ['trusted', 'moderator_verified'];
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'mile_marker' => ['nullable', 'numeric', 'between:0,3000'],
            'kind' => ['required', 'string', Rule::in($this->allowedKinds())],
            'severity' => ['nullable', 'string', Rule::in($this->allowedSeverity())],
            'message' => ['nullable', 'string', 'max:280'],
            'source' => ['nullable', 'string', 'max:24'],
            'occurred_at' => ['nullable', 'date'],
            'expires_in_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
        ]);

        $idempotencyKey = $this->resolveIdempotencyKey($request, $validated['idempotency_key'] ?? null);
        if ($idempotencyKey) {
            $existing = TrailAssistantMapReport::query()
                ->where('user_id', $request->user()->id)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                return $this->ok([
                    'report' => $this->payload($existing),
                    'idempotent_replay' => true,
                    'duplicate_guard' => 'idempotency_key',
                ]);
            }
        }

        $normalizedMessage = $this->normalizeText((string) ($validated['message'] ?? ''), 280);
        $dedupeFingerprint = $this->buildDedupeFingerprint(
            (float) $validated['lat'],
            (float) $validated['lon'],
            (string) $validated['kind'],
            (string) ($validated['severity'] ?? 'info'),
            $normalizedMessage
        );

        $duplicateWindowMinutes = (int) config('trail_assistant.map_reports.duplicate_window_minutes', 120);
        $existingDuplicate = TrailAssistantMapReport::query()
            ->where('user_id', $request->user()->id)
            ->where('dedupe_fingerprint', $dedupeFingerprint)
            ->where('created_at', '>=', now()->subMinutes(max(5, $duplicateWindowMinutes)))
            ->orderByDesc('id')
            ->first();

        if ($existingDuplicate) {
            return $this->ok([
                'report' => $this->payload($existingDuplicate),
                'idempotent_replay' => false,
                'duplicate_guard' => 'fingerprint_window',
            ]);
        }

        $occurredAt = isset($validated['occurred_at'])
            ? CarbonImmutable::parse((string) $validated['occurred_at'])->utc()
            : CarbonImmutable::now('UTC');

        $defaultExpiry = (int) config('trail_assistant.map_reports.default_expiry_hours', 48);
        $expiryHours = (int) ($validated['expires_in_hours'] ?? max(1, $defaultExpiry));

        $verification = $this->resolveVerification($request);

        try {
            $report = TrailAssistantMapReport::query()->create([
                'report_id' => 'tmr_'.Str::lower(Str::random(12)),
                'user_id' => $request->user()->id,
                'idempotency_key' => $idempotencyKey,
                'dedupe_fingerprint' => $dedupeFingerprint,
                'lat' => (float) $validated['lat'],
                'lon' => (float) $validated['lon'],
                'mile_marker' => isset($validated['mile_marker']) ? (float) $validated['mile_marker'] : null,
                'kind' => (string) $validated['kind'],
                'severity' => (string) ($validated['severity'] ?? 'info'),
                'message' => $normalizedMessage !== '' ? $normalizedMessage : null,
                'source' => $this->normalizeText((string) ($validated['source'] ?? 'mobile_app'), 24),
                'verification' => $verification,
                'status' => 'active',
                'occurred_at' => $occurredAt,
                'expires_at' => $occurredAt->addHours($expiryHours),
            ]);
        } catch (QueryException $exception) {
            if ($idempotencyKey && $this->isIdempotencyConstraintViolation($exception)) {
                $existingByKey = TrailAssistantMapReport::query()
                    ->where('user_id', $request->user()->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingByKey) {
                    return $this->ok([
                        'report' => $this->payload($existingByKey),
                        'idempotent_replay' => true,
                        'duplicate_guard' => 'idempotency_key',
                    ]);
                }

                return $this->fail(
                    'idempotency_key_conflict',
                    'Idempotency key already used for a different map report. Retry with a new key.',
                    409
                );
            }

            throw $exception;
        }

        $this->recordAudit(
            report: $report,
            request: $request,
            action: 'created',
            fromVerification: null,
            toVerification: $report->verification,
            note: null,
            metadata: ['source' => $report->source]
        );

        return $this->ok([
            'report' => $this->payload($report),
            'idempotent_replay' => false,
            'duplicate_guard' => null,
            'safety_note' => 'Community reports are informational and should be cross-checked on trail.',
        ], 201);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'kind' => ['nullable', 'string', Rule::in($this->allowedKinds())],
            'status' => ['nullable', 'string', Rule::in(['active', 'resolved', 'hidden'])],
            'verification' => ['nullable', 'string', Rule::in(['unverified', 'trusted', 'moderator_verified'])],
            'scope' => ['nullable', 'string', Rule::in(['mine', 'moderation_queue', 'all'])],
            'since' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $limit = (int) ($validated['limit'] ?? 200);
        $scope = (string) ($validated['scope'] ?? 'mine');

        $query = TrailAssistantMapReport::query();

        if ($scope === 'mine') {
            $query->where('user_id', $request->user()->id);
        } else {
            if (! $this->isModerator($request)) {
                return $this->fail('forbidden', 'Only moderators can access report queues.', 403);
            }

            if ($scope === 'moderation_queue') {
                $query->where('status', 'active')
                    ->where('verification', 'unverified');
            }
        }

        $query
            ->when(isset($validated['kind']), fn ($q) => $q->where('kind', $validated['kind']))
            ->when(isset($validated['status']), fn ($q) => $q->where('status', $validated['status']))
            ->when(isset($validated['verification']), fn ($q) => $q->where('verification', $validated['verification']))
            ->when(isset($validated['since']), fn ($q) => $q->where('occurred_at', '>=', CarbonImmutable::parse((string) $validated['since'])->utc()))
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->limit($limit);

        $rows = $query->get()->map(fn (TrailAssistantMapReport $report): array => $this->payload($report))->all();

        return $this->ok([
            'scope' => $scope,
            'reports' => $rows,
        ]);
    }

    public function publicFeed(Request $request)
    {
        $validated = $request->validate([
            'kind' => ['nullable', 'string', Rule::in($this->allowedKinds())],
            'since' => ['nullable', 'date'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'min_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'max_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'min_lon' => ['nullable', 'numeric', 'between:-180,180'],
            'max_lon' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $limit = (int) ($validated['limit'] ?? 200);
        $visibleVerifications = TrailAssistantGovernanceConfig::mapReportPublicVisibleVerifications();

        $query = TrailAssistantMapReport::query()
            ->where('status', 'active')
            ->whereIn('verification', $visibleVerifications)
            ->where(function ($q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>=', now());
            })
            ->when(isset($validated['kind']), fn ($q) => $q->where('kind', $validated['kind']))
            ->when(isset($validated['since']), fn ($q) => $q->where('occurred_at', '>=', CarbonImmutable::parse((string) $validated['since'])->utc()))
            ->when(isset($validated['min_lat']), fn ($q) => $q->where('lat', '>=', (float) $validated['min_lat']))
            ->when(isset($validated['max_lat']), fn ($q) => $q->where('lat', '<=', (float) $validated['max_lat']))
            ->when(isset($validated['min_lon']), fn ($q) => $q->where('lon', '>=', (float) $validated['min_lon']))
            ->when(isset($validated['max_lon']), fn ($q) => $q->where('lon', '<=', (float) $validated['max_lon']))
            ->orderByRaw("case severity when 'emergency' then 4 when 'danger' then 3 when 'caution' then 2 else 1 end desc")
            ->orderByDesc('occurred_at')
            ->limit($limit);

        $rows = $query->get()->map(fn (TrailAssistantMapReport $report): array => $this->payload($report, includeOwner: false))->all();

        return $this->ok([
            'reports' => $rows,
            'safety_note' => 'Reports are advisory. Verify conditions on trail before committing to route changes.',
        ]);
    }

    public function verify(Request $request, string $reportId)
    {
        if (! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can verify reports.', 403);
        }

        $validated = $request->validate([
            'target_verification' => ['required', 'string', Rule::in($this->allowedVerificationTargets())],
            'note' => ['required', 'string', 'min:10', 'max:280'],
        ]);

        $report = TrailAssistantMapReport::query()->where('report_id', $reportId)->firstOrFail();

        $fromVerification = (string) $report->verification;
        $targetVerification = (string) $validated['target_verification'];

        if ($fromVerification === $targetVerification) {
            return $this->ok([
                'report' => $this->payload($report),
                'already_in_state' => true,
            ]);
        }

        if (! $this->canPromoteVerification($fromVerification, $targetVerification)) {
            return $this->fail(
                'invalid_transition',
                sprintf('Cannot promote verification from "%s" to "%s".', $fromVerification, $targetVerification),
                422
            );
        }

        $report->verification = $targetVerification;
        $report->save();

        $audit = $this->recordAudit(
            report: $report,
            request: $request,
            action: 'verification_promoted',
            fromVerification: $fromVerification,
            toVerification: $targetVerification,
            note: $this->normalizeText((string) $validated['note'], 280)
        );

        return $this->ok([
            'report' => $this->payload($report),
            'audit_event' => $this->auditPayload($audit),
            'already_in_state' => false,
        ]);
    }

    public function audit(Request $request, string $reportId)
    {
        $report = TrailAssistantMapReport::query()->where('report_id', $reportId)->firstOrFail();

        if (! $this->canViewAudit($request, $report)) {
            return $this->fail('forbidden', 'You are not allowed to view this audit trail.', 403);
        }

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $limit = (int) ($validated['limit'] ?? 50);

        $events = TrailAssistantMapReportAudit::query()
            ->where('map_report_id', $report->id)
            ->with('actor:id,name,email')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (TrailAssistantMapReportAudit $audit): array => $this->auditPayload($audit))
            ->all();

        return $this->ok([
            'report' => $this->payload($report),
            'events' => $events,
        ]);
    }

    public function resolve(Request $request, string $reportId)
    {
        $report = TrailAssistantMapReport::query()->where('report_id', $reportId)->firstOrFail();

        $isOwner = (int) $report->user_id === (int) $request->user()->id;
        $isModerator = $this->isModerator($request);

        if (! $isOwner && ! $isModerator) {
            return $this->fail('forbidden', 'You are not allowed to resolve this report.', 403);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:280'],
        ]);

        if ($report->status !== 'resolved') {
            $report->status = 'resolved';
            $report->resolved_at = now();
            $report->save();

            $this->recordAudit(
                report: $report,
                request: $request,
                action: 'resolved',
                fromVerification: $report->verification,
                toVerification: $report->verification,
                note: isset($validated['note']) ? $this->normalizeText((string) $validated['note'], 280) : null
            );
        }

        return $this->ok([
            'report' => $this->payload($report),
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

    private function isIdempotencyConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $message = Str::lower($exception->getMessage());

        return $sqlState === '23000' && str_contains($message, 'idempotency_key');
    }

    private function buildDedupeFingerprint(float $lat, float $lon, string $kind, string $severity, string $message): string
    {
        $bucketLat = number_format($lat, 4, '.', '');
        $bucketLon = number_format($lon, 4, '.', '');
        $compressedMessage = Str::of($message)
            ->lower()
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();

        $payload = [
            'lat' => $bucketLat,
            'lon' => $bucketLon,
            'kind' => Str::lower($kind),
            'severity' => Str::lower($severity),
            'message' => $compressedMessage,
        ];

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function resolveVerification(Request $request): string
    {
        if (in_array((int) $request->user()->id, TrailAssistantGovernanceConfig::mapReportTrustedUserIds(), true)) {
            return 'trusted';
        }

        return 'unverified';
    }

    private function isModerator(Request $request): bool
    {
        return TrailAssistantModeratorGate::canModerate($request->user());
    }

    private function canViewAudit(Request $request, TrailAssistantMapReport $report): bool
    {
        if ($this->isModerator($request)) {
            return true;
        }

        return (int) $report->user_id === (int) $request->user()->id;
    }

    private function canPromoteVerification(string $from, string $to): bool
    {
        return match ($from) {
            'unverified' => in_array($to, ['trusted', 'moderator_verified'], true),
            'trusted' => $to === 'moderator_verified',
            default => false,
        };
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

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function recordAudit(
        TrailAssistantMapReport $report,
        Request $request,
        string $action,
        ?string $fromVerification,
        ?string $toVerification,
        ?string $note = null,
        array $metadata = [],
    ): TrailAssistantMapReportAudit {
        $baseMetadata = [
            'request_id' => request()->header('x-request-id'),
            'ip' => $request->ip(),
            'user_agent' => Str::limit((string) ($request->userAgent() ?? ''), 180, ''),
        ];

        return TrailAssistantMapReportAudit::query()->create([
            'map_report_id' => $report->id,
            'report_id' => $report->report_id,
            'actor_user_id' => $request->user()->id,
            'action' => $action,
            'from_verification' => $fromVerification,
            'to_verification' => $toVerification,
            'note' => $note,
            'metadata' => array_filter(array_merge($baseMetadata, $metadata), static fn (mixed $value): bool => $value !== null && $value !== ''),
        ]);
    }

    private function payload(TrailAssistantMapReport $report, bool $includeOwner = true): array
    {
        $payload = [
            'report_id' => $report->report_id,
            'lat' => $report->lat,
            'lon' => $report->lon,
            'mile_marker' => $report->mile_marker,
            'kind' => $report->kind,
            'severity' => $report->severity,
            'message' => $report->message,
            'verification' => $report->verification,
            'status' => $report->status,
            'source' => $report->source,
            'occurred_at' => $report->occurred_at?->toISOString(),
            'expires_at' => $report->expires_at?->toISOString(),
            'resolved_at' => $report->resolved_at?->toISOString(),
            'created_at' => $report->created_at?->toISOString(),
        ];

        if ($includeOwner) {
            $payload['user_id'] = $report->user_id ? (string) $report->user_id : null;
        }

        return $payload;
    }

    private function auditPayload(TrailAssistantMapReportAudit $audit): array
    {
        return [
            'action' => $audit->action,
            'from_verification' => $audit->from_verification,
            'to_verification' => $audit->to_verification,
            'note' => $audit->note,
            'created_at' => $audit->created_at?->toISOString(),
            'actor' => $audit->actor ? [
                'id' => (string) $audit->actor->id,
                'name' => $audit->actor->name,
                'email' => $audit->actor->email,
            ] : null,
            'metadata' => $audit->metadata,
        ];
    }
}
