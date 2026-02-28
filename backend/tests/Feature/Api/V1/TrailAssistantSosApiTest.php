<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantSosApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sos_escalation_requires_authentication(): void
    {
        $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.1,
            'lon' => -83.1,
            'message' => 'Need emergency support now.',
            'confirm_emergency' => true,
        ])->assertUnauthorized();
    }

    public function test_authenticated_hiker_can_create_sos_and_replay_by_idempotency_key(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'lat' => 35.611,
            'lon' => -83.489,
            'mile_marker' => 243.4,
            'message' => 'Potential hypothermia symptoms and unable to continue safely.',
            'confirm_emergency' => true,
        ];

        $first = $this->postJson('/api/v1/trail-assistant/sos/escalate', $payload, [
            'Idempotency-Key' => 'sos-idempotency-1',
        ]);

        $first
            ->assertCreated()
            ->assertJsonPath('data.escalation.status', 'pending_review')
            ->assertJsonPath('data.idempotent_replay', false);

        $escalationId = (string) $first->json('data.escalation.escalation_id');

        $second = $this->postJson('/api/v1/trail-assistant/sos/escalate', $payload, [
            'Idempotency-Key' => 'sos-idempotency-1',
        ]);

        $second
            ->assertOk()
            ->assertJsonPath('data.escalation.escalation_id', $escalationId)
            ->assertJsonPath('data.idempotent_replay', true)
            ->assertJsonPath('data.duplicate_guard', 'idempotency_key');

        $this->assertDatabaseCount('trail_assistant_sos_escalations', 1);
    }

    public function test_sos_escalation_enforces_cooldown_between_distinct_requests(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.601,
            'lon' => -83.401,
            'message' => 'Injury from fall and cannot bear weight.',
            'confirm_emergency' => true,
        ])->assertCreated();

        $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.602,
            'lon' => -83.402,
            'message' => 'Weather deteriorated, stuck and need immediate extraction advice.',
            'confirm_emergency' => true,
        ])
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'sos_cooldown_active');
    }

    public function test_sos_queue_scope_and_status_updates_require_moderator_guard(): void
    {
        $hiker = User::factory()->create();
        Sanctum::actingAs($hiker);

        $create = $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.701,
            'lon' => -83.301,
            'message' => 'Lost footing near exposed section and need urgent rescue guidance.',
            'confirm_emergency' => true,
        ]);

        $create->assertCreated();
        $escalationId = (string) $create->json('data.escalation.escalation_id');

        $nonModerator = User::factory()->create();
        Sanctum::actingAs($nonModerator);

        $this->getJson('/api/v1/trail-assistant/sos/escalations?scope=queue')
            ->assertStatus(403);

        $moderator = User::factory()->create(['email' => 'christopheraaronhogg@gmail.com']);
        Sanctum::actingAs($moderator);

        $this->getJson('/api/v1/trail-assistant/sos/escalations?scope=queue')
            ->assertOk()
            ->assertJsonCount(1, 'data.escalations')
            ->assertJsonPath('data.escalations.0.escalation_id', $escalationId);

        $this->postJson("/api/v1/trail-assistant/sos/escalations/{$escalationId}/status", [
            'status' => 'acknowledged',
            'note' => 'Responder contacted and triage started.',
        ])
            ->assertOk()
            ->assertJsonPath('data.escalation.status', 'acknowledged');
    }
}
