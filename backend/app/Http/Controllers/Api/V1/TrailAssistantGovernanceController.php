<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\TrailAssistantGovernanceConfig;
use App\Support\TrailAssistantModeratorGate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TrailAssistantGovernanceController extends ApiController
{
    public function showModeration(Request $request)
    {
        if (! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can view governance controls.', 403);
        }

        return $this->ok([
            'governance' => TrailAssistantGovernanceConfig::moderationSnapshot(),
        ]);
    }

    public function updateModeration(Request $request)
    {
        if (! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can update governance controls.', 403);
        }

        $validated = $request->validate([
            'moderator_user_ids' => ['nullable', 'array', 'max:500'],
            'moderator_user_ids.*' => ['integer', 'min:1'],
            'moderator_emails' => ['nullable', 'array', 'max:500'],
            'moderator_emails.*' => ['string', 'email', 'max:190'],
            'map_report_trusted_user_ids' => ['nullable', 'array', 'max:1000'],
            'map_report_trusted_user_ids.*' => ['integer', 'min:1'],
            'map_report_public_visible_verifications' => ['nullable', 'array', 'max:2'],
            'map_report_public_visible_verifications.*' => [
                'string',
                Rule::in(['trusted', 'moderator_verified']),
            ],
        ]);

        $updates = [];
        foreach (['moderator_user_ids', 'moderator_emails', 'map_report_trusted_user_ids', 'map_report_public_visible_verifications'] as $key) {
            if (array_key_exists($key, $validated)) {
                $updates[$key] = $validated[$key];
            }
        }

        TrailAssistantGovernanceConfig::updateModerationControls($updates, (int) $request->user()->id);

        return $this->ok([
            'governance' => TrailAssistantGovernanceConfig::moderationSnapshot(),
            'updated_fields' => array_keys($updates),
            'safety_note' => 'Governance controls are non-secret policy values; credentials and API secrets stay outside this endpoint.',
        ]);
    }

    private function isModerator(Request $request): bool
    {
        return TrailAssistantModeratorGate::canModerate($request->user());
    }
}
