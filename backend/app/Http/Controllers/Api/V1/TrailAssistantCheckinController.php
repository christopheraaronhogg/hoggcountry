<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantCheckin;
use App\Models\TrailAssistantMapVisibilitySetting;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantCheckinController extends ApiController
{
    private const SOURCES = ['mobile_app', 'web_app', 'manual'];

    private const TRAIL_TOTAL_MILES = 2197.4;

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lon' => ['required', 'numeric', 'between:-180,180'],
            'mile_marker' => ['nullable', 'numeric', 'between:0,3000'],
            'battery_percent' => ['nullable', 'integer', 'between:0,100'],
            'status_note' => ['nullable', 'string', 'max:280'],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'observed_at' => ['nullable', 'date'],
            'idempotency_key' => ['nullable', 'string', 'max:120'],
            'client_event_id' => ['nullable', 'string', 'max:80'],
            'replayed_from_offline' => ['nullable', 'boolean'],
            'sync_metadata' => ['nullable', 'array'],
        ]);

        $userId = (int) $request->user()->id;

        $idempotencyKey = $this->resolveIdempotencyKey($request, $validated['idempotency_key'] ?? null);
        if ($idempotencyKey) {
            $existingByKey = TrailAssistantCheckin::query()
                ->where('user_id', $userId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingByKey) {
                return $this->respondWithCheckin(
                    $existingByKey,
                    status: 200,
                    idempotentReplay: true,
                    duplicateGuard: 'idempotency_key'
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

        if ($clientEventId !== null) {
            $existingByClientEvent = TrailAssistantCheckin::query()
                ->where('user_id', $userId)
                ->where('client_event_id', $clientEventId)
                ->first();

            if ($existingByClientEvent) {
                return $this->respondWithCheckin(
                    $existingByClientEvent,
                    status: 200,
                    idempotentReplay: true,
                    duplicateGuard: 'client_event_id'
                );
            }
        }

        $observedAt = isset($validated['observed_at'])
            ? Carbon::parse((string) $validated['observed_at'])->utc()
            : now();

        [$shareScope, $shareLocationMode, $visibleAfter] = $this->resolveVisibilityForUser(
            userId: $userId,
            observedAt: $observedAt
        );

        try {
            $checkin = TrailAssistantCheckin::query()->create([
                'checkin_id' => 'tac_'.Str::lower(Str::random(12)),
                'idempotency_key' => $idempotencyKey,
                'client_event_id' => $clientEventId,
                'user_id' => $userId,
                'lat' => (float) $validated['lat'],
                'lon' => (float) $validated['lon'],
                'mile_marker' => isset($validated['mile_marker']) ? (float) $validated['mile_marker'] : null,
                'battery_percent' => isset($validated['battery_percent']) ? (int) $validated['battery_percent'] : null,
                'status_note' => $this->nullableText((string) ($validated['status_note'] ?? ''), 280),
                'source' => (string) ($validated['source'] ?? 'mobile_app'),
                'replayed_from_offline' => (bool) ($validated['replayed_from_offline'] ?? false),
                'sync_metadata' => $this->normalizeSyncMetadata($validated['sync_metadata'] ?? []),
                'share_scope' => $shareScope,
                'share_location_mode' => $shareLocationMode,
                'observed_at' => $observedAt,
                'visible_after' => $visibleAfter,
            ]);
        } catch (QueryException $exception) {
            if ($idempotencyKey && $this->isSyncConstraintViolation($exception, 'trail_checkins_user_idempotency_unique')) {
                $existingByKey = TrailAssistantCheckin::query()
                    ->where('user_id', $userId)
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();

                if ($existingByKey) {
                    return $this->respondWithCheckin(
                        $existingByKey,
                        status: 200,
                        idempotentReplay: true,
                        duplicateGuard: 'idempotency_key'
                    );
                }
            }

            if ($clientEventId !== null && $this->isSyncConstraintViolation($exception, 'trail_checkins_user_client_event_unique')) {
                $existingByClientEvent = TrailAssistantCheckin::query()
                    ->where('user_id', $userId)
                    ->where('client_event_id', $clientEventId)
                    ->first();

                if ($existingByClientEvent) {
                    return $this->respondWithCheckin(
                        $existingByClientEvent,
                        status: 200,
                        idempotentReplay: true,
                        duplicateGuard: 'client_event_id'
                    );
                }
            }

            throw $exception;
        }

        return $this->respondWithCheckin($checkin, status: 201);
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'since' => ['nullable', 'date'],
        ]);

        $limit = (int) ($validated['limit'] ?? 200);

        $query = TrailAssistantCheckin::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->limit($limit);

        if (isset($validated['since'])) {
            $since = Carbon::parse((string) $validated['since'])->utc();
            $query->where('observed_at', '>=', $since->toDateTimeString());
        }

        $rows = $query->get();

        return $this->ok([
            'checkins' => $rows
                ->map(fn (TrailAssistantCheckin $checkin): array => $this->checkinPayload($checkin))
                ->all(),
            'path' => $rows
                ->sortBy('observed_at')
                ->values()
                ->map(fn (TrailAssistantCheckin $checkin): array => [
                    'lat' => $checkin->lat,
                    'lon' => $checkin->lon,
                    'mile_marker' => $checkin->mile_marker,
                    'observed_at' => $checkin->observed_at?->toISOString(),
                ])
                ->all(),
            'progress' => $this->progressSnapshotForUser((int) $request->user()->id),
        ]);
    }

    public function latest(Request $request)
    {
        $checkin = TrailAssistantCheckin::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->first();

        return $this->ok([
            'checkin' => $checkin ? $this->checkinPayload($checkin) : null,
            'progress' => $this->progressSnapshotForUser((int) $request->user()->id),
        ]);
    }

    public function history(Request $request)
    {
        return $this->index($request);
    }

    public function progress(Request $request)
    {
        return $this->ok([
            'progress' => $this->progressSnapshotForUser((int) $request->user()->id),
        ]);
    }

    private function respondWithCheckin(
        TrailAssistantCheckin $checkin,
        int $status = 200,
        bool $idempotentReplay = false,
        ?string $duplicateGuard = null,
    ): JsonResponse {
        return $this->ok([
            'checkin' => $this->checkinPayload($checkin),
            'progress' => $this->progressSnapshotForUser((int) $checkin->user_id),
            'idempotent_replay' => $idempotentReplay,
            'duplicate_guard' => $duplicateGuard,
            'sync' => [
                'client_event_id' => $checkin->client_event_id,
                'replayed_from_offline' => (bool) $checkin->replayed_from_offline,
            ],
        ], $status);
    }

    private function checkinPayload(TrailAssistantCheckin $checkin): array
    {
        return [
            'checkin_id' => $checkin->checkin_id,
            'lat' => $checkin->lat,
            'lon' => $checkin->lon,
            'mile_marker' => $checkin->mile_marker,
            'battery_percent' => $checkin->battery_percent,
            'status_note' => $checkin->status_note,
            'source' => $checkin->source,
            'idempotency_key' => $checkin->idempotency_key,
            'client_event_id' => $checkin->client_event_id,
            'replayed_from_offline' => (bool) $checkin->replayed_from_offline,
            'sync_metadata' => $checkin->sync_metadata,
            'share_scope' => $checkin->share_scope,
            'share_location_mode' => $checkin->share_location_mode,
            'visible_after' => $checkin->visible_after?->toISOString(),
            'observed_at' => $checkin->observed_at?->toISOString(),
            'created_at' => $checkin->created_at?->toISOString(),
        ];
    }

    private function progressSnapshotForUser(int $userId): array
    {
        $first = TrailAssistantCheckin::query()
            ->where('user_id', $userId)
            ->whereNotNull('mile_marker')
            ->orderBy('observed_at')
            ->orderBy('id')
            ->first();

        $latest = TrailAssistantCheckin::query()
            ->where('user_id', $userId)
            ->whereNotNull('mile_marker')
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->first();

        $latestAny = TrailAssistantCheckin::query()
            ->where('user_id', $userId)
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->first();

        $firstMile = $first?->mile_marker;
        $latestMile = $latest?->mile_marker;

        $latestClamped = is_numeric($latestMile)
            ? max(0.0, min(self::TRAIL_TOTAL_MILES, (float) $latestMile))
            : null;

        $firstClamped = is_numeric($firstMile)
            ? max(0.0, min(self::TRAIL_TOTAL_MILES, (float) $firstMile))
            : null;

        $percentComplete = $latestClamped !== null
            ? round(($latestClamped / self::TRAIL_TOTAL_MILES) * 100, 2)
            : null;

        return [
            'at_total_miles' => self::TRAIL_TOTAL_MILES,
            'trail_total_miles' => self::TRAIL_TOTAL_MILES,
            'first_mile_marker' => $firstClamped !== null ? round($firstClamped, 1) : null,
            'latest_mile_marker' => $latestClamped !== null ? round($latestClamped, 1) : null,
            'mile_marker' => $latestClamped !== null ? round($latestClamped, 1) : null,
            'miles_since_first_checkin' => $firstClamped !== null && $latestClamped !== null
                ? round(max(0.0, $latestClamped - $firstClamped), 1)
                : null,
            'miles_remaining' => $latestClamped !== null
                ? round(max(0.0, self::TRAIL_TOTAL_MILES - $latestClamped), 1)
                : null,
            'percent_of_at_complete' => $percentComplete,
            'percent_complete' => $percentComplete,
            'latest_observed_at' => $latestAny?->observed_at?->toISOString(),
            'checkin_count' => TrailAssistantCheckin::query()
                ->where('user_id', $userId)
                ->count(),
        ];
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

    private function normalizeSyncMetadata(mixed $value, int $depth = 0): mixed
    {
        if ($depth >= 4) {
            return [];
        }

        if (! is_array($value)) {
            if (is_bool($value) || is_int($value) || is_float($value) || is_null($value)) {
                return $value;
            }

            return $this->nullableText((string) $value, 300);
        }

        if (array_is_list($value)) {
            $normalized = [];
            foreach ($value as $entry) {
                $normalized[] = $this->normalizeSyncMetadata($entry, $depth + 1);
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

            $normalized[$normalizedKey] = $this->normalizeSyncMetadata($entry, $depth + 1);

            if (count($normalized) >= 40) {
                break;
            }
        }

        ksort($normalized);

        return $normalized;
    }

    private function isSyncConstraintViolation(QueryException $exception, string $constraintName): bool
    {
        $sqlState = (string) ($exception->errorInfo[0] ?? '');
        $message = Str::lower($exception->getMessage());

        return $sqlState === '23000' && str_contains($message, Str::lower($constraintName));
    }

    /**
     * @return array{0:string,1:string,2:?Carbon}
     */
    private function resolveVisibilityForUser(int $userId, Carbon $observedAt): array
    {
        $settings = TrailAssistantMapVisibilitySetting::query()->firstOrCreate(
            ['user_id' => $userId],
            [
                'share_scope' => (string) config('trail_assistant.map_sharing.default_scope', 'private'),
                'location_mode' => (string) config('trail_assistant.map_sharing.default_location_mode', 'coarse'),
                'visibility_delay_minutes' => (int) config('trail_assistant.map_sharing.default_visibility_delay_minutes', 90),
            ]
        );

        $allowedScopes = config('trail_assistant.map_sharing.scopes', ['private', 'trusted', 'public']);
        $allowedModes = config('trail_assistant.map_sharing.location_modes', ['exact', 'coarse']);

        if (! is_array($allowedScopes) || ! in_array((string) $settings->share_scope, $allowedScopes, true)) {
            $settings->share_scope = 'private';
        }

        if (! is_array($allowedModes) || ! in_array((string) $settings->location_mode, $allowedModes, true)) {
            $settings->location_mode = 'coarse';
        }

        $delayMinutes = max(0, min(
            (int) config('trail_assistant.map_sharing.max_visibility_delay_minutes', 1440),
            (int) $settings->visibility_delay_minutes
        ));

        if ((string) $settings->share_scope === 'public') {
            $delayMinutes = max(
                (int) config('trail_assistant.map_sharing.min_public_delay_minutes', 30),
                $delayMinutes
            );
        }

        if ((string) $settings->share_scope === 'private') {
            return ['private', (string) $settings->location_mode, null];
        }

        return [
            (string) $settings->share_scope,
            (string) $settings->location_mode,
            $observedAt->copy()->addMinutes($delayMinutes),
        ];
    }

    private function nullableText(string $value, int $maxLength): ?string
    {
        $normalized = Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($maxLength, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }
}
