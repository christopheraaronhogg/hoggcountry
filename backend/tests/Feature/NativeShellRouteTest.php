<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NativeShellRouteTest extends TestCase
{
    public function test_native_shell_route_renders_inertia_page(): void
    {
        $response = $this->get('/native');

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('NativeLanding')
                ->where('build.release_channel', 'alpha')
                ->where('build.platforms.0', 'ios')
                ->where('build.platforms.1', 'android')
                ->where('tagline', 'Trail-native video handoff and live map operations.')
            );
    }
}
