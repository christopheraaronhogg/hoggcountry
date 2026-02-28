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
];
