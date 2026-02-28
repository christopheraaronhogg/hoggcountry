<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

class TrailAssistantModeratorGate
{
    public static function canModerate(User $user): bool
    {
        if (in_array((int) $user->id, TrailAssistantGovernanceConfig::moderatorUserIds(), true)) {
            return true;
        }

        $email = Str::lower((string) $user->email);
        if ($email === '') {
            return false;
        }

        return in_array($email, TrailAssistantGovernanceConfig::moderatorEmails(), true);
    }
}
