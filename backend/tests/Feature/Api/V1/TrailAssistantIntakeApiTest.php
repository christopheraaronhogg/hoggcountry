<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
            ->assertJsonPath('error', null)
            ->assertJsonStructure([
                'data' => [
                    'intake_id',
                    'route_label',
                    'source',
                    'status',
                    'received_at',
                    'routing_labels',
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
}
