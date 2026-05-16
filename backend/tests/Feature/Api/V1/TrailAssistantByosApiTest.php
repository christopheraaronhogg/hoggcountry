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

        $this->assertTrue($providers->has('openai_codex_local_bridge'));
        $this->assertTrue((bool) ($providers['openai_codex_local_bridge']['enabled'] ?? false));
        $this->assertSame('scout_local_bridge', $providers['openai_codex_local_bridge']['auth_mode'] ?? null);

        $this->assertTrue($providers->has('openai_api_key'));
        $this->assertTrue((bool) ($providers['openai_api_key']['enabled'] ?? false));
        $this->assertSame('api_key', $providers['openai_api_key']['auth_mode'] ?? null);

        $this->assertTrue($providers->has('chatgpt_subscription_passthrough'));
        $this->assertFalse((bool) ($providers['chatgpt_subscription_passthrough']['enabled'] ?? true));
    }

    public function test_byos_decision_endpoint_returns_supported_and_unsupported_lanes_with_sources(): void
    {
        $response = $this->getJson('/api/v1/trail-assistant/byos/decision');

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.default_provider', 'openai_api_key')
            ->assertJsonPath('data.sources.0.url', 'https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus')
            ->assertJsonStructure([
                'data' => [
                    'status',
                    'last_reviewed_on',
                    'summary',
                    'supported_now' => [
                        '*' => ['id', 'label', 'notes'],
                    ],
                    'unsupported_now' => [
                        '*' => ['id', 'label', 'reason'],
                    ],
                    'sources' => [
                        '*' => ['label', 'url'],
                    ],
                    'provider_states' => [
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

        $supported = collect($response->json('data.supported_now', []))->keyBy('id');
        $unsupported = collect($response->json('data.unsupported_now', []))->keyBy('id');
        $providers = collect($response->json('data.provider_states', []))->keyBy('id');

        $this->assertTrue($supported->has('openai_codex_local_bridge'));
        $this->assertTrue($supported->has('openai_api_key'));
        $this->assertTrue($unsupported->has('chatgpt_subscription_passthrough'));
        $this->assertTrue($unsupported->has('chatgpt_background_delegate'));
        $this->assertTrue((bool) ($providers['openai_codex_local_bridge']['enabled'] ?? false));
        $this->assertTrue((bool) ($providers['openai_api_key']['enabled'] ?? false));
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

    public function test_entitlement_preview_marks_chatgpt_local_bridge_active_when_loopback_url_is_present(): void
    {
        $response = $this->postJson('/api/v1/trail-assistant/byos/entitlement-preview', [
            'provider' => 'openai_codex_local_bridge',
            'credentials' => [
                'bridge_url' => 'http://127.0.0.1:4318/reply',
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.entitlement.provider', 'openai_codex_local_bridge')
            ->assertJsonPath('data.entitlement.status', 'active')
            ->assertJsonPath('data.entitlement.reason', 'local_bridge_configured')
            ->assertJsonPath('data.credentials_summary.bridge_url_present', true)
            ->assertJsonPath('data.credentials_summary.bridge_url_host', '127.0.0.1');
    }
}
