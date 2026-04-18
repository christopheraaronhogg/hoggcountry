<?php

namespace App\Support;

final class TrailAssistantByosEntitlementService
{
    public function __construct(
        private readonly TrailAssistantByosProviderRegistry $registry,
    ) {}

    /**
     * @param array<string, mixed> $credentials
     */
    public function evaluate(string $providerId, array $credentials = []): TrailAssistantByosEntitlement
    {
        $provider = $this->registry->provider($providerId);

        if (! $provider) {
            return new TrailAssistantByosEntitlement(
                provider: $providerId,
                status: 'unsupported',
                reason: 'unknown_provider',
                details: [
                    'message' => 'Provider is not configured in trail_assistant.byos.providers.',
                ],
            );
        }

        if (! ($provider['enabled'] ?? false)) {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'unsupported',
                reason: 'provider_disabled',
                details: $provider,
            );
        }

        $authMode = (string) ($provider['auth_mode'] ?? 'unsupported');

        return match ($authMode) {
            'api_key' => $this->evaluateApiKeyProvider($provider, $credentials),
            'openclaw_local_bridge' => $this->evaluateOpenClawLocalBridgeProvider($provider, $credentials),
            'oauth' => new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'pending_provider_integration',
                reason: 'oauth_flow_not_wired',
                details: $provider,
            ),
            'chatgpt_subscription_passthrough' => new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'unsupported',
                reason: 'chatgpt_subscription_passthrough_unavailable',
                details: $provider,
            ),
            default => new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'unsupported',
                reason: 'unsupported_auth_mode',
                details: $provider,
            ),
        };
    }

    /**
     * @param array<string, mixed> $provider
     * @param array<string, mixed> $credentials
     */
    private function evaluateApiKeyProvider(array $provider, array $credentials): TrailAssistantByosEntitlement
    {
        $apiKey = is_string($credentials['api_key'] ?? null)
            ? trim((string) $credentials['api_key'])
            : '';

        if ($apiKey === '') {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_credentials',
                reason: 'missing_api_key',
                details: $provider,
            );
        }

        if (strlen($apiKey) < 20) {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_credentials',
                reason: 'api_key_too_short',
                details: $provider,
            );
        }

        $requiredPrefix = is_string($provider['api_key_prefix'] ?? null)
            ? trim((string) $provider['api_key_prefix'])
            : '';

        if ($requiredPrefix !== '' && ! str_starts_with($apiKey, $requiredPrefix)) {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_credentials',
                reason: 'api_key_format_invalid',
                details: $provider,
            );
        }

        return new TrailAssistantByosEntitlement(
            provider: $provider['id'],
            status: 'active',
            reason: 'api_key_present',
            details: $provider,
        );
    }

    /**
     * @param array<string, mixed> $provider
     * @param array<string, mixed> $credentials
     */
    private function evaluateOpenClawLocalBridgeProvider(array $provider, array $credentials): TrailAssistantByosEntitlement
    {
        $bridgeUrl = is_string($credentials['bridge_url'] ?? null)
            ? trim((string) $credentials['bridge_url'])
            : '';

        if ($bridgeUrl === '') {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_connector',
                reason: 'missing_local_bridge_url',
                details: $provider,
            );
        }

        if (! filter_var($bridgeUrl, FILTER_VALIDATE_URL)) {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_connector',
                reason: 'local_bridge_url_invalid',
                details: $provider,
            );
        }

        $host = strtolower((string) (parse_url($bridgeUrl, PHP_URL_HOST) ?? ''));
        $loopbackHosts = ['127.0.0.1', 'localhost', '::1'];

        if (! in_array($host, $loopbackHosts, true)) {
            return new TrailAssistantByosEntitlement(
                provider: $provider['id'],
                status: 'needs_connector',
                reason: 'local_bridge_must_be_loopback',
                details: $provider,
            );
        }

        return new TrailAssistantByosEntitlement(
            provider: $provider['id'],
            status: 'active',
            reason: 'local_bridge_configured',
            details: $provider,
        );
    }
}
