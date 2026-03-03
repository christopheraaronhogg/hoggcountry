<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrailAssistantByosApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_provider_capabilities_endpoint_lists_byos_options(): void
    {
        $response = $this->getJson('/api/v1/trail-assistant/byos/providers');

        $response
            ->assertOk()
            ->assertJsonPath('data.default_provider', 'openai_api_key')
            ->assertJsonStructure([
                'data' => [
                    'default_provider',
                    'providers' => [
                        '*' => [
                            'id',
                            'label',
                            'enabled',
                            'auth_mode',
                            'funding_model',
                            'available_models',
                            'notes',
                        ],
                    ],
                ],
                'error',
                'meta' => ['request_id'],
            ]);

        $providers = collect($response->json('data.providers', []))->keyBy('id');

        $this->assertTrue($providers->has('openai_api_key'));
        $this->assertTrue((bool) ($providers['openai_api_key']['enabled'] ?? false));
        $this->assertSame('api_key', $providers['openai_api_key']['auth_mode'] ?? null);

        $this->assertTrue($providers->has('chatgpt_subscription_passthrough'));
        $this->assertFalse((bool) ($providers['chatgpt_subscription_passthrough']['enabled'] ?? true));
    }
}
