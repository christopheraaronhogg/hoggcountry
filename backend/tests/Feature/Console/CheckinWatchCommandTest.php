<?php

namespace Tests\Feature\Console;

use App\Models\Device;
use App\Models\SyncDocument;
use App\Models\User;
use App\Services\PushSender;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class CheckinWatchCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_overdue_past_grace_with_push_device_sends_once_and_updates_dedupe(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T14:00:00Z'));
        config(['services.checkin_alerts.grace_minutes' => 180]);

        $user = $this->createUserWithPushDevice();
        $nextDueAt = '2026-03-01T09:00:00Z';
        $this->createCheckinsDocument($user, ['nextDueAt' => $nextDueAt]);

        $expectedPayload = [
            'title' => 'Check-in overdue',
            'body' => 'No check-in received since Mar 1, 2026 9:00 AM UTC. Open Hogg Country to check in.',
            'url' => '/',
        ];

        $this->mock(PushSender::class, function (MockInterface $mock) use ($user, $expectedPayload): void {
            $mock->shouldReceive('sendToUser')
                ->once()
                ->withArgs(function (User $sentUser, array $payload) use ($user, $expectedPayload): bool {
                    $this->assertTrue($sentUser->is($user));
                    $this->assertSame($expectedPayload, $payload);
                    $this->assertDoesNotMatchRegularExpression('/-?\d{1,3}\.\d{3,}/', implode(' ', $payload));

                    return true;
                })
                ->andReturn([
                    'sent' => 1,
                    'failed' => 0,
                    'pruned' => 0,
                    'skipped' => 0,
                    'unconfigured' => [],
                ]);
        });

        $this->artisan('checkins:watch')
            ->expectsOutputToContain('sent=1 failed=0 pruned=0 skipped=0 unconfigured=none')
            ->expectsOutput('checkins:watch complete (users_scanned=1, overdue=1, alerted=1)')
            ->assertExitCode(0);

        $this->assertSame($nextDueAt, $user->refresh()->checkin_alert_sent_for);
    }

    public function test_second_run_for_same_next_due_at_does_not_send_again(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T14:00:00Z'));
        config(['services.checkin_alerts.grace_minutes' => 180]);

        $user = $this->createUserWithPushDevice();
        $nextDueAt = '2026-03-01T09:00:00Z';
        $this->createCheckinsDocument($user, ['nextDueAt' => $nextDueAt]);

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldReceive('sendToUser')
                ->once()
                ->andReturn([
                    'sent' => 1,
                    'failed' => 0,
                    'pruned' => 0,
                    'skipped' => 0,
                    'unconfigured' => [],
                ]);
        });

        $this->artisan('checkins:watch')->assertExitCode(0);
        $this->assertSame($nextDueAt, $user->refresh()->checkin_alert_sent_for);

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('sendToUser');
        });

        $this->artisan('checkins:watch')
            ->expectsOutput('checkins:watch complete (users_scanned=1, overdue=1, alerted=0)')
            ->assertExitCode(0);
    }

    public function test_new_later_overdue_next_due_at_alerts_again(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T18:00:00Z'));
        config(['services.checkin_alerts.grace_minutes' => 180]);

        $user = $this->createUserWithPushDevice();
        $oldNextDueAt = '2026-03-01T09:00:00Z';
        $newNextDueAt = '2026-03-01T13:00:00Z';
        $user->forceFill(['checkin_alert_sent_for' => $oldNextDueAt])->save();
        $this->createCheckinsDocument($user, ['nextDueAt' => $newNextDueAt]);

        $this->mock(PushSender::class, function (MockInterface $mock) use ($user): void {
            $mock->shouldReceive('sendToUser')
                ->once()
                ->withArgs(function (User $sentUser, array $payload) use ($user): bool {
                    $this->assertTrue($sentUser->is($user));
                    $this->assertSame('Check-in overdue', $payload['title']);
                    $this->assertSame('No check-in received since Mar 1, 2026 1:00 PM UTC. Open Hogg Country to check in.', $payload['body']);
                    $this->assertSame('/', $payload['url']);

                    return true;
                })
                ->andReturn([
                    'sent' => 0,
                    'failed' => 0,
                    'pruned' => 0,
                    'skipped' => 1,
                    'unconfigured' => ['webpush'],
                ]);
        });

        $this->artisan('checkins:watch')
            ->expectsOutputToContain('unconfigured=webpush')
            ->expectsOutput('checkins:watch complete (users_scanned=1, overdue=1, alerted=1)')
            ->assertExitCode(0);

        $this->assertSame($newNextDueAt, $user->refresh()->checkin_alert_sent_for);
    }

    public function test_not_yet_past_grace_does_not_send(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T11:00:00Z'));
        config(['services.checkin_alerts.grace_minutes' => 180]);

        $user = $this->createUserWithPushDevice();
        $this->createCheckinsDocument($user, ['nextDueAt' => '2026-03-01T09:00:00Z']);

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('sendToUser');
        });

        $this->artisan('checkins:watch')
            ->expectsOutput('checkins:watch complete (users_scanned=1, overdue=0, alerted=0)')
            ->assertExitCode(0);

        $this->assertNull($user->refresh()->checkin_alert_sent_for);
    }

    public function test_user_without_push_device_does_not_send(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T14:00:00Z'));

        $user = User::factory()->create();
        Device::query()->create([
            'user_id' => $user->id,
            'platform' => 'ios',
            'device_name' => 'No Push',
            'last_seen_at' => now(),
            'push_provider' => null,
        ]);
        $this->createCheckinsDocument($user, ['nextDueAt' => '2026-03-01T09:00:00Z']);

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('sendToUser');
        });

        $this->artisan('checkins:watch')
            ->expectsOutput('checkins:watch complete (users_scanned=0, overdue=0, alerted=0)')
            ->assertExitCode(0);
    }

    public function test_missing_non_string_and_unparseable_next_due_at_are_skipped(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T14:00:00Z'));

        $missing = $this->createUserWithPushDevice();
        $nonString = $this->createUserWithPushDevice();
        $unparseable = $this->createUserWithPushDevice();

        $this->createCheckinsDocument($missing, []);
        $this->createCheckinsDocument($nonString, ['nextDueAt' => 12345]);
        $this->createCheckinsDocument($unparseable, ['nextDueAt' => 'next Friday']);

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('sendToUser');
        });

        $this->artisan('checkins:watch')
            ->expectsOutput('checkins:watch complete (users_scanned=3, overdue=0, alerted=0)')
            ->assertExitCode(0);
    }

    public function test_user_with_push_device_but_no_checkins_doc_is_skipped(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-01T14:00:00Z'));

        $this->createUserWithPushDevice();

        $this->mock(PushSender::class, function (MockInterface $mock): void {
            $mock->shouldNotReceive('sendToUser');
        });

        $this->artisan('checkins:watch')
            ->expectsOutput('checkins:watch complete (users_scanned=1, overdue=0, alerted=0)')
            ->assertExitCode(0);
    }

    private function createUserWithPushDevice(): User
    {
        $user = User::factory()->create();

        Device::query()->create([
            'user_id' => $user->id,
            'platform' => 'ios',
            'device_name' => 'Dad Phone',
            'last_seen_at' => now(),
            'push_provider' => 'webpush',
            'push_subscription' => [
                'endpoint' => 'https://push.example.test/device/'.$user->id,
                'keys' => [
                    'p256dh' => 'test-key',
                    'auth' => 'test-auth',
                ],
            ],
            'push_updated_at' => now(),
        ]);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $content
     */
    private function createCheckinsDocument(User $user, array $content): SyncDocument
    {
        return SyncDocument::query()->create([
            'user_id' => $user->id,
            'doc_type' => 'checkins',
            'doc_id' => 'me',
            'schema_version' => 1,
            'content' => $content,
            'etag' => 'etag-'.$user->id,
            'client_updated_at' => now(),
            'server_updated_at' => now(),
        ]);
    }
}
