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

    public function test_entitlement_preview_returns_needs_credentials_without_echoing_raw_api_key(): void
    {
        $response = $this->postJson('/api/v1/trail-assistant/byos/entitlement-preview', [
            'provider' => 'openai_api_key',
            'credentials' => [],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.entitlement.provider', 'openai_api_key')
            ->assertJsonPath('data.entitlement.status', 'needs_credentials')
            ->assertJsonPath('data.entitlement.reason', 'missing_api_key')
            ->assertJsonPath('data.credentials_summary.api_key_present', false)
            ->assertJsonPath('data.credentials_summary.api_key_length', 0)
            ->assertJsonPath('data.preview_mode.stored', false);
    }

    public function test_entitlement_preview_marks_openai_provider_active_for_valid_key_shape(): void
    {
        $apiKey = 'sk-demo-proof-12345678901234567890';

        $response = $this->postJson('/api/v1/trail-assistant/byos/entitlement-preview', [
            'provider' => 'openai_api_key',
            'credentials' => [
                'api_key' => $apiKey,
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.entitlement.provider', 'openai_api_key')
            ->assertJsonPath('data.entitlement.status', 'active')
            ->assertJsonPath('data.entitlement.reason', 'api_key_present')
            ->assertJsonPath('data.credentials_summary.api_key_present', true)
            ->assertJsonPath('data.credentials_summary.api_key_length', strlen($apiKey));

        $hint = (string) $response->json('data.credentials_summary.api_key_hint');

        $this->assertNotEmpty($hint);
        $this->assertStringNotContainsString($apiKey, json_encode($response->json()));
    }

    public function test_entitlement_preview_flags_invalid_key_format_for_openai_provider(): void
    {
        $response = $this->postJson('/api/v1/trail-assistant/byos/entitlement-preview', [
            'provider' => 'openai_api_key',
            'credentials' => [
                'api_key' => 'not-openai-prefix-12345678901234567890',
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.entitlement.status', 'needs_credentials')
            ->assertJsonPath('data.entitlement.reason', 'api_key_format_invalid');
    }
}
