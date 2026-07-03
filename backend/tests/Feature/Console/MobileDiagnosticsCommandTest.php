<?php

namespace Tests\Feature\Console;

use App\Models\MobileDiagnostic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MobileDiagnosticsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_diagnostics_command_lists_recent_events(): void
    {
        MobileDiagnostic::query()->create([
            'event_id' => 'evt_console_1',
            'install_id' => 'install_dad_phone',
            'category' => 'scout',
            'name' => 'ask_failed',
            'severity' => 'error',
            'platform' => 'ios',
            'native' => true,
            'context' => [
                'phase' => 'provider_generate',
                'provider' => 'on-device-gemma',
                'error_summary' => 'engine boom',
            ],
        ]);

        $this->artisan('mobile:diagnostics', ['--install' => 'install_dad_phone', '--json' => true])
            ->expectsOutputToContain('ask_failed')
            ->assertExitCode(0);
    }
}
