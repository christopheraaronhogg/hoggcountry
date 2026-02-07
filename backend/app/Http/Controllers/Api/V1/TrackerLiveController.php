<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\CommunityTracker;
use App\Models\TrackerFix;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class TrackerLiveController extends ApiController
{
    public function index(Request $request)
    {
        $trackers = CommunityTracker::query()
            ->where('user_id', $request->user()->id)
            ->with('latestFix')
            ->when(
                is_string($request->query('label')) && trim((string) $request->query('label')) !== '',
                fn ($query) => $query->whereRaw('LOWER(label) = ?', [mb_strtolower(trim((string) $request->query('label')))])
            )
            ->orderBy('label')
            ->get();

        $fixes = $this->buildLiveFixesPayload($trackers);

        return $this->ok([
            'fixes' => $fixes,
        ]);
    }

    public function publicLive(Request $request)
    {
        $trackers = CommunityTracker::query()
            ->where('is_public', true)
            ->with('latestFix')
            ->when(
                is_string($request->query('label')) && trim((string) $request->query('label')) !== '',
                fn ($query) => $query->whereRaw('LOWER(label) = ?', [mb_strtolower(trim((string) $request->query('label')))])
            )
            ->orderBy('label')
            ->get();

        return $this->ok([
            'fixes' => $this->buildLiveFixesPayload($trackers),
        ]);
    }

    public function publicHistory(Request $request)
    {
        $limit = max(1, min(5000, (int) $request->query('limit', 1200)));

        $since = null;
        $sinceRaw = $request->query('since');
        if (is_string($sinceRaw) && trim($sinceRaw) !== '') {
            try {
                $since = CarbonImmutable::parse($sinceRaw)->utc();
            } catch (\Throwable) {
                $since = null;
            }
        }

        $trackers = CommunityTracker::query()
            ->where('is_public', true)
            ->when(
                is_string($request->query('label')) && trim((string) $request->query('label')) !== '',
                fn ($query) => $query->whereRaw('LOWER(label) = ?', [mb_strtolower(trim((string) $request->query('label')))])
            )
            ->with([
                'fixes' => function ($query) use ($since, $limit): void {
                    if ($since) {
                        $query->where('observed_at', '>=', $since->toDateTimeString());
                    }

                    // Fetch latest N then re-sort ascending in payload for path rendering.
                    $query->orderByDesc('observed_at')->limit($limit);
                },
            ])
            ->orderBy('label')
            ->get();

        $rows = $trackers
            ->map(function (CommunityTracker $tracker): array {
                /** @var Collection<int, TrackerFix> $fixes */
                $fixes = $tracker->fixes->sortBy('observed_at')->values();

                return [
                    'tracker_id' => $tracker->id,
                    'label' => $tracker->label,
                    'color' => $tracker->color,
                    'is_public' => $tracker->is_public,
                    'source' => 'garmin_mapshare',
                    'points' => $fixes
                        ->map(fn (TrackerFix $fix): array => [
                            'lat' => $fix->lat,
                            'lon' => $fix->lon,
                            'mile' => $fix->mile,
                            'observed_at' => $fix->observed_at->toISOString(),
                        ])
                        ->all(),
                ];
            })
            ->filter(fn (array $row): bool => ! empty($row['points']))
            ->values()
            ->all();

        return $this->ok([
            'trackers' => $rows,
        ]);
    }

    /**
     * @param Collection<int, CommunityTracker> $trackers
     * @return array<int, array{tracker_id:string,label:string,color:string|null,is_public:bool,lat:float,lon:float,mile:float|null,observed_at:string,source:string}>
     */
    private function buildLiveFixesPayload(Collection $trackers): array
    {
        return $trackers
            ->filter(fn (CommunityTracker $tracker): bool => (bool) $tracker->latestFix)
            ->map(function (CommunityTracker $tracker): array {
                return [
                    'tracker_id' => $tracker->id,
                    'label' => $tracker->label,
                    'color' => $tracker->color,
                    'is_public' => (bool) $tracker->is_public,
                    'lat' => $tracker->latestFix->lat,
                    'lon' => $tracker->latestFix->lon,
                    'mile' => $tracker->latestFix->mile,
                    'observed_at' => $tracker->latestFix->observed_at->toISOString(),
                    'source' => 'garmin_mapshare',
                ];
            })
            ->values()
            ->all();
    }
}
