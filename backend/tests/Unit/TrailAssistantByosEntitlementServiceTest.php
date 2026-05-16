<?php

namespace Tests\Unit;

use App\Support\TrailAssistantByosEntitlementService;
use App\Support\TrailAssistantByosProviderRegistry;
use Tests\TestCase;

class TrailAssistantByosEntitlementServiceTest extends TestCase
{
    public function test_unknown_provider_returns_unsupported_status(): void
    {
        $service = new TrailAssistantByosEntitlementService(new TrailAssistantByosProviderRegistry([]));

        $entitlement = $service->evaluate('missing-provider');

        $this->assertSame('unsupported', $entitlement->status);
        $this->assertSame('unknown_provider', $entitlement->reason);
    }

    public function test_openai_api_key_provider_requires_credentials(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_api_key');

        $this->assertSame('needs_credentials', $entitlement->status);
        $this->assertSame('missing_api_key', $entitlement->reason);
    }

    public function test_openai_api_key_provider_rejects_invalid_prefix(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_api_key', [
            'api_key' => 'demo-super-long-key-value-for-tests',
        ]);

        $this->assertSame('needs_credentials', $entitlement->status);
        $this->assertSame('api_key_format_invalid', $entitlement->reason);
    }

    public function test_openai_api_key_provider_is_active_when_key_is_present(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_api_key', [
            'api_key' => 'sk-demo-super-long-key-value-for-tests',
        ]);

        $this->assertSame('active', $entitlement->status);
        $this->assertSame('api_key_present', $entitlement->reason);
    }

    public function test_chatgpt_local_bridge_requires_loopback_connector_url(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_codex_local_bridge');

        $this->assertSame('needs_connector', $entitlement->status);
        $this->assertSame('missing_local_bridge_url', $entitlement->reason);
    }

    public function test_chatgpt_local_bridge_is_active_when_loopback_connector_is_present(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_codex_local_bridge', [
            'bridge_url' => 'http://127.0.0.1:4318/reply',
        ]);

        $this->assertSame('active', $entitlement->status);
        $this->assertSame('local_bridge_configured', $entitlement->reason);
    }

    public function test_chatgpt_subscription_passthrough_returns_unsupported(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('chatgpt_subscription_passthrough');

        $this->assertSame('unsupported', $entitlement->status);
        $this->assertSame('chatgpt_subscription_passthrough_unavailable', $entitlement->reason);
    }

    private function registry(): TrailAssistantByosProviderRegistry
    {
        return new TrailAssistantByosProviderRegistry([
            'openai_codex_local_bridge' => [
                'label' => 'ChatGPT/Codex local companion',
                'enabled' => true,
                'auth_mode' => 'scout_local_bridge',
                'funding_model' => 'user_subscription_local_companion',
                'available_models' => ['openai-codex/gpt-5.4'],
            ],
            'openai_api_key' => [
                'label' => 'OpenAI API key',
                'enabled' => true,
                'auth_mode' => 'api_key',
                'funding_model' => 'user_api_payg',
                'api_key_prefix' => 'sk-',
                'available_models' => ['gpt-4.1-mini'],
            ],
            'chatgpt_subscription_passthrough' => [
                'label' => 'ChatGPT subscription passthrough',
                'enabled' => true,
                'auth_mode' => 'chatgpt_subscription_passthrough',
                'funding_model' => 'not_available',
            ],
        ]);
    }
}
