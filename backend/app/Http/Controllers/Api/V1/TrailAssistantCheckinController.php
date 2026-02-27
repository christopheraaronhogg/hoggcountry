<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantCheckin;
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
        ]);

        $observedAt = isset($validated['observed_at'])
            ? Carbon::parse((string) $validated['observed_at'])->utc()
            : now();

        $checkin = TrailAssistantCheckin::query()->create([
            'checkin_id' => 'tac_'.Str::lower(Str::random(12)),
            'user_id' => $request->user()->id,
            'lat' => (float) $validated['lat'],
            'lon' => (float) $validated['lon'],
            'mile_marker' => isset($validated['mile_marker']) ? (float) $validated['mile_marker'] : null,
            'battery_percent' => isset($validated['battery_percent']) ? (int) $validated['battery_percent'] : null,
            'status_note' => $this->nullableText((string) ($validated['status_note'] ?? ''), 280),
            'source' => (string) ($validated['source'] ?? 'mobile_app'),
            'observed_at' => $observedAt,
        ]);

        return $this->ok([
            'checkin' => $this->checkinPayload($checkin),
            'progress' => $this->progressSnapshotForUser((int) $request->user()->id),
        ], 201);
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
