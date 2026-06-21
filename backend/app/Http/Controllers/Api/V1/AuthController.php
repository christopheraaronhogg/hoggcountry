<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Profile;
use App\Models\SocialAccount;
use App\Models\User;
use App\Support\OpenAIIdToken;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends ApiController
{
    public function register(Request $request)
    {
        if ($this->registrationIsClosed()) {
            return $this->fail(
                'registration_closed',
                $this->registrationClosedMessage(),
                403
            );
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'confirmed', 'min:8'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $existingUser = $this->findUserByEmail($email);
        if ($existingUser) {
            return $this->fail('account_exists', 'An account already exists for this email. Sign in or recover your login instead.', 409, [
                'email' => $email,
                'providers' => $this->authProvidersForUser($existingUser),
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => $validated['password'],
        ]);

        Profile::create([
            'user_id' => $user->id,
            'display_name' => $validated['name'],
        ]);

        $user->sendEmailVerificationNotification();

        $tokenName = $validated['device_name'] ?? 'web-client';
        $token = $user->createToken($tokenName)->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user->load('profile')),
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $user = $this->findUserByEmail($email);

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            $user = $this->resolveLaunchInviteUser($email, $validated['password']);

            if (! $user) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }
        }

        $tokenName = $validated['device_name'] ?? 'web-client';
        $token = $user->createToken($tokenName)->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user->load('profile')),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->ok([
            'message' => 'Logged out',
        ]);
    }

    public function me(Request $request)
    {
        return $this->ok($this->userPayload($request->user()->load('profile')));
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = $this->normalizeEmail($validated['email']);
        $status = Password::sendResetLink([
            'email' => $email,
        ]);

        if ($status === Password::INVALID_USER) {
            return $this->ok([
                'message' => __(Password::RESET_LINK_SENT),
            ]);
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->fail('password_reset_failed', __($status), 422);
        }

        return $this->ok([
            'message' => __($status),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $validated['email'] = $this->normalizeEmail($validated['email']);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                if (! $user->hasVerifiedEmail()) {
                    $user->markEmailAsVerified();
                }

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->fail('password_reset_failed', __($status), 422);
        }

        return $this->ok([
            'message' => __($status),
        ]);
    }

    public function verifyEmail(Request $request, int $id, string $hash)
    {
        $user = User::find($id);

        if (! $user) {
            return $this->fail('not_found', 'User not found.', 404);
        }

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return $this->fail('invalid_verification_hash', 'Email verification hash is invalid.', 403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $this->ok([
            'message' => 'Email verified.',
        ]);
    }

    public function googleRedirect(Request $request)
    {
        $callback = $this->resolveFrontendCallbackUrl($request->query('callback'));

        $driver = Socialite::driver('google')->stateless();
        if ($callback) {
            $state = Str::random(64);
            Cache::put($this->googleStateCacheKey($state), $callback, now()->addMinutes(10));
            $driver = $driver->with(['state' => $state]);
        }

        return $driver->redirect();
    }

    public function googleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();
        } catch (\Throwable $exception) {
            return $this->fail('oauth_failed', 'Google authentication failed.', 422, [
                'provider' => 'google',
                'hint' => 'Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and redirect URI settings.',
            ]);
        }

        $providerUserId = trim((string) $googleUser->getId());
        $email = $this->normalizeEmail((string) $googleUser->getEmail());

        if ($providerUserId === '' || $email === '') {
            return $this->fail('oauth_invalid_user', 'Google account did not return required identity fields.', 422, [
                'provider' => 'google',
            ]);
        }

        if (! $this->googleEmailIsVerified($googleUser)) {
            return $this->fail('oauth_unverified_email', 'Google did not return a verified email for this account.', 422, [
                'provider' => 'google',
            ]);
        }

        $knownSocialAccount = SocialAccount::query()
            ->where('provider', 'google')
            ->where('provider_user_id', $providerUserId)
            ->exists();

        if (
            $this->registrationIsClosed()
            && ! $knownSocialAccount
            && ! $this->findUserByEmail($email)
        ) {
            return $this->fail('registration_closed', $this->registrationClosedMessage(), 403, [
                'provider' => 'google',
            ]);
        }

        $user = DB::transaction(function () use ($googleUser, $providerUserId, $email): User {
            $social = SocialAccount::query()
                ->where('provider', 'google')
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($social) {
                $social->forceFill([
                    'email' => $email,
                    'avatar_url' => $googleUser->getAvatar(),
                    'raw_user' => $this->googleRawUserPayload($googleUser),
                ])->save();

                return $social->user;
            }

            $existingUser = $this->findUserByEmail($email);

            if (! $existingUser) {
                $displayName = trim((string) $googleUser->getName());
                $fallbackName = Str::headline(Str::before($email, '@'));

                $existingUser = User::query()->create([
                    'name' => $displayName !== '' ? $displayName : $fallbackName,
                    'email' => $email,
                    'password' => Str::random(40),
                ]);

                $existingUser->forceFill([
                    'email_verified_at' => now(),
                ])->save();
            } elseif (! $existingUser->email_verified_at) {
                $existingUser->forceFill([
                    'email_verified_at' => now(),
                ])->save();
            }

            $profile = $existingUser->profile()->firstOrCreate(
                ['user_id' => $existingUser->id],
                ['display_name' => $existingUser->name]
            );

            if (! $profile->avatar_url && $googleUser->getAvatar()) {
                $profile->forceFill(['avatar_url' => (string) $googleUser->getAvatar()])->save();
            }

            SocialAccount::query()->updateOrCreate(
                [
                    'provider' => 'google',
                    'provider_user_id' => $providerUserId,
                ],
                [
                    'user_id' => $existingUser->id,
                    'email' => $email,
                    'avatar_url' => $googleUser->getAvatar(),
                    'raw_user' => $this->googleRawUserPayload($googleUser),
                ]
            );

            return $existingUser;
        });

        $token = $user->createToken('google-oauth')->plainTextToken;

        $frontendCallbackUrl = null;
        $state = $request->query('state');
        if (is_string($state) && $state !== '') {
            $stateCallback = Cache::pull($this->googleStateCacheKey($state));
            if (is_string($stateCallback)) {
                $frontendCallbackUrl = $this->resolveFrontendCallbackUrl($stateCallback);
            }
        }

        if (! $frontendCallbackUrl) {
            $configured = config('app.frontend_auth_callback_url');
            if (is_string($configured)) {
                $frontendCallbackUrl = $this->resolveFrontendCallbackUrl($configured);
            }
        }

        if (
            ! $request->expectsJson() &&
            is_string($frontendCallbackUrl)
        ) {
            $handoffCode = Str::random(64);
            Cache::put($this->googleHandoffCacheKey($handoffCode), [
                'token' => $token,
                'user' => $this->userPayload($user->load('profile')),
                'provider' => 'google',
            ], now()->addMinutes(5));

            return redirect()->away($this->appendQueryParams($frontendCallbackUrl, [
                'handoff' => $handoffCode,
                'provider' => 'google',
            ]));
        }

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user->load('profile')),
            'provider' => 'google',
        ]);
    }

    public function googleHandoff(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:64'],
        ]);

        $payload = Cache::pull($this->googleHandoffCacheKey($validated['code']));
        if (! is_array($payload) || ! isset($payload['token'], $payload['user'], $payload['provider'])) {
            return $this->fail('google_handoff_invalid', 'Google login expired. Try signing in again.', 422, [
                'provider' => 'google',
            ]);
        }

        return $this->ok($payload);
    }

    /**
     * "Continue with ChatGPT" login: the Scout web frontend completes the
     * Codex PKCE flow and posts the resulting OIDC id_token here. The token
     * is verified against OpenAI's public JWKS, so this endpoint trusts the
     * token issuer, never the caller.
     */
    public function openaiExchange(Request $request)
    {
        $validated = $request->validate([
            'id_token' => ['required', 'string', 'max:8192'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        try {
            $claims = OpenAIIdToken::verify($validated['id_token']);
        } catch (\RuntimeException $exception) {
            report($exception);

            return $this->fail('openai_token_invalid', 'ChatGPT login could not be verified. Try signing in again.', 422, [
                'provider' => 'openai',
            ]);
        }

        $providerUserId = trim((string) ($claims['sub'] ?? ''));
        $email = $this->normalizeEmail((string) ($claims['email'] ?? ''));

        if ($providerUserId === '' || $email === '' || ! str_contains($email, '@')) {
            return $this->fail('openai_profile_incomplete', 'Your ChatGPT account did not share a verified email. Use email signup instead.', 422, [
                'provider' => 'openai',
            ]);
        }

        if (($claims['email_verified'] ?? null) === false) {
            return $this->fail('openai_email_unverified', 'Verify the email on your ChatGPT account, then try again.', 422, [
                'provider' => 'openai',
            ]);
        }

        $knownSocialAccount = SocialAccount::query()
            ->where('provider', 'openai')
            ->where('provider_user_id', $providerUserId)
            ->exists();

        if (
            $this->registrationIsClosed()
            && ! $knownSocialAccount
            && ! $this->findUserByEmail($email)
        ) {
            return $this->fail('registration_closed', $this->registrationClosedMessage(), 403, [
                'provider' => 'openai',
            ]);
        }

        $user = DB::transaction(function () use ($claims, $providerUserId, $email): User {
            $social = SocialAccount::query()
                ->where('provider', 'openai')
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($social) {
                $social->forceFill([
                    'email' => $email,
                    'raw_user' => $this->openaiRawUserPayload($claims),
                ])->save();

                return $social->user;
            }

            $existingUser = $this->findUserByEmail($email);

            if (! $existingUser) {
                $displayName = trim((string) ($claims['name'] ?? ''));
                $fallbackName = Str::headline(Str::before($email, '@'));

                $existingUser = User::query()->create([
                    'name' => $displayName !== '' ? $displayName : $fallbackName,
                    'email' => $email,
                    'password' => Str::random(40),
                ]);

                $existingUser->forceFill([
                    'email_verified_at' => now(),
                ])->save();
            } elseif (! $existingUser->email_verified_at) {
                $existingUser->forceFill([
                    'email_verified_at' => now(),
                ])->save();
            }

            $existingUser->profile()->firstOrCreate(
                ['user_id' => $existingUser->id],
                ['display_name' => $existingUser->name]
            );

            SocialAccount::query()->updateOrCreate(
                [
                    'provider' => 'openai',
                    'provider_user_id' => $providerUserId,
                ],
                [
                    'user_id' => $existingUser->id,
                    'email' => $email,
                    'raw_user' => $this->openaiRawUserPayload($claims),
                ]
            );

            return $existingUser;
        });

        $tokenName = $validated['device_name'] ?? 'chatgpt-oauth';
        $token = $user->createToken($tokenName)->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user->load('profile')),
            'provider' => 'openai',
        ]);
    }

    /**
     * @param  array<string, mixed>  $claims
     * @return array<string, mixed>
     */
    private function openaiRawUserPayload(array $claims): array
    {
        return [
            'sub' => $claims['sub'] ?? null,
            'email' => $claims['email'] ?? null,
            'email_verified' => $claims['email_verified'] ?? null,
            'name' => $claims['name'] ?? null,
            'iss' => $claims['iss'] ?? null,
        ];
    }

    private function googleStateCacheKey(string $state): string
    {
        return "oauth_google_state:{$state}";
    }

    private function googleHandoffCacheKey(string $code): string
    {
        return "oauth_google_handoff:{$code}";
    }

    private function normalizeEmail(string $email): string
    {
        return Str::lower(trim($email));
    }

    private function findUserByEmail(string $email): ?User
    {
        return User::query()
            ->whereRaw('LOWER(email) = ?', [$this->normalizeEmail($email)])
            ->first();
    }

    private function authProvidersForUser(User $user): array
    {
        $providers = $user->socialAccounts()
            ->pluck('provider')
            ->map(fn (string $provider): string => Str::lower($provider))
            ->unique()
            ->values()
            ->all();

        array_unshift($providers, 'email');

        return array_values(array_unique($providers));
    }

    private function registrationIsClosed(): bool
    {
        return ! (bool) config('app.public_registration_enabled');
    }

    private function registrationClosedMessage(): string
    {
        return 'Scout web signups are closed while the hosted AI beta is private. Join the launch list from the app page.';
    }

    private function resolveLaunchInviteUser(string $email, string $password): ?User
    {
        $invite = config('app.launch_invite', []);
        if (! is_array($invite)) {
            return null;
        }

        $inviteEmail = $this->normalizeEmail((string) ($invite['email'] ?? ''));
        $invitePassword = (string) ($invite['password'] ?? '');

        if ($inviteEmail === '' || $invitePassword === '') {
            return null;
        }

        if (! hash_equals($inviteEmail, $this->normalizeEmail($email)) || ! hash_equals($invitePassword, $password)) {
            return null;
        }

        $name = trim((string) ($invite['name'] ?? '')) ?: 'Dad';
        $trailName = trim((string) ($invite['trail_name'] ?? '')) ?: $name;

        return DB::transaction(function () use ($inviteEmail, $invitePassword, $name, $trailName): User {
            $user = $this->findUserByEmail($inviteEmail) ?? new User(['email' => $inviteEmail]);
            $user->forceFill([
                'name' => $user->exists ? $user->name : $name,
                'password' => $invitePassword,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            $profile = $user->profile()->first();
            $user->profile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'display_name' => $profile?->display_name ?: $name,
                    'trail_name' => $profile?->trail_name ?: $trailName,
                ]
            );

            return $user->load('profile');
        });
    }

    private function googleEmailIsVerified($googleUser): bool
    {
        $raw = method_exists($googleUser, 'getRaw') ? $googleUser->getRaw() : [];
        $verified = is_array($raw)
            ? ($raw['email_verified'] ?? $raw['verified_email'] ?? null)
            : null;

        return $verified === true || $verified === 1 || $verified === '1' || $verified === 'true';
    }

    private function googleRawUserPayload($googleUser): array
    {
        $raw = method_exists($googleUser, 'getRaw') ? $googleUser->getRaw() : [];

        return [
            'nickname' => $googleUser->getNickname(),
            'name' => $googleUser->getName(),
            'email' => $googleUser->getEmail(),
            'avatar' => $googleUser->getAvatar(),
            'email_verified' => is_array($raw) ? ($raw['email_verified'] ?? $raw['verified_email'] ?? null) : null,
        ];
    }

    private function resolveFrontendCallbackUrl(?string $candidate): ?string
    {
        if (! is_string($candidate)) {
            return null;
        }

        $candidate = trim($candidate);
        if ($candidate === '') {
            return null;
        }

        if (! filter_var($candidate, FILTER_VALIDATE_URL)) {
            return null;
        }

        $host = strtolower((string) parse_url($candidate, PHP_URL_HOST));
        $scheme = strtolower((string) parse_url($candidate, PHP_URL_SCHEME));
        if ($host === '' || ! in_array($scheme, ['https', 'http'], true)) {
            return null;
        }

        if ($scheme === 'http' && ! in_array($host, ['localhost', '127.0.0.1'], true)) {
            return null;
        }

        $allowedHosts = $this->allowedFrontendHosts();
        if (count($allowedHosts) > 0 && ! in_array($host, $allowedHosts, true)) {
            return null;
        }

        return $candidate;
    }

    private function appendQueryParams(string $url, array $params): string
    {
        $fragment = parse_url($url, PHP_URL_FRAGMENT);
        $baseUrl = is_string($fragment)
            ? Str::before($url, '#')
            : $url;
        $separator = Str::contains($baseUrl, '?') ? '&' : '?';
        $withQuery = $baseUrl.$separator.http_build_query($params);

        return is_string($fragment) ? "{$withQuery}#{$fragment}" : $withQuery;
    }

    private function allowedFrontendHosts(): array
    {
        $hosts = [];

        $configured = config('app.frontend_auth_callback_url');
        if (is_string($configured) && filter_var($configured, FILTER_VALIDATE_URL)) {
            $configuredHost = strtolower((string) parse_url($configured, PHP_URL_HOST));
            if ($configuredHost !== '') {
                $hosts[] = $configuredHost;
            }
        }

        $extra = config('app.frontend_auth_allowed_hosts', []);
        if (is_array($extra)) {
            foreach ($extra as $host) {
                if (! is_string($host)) {
                    continue;
                }
                $trimmed = trim(strtolower($host));
                if ($trimmed !== '') {
                    $hosts[] = $trimmed;
                }
            }
        }

        return array_values(array_unique($hosts));
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
            'profile' => [
                'display_name' => $user->profile?->display_name,
                'trail_name' => $user->profile?->trail_name,
                'bio' => $user->profile?->bio,
                'avatar_url' => $user->profile?->avatar_url,
            ],
        ];
    }
}
