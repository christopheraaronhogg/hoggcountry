<?php

namespace App\Support;

use Illuminate\Support\Arr;

final class TrailAssistantByosProviderRegistry
{
    /**
     * @var array<string, array<string, mixed>>
     */
    private array $providers;

    /**
     * @param array<string, array<string, mixed>>|null $providers
     */
    public function __construct(?array $providers = null)
    {
        $configured = is_array($providers)
            ? $providers
            : (array) config('trail_assistant.byos.providers', []);

        $this->providers = [];

        foreach ($configured as $providerId => $providerConfig) {
            if (! is_array($providerConfig)) {
                continue;
            }

            $id = $this->normalizeProviderId((string) $providerId);
            if ($id === '') {
                continue;
            }

            $this->providers[$id] = [
                'id' => $id,
                'label' => (string) Arr::get($providerConfig, 'label', $id),
                'enabled' => (bool) Arr::get($providerConfig, 'enabled', false),
                'auth_mode' => (string) Arr::get($providerConfig, 'auth_mode', 'unsupported'),
                'funding_model' => (string) Arr::get($providerConfig, 'funding_model', 'unknown'),
                'api_key_prefix' => (string) Arr::get($providerConfig, 'api_key_prefix', ''),
                'notes' => (string) Arr::get($providerConfig, 'notes', ''),
                'available_models' => array_values(array_filter(
                    (array) Arr::get($providerConfig, 'available_models', []),
                    static fn (mixed $model): bool => is_string($model) && trim($model) !== ''
                )),
            ];
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function all(): array
    {
        return $this->providers;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function provider(string $providerId): ?array
    {
        $id = $this->normalizeProviderId($providerId);

        if ($id === '') {
            return null;
        }

        return $this->providers[$id] ?? null;
    }

    public function defaultProviderId(): string
    {
        $configured = (string) config('trail_assistant.byos.default_provider', '');
        $normalized = $this->normalizeProviderId($configured);

        if ($normalized !== '' && isset($this->providers[$normalized])) {
            return $normalized;
        }

        return array_key_first($this->providers) ?? '';
    }

    private function normalizeProviderId(string $providerId): string
    {
        $normalized = strtolower(trim($providerId));

        return preg_replace('/[^a-z0-9_\-\.]/', '', $normalized) ?? '';
    }
}
