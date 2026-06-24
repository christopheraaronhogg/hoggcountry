<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NpsProxyApiTest extends TestCase
{
    public function test_nps_proxy_requires_server_side_api_key(): void
    {
        config()->set('services.nps.api_key', '');

        Http::fake();

        $response = $this->getJson('/api/v1/nps/parks?parkCode=acad');

        $response->assertStatus(503);
        $response->assertJsonPath('error.code', 'nps_api_key_missing');

        Http::assertNothingSent();
    }

    public function test_nps_proxy_sends_key_as_header_without_forwarding_query_key(): void
    {
        config()->set('services.nps.api_key', 'test-nps-key');
        config()->set('services.nps.base_url', 'https://developer.nps.gov/api/v1');

        Http::fake([
            'https://developer.nps.gov/api/v1/parks*' => Http::response([
                'total' => '1',
                'data' => [
                    [
                        'parkCode' => 'acad',
                        'fullName' => 'Acadia National Park',
                    ],
                ],
            ], 200, [
                'X-RateLimit-Limit' => '1000',
                'X-RateLimit-Remaining' => '999',
            ]),
        ]);

        $response = $this->getJson('/api/v1/nps/parks?parkCode=acad&limit=1&api_key=do-not-forward');

        $response->assertOk();
        $response->assertJsonPath('data.source', 'nps');
        $response->assertJsonPath('data.resource', 'parks');
        $response->assertJsonPath('data.payload.data.0.parkCode', 'acad');
        $response->assertJsonPath('meta.rate_limit.remaining', '999');

        Http::assertSent(function ($request): bool {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            return $request->url() === 'https://developer.nps.gov/api/v1/parks?parkCode=acad&limit=1'
                && $request->hasHeader('X-Api-Key', 'test-nps-key')
                && ! $request->hasHeader('Authorization')
                && ! array_key_exists('api_key', $query);
        });
    }

    public function test_nps_proxy_limits_supported_resources(): void
    {
        config()->set('services.nps.api_key', 'test-nps-key');

        Http::fake();

        $response = $this->getJson('/api/v1/nps/users');

        $response->assertStatus(404);
        $response->assertJsonPath('error.code', 'nps_resource_not_supported');

        Http::assertNothingSent();
    }
}
