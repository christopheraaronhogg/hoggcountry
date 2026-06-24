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

    // OpenAI — powers the web PWA (app.hoggcountry.com), where there's no
    // on-device Gemma engine: Scripture Ask (/scripture/answer) and the Scout
    // answer lane (/scout/ask) both proxy here. The iOS app answers on-device and
    // never hits these. Key is server-side only (Forge env), never in the bundle;
    // with no key both endpoints return 503 and the PWA falls back honestly.
    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'base_url' => rtrim((string) env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),
        'scripture_model' => env('OPENAI_SCRIPTURE_MODEL', 'gpt-4.1-mini'),
        'scout_model' => env('SCOUT_OPENAI_MODEL', 'gpt-4o-mini'),

        // Spend guard: ONLY these emails may spend the key. Defaults to the launch
        // invite (Dad). Comma-separated SCOUT_LLM_ALLOWED_EMAILS overrides. When the
        // list is empty (nothing configured) the gate is inert and any authenticated
        // user passes — so set SCOUT_LAUNCH_INVITE_EMAIL (or this) on Forge.
        'allowed_emails' => array_values(array_filter(array_map(
            static fn (string $email): string => strtolower(trim($email)),
            explode(',', (string) env('SCOUT_LLM_ALLOWED_EMAILS', (string) env('SCOUT_LAUNCH_INVITE_EMAIL', '')))
        ))),

        // Cumulative per-account request budget across a rolling 24h, on top of the
        // per-minute burst throttle. A runaway client or a leaked token can't bill
        // beyond this. Generous for a one-person app; tune down freely.
        'daily_limit' => (int) env('SCOUT_LLM_DAILY_LIMIT', 200),
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

];
