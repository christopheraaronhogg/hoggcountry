<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class NpsController extends ApiController
{
    private const ALLOWED_RESOURCES = [
        'alerts',
        'campgrounds',
        'events',
        'parks',
        'visitorcenters',
    ];

    public function show(Request $request, string $resource): JsonResponse
    {
        $resource = Str::lower($resource);

        if (! in_array($resource, self::ALLOWED_RESOURCES, true)) {
            return $this->fail('nps_resource_not_supported', 'This NPS resource is not proxied by Hogg Country.', 404, [
                'allowed_resources' => self::ALLOWED_RESOURCES,
            ]);
        }

        $apiKey = trim((string) config('services.nps.api_key', ''));
        if ($apiKey === '') {
            return $this->fail('nps_api_key_missing', 'NPS API access is not configured on this server.', 503);
        }

        try {
            $upstream = Http::baseUrl((string) config('services.nps.base_url'))
                ->acceptJson()
                ->withHeaders([
                    'X-Api-Key' => $apiKey,
                ])
                ->connectTimeout((int) config('services.nps.connect_timeout', 3))
                ->timeout((int) config('services.nps.timeout', 8))
                ->get($resource, $this->forwardedQuery($request));
        } catch (ConnectionException) {
            return $this->fail('nps_api_unavailable', 'NPS API is temporarily unreachable.', 503);
        }

        if ($upstream->unauthorized() || $upstream->forbidden()) {
            return $this->fail('nps_api_rejected', 'NPS API rejected the configured API key.', 502, [
                'upstream_status' => $upstream->status(),
            ]);
        }

        if (! $upstream->successful()) {
            return $this->fail('nps_api_error', 'NPS API returned an error.', 502, [
                'upstream_status' => $upstream->status(),
            ]);
        }

        return $this->ok([
            'source' => 'nps',
            'resource' => $resource,
            'payload' => $upstream->json(),
        ], meta: [
            'rate_limit' => array_filter([
                'limit' => $upstream->header('X-RateLimit-Limit'),
                'remaining' => $upstream->header('X-RateLimit-Remaining'),
            ], static fn (?string $value): bool => $value !== null && $value !== ''),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function forwardedQuery(Request $request): array
    {
        $query = $request->query();

        foreach (array_keys($query) as $key) {
            if (Str::lower((string) $key) === 'api_key') {
                unset($query[$key]);
            }
        }

        return $query;
    }
}
