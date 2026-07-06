<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Device;
use App\Models\SyncChange;
use App\Models\SyncDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SyncController extends ApiController
{
    public function bootstrap(Request $request)
    {
        $docs = SyncDocument::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('doc_type')
            ->orderBy('doc_id')
            ->get();

        $cursor = (int) (SyncChange::query()
            ->where('user_id', $request->user()->id)
            ->max('seq') ?? 0);

        return $this->ok([
            'docs' => $docs->map(fn (SyncDocument $doc): array => $this->documentPayload($doc))->all(),
            'cursor' => (string) $cursor,
            'server_time' => now()->utc()->toIso8601String(),
        ]);
    }

    public function push(Request $request)
    {
        $validated = $request->validate([
            'device_id' => ['required', 'uuid'],
            'changes' => ['required', 'array', 'min:1'],
            'changes.*.op' => ['required', 'in:upsert,delete'],
            'changes.*.doc_type' => ['required', 'string', 'max:100'],
            'changes.*.doc_id' => ['required', 'string', 'max:100'],
            'changes.*.schema_version' => ['nullable', 'integer', 'min:1'],
            'changes.*.client_updated_at' => ['required', 'date'],
            'changes.*.etag' => ['required', 'string', 'max:64'],
            'changes.*.content' => ['nullable', 'array'],
        ]);

        $device = Device::query()
            ->where('id', $validated['device_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $device) {
            return $this->fail('unknown_device', 'Device is not registered for this account.', 422);
        }

        foreach ($validated['changes'] as $index => $change) {
            if ($change['op'] === 'upsert' && ! array_key_exists('content', $change)) {
                return $this->fail(
                    'invalid_change',
                    "changes.{$index}.content is required for upsert operations.",
                    422
                );
            }
        }

        $device->forceFill(['last_seen_at' => now()])->save();

        $applied = [];
        $rejected = [];

        DB::transaction(function () use ($request, $validated, $device, &$applied, &$rejected): void {
            foreach ($validated['changes'] as $change) {
                $docType = $change['doc_type'];
                $docId = $change['doc_id'];
                $op = $change['op'];
                $incomingClientUpdatedAt = Carbon::parse($change['client_updated_at'])->utc();

                $existing = SyncDocument::query()
                    ->where('user_id', $request->user()->id)
                    ->where('doc_type', $docType)
                    ->where('doc_id', $docId)
                    ->lockForUpdate()
                    ->first();

                if (
                    $existing &&
                    $incomingClientUpdatedAt->equalTo($existing->client_updated_at) &&
                    $change['etag'] === $existing->etag
                ) {
                    $applied[] = [
                        'seq' => null,
                        'doc_type' => $existing->doc_type,
                        'doc_id' => $existing->doc_id,
                        'op' => $existing->deleted_at ? 'delete' : 'upsert',
                        'schema_version' => $existing->schema_version,
                        'server_updated_at' => $existing->server_updated_at->toISOString(),
                        'etag' => $existing->etag,
                    ];

                    continue;
                }

                if ($existing && $incomingClientUpdatedAt->lt($existing->client_updated_at)) {
                    $rejected[] = $this->rejectedPayload($existing, $change, 'stale_client_updated_at');

                    continue;
                }

                if (
                    $existing &&
                    $incomingClientUpdatedAt->equalTo($existing->client_updated_at) &&
                    $change['etag'] !== $existing->etag &&
                    strcmp($device->id, (string) $existing->last_device_id) <= 0
                ) {
                    $rejected[] = $this->rejectedPayload($existing, $change, 'tie_breaker_lost');

                    continue;
                }

                $serverUpdatedAt = now()->utc();
                $schemaVersion = (int) ($change['schema_version'] ?? $existing?->schema_version ?? 1);
                $content = $op === 'upsert' ? ($change['content'] ?? []) : $existing?->content;
                $deletedAt = $op === 'delete' ? $serverUpdatedAt : null;

                $document = SyncDocument::query()->updateOrCreate(
                    [
                        'user_id' => $request->user()->id,
                        'doc_type' => $docType,
                        'doc_id' => $docId,
                    ],
                    [
                        'schema_version' => $schemaVersion,
                        'content' => $content,
                        'etag' => $change['etag'],
                        'client_updated_at' => $incomingClientUpdatedAt,
                        'server_updated_at' => $serverUpdatedAt,
                        'last_device_id' => $device->id,
                        'deleted_at' => $deletedAt,
                    ]
                );

                $syncChange = SyncChange::query()->create([
                    'user_id' => $request->user()->id,
                    'doc_type' => $docType,
                    'doc_id' => $docId,
                    'op' => $op,
                    'schema_version' => $schemaVersion,
                    'server_updated_at' => $serverUpdatedAt,
                    'payload' => $op === 'upsert' ? $content : null,
                    'etag' => $document->etag,
                ]);

                $applied[] = [
                    'seq' => (string) $syncChange->seq,
                    'doc_type' => $document->doc_type,
                    'doc_id' => $document->doc_id,
                    'op' => $op,
                    'schema_version' => $document->schema_version,
                    'server_updated_at' => $document->server_updated_at->toISOString(),
                    'etag' => $document->etag,
                ];
            }
        });

        $cursor = (int) (SyncChange::query()
            ->where('user_id', $request->user()->id)
            ->max('seq') ?? 0);

        return $this->ok([
            'applied' => $applied,
            'rejected' => $rejected,
            'cursor' => (string) $cursor,
        ]);
    }

    public function pull(Request $request)
    {
        $validated = $request->validate([
            'cursor' => ['nullable', 'integer', 'min:0'],
        ]);

        $cursor = (int) ($validated['cursor'] ?? 0);

        $changes = SyncChange::query()
            ->where('user_id', $request->user()->id)
            ->where('seq', '>', $cursor)
            ->orderBy('seq')
            ->limit(250)
            ->get();

        $nextCursor = $changes->isEmpty() ? $cursor : (int) $changes->last()->seq;

        return $this->ok([
            'changes' => $changes->map(function (SyncChange $change): array {
                return [
                    'seq' => (string) $change->seq,
                    'doc_type' => $change->doc_type,
                    'doc_id' => $change->doc_id,
                    'op' => $change->op,
                    'schema_version' => $change->schema_version,
                    'server_updated_at' => $change->server_updated_at->toISOString(),
                    'etag' => $change->etag,
                    'content' => $change->payload,
                ];
            })->all(),
            'next_cursor' => (string) $nextCursor,
        ]);
    }

    private function documentPayload(SyncDocument $document): array
    {
        return [
            'doc_type' => $document->doc_type,
            'doc_id' => $document->doc_id,
            'schema_version' => $document->schema_version,
            'op' => $document->deleted_at ? 'delete' : 'upsert',
            'content' => $document->deleted_at ? null : $document->content,
            'etag' => $document->etag,
            'client_updated_at' => $document->client_updated_at->toISOString(),
            'server_updated_at' => $document->server_updated_at->toISOString(),
            'last_device_id' => $document->last_device_id,
        ];
    }

    private function rejectedPayload(SyncDocument $existing, array $incoming, string $reason): array
    {
        return [
            'doc_type' => $incoming['doc_type'],
            'doc_id' => $incoming['doc_id'],
            'reason' => $reason,
            'server' => [
                'schema_version' => $existing->schema_version,
                'etag' => $existing->etag,
                'client_updated_at' => $existing->client_updated_at?->toISOString(),
                'server_updated_at' => $existing->server_updated_at?->toISOString(),
                'last_device_id' => $existing->last_device_id,
                'deleted_at' => $existing->deleted_at?->toISOString(),
            ],
        ];
    }
}
