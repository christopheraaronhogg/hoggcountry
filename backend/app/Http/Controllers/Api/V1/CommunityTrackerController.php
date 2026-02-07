<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\CommunityTracker;
use Illuminate\Http\Request;

class CommunityTrackerController extends ApiController
{
    public function index(Request $request)
    {
        $trackers = CommunityTracker::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('label')
            ->get();

        return $this->ok([
            'trackers' => $trackers->map(fn (CommunityTracker $tracker): array => $this->trackerPayload($tracker))->all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'garmin_share_id' => ['required', 'string', 'max:160'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $tracker = CommunityTracker::query()->create([
            'user_id' => $request->user()->id,
            'label' => $validated['label'],
            'garmin_share_id' => $validated['garmin_share_id'],
            'color' => $validated['color'] ?? null,
            'is_public' => (bool) ($validated['is_public'] ?? false),
        ]);

        return $this->ok([
            'tracker' => $this->trackerPayload($tracker),
        ], 201);
    }

    public function update(Request $request, string $trackerId)
    {
        $tracker = CommunityTracker::query()
            ->where('id', $trackerId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $tracker) {
            return $this->fail('not_found', 'Tracker not found.', 404);
        }

        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:120'],
            'garmin_share_id' => ['sometimes', 'string', 'max:160'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'is_public' => ['sometimes', 'boolean'],
        ]);

        $tracker->fill($validated);
        $tracker->save();

        return $this->ok([
            'tracker' => $this->trackerPayload($tracker),
        ]);
    }

    public function destroy(Request $request, string $trackerId)
    {
        $tracker = CommunityTracker::query()
            ->where('id', $trackerId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $tracker) {
            return $this->fail('not_found', 'Tracker not found.', 404);
        }

        $tracker->delete();

        return $this->ok([
            'tracker_id' => $trackerId,
            'deleted' => true,
        ]);
    }

    private function trackerPayload(CommunityTracker $tracker): array
    {
        return [
            'id' => $tracker->id,
            'label' => $tracker->label,
            'garmin_share_id' => $tracker->garmin_share_id,
            'color' => $tracker->color,
            'is_public' => $tracker->is_public,
            'created_at' => $tracker->created_at?->toISOString(),
            'updated_at' => $tracker->updated_at?->toISOString(),
        ];
    }
}
