<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\CommunityTracker;
use Illuminate\Http\Request;

class TrackerLiveController extends ApiController
{
    public function index(Request $request)
    {
        $trackers = CommunityTracker::query()
            ->where('user_id', $request->user()->id)
            ->with('latestFix')
            ->orderBy('label')
            ->get();

        $fixes = $trackers
            ->filter(fn (CommunityTracker $tracker): bool => (bool) $tracker->latestFix)
            ->map(function (CommunityTracker $tracker): array {
                return [
                    'tracker_id' => $tracker->id,
                    'label' => $tracker->label,
                    'lat' => $tracker->latestFix->lat,
                    'lon' => $tracker->latestFix->lon,
                    'mile' => $tracker->latestFix->mile,
                    'observed_at' => $tracker->latestFix->observed_at->toISOString(),
                    'source' => 'garmin_mapshare',
                ];
            })
            ->values()
            ->all();

        return $this->ok([
            'fixes' => $fixes,
        ]);
    }
}
