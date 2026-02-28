<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TrailAssistantMapVisibilityApiTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_default_private_scope_keeps_checkins_out_of_public_map_feed(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('map-visibility-default')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 34.123456,
                'lon' => -83.222233,
                'mile_marker' => 101.2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.checkin.share_scope', 'private');

        $this->getJson('/api/v1/trail-assistant/map-sharing/public')
            ->assertOk()
            ->assertJsonCount(0, 'data.checkins');
    }

    public function test_public_sharing_can_use_coarse_location_and_delay(): void
    {
        Carbon::setTestNow('2026-02-27 10:00:00');

        $user = User::factory()->create();
        $token = $user->createToken('map-visibility-public')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/trail-assistant/map-sharing/settings', [
                'share_scope' => 'public',
                'location_mode' => 'coarse',
                'visibility_delay_minutes' => 45,
            ])
            ->assertOk()
            ->assertJsonPath('data.settings.share_scope', 'public')
            ->assertJsonPath('data.settings.location_mode', 'coarse')
            ->assertJsonPath('data.settings.visibility_delay_minutes', 45);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 34.123456,
                'lon' => -83.222233,
                'mile_marker' => 150.5,
                'observed_at' => now()->toISOString(),
            ])
            ->assertCreated();

        $this->getJson('/api/v1/trail-assistant/map-sharing/public')
            ->assertOk()
            ->assertJsonCount(0, 'data.checkins');

        Carbon::setTestNow(now()->addMinutes(46));

        $this->getJson('/api/v1/trail-assistant/map-sharing/public')
            ->assertOk()
            ->assertJsonCount(1, 'data.checkins')
            ->assertJsonPath('data.checkins.0.precision', 'coarse')
            ->assertJsonPath('data.checkins.0.lat', 34.12)
            ->assertJsonPath('data.checkins.0.lon', -83.22);
    }

    public function test_trusted_scope_visible_to_authenticated_feed_but_not_public_feed(): void
    {
        $reporter = User::factory()->create();
        $reporterToken = $reporter->createToken('map-visibility-trusted-reporter')->plainTextToken;

        $viewer = User::factory()->create();
        $viewerToken = $viewer->createToken('map-visibility-trusted-viewer')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$reporterToken}")
            ->putJson('/api/v1/trail-assistant/map-sharing/settings', [
                'share_scope' => 'trusted',
                'location_mode' => 'exact',
                'visibility_delay_minutes' => 0,
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$reporterToken}")
            ->postJson('/api/v1/trail-assistant/checkins', [
                'lat' => 35.234567,
                'lon' => -83.334455,
                'mile_marker' => 211.2,
            ])
            ->assertCreated();

        $this->getJson('/api/v1/trail-assistant/map-sharing/public')
            ->assertOk()
            ->assertJsonCount(0, 'data.checkins');

        $this->withHeader('Authorization', "Bearer {$viewerToken}")
            ->getJson('/api/v1/trail-assistant/map-sharing/feed')
            ->assertOk()
            ->assertJsonCount(1, 'data.checkins')
            ->assertJsonPath('data.checkins.0.share_scope', 'trusted')
            ->assertJsonPath('data.checkins.0.precision', 'exact')
            ->assertJsonPath('data.checkins.0.lat', 35.234567);
    }
}
