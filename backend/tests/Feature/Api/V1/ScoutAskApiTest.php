<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScoutAskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_scout_ask_requires_authentication(): void
    {
        Http::fake();

        $this->postJson('/api/v1/scout/ask', ['prompt' => 'How far to the next shelter?'])
            ->assertUnauthorized();

        Http::assertNothingSent();
    }

    public function test_authenticated_hiker_gets_a_cloud_answer(): void
    {
        config(['services.openai.key' => 'test-key', 'services.openai.scout_model' => 'gpt-4o-mini']);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    ['message' => ['role' => 'assistant', 'content' => 'Stealth Gap shelter is about 3.2 miles ahead.']],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/scout/ask', [
            'prompt' => 'How far to the next shelter?',
            'payload' => [
                'hiker' => ['trailName' => 'Hogg'],
                'weather' => ['summary' => 'Clear, 60F'],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.answer', 'Stealth Gap shelter is about 3.2 miles ahead.')
            ->assertJsonPath('data.confidence', 'medium')
            ->assertJsonPath('data.contextUsed', ['hiker', 'weather']);

        Http::assertSent(function ($request): bool {
            return str_contains($request->url(), 'api.openai.com')
                && $request->hasHeader('Authorization', 'Bearer test-key')
                && $request['model'] === 'gpt-4o-mini';
        });
    }

    public function test_returns_503_when_cloud_scout_is_not_configured(): void
    {
        config(['services.openai.key' => '']);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);

        Http::fake();

        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertStatus(503)
            ->assertJsonPath('error.code', 'scout_cloud_unconfigured');

        Http::assertNothingSent();
    }

    public function test_returns_502_when_openai_fails(): void
    {
        config(['services.openai.key' => 'test-key']);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);

        Http::fake([
            'api.openai.com/*' => Http::response(['error' => 'overloaded'], 500),
        ]);

        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertStatus(502)
            ->assertJsonPath('error.code', 'scout_cloud_error');
    }

    public function test_prompt_is_required(): void
    {
        config(['services.openai.key' => 'test-key']);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);

        Http::fake();

        $this->postJson('/api/v1/scout/ask', ['prompt' => ''])
            ->assertStatus(422);

        Http::assertNothingSent();
    }

    public function test_only_allowlisted_owner_can_spend_the_key(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.allowed_emails' => ['dad@example.com'],
        ]);
        Http::fake(['api.openai.com/*' => Http::response([
            'choices' => [['message' => ['content' => 'ok']]],
        ], 200)]);

        // A non-owner account is authenticated but blocked at the spend point.
        Sanctum::actingAs(User::factory()->create(['email' => 'stranger@example.com']), ['app', 'llm']);
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'not_authorized');
        Http::assertNothingSent();

        // The owner (case-insensitive) gets through.
        Sanctum::actingAs(User::factory()->create(['email' => 'DAD@example.com']), ['app', 'llm']);
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertOk();
        Http::assertSentCount(1);
    }

    public function test_enforces_a_daily_spend_budget_per_account(): void
    {
        config([
            'services.openai.key' => 'test-key',
            'services.openai.allowed_emails' => [],
            'services.openai.daily_limit' => 2,
        ]);
        Http::fake(['api.openai.com/*' => Http::response([
            'choices' => [['message' => ['content' => 'ok']]],
        ], 200)]);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);

        $this->postJson('/api/v1/scout/ask', ['prompt' => 'q1'])->assertOk();
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'q2'])->assertOk();
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'q3'])
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'daily_limit_reached');

        Http::assertSentCount(2);
    }

    public function test_rejects_an_oversized_payload_without_spending(): void
    {
        config(['services.openai.key' => 'test-key']);
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);
        Http::fake();

        $this->postJson('/api/v1/scout/ask', [
            'prompt' => 'hi',
            'payload' => ['junk' => str_repeat('x', 20000)],
        ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'payload_too_large');

        Http::assertNothingSent();
    }

    public function test_requires_the_llm_token_ability(): void
    {
        config(['services.openai.key' => 'test-key']);
        Http::fake(['api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => 'ok']]]], 200)]);

        // A token scoped without the 'llm' ability cannot reach the paid lane.
        Sanctum::actingAs(User::factory()->create(), ['app']);
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertForbidden();
        Http::assertNothingSent();

        // A token with the ability passes the scope gate.
        Sanctum::actingAs(User::factory()->create(), ['app', 'llm']);
        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])->assertOk();
    }
}
