<?php

namespace Tests\Feature\Api\V1;

use App\Models\TrailAssistantSosEscalation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantSosApiTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

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

    public function test_sos_idempotency_key_collision_from_another_user_returns_conflict(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();

        Sanctum::actingAs($firstUser);

        $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.611,
            'lon' => -83.489,
            'message' => 'Potential hypothermia symptoms and unable to continue safely.',
            'confirm_emergency' => true,
        ], [
            'Idempotency-Key' => 'shared-sos-key',
        ])->assertCreated();

        Sanctum::actingAs($secondUser);

        $conflict = $this->postJson('/api/v1/trail-assistant/sos/escalate', [
            'lat' => 35.801,
            'lon' => -83.388,
            'message' => 'Injury near stream crossing with mobility impairment.',
            'confirm_emergency' => true,
        ], [
            'Idempotency-Key' => 'shared-sos-key',
        ]);

        $conflict
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'idempotency_key_conflict')
            ->assertJsonMissingPath('data.escalation.escalation_id');

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

    public function test_moderator_queue_scope_includes_operational_visibility_snapshot(): void
    {
        Carbon::setTestNow('2026-02-28 01:00:00');

        $moderator = User::factory()->create(['email' => 'christopheraaronhogg@gmail.com']);
        $hiker = User::factory()->create();

        TrailAssistantSosEscalation::query()->create([
            'escalation_id' => 'sos_pendingops1',
            'user_id' => $hiker->id,
            'lat' => 35.701,
            'lon' => -83.301,
            'message' => 'Need urgent assistance near exposed ridge.',
            'contact_method' => 'sms',
            'status' => 'pending_review',
            'severity' => 'emergency',
            'requires_manual_dispatch' => true,
            'triggered_at' => now()->subMinutes(40),
            'abuse_flags' => ['possible_test_keyword'],
        ]);

        TrailAssistantSosEscalation::query()->create([
            'escalation_id' => 'sos_ackops0001',
            'user_id' => $hiker->id,
            'lat' => 35.801,
            'lon' => -83.401,
            'message' => 'Responder acknowledged but transport still needed.',
            'contact_method' => 'satellite',
            'status' => 'acknowledged',
            'severity' => 'emergency',
            'requires_manual_dispatch' => true,
            'triggered_at' => now()->subMinutes(20),
            'acknowledged_at' => now()->subMinutes(18),
        ]);

        TrailAssistantSosEscalation::query()->create([
            'escalation_id' => 'sos_resolved01',
            'user_id' => $hiker->id,
            'lat' => 35.901,
            'lon' => -83.501,
            'message' => 'Incident resolved earlier today.',
            'contact_method' => 'in_app',
            'status' => 'resolved',
            'severity' => 'emergency',
            'requires_manual_dispatch' => true,
            'triggered_at' => now()->subHours(4),
            'resolved_at' => now()->subHours(3),
            'acknowledged_at' => now()->subHours(4),
        ]);

        Sanctum::actingAs($moderator);

        $response = $this->getJson('/api/v1/trail-assistant/sos/escalations?scope=queue');

        $response
            ->assertOk()
            ->assertJsonPath('data.operations.open_total', 2)
            ->assertJsonPath('data.operations.pending_review', 1)
            ->assertJsonPath('data.operations.acknowledged', 1)
            ->assertJsonPath('data.operations.resolved_last_24h', 1)
            ->assertJsonPath('data.operations.flagged_open', 1)
            ->assertJsonPath('data.operations.oldest_open_age_minutes', 40)
            ->assertJsonPath('data.operations.pending_over_ack_sla', 1)
            ->assertJsonPath('data.operations.contact_method_breakdown.sms', 1)
            ->assertJsonPath('data.operations.contact_method_breakdown.satellite', 1);

        $rows = collect($response->json('data.escalations'));
        $pending = $rows->firstWhere('escalation_id', 'sos_pendingops1');

        $this->assertIsArray($pending);
        $this->assertSame(40, $pending['queue_age_minutes']);
        $this->assertTrue($pending['is_ack_sla_breached']);
        $this->assertFalse($pending['is_resolution_sla_breached']);
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
