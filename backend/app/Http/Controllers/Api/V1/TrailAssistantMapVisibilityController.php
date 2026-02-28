<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantCheckin;
use App\Models\TrailAssistantMapVisibilitySetting;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantMapVisibilityController extends ApiController
{
    public function settings(Request $request)
    {
        $settings = $this->settingsForUser((int) $request->user()->id);

        return $this->ok([
            'settings' => $this->settingsPayload($settings),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'share_scope' => ['nullable', 'string', Rule::in($this->allowedScopes())],
            'location_mode' => ['nullable', 'string', Rule::in($this->allowedLocationModes())],
            'visibility_delay_minutes' => ['nullable', 'integer', 'min:0', 'max:'.$this->maxVisibilityDelayMinutes()],
        ]);

        $settings = $this->settingsForUser((int) $request->user()->id);

        if (isset($validated['share_scope'])) {
            $settings->share_scope = (string) $validated['share_scope'];
        }

        if (isset($validated['location_mode'])) {
            $settings->location_mode = (string) $validated['location_mode'];
        }

        if (isset($validated['visibility_delay_minutes'])) {
            $settings->visibility_delay_minutes = (int) $validated['visibility_delay_minutes'];
        }

        $delayAdjusted = false;
        if ($settings->share_scope === 'public' && $settings->visibility_delay_minutes < $this->minPublicDelayMinutes()) {
            $settings->visibility_delay_minutes = $this->minPublicDelayMinutes();
            $delayAdjusted = true;
        }

        $settings->save();

        return $this->ok([
            'settings' => $this->settingsPayload($settings),
            'delay_adjusted' => $delayAdjusted,
            'safety_note' => 'Public sharing applies a delayed visibility window to reduce real-time location exposure.',
        ]);
    }

    public function publicFeed(Request $request)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'since' => ['nullable', 'date'],
        ]);

        $limit = (int) ($validated['limit'] ?? 200);

        $query = TrailAssistantCheckin::query()
            ->where('share_scope', 'public')
            ->whereNotNull('visible_after')
            ->where('visible_after', '<=', now())
            ->when(
                isset($validated['since']),
                fn ($builder) => $builder->where('observed_at', '>=', CarbonImmutable::parse((string) $validated['since'])->utc())
            )
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->limit($limit);

        $rows = $query->get()->map(fn (TrailAssistantCheckin $checkin): array => $this->sharedPayload($checkin))->all();

        return $this->ok([
            'checkins' => $rows,
            'safety_note' => 'Public map points are delayed and may be coarse for hiker privacy.',
        ]);
    }

    public function authenticatedFeed(Request $request)
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:500'],
            'since' => ['nullable', 'date'],
        ]);

        $limit = (int) ($validated['limit'] ?? 200);
        $userId = (int) $request->user()->id;

        $query = TrailAssistantCheckin::query()
            ->where(function ($builder) use ($userId): void {
                $builder->where('user_id', $userId)
                    ->orWhereIn('share_scope', ['trusted', 'public']);
            })
            ->where(function ($builder) use ($userId): void {
                $builder->where('user_id', $userId)
                    ->orWhere(function ($visibility) {
                        $visibility->whereNotNull('visible_after')->where('visible_after', '<=', now());
                    });
            })
            ->when(
                isset($validated['since']),
                fn ($builder) => $builder->where('observed_at', '>=', CarbonImmutable::parse((string) $validated['since'])->utc())
            )
            ->orderByDesc('observed_at')
            ->orderByDesc('id')
            ->limit($limit);

        $rows = $query->get()->map(fn (TrailAssistantCheckin $checkin): array => $this->sharedPayload($checkin, (int) $request->user()->id))->all();

        return $this->ok([
            'checkins' => $rows,
        ]);
    }

    private function settingsForUser(int $userId): TrailAssistantMapVisibilitySetting
    {
        return TrailAssistantMapVisibilitySetting::query()->firstOrCreate(
            ['user_id' => $userId],
            [
                'share_scope' => (string) config('trail_assistant.map_sharing.default_scope', 'private'),
                'location_mode' => (string) config('trail_assistant.map_sharing.default_location_mode', 'coarse'),
                'visibility_delay_minutes' => (int) config('trail_assistant.map_sharing.default_visibility_delay_minutes', 90),
            ]
        );
    }

    /**
     * @return array<int, string>
     */
    private function allowedScopes(): array
    {
        $scopes = config('trail_assistant.map_sharing.scopes', ['private', 'trusted', 'public']);

        if (! is_array($scopes) || $scopes === []) {
            return ['private', 'trusted', 'public'];
        }

        return array_values(array_filter($scopes, fn (mixed $value): bool => is_string($value) && trim($value) !== ''));
    }

    /**
     * @return array<int, string>
     */
    private function allowedLocationModes(): array
    {
        $modes = config('trail_assistant.map_sharing.location_modes', ['exact', 'coarse']);

        if (! is_array($modes) || $modes === []) {
            return ['exact', 'coarse'];
        }

        return array_values(array_filter($modes, fn (mixed $value): bool => is_string($value) && trim($value) !== ''));
    }

    private function minPublicDelayMinutes(): int
    {
        return max(0, (int) config('trail_assistant.map_sharing.min_public_delay_minutes', 30));
    }

    private function maxVisibilityDelayMinutes(): int
    {
        return max(60, (int) config('trail_assistant.map_sharing.max_visibility_delay_minutes', 1440));
    }

    private function settingsPayload(TrailAssistantMapVisibilitySetting $settings): array
    {
        return [
            'share_scope' => $settings->share_scope,
            'location_mode' => $settings->location_mode,
            'visibility_delay_minutes' => (int) $settings->visibility_delay_minutes,
            'min_public_delay_minutes' => $this->minPublicDelayMinutes(),
            'updated_at' => $settings->updated_at?->toISOString(),
        ];
    }

    private function sharedPayload(TrailAssistantCheckin $checkin, ?int $viewerUserId = null): array
    {
        $isOwner = $viewerUserId !== null && (int) $checkin->user_id === $viewerUserId;
        [$lat, $lon, $precision] = $this->presentCoordinates($checkin, $isOwner);

        return [
            'checkin_id' => $checkin->checkin_id,
            'lat' => $lat,
            'lon' => $lon,
            'mile_marker' => $checkin->mile_marker,
            'share_scope' => $checkin->share_scope,
            'precision' => $precision,
            'observed_at' => $checkin->observed_at?->toISOString(),
            'visible_after' => $checkin->visible_after?->toISOString(),
            'user_ref' => $isOwner
                ? 'self'
                : Str::substr(hash('sha256', 'trail-map-share-'.$checkin->user_id), 0, 12),
            'is_owner' => $isOwner,
        ];
    }

    /**
     * @return array{0:float,1:float,2:string}
     */
    private function presentCoordinates(TrailAssistantCheckin $checkin, bool $isOwner): array
    {
        $lat = (float) $checkin->lat;
        $lon = (float) $checkin->lon;

        if ($isOwner) {
            return [$lat, $lon, 'exact'];
        }

        if ((string) $checkin->share_location_mode === 'coarse') {
            $decimals = max(0, (int) config('trail_assistant.map_sharing.coarse_rounding_decimals', 2));

            return [round($lat, $decimals), round($lon, $decimals), 'coarse'];
        }

        return [$lat, $lon, 'exact'];
    }
}
