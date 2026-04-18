<?php

use App\Http\Controllers\OpenClawWebProxyController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

Route::get('/', [OpenClawWebProxyController::class, 'root'])->withoutMiddleware([
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

Route::match(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], '/{path}', [OpenClawWebProxyController::class, 'show'])
    ->where('path', '^(?!api(?:/|$)|up(?:/|$)|native(?:/|$)).+')
    ->withoutMiddleware([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \App\Http\Middleware\HandleInertiaRequests::class,
    ]);
