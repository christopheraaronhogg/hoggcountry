<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrailAssistantCheckinApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_post_checkin_and_fetch_progress(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('trail-checkin-test')->plainTextToken;

        $first = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 34.123456,
                'lon' => -83.222233,
                'mile_marker' => 101.2,
                'battery_percent' => 64,
                'status_note' => 'Feeling strong. Leaving camp now.',
                'source' => 'mobile_app',
                'observed_at' => '2026-02-27T10:15:00Z',
            ]);

        $first
            ->assertCreated()
            ->assertJsonPath('data.checkin.mile_marker', 101.2)
            ->assertJsonPath('data.progress.first_mile_marker', 101.2)
            ->assertJsonPath('data.progress.latest_mile_marker', 101.2)
            ->assertJsonPath('data.progress.miles_since_first_checkin', 0)
            ->assertJsonStructure([
                'data' => [
                    'checkin' => ['checkin_id', 'lat', 'lon', 'mile_marker', 'observed_at'],
                    'progress' => ['at_total_miles', 'first_mile_marker', 'latest_mile_marker', 'percent_of_at_complete'],
                ],
                'error',
                'meta' => ['request_id'],
            ]);

        $second = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 34.223456,
                'lon' => -83.322233,
                'mile_marker' => 108.9,
                'battery_percent' => 52,
                'status_note' => 'Rain coming in but pace is good.',
            ]);

        $second
            ->assertCreated()
            ->assertJsonPath('data.progress.first_mile_marker', 101.2)
            ->assertJsonPath('data.progress.latest_mile_marker', 108.9)
            ->assertJsonPath('data.progress.miles_since_first_checkin', 7.7);

        $progress = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/trail-assistant/progress');

        $progress
            ->assertOk()
            ->assertJsonPath('data.progress.first_mile_marker', 101.2)
            ->assertJsonPath('data.progress.latest_mile_marker', 108.9)
            ->assertJsonPath('data.progress.miles_since_first_checkin', 7.7);
    }

    public function test_checkin_endpoints_require_authentication(): void
    {
        $this->postJson('/api/v1/trail-assistant/checkins', [
            'lat' => 34,
            'lon' => -83,
        ])->assertUnauthorized();

        $this->getJson('/api/v1/trail-assistant/checkins')->assertUnauthorized();
        $this->getJson('/api/v1/trail-assistant/progress')->assertUnauthorized();
    }

    public function test_checkin_validation_rejects_invalid_coordinates(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('trail-checkin-test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 120,
                'lon' => -300,
                'mile_marker' => -50,
            ]);

        $response->assertStatus(422);
    }
}
