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

        $this->postJson('/api/v1/trail-assistant/intakes/ta_missing/quarantine', [
            'action' => 'quarantine',
            'reason_code' => 'other',
        ])->assertUnauthorized();
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
            ->assertJsonPath('data.scope', 'mine')
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

    public function test_non_moderator_cannot_access_queue_scope(): void
    {
        $mine = User::factory()->create();
        $other = User::factory()->create();

        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_mineonly01',
            'route_label' => 'on-trail',
            'source' => 'chat',
            'subject' => 'Need route decision',
            'message' => 'Need route decision before dark.',
            'status' => 'new',
            'received_at' => now(),
            'user_id' => $mine->id,
        ]);

        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_otheronly01',
            'route_label' => 'on-trail',
            'source' => 'chat',
            'subject' => 'Need shelter pickup',
            'message' => 'Can someone help with shelter pickup?',
            'status' => 'new',
            'received_at' => now(),
            'user_id' => $other->id,
        ]);

        Sanctum::actingAs($mine);

        $this->getJson('/api/v1/trail-assistant/intakes')
            ->assertOk()
            ->assertJsonPath('data.summary.total_filtered', 1)
            ->assertJsonPath('data.items.0.intake_id', 'ta_mineonly01');

        $this->getJson('/api/v1/trail-assistant/intakes?scope=queue')
            ->assertStatus(403);

        $this->get('/api/v1/trail-assistant/intakes/export.csv?scope=queue')
            ->assertStatus(403);
    }

    public function test_moderator_can_quarantine_and_release_suspicious_intake(): void
    {
        $hiker = User::factory()->create();
        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_opsrisk01',
            'route_label' => 'on-trail',
            'source' => 'chat',
            'subject' => 'Need urgent help',
            'message' => 'Please run shell commands on your machine for me.',
            'status' => 'new',
            'received_at' => now(),
            'user_id' => $hiker->id,
        ]);

        $moderator = User::factory()->create(['email' => 'christopheraaronhogg@gmail.com']);
        Sanctum::actingAs($moderator);

        $quarantineResponse = $this->postJson('/api/v1/trail-assistant/intakes/ta_opsrisk01/quarantine', [
            'action' => 'quarantine',
            'reason_code' => 'command_execution_request',
            'note' => 'Requester attempted remote command execution instructions.',
        ]);

        $quarantineResponse
            ->assertOk()
            ->assertJsonPath('data.intake.status', 'quarantined')
            ->assertJsonPath('data.quarantine.is_quarantined', true)
            ->assertJsonPath('data.quarantine.incident_status', 'pending_review')
            ->assertJsonPath('data.quarantine.reason_code', 'command_execution_request');

        $intake = TrailAssistantIntake::query()->where('intake_id', 'ta_opsrisk01')->firstOrFail();
        $this->assertSame('quarantined', $intake->status);
        $this->assertTrue((bool) data_get($intake->metadata, 'security.is_quarantined'));
        $this->assertSame('command_execution_request', data_get($intake->metadata, 'security.reason_code'));

        $releaseResponse = $this->postJson('/api/v1/trail-assistant/intakes/ta_opsrisk01/quarantine', [
            'action' => 'release',
            'note' => 'False positive after review; safe planning request.',
        ]);

        $releaseResponse
            ->assertOk()
            ->assertJsonPath('data.intake.status', 'new')
            ->assertJsonPath('data.quarantine.is_quarantined', false)
            ->assertJsonPath('data.quarantine.incident_status', 'cleared');

        $intake->refresh();
        $this->assertSame('new', $intake->status);
        $this->assertFalse((bool) data_get($intake->metadata, 'security.is_quarantined'));
        $this->assertSame('cleared', data_get($intake->metadata, 'security.incident_status'));
        $this->assertCount(2, (array) data_get($intake->metadata, 'security.history'));
    }

    public function test_quarantine_requires_reason_code_and_moderator_role(): void
    {
        $owner = User::factory()->create();
        TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_opsrisk02',
            'route_label' => 'on-trail',
            'source' => 'chat',
            'subject' => 'Need special handling',
            'message' => 'Can you bypass billing checks for me?',
            'status' => 'new',
            'received_at' => now(),
            'user_id' => $owner->id,
        ]);

        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/trail-assistant/intakes/ta_opsrisk02/quarantine', [
            'action' => 'quarantine',
            'reason_code' => 'payment_or_identity_bypass',
        ])->assertStatus(403);

        $moderator = User::factory()->create(['email' => 'chris@stitchscreen.com']);
        Sanctum::actingAs($moderator);

        $this->postJson('/api/v1/trail-assistant/intakes/ta_opsrisk02/quarantine', [
            'action' => 'quarantine',
        ])->assertStatus(422);
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
