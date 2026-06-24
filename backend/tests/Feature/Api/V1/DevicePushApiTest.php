<?php

namespace Tests\Feature\Api\V1;

use App\Models\Device;
use App\Models\User;
use App\Services\PushSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DevicePushApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_webpush_subscription_for_own_device(): void
    {
        config()->set('services.webpush.vapid_public', 'public-key');
        config()->set('services.webpush.vapid_private', 'private-key');
        config()->set('services.webpush.subject', 'mailto:chris@hoggcountry.com');

        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $deviceId = '11111111-1111-4111-8111-111111111111';

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/register', [
                'device_id' => $deviceId,
                'platform' => 'web',
                'device_name' => 'Dad PWA',
            ])
            ->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/push', [
                'device_id' => $deviceId,
                'provider' => 'webpush',
                'subscription' => [
                    'endpoint' => 'https://push.example.test/send/abc',
                    'keys' => [
                        'p256dh' => 'client-public-key',
                        'auth' => 'client-auth-secret',
                    ],
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.device_id', $deviceId)
            ->assertJsonPath('data.push_provider', 'webpush');

        $this->assertDatabaseHas('devices', [
            'id' => $deviceId,
            'user_id' => $user->id,
            'push_provider' => 'webpush',
        ]);

        $device = Device::find($deviceId);
        $this->assertSame('https://push.example.test/send/abc', $device->push_subscription['endpoint']);
        $this->assertNotNull($device->push_updated_at);
    }

    public function test_push_registration_reuses_device_conflict_guard(): void
    {
        config()->set('services.webpush.vapid_public', 'public-key');
        config()->set('services.webpush.vapid_private', 'private-key');
        config()->set('services.webpush.subject', 'mailto:chris@hoggcountry.com');

        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $token = $intruder->createToken('test-token')->plainTextToken;
        $deviceId = '22222222-2222-4222-8222-222222222222';

        Device::query()->create([
            'id' => $deviceId,
            'user_id' => $owner->id,
            'platform' => 'web',
            'device_name' => 'Owner PWA',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/push', [
                'device_id' => $deviceId,
                'provider' => 'webpush',
                'subscription' => [
                    'endpoint' => 'https://push.example.test/send/abc',
                    'keys' => [
                        'p256dh' => 'client-public-key',
                        'auth' => 'client-auth-secret',
                    ],
                ],
            ]);

        $response
            ->assertStatus(409)
            ->assertJsonPath('error.code', 'device_conflict');
    }

    public function test_user_can_register_apns_token_for_own_device(): void
    {
        $keyPath = tempnam(sys_get_temp_dir(), 'apns-test-');

        file_put_contents($keyPath, 'not-a-real-key');

        config()->set('services.apns.key_id', 'ABC123DEFG');
        config()->set('services.apns.team_id', 'TEAM123456');
        config()->set('services.apns.bundle_id', 'com.hoggcountry.trailassistant');
        config()->set('services.apns.key_path', $keyPath);
        config()->set('services.apns.production', false);

        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $deviceId = '66666666-6666-4666-8666-666666666666';

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/register', [
                'device_id' => $deviceId,
                'platform' => 'ios',
                'device_name' => 'Dad iPhone',
            ])
            ->assertCreated();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/push', [
                'device_id' => $deviceId,
                'provider' => 'apns',
                'token' => 'abc123devicepush',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.device_id', $deviceId)
            ->assertJsonPath('data.push_provider', 'apns');

        $this->assertDatabaseHas('devices', [
            'id' => $deviceId,
            'user_id' => $user->id,
            'push_provider' => 'apns',
            'push_token' => 'abc123devicepush',
        ]);

        unlink($keyPath);
    }

    public function test_push_registration_returns_503_when_provider_keys_are_missing(): void
    {
        config()->set('services.webpush.vapid_public', '');
        config()->set('services.webpush.vapid_private', '');
        config()->set('services.webpush.subject', '');

        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $deviceId = '33333333-3333-4333-8333-333333333333';

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/push', [
                'device_id' => $deviceId,
                'provider' => 'webpush',
                'subscription' => [
                    'endpoint' => 'https://push.example.test/send/abc',
                    'keys' => [
                        'p256dh' => 'client-public-key',
                        'auth' => 'client-auth-secret',
                    ],
                ],
            ]);

        $response
            ->assertStatus(503)
            ->assertJsonPath('error.code', 'push_provider_not_configured');

        $this->assertDatabaseMissing('devices', [
            'id' => $deviceId,
        ]);
    }

    public function test_user_can_delete_push_registration(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        $device = Device::query()->create([
            'id' => '44444444-4444-4444-8444-444444444444',
            'user_id' => $user->id,
            'platform' => 'web',
            'device_name' => 'Dad PWA',
            'push_provider' => 'webpush',
            'push_subscription' => [
                'endpoint' => 'https://push.example.test/send/abc',
                'keys' => [
                    'p256dh' => 'client-public-key',
                    'auth' => 'client-auth-secret',
                ],
            ],
            'push_updated_at' => now(),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/v1/devices/push', [
                'device_id' => $device->id,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.deleted', true);

        $device->refresh();
        $this->assertNull($device->push_provider);
        $this->assertNull($device->push_token);
        $this->assertNull($device->push_subscription);
        $this->assertNull($device->push_updated_at);
    }

    public function test_test_push_sends_to_caller_devices_synchronously(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        Device::query()->create([
            'id' => '55555555-5555-4555-8555-555555555555',
            'user_id' => $user->id,
            'platform' => 'web',
            'device_name' => 'Dad PWA',
            'push_provider' => 'webpush',
            'push_subscription' => [
                'endpoint' => 'https://push.example.test/send/abc',
                'keys' => [
                    'p256dh' => 'client-public-key',
                    'auth' => 'client-auth-secret',
                ],
            ],
            'push_updated_at' => now(),
        ]);

        $this->mock(PushSender::class, function ($mock) use ($user): void {
            $mock->shouldReceive('isProviderConfigured')
                ->once()
                ->with('webpush')
                ->andReturn(true);

            $mock->shouldReceive('sendToUser')
                ->once()
                ->withArgs(function (User $sentUser, array $payload) use ($user): bool {
                    return $sentUser->is($user)
                        && $payload['title'] === 'Hogg Country'
                        && $payload['body'] === "Hogg Country push is live \u{1F392}"
                        && $payload['url'] === '/';
                })
                ->andReturn([
                    'sent' => 1,
                    'failed' => 0,
                    'pruned' => 0,
                    'skipped' => 0,
                    'unconfigured' => [],
                ]);
        });

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/devices/push/test');

        $response
            ->assertOk()
            ->assertJsonPath('data.sent', 1)
            ->assertJsonPath('data.failed', 0)
            ->assertJsonPath('data.pruned', 0)
            ->assertJsonPath('data.skipped', 0);
    }
}
