<?php

return [
    'subscription' => [
        'currency' => 'usd',
        'stripe_wiring' => 'deferred',
        'plans' => [
            [
                'id' => 'trail-free',
                'name' => 'Trail Free',
                'interval' => 'month',
                'amount_cents' => 0,
                'stripe_price_id' => null,
                'features' => [
                    'local_first_profile',
                    'manual_gps_checkins',
                    'community_map_view',
                ],
            ],
            [
                'id' => 'trail-assistant-core',
                'name' => 'Trail Assistant Core',
                'interval' => 'month',
                'amount_cents' => 1900,
                'stripe_price_id' => null,
                'features' => [
                    'all_free_features',
                    'priority_chat_support',
                    'weekly_plan_refresh',
                    'private_progress_history',
                ],
            ],
            [
                'id' => 'trail-assistant-guide',
                'name' => 'Trail Assistant Guide+',
                'interval' => 'month',
                'amount_cents' => 3900,
                'stripe_price_id' => null,
                'features' => [
                    'all_core_features',
                    'daily_decision_support',
                    'resupply_memos',
                    'crisis_response_sla',
                ],
            ],
        ],
    ],

    'map_reports' => [
        'kinds' => [
            'tree_down',
            'water_issue',
            'bridge_out',
            'trail_closed',
            'injury_assist',
            'wildlife',
            'weather_hazard',
            'other',
        ],
        'severity' => ['info', 'caution', 'danger', 'emergency'],
        'duplicate_window_minutes' => 120,
        'default_expiry_hours' => 48,
        'public_visible_verifications' => ['trusted', 'moderator_verified'],
        'trusted_user_ids' => [],
        'moderator_user_ids' => [],
        'moderator_emails' => [
            'christopheraaronhogg@gmail.com',
            'chris@stitchscreen.com',
        ],
        'admin_resolver_emails' => [
            'christopheraaronhogg@gmail.com',
            'chris@stitchscreen.com',
        ],
    ],

    'sos' => [
        'cooldown_minutes' => 15,
        'duplicate_window_minutes' => 180,
        'max_requests_per_24h' => 4,
        'contact_methods' => ['in_app', 'sms', 'satellite'],
        'moderator_user_ids' => [],
        'moderator_emails' => [
            'christopheraaronhogg@gmail.com',
            'chris@stitchscreen.com',
        ],
        'ops' => [
            'ack_sla_minutes' => 15,
            'resolution_sla_minutes' => 180,
        ],
    ],

    'map_sharing' => [
        'scopes' => ['private', 'trusted', 'public'],
        'location_modes' => ['exact', 'coarse'],
        'default_scope' => 'private',
        'default_location_mode' => 'coarse',
        'default_visibility_delay_minutes' => 90,
        'min_public_delay_minutes' => 30,
        'max_visibility_delay_minutes' => 1440,
        'coarse_rounding_decimals' => 2,
    ],

    'byos' => [
        'default_provider' => env('TRAIL_ASSISTANT_BYOS_DEFAULT_PROVIDER', 'openai_api_key'),
        'decision' => [
            'status' => 'accepted',
            'last_reviewed_on' => '2026-04-18',
            'summary' => 'A user-authenticated ChatGPT/Codex companion is feasible now for foreground responses. Pure hosted billing passthrough and unattended background execution on a ChatGPT subscription are still not a safe supported lane.',
            'supported_now' => [
                [
                    'id' => 'openai_codex_local_bridge',
                    'label' => 'ChatGPT/Codex local companion',
                    'notes' => 'User signs into ChatGPT/Codex locally through Scout, then Hogg Country talks to a loopback bridge for live responses.',
                ],
                [
                    'id' => 'openai_api_key',
                    'label' => 'BYO OpenAI API key',
                    'notes' => 'User supplies their own API key; model usage is billed to their API account.',
                ],
                [
                    'id' => 'app_managed_billing',
                    'label' => 'Trail Assistant managed billing',
                    'notes' => 'Trail Assistant funds API usage and charges users through app-managed subscription tiers.',
                ],
                [
                    'id' => 'hybrid_mode',
                    'label' => 'Hybrid mode',
                    'notes' => 'Users can choose either a ChatGPT companion, a BYO key, or app-managed billing based on context.',
                ],
            ],
            'unsupported_now' => [
                [
                    'id' => 'chatgpt_subscription_passthrough',
                    'label' => 'Hosted ChatGPT subscription passthrough',
                    'reason' => 'ChatGPT subscriptions and API billing remain separate for server-side third-party billing passthrough.',
                ],
                [
                    'id' => 'openai_signin_billing_passthrough',
                    'label' => 'Sign in with OpenAI billing delegation',
                    'reason' => 'Current OpenAI OAuth/App SDK docs do not provide a hosted third-party billing delegation path from ChatGPT subscriptions.',
                ],
                [
                    'id' => 'chatgpt_background_delegate',
                    'label' => 'Unattended background delegate on ChatGPT subscription',
                    'reason' => 'A user-linked local ChatGPT companion works for attended foreground requests, but a cloud worker spending the user subscription in the background is still unresolved.',
                ],
            ],
            'sources' => [
                [
                    'label' => 'What is ChatGPT Plus?',
                    'url' => 'https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus',
                ],
                [
                    'label' => 'How can I move my ChatGPT subscription to the API?',
                    'url' => 'https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api',
                ],
                [
                    'label' => 'Billing settings in ChatGPT vs Platform',
                    'url' => 'https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform',
                ],
                [
                    'label' => 'OpenAI API authentication intro',
                    'url' => 'https://platform.openai.com/docs/api-reference/introduction',
                ],
                [
                    'label' => 'OpenAI Actions authentication',
                    'url' => 'https://platform.openai.com/docs/actions/authentication',
                ],
                [
                    'label' => 'OpenAI Apps SDK auth',
                    'url' => 'https://developers.openai.com/apps-sdk/build/auth/',
                ],
                [
                    'label' => 'OpenAI Terms of Use',
                    'url' => 'https://openai.com/policies/terms-of-use/',
                ],
            ],
        ],
        'providers' => [
            'openai_codex_local_bridge' => [
                'label' => 'ChatGPT/Codex local companion',
                'enabled' => true,
                'auth_mode' => 'scout_local_bridge',
                'funding_model' => 'user_subscription_local_companion',
                'available_models' => ['openai-codex/gpt-5.5'],
                'notes' => 'Supported as the first practical connector lane. Requires a local Scout companion logged into ChatGPT/Codex and a loopback bridge process.',
            ],
            'openai_api_key' => [
                'label' => 'OpenAI API key (user-provided)',
                'enabled' => true,
                'auth_mode' => 'api_key',
                'funding_model' => 'user_api_payg',
                'api_key_prefix' => 'sk-',
                'available_models' => ['gpt-5.5', 'gpt-5.4-mini'],
                'notes' => 'Supported now. User provides their own API key through secure settings.',
            ],
            'chatgpt_subscription_passthrough' => [
                'label' => 'ChatGPT subscription passthrough',
                'enabled' => false,
                'auth_mode' => 'chatgpt_subscription_passthrough',
                'funding_model' => 'not_available',
                'available_models' => [],
                'notes' => 'Not currently supported for third-party API billing passthrough.',
            ],
            'openai_oauth_future' => [
                'label' => 'OpenAI OAuth (future placeholder)',
                'enabled' => false,
                'auth_mode' => 'oauth',
                'funding_model' => 'unknown',
                'available_models' => [],
                'notes' => 'Reserved for future provider-managed OAuth capabilities if OpenAI ships them.',
            ],
        ],
    ],
];
