<?php

namespace Tests\Feature\Api\V1;

use App\Models\CommunityTracker;
use App\Models\TrackerFix;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackerPublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_live_returns_only_public_tracker_latest_fixes(): void
    {
        $publicOwner = User::factory()->create();
        $privateOwner = User::factory()->create();

        $publicTracker = CommunityTracker::query()->create([
            'user_id' => $publicOwner->id,
            'label' => 'HoggCountry',
            'garmin_share_id' => 'hoggcountry',
            'color' => '#f97316',
            'is_public' => true,
        ]);

        TrackerFix::query()->create([
            'tracker_id' => $publicTracker->id,
            'lat' => 34.67,
            'lon' => -84.00,
            'mile' => null,
            'observed_at' => '2026-02-07T02:00:00Z',
        ]);
        TrackerFix::query()->create([
            'tracker_id' => $publicTracker->id,
            'lat' => 34.678923,
            'lon' => -84.002301,
            'mile' => null,
            'observed_at' => '2026-02-07T03:00:00Z',
        ]);

        $privateTracker = CommunityTracker::query()->create([
            'user_id' => $privateOwner->id,
            'label' => 'Private Tracker',
            'garmin_share_id' => 'private-id',
            'color' => '#2563eb',
            'is_public' => false,
        ]);

        TrackerFix::query()->create([
            'tracker_id' => $privateTracker->id,
            'lat' => 40.00,
            'lon' => -75.00,
            'mile' => null,
            'observed_at' => '2026-02-07T04:00:00Z',
        ]);

        $response = $this->getJson('/api/v1/trackers/public/live');
        $response->assertOk();

        $fixes = $response->json('data.fixes');
        $this->assertIsArray($fixes);
        $this->assertCount(1, $fixes);

        $this->assertSame('HoggCountry', $fixes[0]['label']);
        $this->assertSame(34.678923, $fixes[0]['lat']);
        $this->assertSame(-84.002301, $fixes[0]['lon']);
    }

    public function test_public_history_returns_filtered_points_sorted_ascending(): void
    {
        $owner = User::factory()->create();

        $hoggTracker = CommunityTracker::query()->create([
            'user_id' => $owner->id,
            'label' => 'HoggCountry',
            'garmin_share_id' => 'hoggcountry',
            'color' => '#f97316',
            'is_public' => true,
        ]);

        TrackerFix::query()->create([
            'tracker_id' => $hoggTracker->id,
            'lat' => 34.600001,
            'lon' => -84.100001,
            'mile' => 5.5,
            'observed_at' => '2026-02-07T01:00:00Z',
        ]);
        TrackerFix::query()->create([
            'tracker_id' => $hoggTracker->id,
            'lat' => 34.650001,
            'lon' => -84.050001,
            'mile' => 6.5,
            'observed_at' => '2026-02-07T02:00:00Z',
        ]);
        TrackerFix::query()->create([
            'tracker_id' => $hoggTracker->id,
            'lat' => 34.700001,
            'lon' => -84.000001,
            'mile' => 7.5,
            'observed_at' => '2026-02-07T03:00:00Z',
        ]);

        $otherTracker = CommunityTracker::query()->create([
            'user_id' => $owner->id,
            'label' => 'Another Tracker',
            'garmin_share_id' => 'another',
            'color' => '#2563eb',
            'is_public' => true,
        ]);

        TrackerFix::query()->create([
            'tracker_id' => $otherTracker->id,
            'lat' => 35.100001,
            'lon' => -83.900001,
            'mile' => 10.0,
            'observed_at' => '2026-02-07T02:30:00Z',
        ]);

        $response = $this->getJson('/api/v1/trackers/public/history?label=hoggcountry&limit=2');
        $response->assertOk();

        $trackers = $response->json('data.trackers');
        $this->assertIsArray($trackers);
        $this->assertCount(1, $trackers);

        $this->assertSame('HoggCountry', $trackers[0]['label']);
        $points = $trackers[0]['points'];
        $this->assertCount(2, $points);

        // limit=2 should keep the latest two points, ordered oldest->newest in payload.
        $this->assertSame('2026-02-07T02:00:00.000000Z', $points[0]['observed_at']);
        $this->assertSame('2026-02-07T03:00:00.000000Z', $points[1]['observed_at']);
    }
}
