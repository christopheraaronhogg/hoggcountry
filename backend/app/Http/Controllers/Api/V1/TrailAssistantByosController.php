<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\TrailAssistantByosEntitlementService;
use App\Support\TrailAssistantByosProviderRegistry;
use Illuminate\Http\Request;

class TrailAssistantByosController extends ApiController
{
    public function providers(TrailAssistantByosProviderRegistry $registry)
    {
        return $this->ok([
            'default_provider' => $registry->defaultProviderId(),
            'providers' => array_values($registry->all()),
        ]);
    }

    public function entitlementPreview(
        Request $request,
        TrailAssistantByosProviderRegistry $registry,
        TrailAssistantByosEntitlementService $entitlements,
    ) {
        $validated = $request->validate([
            'provider' => ['nullable', 'string', 'max:80'],
            'credentials' => ['nullable', 'array'],
            'credentials.api_key' => ['nullable', 'string', 'max:512'],
        ]);

        $provider = is_string($validated['provider'] ?? null)
            ? trim((string) $validated['provider'])
            : $registry->defaultProviderId();

        $credentials = is_array($validated['credentials'] ?? null)
            ? $validated['credentials']
            : [];

        $entitlement = $entitlements->evaluate($provider, $credentials);

        return $this->ok([
            'default_provider' => $registry->defaultProviderId(),
            'entitlement' => $entitlement->toArray(),
            'credentials_summary' => $this->credentialsSummary($credentials),
            'preview_mode' => [
                'stored' => false,
                'note' => 'Credentials are evaluated only for this request and are not persisted.',
            ],
        ]);
    }

    /**
     * @param array<string, mixed> $credentials
     * @return array<string, mixed>
     */
    private function credentialsSummary(array $credentials): array
    {
        $apiKey = is_string($credentials['api_key'] ?? null)
            ? trim((string) $credentials['api_key'])
            : '';

        return [
            'api_key_present' => $apiKey !== '',
            'api_key_length' => $apiKey === '' ? 0 : strlen($apiKey),
            'api_key_hint' => $this->maskApiKey($apiKey),
        ];
    }

    private function maskApiKey(string $apiKey): ?string
    {
        if ($apiKey === '') {
            return null;
        }

        if (strlen($apiKey) <= 8) {
            return str_repeat('*', strlen($apiKey));
        }

        return substr($apiKey, 0, 4).'…'.substr($apiKey, -4);
    }
}
