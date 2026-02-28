<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantMapReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_feed_is_accessible_but_write_requires_authentication(): void
    {
        $this->getJson('/api/v1/trail-assistant/map-reports/public')
            ->assertOk()
            ->assertJsonPath('error', null);

        $this->postJson('/api/v1/trail-assistant/map-reports', [
            'lat' => 35.1,
            'lon' => -83.1,
            'kind' => 'tree_down',
        ])->assertUnauthorized();
    }

    public function test_unverified_report_is_created_but_hidden_from_public_feed(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('map-report')->plainTextToken;

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/map-reports', [
                'lat' => 35.611,
                'lon' => -83.489,
                'mile_marker' => 243.4,
                'kind' => 'tree_down',
                'severity' => 'danger',
                'message' => 'Large tree across trail just north of shelter.',
            ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.report.verification', 'unverified')
            ->assertJsonPath('data.report.status', 'active');

        $public = $this->getJson('/api/v1/trail-assistant/map-reports/public');
        $public->assertOk()->assertJsonCount(0, 'data.reports');
    }

    public function test_trusted_report_can_appear_on_public_feed(): void
    {
        $user = User::factory()->create();
        Config::set('trail_assistant.map_reports.trusted_user_ids', [$user->id]);

        $token = $user->createToken('map-report')->plainTextToken;

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/map-reports', [
                'lat' => 35.711,
                'lon' => -83.589,
                'mile_marker' => 250.1,
                'kind' => 'bridge_out',
                'severity' => 'caution',
                'message' => 'Footbridge washed out; use creek crossing downstream.',
            ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.report.verification', 'trusted');

        $public = $this->getJson('/api/v1/trail-assistant/map-reports/public');
        $public
            ->assertOk()
            ->assertJsonCount(1, 'data.reports')
            ->assertJsonPath('data.reports.0.kind', 'bridge_out');
    }

    public function test_idempotency_key_replays_same_map_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('map-report')->plainTextToken;

        $payload = [
            'lat' => 35.811,
            'lon' => -83.689,
            'kind' => 'weather_hazard',
            'severity' => 'danger',
            'message' => 'Lightning nearby on exposed ridge.',
        ];

        $first = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'Idempotency-Key' => 'map-report-123',
        ])->postJson('/api/v1/trail-assistant/map-reports', $payload);

        $first->assertCreated();
        $firstId = $first->json('data.report.report_id');

        $second = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'Idempotency-Key' => 'map-report-123',
        ])->postJson('/api/v1/trail-assistant/map-reports', $payload);

        $second
            ->assertOk()
            ->assertJsonPath('data.report.report_id', $firstId)
            ->assertJsonPath('data.idempotent_replay', true);
    }

    public function test_moderator_can_promote_unverified_report_with_audit_trail(): void
    {
        $reporter = User::factory()->create();

        $moderator = User::factory()->create([
            'email' => 'christopheraaronhogg@gmail.com',
        ]);

        Sanctum::actingAs($reporter);

        $create = $this->postJson('/api/v1/trail-assistant/map-reports', [
            'lat' => 35.455,
            'lon' => -83.501,
            'kind' => 'trail_closed',
            'severity' => 'danger',
            'message' => 'Flooding near crossing, reroute needed.',
        ]);

        $create->assertCreated()->assertJsonPath('data.report.verification', 'unverified');
        $reportId = (string) $create->json('data.report.report_id');

        Sanctum::actingAs($moderator);

        $verify = $this->postJson("/api/v1/trail-assistant/map-reports/{$reportId}/verify", [
            'target_verification' => 'moderator_verified',
            'note' => 'Cross-checked with second report and local ranger update.',
        ]);

        $verify
            ->assertOk()
            ->assertJsonPath('data.report.verification', 'moderator_verified')
            ->assertJsonPath('data.audit_event.action', 'verification_promoted');

        $this->assertDatabaseHas('trail_assistant_map_report_audits', [
            'report_id' => $reportId,
            'action' => 'verification_promoted',
            'from_verification' => 'unverified',
            'to_verification' => 'moderator_verified',
            'actor_user_id' => $moderator->id,
        ]);

        $this->getJson('/api/v1/trail-assistant/map-reports/public')
            ->assertOk()
            ->assertJsonCount(1, 'data.reports')
            ->assertJsonPath('data.reports.0.report_id', $reportId);
    }

    public function test_non_moderator_cannot_promote_report_verification(): void
    {
        $reporter = User::factory()->create();
        $otherUser = User::factory()->create();

        Sanctum::actingAs($reporter);

        $create = $this->postJson('/api/v1/trail-assistant/map-reports', [
            'lat' => 35.515,
            'lon' => -83.411,
            'kind' => 'tree_down',
            'message' => 'Another blockage near switchback.',
        ]);

        $create->assertCreated();
        $reportId = (string) $create->json('data.report.report_id');

        Sanctum::actingAs($otherUser);

        $this->postJson("/api/v1/trail-assistant/map-reports/{$reportId}/verify", [
            'target_verification' => 'trusted',
            'note' => 'I should not be allowed to promote this report.',
        ])->assertStatus(403);

        $this->assertDatabaseMissing('trail_assistant_map_report_audits', [
            'report_id' => $reportId,
            'action' => 'verification_promoted',
        ]);
    }
}
