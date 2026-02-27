<?php

namespace App\Http\Controllers\Api\V1;

class TrailAssistantPlanController extends ApiController
{
    public function index()
    {
        $config = config('trail_assistant.subscription', []);
        $plans = is_array($config['plans'] ?? null) ? $config['plans'] : [];

        return $this->ok([
            'stripe_wiring' => (string) ($config['stripe_wiring'] ?? 'deferred'),
            'currency' => (string) ($config['currency'] ?? 'usd'),
            'plans' => array_values(array_filter($plans, static fn (mixed $plan): bool => is_array($plan))),
        ]);
    }
}
