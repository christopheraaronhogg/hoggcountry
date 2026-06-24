<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'scout_web' => [
        'enabled' => filter_var(env('SCOUT_WEB_PROXY_ENABLED', env('OPENCLAW_WEB_PROXY_ENABLED', false)), FILTER_VALIDATE_BOOL),
        'origin' => rtrim((string) env('SCOUT_WEB_PROXY_ORIGIN', env('OPENCLAW_WEB_PROXY_ORIGIN', 'http://127.0.0.1:3000')), '/'),
    ],

    'scout_chatgpt_app' => [
        'enabled' => filter_var(env('SCOUT_CHATGPT_APP_PROXY_ENABLED', true), FILTER_VALIDATE_BOOL),
        'origin' => rtrim((string) env('SCOUT_CHATGPT_APP_PROXY_ORIGIN', 'http://127.0.0.1:8788'), '/'),
    ],

    // Cloud Scout answer lane for the PWA (app.hoggcountry.com), where the
    // on-device Gemma engine is unavailable (no Capacitor native plugin in a
    // browser). The key lives server-side ONLY — it must never be shipped in
    // the mobile/PWA bundle. The /api/v1/scout/ask endpoint is auth:sanctum
    // gated, so this lane only answers for invited accounts (Dad).
    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'scout_model' => env('SCOUT_OPENAI_MODEL', 'gpt-4o-mini'),
        'base_url' => rtrim((string) env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),
    ],

];
