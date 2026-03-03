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

    public function test_openai_api_key_provider_is_active_when_key_is_present(): void
    {
        $service = new TrailAssistantByosEntitlementService($this->registry());

        $entitlement = $service->evaluate('openai_api_key', [
            'api_key' => 'sk-demo-super-long-key-value-for-tests',
        ]);

        $this->assertSame('active', $entitlement->status);
        $this->assertSame('api_key_present', $entitlement->reason);
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
            'openai_api_key' => [
                'label' => 'OpenAI API key',
                'enabled' => true,
                'auth_mode' => 'api_key',
                'funding_model' => 'user_api_payg',
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
