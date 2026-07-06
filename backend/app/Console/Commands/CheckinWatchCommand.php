<?php

namespace App\Console\Commands;

use App\Models\SyncDocument;
use App\Models\User;
use App\Services\PushSender;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

class CheckinWatchCommand extends Command
{
    protected $signature = 'checkins:watch';

    protected $description = 'Send status-only push alerts for overdue mobile check-ins';

    public function handle(PushSender $pushSender): int
    {
        $graceMinutes = max(0, (int) config('services.checkin_alerts.grace_minutes', 180));
        $usersScanned = 0;
        $overdue = 0;
        $alerted = 0;

        User::query()
            ->whereHas('devices', function ($query): void {
                $query->whereNotNull('push_provider');
            })
            ->with(['syncDocuments' => function ($query): void {
                $query
                    ->where('doc_type', 'checkins')
                    ->where('doc_id', 'me');
            }])
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($pushSender, $graceMinutes, &$usersScanned, &$overdue, &$alerted): void {
                foreach ($users as $user) {
                    $usersScanned++;

                    $document = $user->syncDocuments->first();
                    if (! $document instanceof SyncDocument) {
                        continue;
                    }

                    $content = $document->content;
                    if (! is_array($content)) {
                        continue;
                    }

                    $nextDueAt = $content['nextDueAt'] ?? null;
                    if (! is_string($nextDueAt)) {
                        continue;
                    }

                    $nextDueAt = trim($nextDueAt);
                    $dueAt = $this->parseIsoDate($nextDueAt);
                    if (! $dueAt instanceof CarbonImmutable) {
                        continue;
                    }

                    if (! $dueAt->addMinutes($graceMinutes)->lessThan(now())) {
                        continue;
                    }

                    $overdue++;

                    if ($user->checkin_alert_sent_for === $nextDueAt) {
                        continue;
                    }

                    $payload = [
                        'title' => 'Check-in overdue',
                        'body' => sprintf(
                            'No check-in received since %s. Open Hogg Country to check in.',
                            $this->formatDueTime($dueAt)
                        ),
                        'url' => '/',
                    ];

                    $result = $pushSender->sendToUser($user, $payload);
                    $alerted++;

                    $user->forceFill([
                        'checkin_alert_sent_for' => $nextDueAt,
                    ])->save();

                    $this->info(sprintf(
                        'checkins:watch user_id=%s next_due_at=%s sent=%d failed=%d pruned=%d skipped=%d unconfigured=%s',
                        $user->id,
                        $dueAt->utc()->toIso8601String(),
                        $result['sent'],
                        $result['failed'],
                        $result['pruned'],
                        $result['skipped'],
                        $result['unconfigured'] === [] ? 'none' : implode(',', $result['unconfigured'])
                    ));
                }
            });

        $this->info("checkins:watch complete (users_scanned={$usersScanned}, overdue={$overdue}, alerted={$alerted})");

        return self::SUCCESS;
    }

    private function parseIsoDate(string $value): ?CarbonImmutable
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/', $value)) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (Throwable) {
            return null;
        }
    }

    private function formatDueTime(CarbonImmutable $dueAt): string
    {
        return $dueAt->utc()->format('M j, Y g:i A \U\T\C');
    }
}
