<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Device;
use App\Services\PushSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceController extends ApiController
{
    public function index(Request $request)
    {
        $devices = Device::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_seen_at')
            ->get();

        return $this->ok([
            'devices' => $devices->map(fn (Device $device): array => $this->devicePayload($device))->all(),
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'device_id' => ['required', 'uuid'],
            'platform' => ['required', 'string', 'max:32'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $existing = Device::find($validated['device_id']);
        if ($existing && $existing->user_id !== $request->user()->id) {
            return $this->fail('device_conflict', 'Device ID is already bound to another account.', 409);
        }

        $device = Device::updateOrCreate(
            [
                'id' => $validated['device_id'],
                'user_id' => $request->user()->id,
            ],
            [
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'last_seen_at' => now(),
            ]
        );

        return $this->ok([
            'device' => $this->devicePayload($device),
        ], 201);
    }

    public function storePush(Request $request, PushSender $pushSender): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'uuid'],
            'provider' => ['required', Rule::in(['webpush', 'apns'])],
            'subscription' => ['required_if:provider,webpush', 'array'],
            'subscription.endpoint' => ['required_if:provider,webpush', 'string', 'url'],
            'subscription.keys' => ['required_if:provider,webpush', 'array'],
            'subscription.keys.p256dh' => ['required_if:provider,webpush', 'string'],
            'subscription.keys.auth' => ['required_if:provider,webpush', 'string'],
            'token' => ['required_if:provider,apns', 'string', 'max:4096'],
        ]);

        if ($conflict = $this->deviceConflictResponse($request, $validated['device_id'])) {
            return $conflict;
        }

        if (! $pushSender->isProviderConfigured($validated['provider'])) {
            return $this->fail(
                'push_provider_not_configured',
                'Push notifications are not configured for this provider on this server.',
                503,
                ['provider' => $validated['provider']]
            );
        }

        $provider = $validated['provider'];
        $device = Device::updateOrCreate(
            [
                'id' => $validated['device_id'],
                'user_id' => $request->user()->id,
            ],
            [
                'push_provider' => $provider,
                'push_token' => $provider === 'apns' ? $validated['token'] : null,
                'push_subscription' => $provider === 'webpush' ? $validated['subscription'] : null,
                'push_updated_at' => now(),
            ]
        );

        return $this->ok([
            'device_id' => $device->id,
            'push_provider' => $device->push_provider,
            'push_updated_at' => $device->push_updated_at?->toISOString(),
        ]);
    }

    public function destroyPush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => ['required', 'uuid'],
        ]);

        if ($conflict = $this->deviceConflictResponse($request, $validated['device_id'])) {
            return $conflict;
        }

        $device = Device::query()
            ->where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $device) {
            return $this->fail('not_found', 'Device not found.', 404);
        }

        $device->forceFill($this->blankPushFields())->save();

        return $this->ok([
            'device_id' => $device->id,
            'deleted' => true,
        ]);
    }

    public function testPush(Request $request, PushSender $pushSender): JsonResponse
    {
        $devices = Device::query()
            ->where('user_id', $request->user()->id)
            ->whereNotNull('push_provider')
            ->get();

        if ($devices->isEmpty()) {
            return $this->fail('push_devices_not_found', 'No push-enabled devices are registered for this account.', 404);
        }

        $configuredProvider = $devices
            ->pluck('push_provider')
            ->unique()
            ->contains(fn (string $provider): bool => $pushSender->isProviderConfigured($provider));

        if (! $configuredProvider) {
            return $this->fail('push_provider_not_configured', 'Push notifications are not configured on this server.', 503);
        }

        $result = $pushSender->sendToUser($request->user(), [
            'title' => 'Hogg Country',
            'body' => "Hogg Country push is live \u{1F392}",
            'url' => '/',
        ]);

        return $this->ok([
            'sent' => $result['sent'],
            'failed' => $result['failed'],
            'pruned' => $result['pruned'],
            'skipped' => $result['skipped'],
        ]);
    }

    public function destroy(Request $request, string $deviceId)
    {
        $device = Device::query()
            ->where('id', $deviceId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $device) {
            return $this->fail('not_found', 'Device not found.', 404);
        }

        $device->delete();

        return $this->ok([
            'device_id' => $deviceId,
            'deleted' => true,
        ]);
    }

    private function deviceConflictResponse(Request $request, string $deviceId): ?JsonResponse
    {
        $existing = Device::find($deviceId);

        if ($existing && $existing->user_id !== $request->user()->id) {
            return $this->fail('device_conflict', 'Device ID is already bound to another account.', 409);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function blankPushFields(): array
    {
        return [
            'push_provider' => null,
            'push_token' => null,
            'push_subscription' => null,
            'push_updated_at' => null,
        ];
    }

    private function devicePayload(Device $device): array
    {
        return [
            'device_id' => $device->id,
            'platform' => $device->platform,
            'device_name' => $device->device_name,
            'last_seen_at' => $device->last_seen_at?->toISOString(),
        ];
    }
}
