<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the paid LLM lanes (/scout/ask, /scripture/answer) so they can only
 * spend the owner's OpenAI key for the owner (Dad), and only up to a cumulative
 * daily budget.
 *
 * Two independent guards:
 *  - OWNER ALLOWLIST: the authenticated user's email must be in
 *    config('services.openai.allowed_emails') (defaults to the launch invite).
 *    This is enforcement at the spend point, so it holds regardless of how a
 *    token was minted (e.g. an existing non-owner account that authenticated via
 *    OAuth can sign in, but cannot spend the key). When the allowlist is empty
 *    (nothing configured) the gate is inert — set SCOUT_LAUNCH_INVITE_EMAIL.
 *  - DAILY BUDGET: a rolling-24h per-account request cap on top of the per-minute
 *    throttle, so a leaked token or a runaway client can't run the bill away.
 */
class EnsureLlmSpendAllowed
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            // Should never happen (route is already auth:sanctum), but fail closed.
            return $this->deny('unauthenticated', 'Authentication required.', 401);
        }

        $allowed = (array) config('services.openai.allowed_emails', []);
        if ($allowed !== []) {
            $email = strtolower(trim((string) $user->email));
            if (! in_array($email, $allowed, true)) {
                return $this->deny(
                    'not_authorized',
                    'This account is not permitted to use the assistant.',
                    403
                );
            }
        }

        $limit = (int) config('services.openai.daily_limit', 200);
        if ($limit > 0) {
            // Shared key across both paid lanes → one combined daily budget.
            $key = 'llm-spend:daily:'.$user->getAuthIdentifier();
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                return $this->deny(
                    'daily_limit_reached',
                    'Daily assistant limit reached. Try again tomorrow.',
                    429,
                    ['retry_after_seconds' => RateLimiter::availableIn($key)]
                );
            }
            RateLimiter::hit($key, 86400);
        }

        return $next($request);
    }

    /**
     * Match the ApiController { data, error, meta } envelope so clients can branch
     * on a stable error code, the same as the controllers behind this middleware.
     */
    private function deny(string $code, string $message, int $status, ?array $details = null): Response
    {
        return response()->json([
            'data' => null,
            'error' => array_filter([
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ], static fn (mixed $value): bool => $value !== null),
            'meta' => [
                'request_id' => request()->header('x-request-id', (string) Str::uuid()),
            ],
        ], $status);
    }
}
