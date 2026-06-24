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
        Sanctum::actingAs(User::factory()->create());

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
        Sanctum::actingAs(User::factory()->create());

        Http::fake();

        $this->postJson('/api/v1/scout/ask', ['prompt' => 'Where is water?'])
            ->assertStatus(503)
            ->assertJsonPath('error.code', 'scout_cloud_unconfigured');

        Http::assertNothingSent();
    }

    public function test_returns_502_when_openai_fails(): void
    {
        config(['services.openai.key' => 'test-key']);
        Sanctum::actingAs(User::factory()->create());

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
        Sanctum::actingAs(User::factory()->create());

        Http::fake();

        $this->postJson('/api/v1/scout/ask', ['prompt' => ''])
            ->assertStatus(422);

        Http::assertNothingSent();
    }
}
