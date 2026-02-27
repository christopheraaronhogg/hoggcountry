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
];
