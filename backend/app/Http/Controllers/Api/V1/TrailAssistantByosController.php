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

    public function decision(TrailAssistantByosProviderRegistry $registry)
    {
        $decision = (array) config('trail_assistant.byos.decision', []);

        return $this->ok([
            'status' => (string) ($decision['status'] ?? 'draft'),
            'last_reviewed_on' => (string) ($decision['last_reviewed_on'] ?? ''),
            'summary' => (string) ($decision['summary'] ?? ''),
            'supported_now' => $this->normalizeDecisionItems(
                $decision['supported_now'] ?? [],
                requireReason: false,
                requireNotes: true,
            ),
            'unsupported_now' => $this->normalizeDecisionItems(
                $decision['unsupported_now'] ?? [],
                requireReason: true,
                requireNotes: false,
            ),
            'sources' => $this->normalizeDecisionSources($decision['sources'] ?? []),
            'provider_states' => array_values($registry->all()),
            'default_provider' => $registry->defaultProviderId(),
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
     * @param mixed $items
     * @return array<int, array<string, string>>
     */
    private function normalizeDecisionItems(mixed $items, bool $requireReason, bool $requireNotes): array
    {
        if (! is_array($items)) {
            return [];
        }

        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $id = trim((string) ($item['id'] ?? ''));
            $label = trim((string) ($item['label'] ?? ''));
            $reason = trim((string) ($item['reason'] ?? ''));
            $notes = trim((string) ($item['notes'] ?? ''));

            if ($id === '' || $label === '') {
                continue;
            }

            $row = [
                'id' => $id,
                'label' => $label,
            ];

            if ($requireReason || $reason !== '') {
                $row['reason'] = $reason;
            }

            if ($requireNotes || $notes !== '') {
                $row['notes'] = $notes;
            }

            $normalized[] = $row;
        }

        return $normalized;
    }

    /**
     * @param mixed $sources
     * @return array<int, array<string, string>>
     */
    private function normalizeDecisionSources(mixed $sources): array
    {
        if (! is_array($sources)) {
            return [];
        }

        $normalized = [];

        foreach ($sources as $source) {
            if (! is_array($source)) {
                continue;
            }

            $label = trim((string) ($source['label'] ?? ''));
            $url = trim((string) ($source['url'] ?? ''));

            if ($label === '' || $url === '') {
                continue;
            }

            $normalized[] = [
                'label' => $label,
                'url' => $url,
            ];
        }

        return $normalized;
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
