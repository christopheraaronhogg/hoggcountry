<?php

namespace Tests\Feature\Api\V1;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthAndSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_closed_by_default(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Trail Bot',
            'email' => 'bot@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'registration_closed');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_user_can_register_and_fetch_profile_with_bearer_token(): void
    {
        Notification::fake();
        config()->set('app.public_registration_enabled', true);

        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Chris Hogg',
            'email' => 'chris@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'device_name' => 'Mac Safari',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'chris@example.com')
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => ['id', 'email', 'name', 'profile'],
                ],
                'error',
                'meta' => ['request_id'],
            ]);

        $token = $registerResponse->json('data.token');
        $this->assertNotEmpty($token);

        $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $meResponse
            ->assertOk()
            ->assertJsonPath('data.email', 'chris@example.com');

        $user = User::where('email', 'chris@example.com')->first();
        $this->assertNotNull($user);
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_duplicate_register_returns_account_exists_without_creating_user(): void
    {
        config()->set('app.public_registration_enabled', true);

        User::factory()->create([
            'email' => 'exists@example.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate',
            'email' => 'EXISTS@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'account_exists')
            ->assertJsonPath('error.details.email', 'exists@example.com');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_launch_invite_login_provisions_private_beta_user(): void
    {
        config()->set('app.launch_invite.email', 'jimmy@hoggs.net');
        config()->set('app.launch_invite.password', 'private-beta-pass');
        config()->set('app.launch_invite.name', 'Jimmy Hogg');
        config()->set('app.launch_invite.trail_name', 'Dad');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'JIMMY@HOGGS.NET',
            'password' => 'private-beta-pass',
            'device_name' => 'Dad Safari',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user.email', 'jimmy@hoggs.net')
            ->assertJsonPath('data.user.name', 'Jimmy Hogg')
            ->assertJsonPath('data.user.profile.trail_name', 'Dad');

        $token = $response->json('data.token');
        $this->assertNotEmpty($token);

        $user = User::where('email', 'jimmy@hoggs.net')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('private-beta-pass', $user->password));
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_google_account_can_set_password_through_frontend_reset_link(): void
    {
        Notification::fake();
        config()->set('app.frontend_password_reset_url', 'https://scout.example.com/reset-password');

        $user = User::factory()->create([
            'email' => 'google@example.com',
            'password' => Hash::make('random-google-only-password'),
            'email_verified_at' => now(),
        ]);

        SocialAccount::query()->create([
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_user_id' => 'google-123',
            'email' => 'google@example.com',
        ]);

        $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'GOOGLE@example.com',
        ])->assertOk();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user, &$token): bool {
            $token = $notification->token;
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith('https://scout.example.com/reset-password?', $url);

            parse_str((string) parse_url($url, PHP_URL_QUERY), $queryParams);
            $this->assertSame('google@example.com', $queryParams['email'] ?? null);
            $this->assertSame($token, $queryParams['token'] ?? null);

            return true;
        });

        $this->assertIsString($token);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'google@example.com',
            'password' => 'new-password123',
            'password_confirmation' => 'new-password123',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'google@example.com',
            'password' => 'new-password123',
        ])->assertOk()
            ->assertJsonPath('data.user.email', 'google@example.com');
    }

    public function test_user_can_register_device_and_sync_character_document(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $deviceId = '11111111-1111-4111-8111-111111111111';
        $etag = str_repeat('a', 64);

        $deviceResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/register', [
                'device_id' => $deviceId,
                'platform' => 'web',
                'device_name' => 'Chrome',
            ]);

        $deviceResponse
            ->assertCreated()
            ->assertJsonPath('data.device.device_id', $deviceId);

        $pushResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/sync/push', [
                'device_id' => $deviceId,
                'changes' => [
                    [
                        'op' => 'upsert',
                        'doc_type' => 'character',
                        'doc_id' => 'primary',
                        'schema_version' => 1,
                        'client_updated_at' => '2026-02-07T20:00:00.000Z',
                        'etag' => $etag,
                        'content' => [
                            'version' => 1,
                            'trail' => ['currentMile' => 123.4],
                        ],
                    ],
                ],
            ]);

        $pushResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.applied')
            ->assertJsonPath('data.applied.0.doc_type', 'character');

        $bootstrapResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/sync/bootstrap');

        $bootstrapResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.docs')
            ->assertJsonPath('data.docs.0.doc_type', 'character')
            ->assertJsonPath('data.docs.0.content.trail.currentMile', 123.4);

        $pullResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/sync/pull?cursor=0');

        $pullResponse
            ->assertOk()
            ->assertJsonCount(1, 'data.changes')
            ->assertJsonPath('data.changes.0.op', 'upsert')
            ->assertJsonPath('data.changes.0.content.trail.currentMile', 123.4);
    }

    public function test_sync_rejects_tie_when_device_id_loses_lexicographic_tiebreaker(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $highDevice = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
        $lowDevice = '00000000-0000-4000-8000-000000000001';

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/register', [
                'device_id' => $highDevice,
                'platform' => 'web',
                'device_name' => 'High Device',
            ])
            ->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/register', [
                'device_id' => $lowDevice,
                'platform' => 'web',
                'device_name' => 'Low Device',
            ])
            ->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/sync/push', [
                'device_id' => $highDevice,
                'changes' => [
                    [
                        'op' => 'upsert',
                        'doc_type' => 'character',
                        'doc_id' => 'primary',
                        'schema_version' => 1,
                        'client_updated_at' => '2026-02-07T20:00:00.000Z',
                        'etag' => str_repeat('a', 64),
                        'content' => ['version' => 1],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonCount(1, 'data.applied');

        $losingPush = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/sync/push', [
                'device_id' => $lowDevice,
                'changes' => [
                    [
                        'op' => 'upsert',
                        'doc_type' => 'character',
                        'doc_id' => 'primary',
                        'schema_version' => 1,
                        'client_updated_at' => '2026-02-07T20:00:00.000Z',
                        'etag' => str_repeat('b', 64),
                        'content' => ['version' => 2],
                    ],
                ],
            ]);

        $losingPush
            ->assertOk()
            ->assertJsonCount(0, 'data.applied')
            ->assertJsonCount(1, 'data.rejected')
            ->assertJsonPath('data.rejected.0.reason', 'tie_breaker_lost');
    }
}
