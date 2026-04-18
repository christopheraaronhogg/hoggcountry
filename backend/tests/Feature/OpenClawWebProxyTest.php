<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OpenClawWebProxyTest extends TestCase
{
    public function test_root_returns_api_status_when_proxy_is_disabled(): void
    {
        config()->set('services.openclaw_web.enabled', false);

        $response = $this->getJson('/');

        $response->assertOk();
        $response->assertJsonPath('data.service', 'hoggcountry-api');
        $response->assertJsonPath('data.health', '/api/v1/health');
    }

    public function test_root_proxies_to_openclaw_web_when_enabled(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:3000');

        Http::fake([
            'http://127.0.0.1:3000/' => Http::response('<!doctype html><html><body>Hogg Country</body></html>', 200, [
                'Content-Type' => 'text/html; charset=utf-8',
                'Cache-Control' => 'no-cache',
            ]),
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('Hogg Country', false);
        $response->assertHeader('Content-Type', 'text/html; charset=utf-8');

        Http::assertSent(function ($request) {
            return $request->url() === 'http://127.0.0.1:3000/'
                && $request->hasHeader('x-forwarded-host', 'localhost')
                && $request->hasHeader('x-forwarded-proto', 'http');
        });
    }

    public function test_redirect_responses_are_passed_through_without_following_them(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:3000');

        Http::fake([
            'http://127.0.0.1:3000/track' => Http::response('', 307, [
                'Location' => '/dad/map',
            ]),
        ]);

        $response = $this->get('/track');

        $response->assertStatus(307);
        $response->assertHeader('Location', '/dad/map');
    }

    public function test_api_routes_stay_on_laravel_when_proxy_is_enabled(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:3000');

        Http::fake();

        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertJsonPath('data.service', 'hoggcountry-api');

        Http::assertNothingSent();
    }
}
