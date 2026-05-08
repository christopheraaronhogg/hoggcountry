<?php

namespace Tests\Feature;

use App\Http\Controllers\OpenClawWebProxyController;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use ReflectionMethod;
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

    public function test_post_requests_are_proxied_to_openclaw_web_when_enabled(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:3000');

        Http::fake([
            'http://127.0.0.1:3000/app-api/workspace/initialize' => Http::response('{"ok":true}', 200, [
                'Content-Type' => 'application/json',
            ]),
        ]);

        $response = $this->withHeader('Origin', 'http://localhost')
            ->postJson('/app-api/workspace/initialize', [
                'trailName' => 'Smoke Test',
            ]);

        $response->assertOk();
        $response->assertExactJson([
            'ok' => true,
        ]);

        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->url() === 'http://127.0.0.1:3000/app-api/workspace/initialize'
                && $request->hasHeader('content-type', 'application/json')
                && $request->hasHeader('origin', 'http://localhost')
                && str_contains($request->body(), 'Smoke Test');
        });
    }

    public function test_multipart_requests_are_proxied_to_openclaw_web_when_enabled(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:3000');

        Http::fake([
            'http://127.0.0.1:3000/app-api/workspace/documents' => Http::response('{"ok":true}', 200, [
                'Content-Type' => 'application/json',
            ]),
        ]);

        $response = $this->withHeader('Origin', 'http://localhost')
            ->post('/app-api/workspace/documents', [
                'note' => 'Trail shuttle',
                'files' => UploadedFile::fake()->createWithContent('notes.txt', 'Shuttle number: 555-0100'),
            ]);

        $response->assertOk();
        $response->assertExactJson([
            'ok' => true,
        ]);

        Http::assertSentCount(1);
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

    public function test_app_api_proxy_failures_return_json_instead_of_laravel_error_html(): void
    {
        config()->set('services.openclaw_web.enabled', true);
        config()->set('services.openclaw_web.origin', 'http://127.0.0.1:9');

        $response = $this->withHeaders([
            'Accept' => '*/*',
            'Content-Type' => 'application/json',
        ])->post('/app-api/claw/reply/turn', [
            'message' => 'Where should I camp tonight?',
        ]);

        $response->assertStatus(503);
        $response->assertHeader('Content-Type', 'application/json');
        $response->assertJsonPath('message', 'Scout is temporarily unavailable. Your prompt is still in the composer — please try again in a moment.');
    }

    public function test_turn_event_routes_are_treated_as_streams(): void
    {
        $method = new ReflectionMethod(OpenClawWebProxyController::class, 'shouldProxyAsStream');
        $method->setAccessible(true);
        $controller = new OpenClawWebProxyController();

        $this->assertTrue($method->invoke($controller, 'app-api/claw/reply/stream'));
        $this->assertTrue($method->invoke($controller, 'app-api/claw/reply/turn/abc123/events'));
        $this->assertFalse($method->invoke($controller, 'app-api/claw/reply/turn'));
    }
}
