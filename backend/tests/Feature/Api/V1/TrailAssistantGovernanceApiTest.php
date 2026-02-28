<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantGovernanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_governance_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/trail-assistant/governance/moderation')
            ->assertUnauthorized();

        $this->putJson('/api/v1/trail-assistant/governance/moderation', [])
            ->assertUnauthorized();
    }

    public function test_non_moderator_cannot_access_governance_controls(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/trail-assistant/governance/moderation')
            ->assertStatus(403);

        $this->putJson('/api/v1/trail-assistant/governance/moderation', [
            'moderator_emails' => ['ops@example.com'],
        ])->assertStatus(403);
    }

    public function test_moderator_can_update_controls_and_updates_take_effect(): void
    {
        $moderator = User::factory()->create([
            'email' => 'christopheraaronhogg@gmail.com',
        ]);

        $promotedModerator = User::factory()->create([
            'email' => 'queue.lead@example.com',
        ]);

        $trustedReporter = User::factory()->create();

        Sanctum::actingAs($moderator);

        $this->putJson('/api/v1/trail-assistant/governance/moderation', [
            'moderator_user_ids' => [$promotedModerator->id],
            'moderator_emails' => ['ops-team@example.com'],
            'map_report_trusted_user_ids' => [$trustedReporter->id],
            'map_report_public_visible_verifications' => ['moderator_verified'],
        ])
            ->assertOk()
            ->assertJsonPath('data.governance.controls.moderator_user_ids.0', $promotedModerator->id)
            ->assertJsonPath('data.governance.controls.map_report_trusted_user_ids.0', $trustedReporter->id)
            ->assertJsonPath('data.governance.controls.map_report_public_visible_verifications.0', 'moderator_verified');

        $this->assertDatabaseHas('trail_assistant_governance_settings', [
            'setting_key' => 'moderation_controls',
            'updated_by_user_id' => $moderator->id,
        ]);

        Sanctum::actingAs($promotedModerator);
        $this->getJson('/api/v1/trail-assistant/governance/moderation')
            ->assertOk()
            ->assertJsonPath('data.governance.source', 'database_override');

        Sanctum::actingAs($trustedReporter);

        $create = $this->postJson('/api/v1/trail-assistant/map-reports', [
            'lat' => 35.511,
            'lon' => -83.422,
            'kind' => 'tree_down',
            'severity' => 'danger',
            'message' => 'Fresh blowdown across trail corridor.',
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.report.verification', 'trusted');

        $this->getJson('/api/v1/trail-assistant/map-reports/public')
            ->assertOk()
            ->assertJsonCount(0, 'data.reports');
    }
}
