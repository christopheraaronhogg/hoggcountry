<?php

namespace Tests\Feature\Api\V1;

use App\Models\TrailAssistantIntake;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantIntakeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_intake_endpoint_creates_request_with_route_label(): void
    {
        $response = $this->postJson('/api/v1/trail-assistant/intake', [
            'route_label' => 'pre-trail',
            'source' => 'web_form',
            'name' => 'Kendra Hiker',
            'email' => 'Kendra@example.com',
            'subject' => 'Need a NOBO start-date plan',
            'message' => "I'm planning a NOBO thru-hike and need pacing + shakedown support.",
            'metadata' => [
                'experience_level' => 'new thru-hiker',
                'target_start_month' => 'April',
                'priority_topics' => ['gear', 'resupply'],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.route_label', 'pre-trail')
            ->assertJsonPath('data.source', 'web_form')
            ->assertJsonPath('data.status', 'new')
            ->assertJsonPath('data.idempotent_replay', false)
            ->assertJsonPath('data.duplicate_guard', null)
            ->assertJsonPath('error', null)
            ->assertJsonStructure([
                'data' => [
                    'intake_id',
                    'route_label',
                    'source',
                    'status',
                    'received_at',
                    'routing_labels',
                    'idempotent_replay',
                    'duplicate_guard',
                ],
                'error',
                'meta' => ['request_id'],
            ]);

        $intakeId = $response->json('data.intake_id');
        $this->assertMatchesRegularExpression('/^ta_[a-z0-9]{12}$/', (string) $intakeId);

        $this->assertDatabaseHas('trail_assistant_intakes', [
            'intake_id' => $intakeId,
            'route_label' => 'pre-trail',
            'source' => 'web_form',
            'email' => 'kendra@example.com',
            'subject' => 'Need a NOBO start-date plan',
            'status' => 'new',
        ]);
    }

    public function test_public_intake_endpoint_rejects_unknown_route_label(): void
    {
        $response = $this->postJson('/api/v1/trail-assistant/intake', [
            'route_label' => 'unknown-lane',
            'subject' => 'Need help',
            'message' => 'Please route this.',
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('trail_assistant_intakes', 0);
    }

    public function test_idempotency_key_replay_returns_existing_intake_without_duplication(): void
    {
        $payload = [
            'route_label' => 'on-trail',
            'subject' => 'Need tonight shelter decision',
            'message' => 'Rain rolling in. Need shelter strategy near Standing Bear.',
            'source' => 'chat',
        ];

        $first = $this->withHeader('Idempotency-Key', 'test-key-1')
            ->postJson('/api/v1/trail-assistant/intake', $payload);

        $second = $this->withHeader('Idempotency-Key', 'test-key-1')
            ->postJson('/api/v1/trail-assistant/intake', $payload);

        $first->assertCreated();
        $second
            ->assertOk()
            ->assertJsonPath('data.idempotent_replay', true)
            ->assertJsonPath('data.duplicate_guard', 'idempotency_key');

        $this->assertSame($first->json('data.intake_id'), $second->json('data.intake_id'));
        $this->assertDatabaseCount('trail_assistant_intakes', 1);
    }

    public function test_duplicate_guard_reuses_recent_matching_payload_even_without_key(): void
    {
        $payload = [
            'route_label' => 'pre-trail',
            'subject' => 'Gear shakedown request',
            'message' => 'Can you review my sleep system for a March start?',
            'email' => 'hiker@example.com',
        ];

        $first = $this->postJson('/api/v1/trail-assistant/intake', $payload);
        $second = $this->postJson('/api/v1/trail-assistant/intake', $payload);

        $first->assertCreated();
        $second
            ->assertOk()
            ->assertJsonPath('data.idempotent_replay', false)
            ->assertJsonPath('data.duplicate_guard', 'fingerprint_window');

        $this->assertSame($first->json('data.intake_id'), $second->json('data.intake_id'));
        $this->assertDatabaseCount('trail_assistant_intakes', 1);
    }

    public function test_authenticated_intake_links_user_when_token_provided(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/trail-assistant/intake', [
            'route_label' => 'on-trail',
            'subject' => 'Need resupply pivot',
            'message' => 'I am delayed and need a new town stop plan.',
            'source' => 'chat',
        ]);

        $response->assertCreated();

        $intakeId = (string) $response->json('data.intake_id');
        $intake = TrailAssistantIntake::query()->where('intake_id', $intakeId)->first();

        $this->assertNotNull($intake);
        $this->assertSame($user->id, $intake->user_id);
    }
}
