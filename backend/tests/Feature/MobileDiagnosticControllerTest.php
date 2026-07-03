<?php

namespace Tests\Feature;

use App\Models\MobileDiagnostic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileDiagnosticControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_diagnostic_can_be_stored_without_authentication(): void
    {
        $response = $this->postJson('/api/v1/mobile/diagnostics', [
            'event_id' => 'evt_test_1',
            'install_id' => 'install_dad_phone',
            'session_id' => 'session_1',
            'category' => 'scout',
            'name' => 'ask_failed',
            'severity' => 'error',
            'occurred_at' => '2026-07-03T12:00:00Z',
            'app_version' => '1.0',
            'app_build' => '39',
            'platform' => 'ios',
            'native' => true,
            'context' => [
                'phase' => 'provider_generate',
                'prompt' => 'Where am I sleeping tonight?',
                'lat' => 42.123456,
                'error_summary' => 'engine boom',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.ok', true);

        $diagnostic = MobileDiagnostic::query()->firstOrFail();
        $this->assertSame('install_dad_phone', $diagnostic->install_id);
        $this->assertSame('scout', $diagnostic->category);
        $this->assertSame('ask_failed', $diagnostic->name);
        $this->assertSame('ios', $diagnostic->platform);
        $this->assertTrue($diagnostic->native);
        $this->assertSame('[redacted]', $diagnostic->context['prompt']);
        $this->assertSame('[redacted]', $diagnostic->context['lat']);
        $this->assertSame('engine boom', $diagnostic->context['error_summary']);
    }

    public function test_mobile_diagnostic_event_id_is_idempotent(): void
    {
        $payload = [
            'event_id' => 'evt_duplicate',
            'install_id' => 'install_dad_phone',
            'category' => 'scout',
            'name' => 'ask_started',
            'severity' => 'info',
        ];

        $this->postJson('/api/v1/mobile/diagnostics', $payload)->assertCreated();
        $this->postJson('/api/v1/mobile/diagnostics', $payload)
            ->assertOk()
            ->assertJsonPath('data.duplicate', true);

        $this->assertSame(1, MobileDiagnostic::query()->count());
    }

    public function test_mobile_diagnostic_rejects_invalid_shape(): void
    {
        $this->postJson('/api/v1/mobile/diagnostics', [
            'install_id' => 'install_dad_phone',
            'category' => 'scout',
            'name' => 'ask_failed',
            'severity' => 'fatal',
        ])->assertUnprocessable()
            ->assertJsonPath('error.code', 'mobile_diagnostics_invalid');
    }
}
