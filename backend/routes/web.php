<?php

use App\Http\Controllers\PrLadderController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

$buildMeta = static function (): array {
    $build = [
        'api_contract_version' => 2,
        'public_trail_assistant_routes' => true,
        'videohogg_queue_routes' => true,
        'native_shell_route' => true,
        'environment' => app()->environment(),
    ];

    foreach ([
        'sha' => env('APP_BUILD_SHA'),
        'branch' => env('APP_BUILD_BRANCH'),
        'deployed_at' => env('APP_BUILD_TIME'),
    ] as $key => $value) {
        if (filled($value)) {
            $build[$key] = $value;
        }
    }

    return $build;
};

Route::get('/', function () use ($buildMeta) {
    return response()->json([
        'data' => [
            'status' => 'ok',
            'service' => 'hoggcountry-api',
            'health' => '/api/v1/health',
        ],
        'error' => null,
        'meta' => [
            'request_id' => request()->header('x-request-id', (string) Str::uuid()),
            'build' => $buildMeta(),
        ],
    ]);
})->withoutMiddleware([
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    \App\Http\Middleware\HandleInertiaRequests::class,
]);

Route::get('/native', function () {
    return Inertia::render('NativeLanding', [
        'tagline' => 'Trail-native video handoff and live map operations.',
        'build' => [
            'platforms' => ['ios', 'android'],
            'release_channel' => 'alpha',
        ],
    ]);
});

Route::get('/pr-ladder', [PrLadderController::class, 'index'])->name('pr-ladder.index');
Route::post('/pr-ladder', [PrLadderController::class, 'store'])->name('pr-ladder.store');
