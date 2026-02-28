<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

class TrailAssistantModeratorGate
{
    public static function canModerate(User $user): bool
    {
        $allowedIds = array_map('intval', array_filter([
            ...self::configArray('trail_assistant.map_reports.moderator_user_ids'),
            ...self::configArray('trail_assistant.sos.moderator_user_ids'),
        ], static fn (mixed $value): bool => is_numeric($value)));

        if (in_array((int) $user->id, $allowedIds, true)) {
            return true;
        }

        $email = Str::lower((string) $user->email);
        if ($email === '') {
            return false;
        }

        $allowedEmails = collect([
            ...self::configArray('trail_assistant.map_reports.moderator_emails'),
            ...self::configArray('trail_assistant.map_reports.admin_resolver_emails'),
            ...self::configArray('trail_assistant.sos.moderator_emails'),
        ])
            ->filter(static fn (mixed $value): bool => is_string($value) && trim($value) !== '')
            ->map(static fn (string $value): string => Str::lower(trim($value)))
            ->unique()
            ->values()
            ->all();

        return in_array($email, $allowedEmails, true);
    }

    /**
     * @return array<int, mixed>
     */
    private static function configArray(string $key): array
    {
        $value = config($key, []);

        return is_array($value) ? $value : [];
    }
}
