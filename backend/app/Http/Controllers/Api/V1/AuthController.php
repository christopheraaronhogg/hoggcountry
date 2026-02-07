<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Profile;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
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
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:8'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
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

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
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

        $status = Password::sendResetLink([
            'email' => $validated['email'],
        ]);

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

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

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

    public function googleRedirect()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function googleCallback()
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
        $email = Str::lower(trim((string) $googleUser->getEmail()));

        if ($providerUserId === '' || $email === '') {
            return $this->fail('oauth_invalid_user', 'Google account did not return required identity fields.', 422, [
                'provider' => 'google',
            ]);
        }

        $user = DB::transaction(function () use ($googleUser, $providerUserId, $email): User {
            $social = SocialAccount::query()
                ->where('provider', 'google')
                ->where('provider_user_id', $providerUserId)
                ->first();

            if ($social) {
                return $social->user;
            }

            $existingUser = User::query()
                ->where('email', $email)
                ->first();

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
                    'raw_user' => [
                        'nickname' => $googleUser->getNickname(),
                        'name' => $googleUser->getName(),
                        'email' => $googleUser->getEmail(),
                        'avatar' => $googleUser->getAvatar(),
                    ],
                ]
            );

            return $existingUser;
        });

        $token = $user->createToken('google-oauth')->plainTextToken;

        return $this->ok([
            'token' => $token,
            'user' => $this->userPayload($user->load('profile')),
            'provider' => 'google',
        ]);
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
