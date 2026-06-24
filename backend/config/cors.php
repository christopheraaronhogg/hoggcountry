<?php

// Published to replace Laravel's default `allowed_origins: ['*']` on /api/*.
// Bearer-token auth + supports_credentials:false already mean '*' was not a real
// vulnerability, but pinning origins removes cross-origin replay as a defense-in-
// depth signal. IMPORTANT: the mobile app does NOT use CapacitorHttp, so its
// WebView fetch() IS subject to CORS — the Capacitor scheme origins below must
// stay, or the iOS/Android app loses access to the API. Extra origins can be
// added at runtime via CORS_ALLOWED_ORIGINS (comma-separated) without a deploy.

$envOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_merge([
        'https://hoggcountry.com',
        'https://www.hoggcountry.com',
        'https://app.hoggcountry.com',
        'https://hoggcountry.on-forge.com',
        // Capacitor WebView origins (mobile app fetch is CORS-subject):
        'capacitor://localhost', // iOS default scheme
        'ionic://localhost',     // legacy iOS scheme (defensive)
        'https://localhost',     // Android (androidScheme: 'https')
    ], $envOrigins))),

    'allowed_origins_patterns' => [
        // Local dev servers (Vite / preview) on any port.
        '#^http://localhost(:\d+)?$#',
        '#^http://127\.0\.0\.1(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Stays false: the API is Bearer-token authenticated, not cookie-based.
    'supports_credentials' => false,

];
