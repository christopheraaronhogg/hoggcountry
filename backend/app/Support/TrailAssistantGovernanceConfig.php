<?php

namespace App\Support;

use App\Models\TrailAssistantGovernanceSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class TrailAssistantGovernanceConfig
{
    private const MODERATION_KEY = 'moderation_controls';

    /**
     * @return array{controls:array<string,mixed>,source:string,updated_at:?string,updated_by_user_id:?string}
     */
    public static function moderationSnapshot(): array
    {
        $defaults = self::defaultModerationControls();

        $setting = TrailAssistantGovernanceSetting::query()
            ->where('setting_key', self::MODERATION_KEY)
            ->first();

        $stored = is_array($setting?->setting_value) ? $setting->setting_value : [];
        $merged = array_merge($defaults, Arr::only($stored, array_keys($defaults)));
        $normalized = self::normalizeModerationControls($merged, $defaults);

        return [
            'controls' => $normalized,
            'source' => $setting ? 'database_override' : 'config_defaults',
            'updated_at' => $setting?->updated_at?->toISOString(),
            'updated_by_user_id' => $setting?->updated_by_user_id ? (string) $setting->updated_by_user_id : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $updates
     */
    public static function updateModerationControls(array $updates, int $updatedByUserId): array
    {
        $snapshot = self::moderationSnapshot();
        $current = $snapshot['controls'];

        foreach (['moderator_user_ids', 'moderator_emails', 'map_report_trusted_user_ids', 'map_report_public_visible_verifications'] as $key) {
            if (array_key_exists($key, $updates)) {
                $current[$key] = $updates[$key];
            }
        }

        $defaults = self::defaultModerationControls();
        $normalized = self::normalizeModerationControls($current, $defaults);

        $setting = TrailAssistantGovernanceSetting::query()->firstOrNew([
            'setting_key' => self::MODERATION_KEY,
        ]);

        $setting->setting_value = $normalized;
        $setting->updated_by_user_id = $updatedByUserId;
        $setting->save();

        return $normalized;
    }

    /**
     * @return array<int, int>
     */
    public static function moderatorUserIds(): array
    {
        return self::moderationSnapshot()['controls']['moderator_user_ids'];
    }

    /**
     * @return array<int, string>
     */
    public static function moderatorEmails(): array
    {
        return self::moderationSnapshot()['controls']['moderator_emails'];
    }

    /**
     * @return array<int, int>
     */
    public static function mapReportTrustedUserIds(): array
    {
        return self::moderationSnapshot()['controls']['map_report_trusted_user_ids'];
    }

    /**
     * @return array<int, string>
     */
    public static function mapReportPublicVisibleVerifications(): array
    {
        return self::moderationSnapshot()['controls']['map_report_public_visible_verifications'];
    }

    /**
     * @return array{moderator_user_ids:array<int,int>,moderator_emails:array<int,string>,map_report_trusted_user_ids:array<int,int>,map_report_public_visible_verifications:array<int,string>}
     */
    private static function defaultModerationControls(): array
    {
        return [
            'moderator_user_ids' => self::normalizeIntegerList([
                ...self::configArray('trail_assistant.map_reports.moderator_user_ids'),
                ...self::configArray('trail_assistant.sos.moderator_user_ids'),
            ]),
            'moderator_emails' => self::normalizeEmailList([
                ...self::configArray('trail_assistant.map_reports.moderator_emails'),
                ...self::configArray('trail_assistant.map_reports.admin_resolver_emails'),
                ...self::configArray('trail_assistant.sos.moderator_emails'),
            ]),
            'map_report_trusted_user_ids' => self::normalizeIntegerList(
                self::configArray('trail_assistant.map_reports.trusted_user_ids')
            ),
            'map_report_public_visible_verifications' => self::normalizeVerificationList(
                self::configArray('trail_assistant.map_reports.public_visible_verifications')
            ),
        ];
    }

    /**
     * @param  array<string, mixed>  $value
     * @param  array{moderator_user_ids:array<int,int>,moderator_emails:array<int,string>,map_report_trusted_user_ids:array<int,int>,map_report_public_visible_verifications:array<int,string>}  $defaults
     * @return array{moderator_user_ids:array<int,int>,moderator_emails:array<int,string>,map_report_trusted_user_ids:array<int,int>,map_report_public_visible_verifications:array<int,string>}
     */
    private static function normalizeModerationControls(array $value, array $defaults): array
    {
        $normalized = [
            'moderator_user_ids' => self::normalizeIntegerList($value['moderator_user_ids'] ?? []),
            'moderator_emails' => self::normalizeEmailList($value['moderator_emails'] ?? []),
            'map_report_trusted_user_ids' => self::normalizeIntegerList($value['map_report_trusted_user_ids'] ?? []),
            'map_report_public_visible_verifications' => self::normalizeVerificationList(
                $value['map_report_public_visible_verifications'] ?? []
            ),
        ];

        if ($normalized['moderator_user_ids'] === [] && $normalized['moderator_emails'] === []) {
            $normalized['moderator_user_ids'] = $defaults['moderator_user_ids'];
            $normalized['moderator_emails'] = $defaults['moderator_emails'];
        }

        if ($normalized['map_report_public_visible_verifications'] === []) {
            $normalized['map_report_public_visible_verifications'] = ['trusted', 'moderator_verified'];
        }

        return $normalized;
    }

    /**
     * @return array<int, mixed>
     */
    private static function configArray(string $key): array
    {
        $value = config($key, []);

        return is_array($value) ? $value : [];
    }

    /**
     * @return array<int, int>
     */
    private static function normalizeIntegerList(mixed $value, int $max = 500): array
    {
        if (! is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $entry) {
            if (! is_numeric($entry)) {
                continue;
            }

            $cast = (int) $entry;
            if ($cast <= 0) {
                continue;
            }

            $normalized[] = $cast;
            if (count($normalized) >= $max) {
                break;
            }
        }

        $normalized = array_values(array_unique($normalized));
        sort($normalized);

        return $normalized;
    }

    /**
     * @return array<int, string>
     */
    private static function normalizeEmailList(mixed $value, int $max = 500): array
    {
        if (! is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $entry) {
            if (! is_string($entry)) {
                continue;
            }

            $email = Str::of($entry)
                ->lower()
                ->trim()
                ->limit(190, '')
                ->toString();

            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            $normalized[] = $email;
            if (count($normalized) >= $max) {
                break;
            }
        }

        $normalized = array_values(array_unique($normalized));
        sort($normalized);

        return $normalized;
    }

    /**
     * @return array<int, string>
     */
    private static function normalizeVerificationList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $allowed = ['trusted', 'moderator_verified'];
        $normalized = [];

        foreach ($value as $entry) {
            if (! is_string($entry)) {
                continue;
            }

            $candidate = Str::lower(trim($entry));

            if (! in_array($candidate, $allowed, true)) {
                continue;
            }

            $normalized[] = $candidate;
        }

        return array_values(array_unique($normalized));
    }
}
