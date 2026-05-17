<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            $configured = config('app.frontend_password_reset_url');
            $resetUrl = is_string($configured) && trim($configured) !== ''
                ? trim($configured)
                : $this->fallbackFrontendPasswordResetUrl();

            return $resetUrl.(Str::contains($resetUrl, '?') ? '&' : '?').http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }

    private function fallbackFrontendPasswordResetUrl(): string
    {
        $callbackUrl = config('app.frontend_auth_callback_url');
        if (is_string($callbackUrl) && filter_var($callbackUrl, FILTER_VALIDATE_URL)) {
            $parts = parse_url($callbackUrl);
            $scheme = $parts['scheme'] ?? 'https';
            $host = $parts['host'] ?? '';
            $port = isset($parts['port']) ? ':'.$parts['port'] : '';

            if ($host !== '') {
                return "{$scheme}://{$host}{$port}/reset-password";
            }
        }

        return url('/reset-password');
    }
}
