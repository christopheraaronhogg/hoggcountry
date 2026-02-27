<?php

namespace Tests\Feature\Api\V1;

use App\Models\TrailAssistantIntake;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrailAssistantOpsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_plan_catalog_endpoint_returns_subscription_scaffold(): void
    {
        $response = $this->getJson('/api/v1/trail-assistant/plans');

        $response
            ->assertOk()
            ->assertJsonPath('data.stripe_wiring', 'deferred')
            ->assertJsonPath('data.currency', 'usd')
            ->assertJsonCount(3, 'data.plans')
            ->assertJsonPath('error', null);
    }

    public function test_triage_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/trail-assistant/intakes')
            ->assertUnauthorized();

        $this->getJson('/api/v1/trail-assistant/intakes/export.csv')
            ->assertUnauthorized();
    }

    public function test_authenticated_triage_list_and_export_return_filtered_records(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_opsvisible01',
            'route_label' => 'on-trail',
            'source' => 'chat',
            'name' => 'Trail User',
            'email' => 'trail@example.com',
            'subject' => 'Need storm contingency',
            'message' => 'Storm incoming over next pass.',
            'status' => 'new',
            'received_at' => now(),
            'user_id' => $user->id,
        ]);

        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_opshidden01',
            'route_label' => 'pre-trail',
            'source' => 'web_form',
            'name' => 'Prep User',
            'email' => 'prep@example.com',
            'subject' => 'Need gear help',
            'message' => 'Pack and shelter guidance',
            'status' => 'closed',
            'received_at' => now(),
        ]);

        $listResponse = $this->getJson('/api/v1/trail-assistant/intakes?status=new');

        $listResponse
            ->assertOk()
            ->assertJsonPath('data.summary.total_filtered', 1)
            ->assertJsonPath('data.items.0.intake_id', 'ta_opsvisible01')
            ->assertJsonPath('data.items.0.user.id', (string) $user->id);

        $exportResponse = $this->get('/api/v1/trail-assistant/intakes/export.csv?status=new');

        $exportResponse
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $csv = $exportResponse->streamedContent();
        $this->assertStringContainsString('ta_opsvisible01', $csv);
        $this->assertStringNotContainsString('ta_opshidden01', $csv);
    }

    public function test_authenticated_user_can_create_and_read_mobile_checkins(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/v1/trail-assistant/checkins', [
            'lat' => 35.611,
            'lon' => -83.489,
            'mile_marker' => 243.4,
            'battery_percent' => 68,
            'status_note' => 'Leaving shelter after rain break.',
            'source' => 'mobile_app',
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.checkin.mile_marker', 243.4)
            ->assertJsonPath('data.progress.percent_complete', round((243.4 / 2197.4) * 100, 2));

        $latestResponse = $this->getJson('/api/v1/trail-assistant/checkins/latest');

        $latestResponse
            ->assertOk()
            ->assertJsonPath('data.checkin.source', 'mobile_app')
            ->assertJsonPath('data.progress.miles_remaining', 1954);

        $historyResponse = $this->getJson('/api/v1/trail-assistant/checkins/history?limit=10');

        $historyResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.checkins')
            ->assertJsonCount(1, 'data.path')
            ->assertJsonPath('data.path.0.mile_marker', 243.4);
    }
}
