<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Device;
use Illuminate\Http\Request;

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
