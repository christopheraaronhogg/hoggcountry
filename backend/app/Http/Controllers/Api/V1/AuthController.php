<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
