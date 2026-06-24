<?php

namespace App\Services;

use App\Models\Device;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class PushSender
{
    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     * @return array{sent: int, failed: int, pruned: int, skipped: int, unconfigured: array<int, string>}
     */
    public function sendToUser(User $user, array $payload): array
    {
        $result = [
            'sent' => 0,
            'failed' => 0,
            'pruned' => 0,
            'skipped' => 0,
            'unconfigured' => [],
        ];

        $devices = Device::query()
            ->where('user_id', $user->id)
            ->whereNotNull('push_provider')
            ->get();

        foreach ($devices as $device) {
            if ($device->push_provider === 'webpush') {
                $this->sendWebPush($device, $payload, $result);

                continue;
            }

            if ($device->push_provider === 'apns') {
                $this->sendApns($device, $payload, $result);

                continue;
            }

            $result['skipped']++;
        }

        $result['unconfigured'] = array_values(array_unique($result['unconfigured']));

        return $result;
    }

    public function isProviderConfigured(string $provider): bool
    {
        return match ($provider) {
            'webpush' => $this->webpushConfigured(),
            'apns' => $this->apnsConfigured(),
            default => false,
        };
    }

    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     * @param  array{sent: int, failed: int, pruned: int, skipped: int, unconfigured: array<int, string>}  $result
     */
    private function sendWebPush(Device $device, array $payload, array &$result): void
    {
        if (! $this->webpushConfigured()) {
            $result['skipped']++;
            $result['unconfigured'][] = 'webpush';

            return;
        }

        if (! is_array($device->push_subscription)) {
            $result['failed']++;

            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => trim((string) config('services.webpush.subject', '')),
                    'publicKey' => trim((string) config('services.webpush.vapid_public', '')),
                    'privateKey' => trim((string) config('services.webpush.vapid_private', '')),
                ],
            ], timeout: 10);

            $report = $webPush->sendOneNotification(
                Subscription::create($device->push_subscription),
                json_encode($this->notificationPayload($payload), JSON_THROW_ON_ERROR)
            );
        } catch (Throwable) {
            $result['failed']++;

            return;
        }

        if ($report->isSuccess()) {
            $result['sent']++;

            return;
        }

        if ($report->isSubscriptionExpired()) {
            $this->pruneDevice($device);
            $result['pruned']++;

            return;
        }

        $result['failed']++;
    }

    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     * @param  array{sent: int, failed: int, pruned: int, skipped: int, unconfigured: array<int, string>}  $result
     */
    private function sendApns(Device $device, array $payload, array &$result): void
    {
        if (! $this->apnsConfigured()) {
            $result['skipped']++;
            $result['unconfigured'][] = 'apns';

            return;
        }

        $token = trim((string) $device->push_token);
        if ($token === '') {
            $result['failed']++;

            return;
        }

        try {
            $response = Http::withHeaders([
                'authorization' => 'bearer '.$this->apnsJwt(),
                'apns-topic' => trim((string) config('services.apns.bundle_id', '')),
                'apns-push-type' => 'alert',
                'apns-priority' => '10',
            ])
                ->acceptJson()
                ->timeout(10)
                ->post($this->apnsUrl($token), $this->apnsPayload($payload));
        } catch (Throwable) {
            $result['failed']++;

            return;
        }

        if ($response->successful()) {
            $result['sent']++;

            return;
        }

        $reason = (string) ($response->json('reason') ?? '');
        if ($response->status() === 410 || in_array($reason, ['BadDeviceToken', 'Unregistered'], true)) {
            $this->pruneDevice($device);
            $result['pruned']++;

            return;
        }

        $result['failed']++;
    }

    private function webpushConfigured(): bool
    {
        return trim((string) config('services.webpush.vapid_public', '')) !== ''
            && trim((string) config('services.webpush.vapid_private', '')) !== ''
            && trim((string) config('services.webpush.subject', '')) !== '';
    }

    private function apnsConfigured(): bool
    {
        $keyPath = $this->apnsKeyPath();

        return trim((string) config('services.apns.key_id', '')) !== ''
            && trim((string) config('services.apns.team_id', '')) !== ''
            && trim((string) config('services.apns.bundle_id', '')) !== ''
            && $keyPath !== ''
            && is_readable($keyPath);
    }

    private function apnsJwt(): string
    {
        return JWT::encode([
            'iss' => trim((string) config('services.apns.team_id', '')),
            'iat' => time(),
        ], (string) file_get_contents($this->apnsKeyPath()), 'ES256', trim((string) config('services.apns.key_id', '')));
    }

    private function apnsUrl(string $token): string
    {
        $host = config('services.apns.production') ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

        return "https://{$host}/3/device/{$token}";
    }

    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     * @return array<string, mixed>
     */
    private function apnsPayload(array $payload): array
    {
        $body = [
            'aps' => [
                'alert' => [
                    'title' => $payload['title'],
                    'body' => $payload['body'],
                ],
                'sound' => 'default',
            ],
        ];

        if (filled($payload['url'] ?? null)) {
            $body['url'] = $payload['url'];
        }

        return $body;
    }

    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     * @return array{title: string, body: string, url?: string|null}
     */
    private function notificationPayload(array $payload): array
    {
        return [
            'title' => $payload['title'],
            'body' => $payload['body'],
            'url' => $payload['url'] ?? '/',
        ];
    }

    private function pruneDevice(Device $device): void
    {
        $device->forceFill([
            'push_provider' => null,
            'push_token' => null,
            'push_subscription' => null,
            'push_updated_at' => null,
        ])->save();
    }

    private function apnsKeyPath(): string
    {
        $path = trim((string) config('services.apns.key_path', ''));
        if ($path === '') {
            return '';
        }

        return str_starts_with($path, '/') ? $path : base_path($path);
    }
}
