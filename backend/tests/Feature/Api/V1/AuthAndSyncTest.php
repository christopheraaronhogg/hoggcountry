<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthAndSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_fetch_profile_with_bearer_token(): void
    {
        Notification::fake();

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
