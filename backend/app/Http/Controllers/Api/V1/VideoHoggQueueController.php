<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\VideoHoggRun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class VideoHoggQueueController extends ApiController
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to access VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:queued,processing,done,failed'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
            'mine_only' => ['nullable', 'boolean'],
        ]);

        $limit = (int) ($validated['limit'] ?? 25);
        $mineOnly = filter_var($validated['mine_only'] ?? true, FILTER_VALIDATE_BOOL);

        $query = VideoHoggRun::query()->orderByDesc('created_at');

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if ($mineOnly) {
            $query->where('user_id', $user->id);
        }

        $runs = $query->limit($limit)->get()->map(fn (VideoHoggRun $run): array => $this->serializeRun($run))->all();

        return $this->ok([
            'runs' => $runs,
            'count' => count($runs),
        ]);
    }

    public function show(Request $request, string $runId)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to access VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'with_manifest' => ['nullable', 'boolean'],
        ]);

        /** @var VideoHoggRun|null $run */
        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        if (! $run) {
            return $this->fail('not_found', 'Run not found.', 404);
        }

        if ((string) $run->user_id !== (string) $user->id) {
            return $this->fail('forbidden', 'You can only access your own VideoHogg runs.', 403);
        }

        $withManifest = filter_var($validated['with_manifest'] ?? false, FILTER_VALIDATE_BOOL);

        return $this->ok([
            'run' => $this->serializeRun($run, $withManifest),
        ]);
    }

    public function claim(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to process VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'worker_id' => ['nullable', 'string', 'max:120'],
            'claim_ttl_seconds' => ['nullable', 'integer', 'min:60', 'max:7200'],
            'force_run_id' => ['nullable', 'string', 'max:40'],
        ]);

        $workerId = trim((string) ($validated['worker_id'] ?? ''));
        if ($workerId === '') {
            $workerId = 'worker-'.Str::lower(Str::random(8));
        }

        $claimTtl = (int) ($validated['claim_ttl_seconds'] ?? 900);
        $forceRunId = trim((string) ($validated['force_run_id'] ?? ''));
        $now = now();

        $run = DB::transaction(function () use ($claimTtl, $forceRunId, $now, $workerId): ?VideoHoggRun {
            VideoHoggRun::query()
                ->where('status', 'processing')
                ->whereNotNull('claim_expires_at')
                ->where('claim_expires_at', '<', $now)
                ->update([
                    'status' => 'queued',
                    'claimed_by' => null,
                    'claimed_at' => null,
                    'claim_expires_at' => null,
                    'last_heartbeat_at' => null,
                ]);

            $query = VideoHoggRun::query()->where('status', 'queued');
            if ($forceRunId !== '') {
                $query->where('run_id', $forceRunId);
            }

            /** @var VideoHoggRun|null $candidate */
            $candidate = $query
                ->orderBy('created_at')
                ->lockForUpdate()
                ->first();

            if (! $candidate) {
                return null;
            }

            $candidate->status = 'processing';
            $candidate->claimed_by = $workerId;
            $candidate->claimed_at = $now;
            $candidate->claim_expires_at = $now->copy()->addSeconds($claimTtl);
            $candidate->last_heartbeat_at = $now;
            $candidate->started_at = $candidate->started_at ?? $now;
            $candidate->save();

            return $candidate->fresh();
        });

        if (! $run) {
            return $this->ok([
                'worker_id' => $workerId,
                'claimed' => false,
                'run' => null,
            ]);
        }

        return $this->ok([
            'worker_id' => $workerId,
            'claimed' => true,
            'run' => $this->serializeRun($run, true),
        ]);
    }

    public function heartbeat(Request $request, string $runId)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to process VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'worker_id' => ['required', 'string', 'max:120'],
            'claim_ttl_seconds' => ['nullable', 'integer', 'min:60', 'max:7200'],
        ]);

        $workerId = trim((string) $validated['worker_id']);
        $claimTtl = (int) ($validated['claim_ttl_seconds'] ?? 900);

        /** @var VideoHoggRun|null $run */
        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        if (! $run) {
            return $this->fail('not_found', 'Run not found.', 404);
        }

        if ($run->status !== 'processing') {
            return $this->fail('invalid_state', 'Run is not in processing state.', 409);
        }

        if (! is_null($run->claimed_by) && $run->claimed_by !== $workerId) {
            return $this->fail('claim_mismatch', 'Run is claimed by a different worker.', 409);
        }

        $now = now();
        $run->claimed_by = $workerId;
        $run->last_heartbeat_at = $now;
        $run->claim_expires_at = $now->copy()->addSeconds($claimTtl);
        $run->save();

        return $this->ok([
            'run' => $this->serializeRun($run),
            'heartbeat_at' => $now->toIso8601String(),
        ]);
    }

    public function complete(Request $request, string $runId)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to process VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'worker_id' => ['nullable', 'string', 'max:120'],
            'output_path' => ['nullable', 'string', 'max:255'],
            'output_url' => ['nullable', 'string', 'max:1000'],
            'extra' => ['nullable', 'array'],
        ]);

        /** @var VideoHoggRun|null $run */
        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        if (! $run) {
            return $this->fail('not_found', 'Run not found.', 404);
        }

        $workerId = trim((string) ($validated['worker_id'] ?? ''));
        if ($workerId !== '' && ! is_null($run->claimed_by) && $run->claimed_by !== $workerId) {
            return $this->fail('claim_mismatch', 'Run is claimed by a different worker.', 409);
        }

        $run->status = 'done';
        $run->completed_at = now();
        $run->failed_at = null;
        $run->failure_code = null;
        $run->failure_message = null;
        $run->claimed_by = null;
        $run->claimed_at = null;
        $run->claim_expires_at = null;
        $run->last_heartbeat_at = null;
        $run->output_path = trim((string) ($validated['output_path'] ?? '')) ?: null;
        $run->output_url = trim((string) ($validated['output_url'] ?? '')) ?: null;
        $run->extra = is_array($validated['extra'] ?? null)
            ? array_merge((array) $run->extra, $validated['extra'])
            : $run->extra;
        $run->save();

        return $this->ok([
            'run' => $this->serializeRun($run),
        ]);
    }

    public function markFailed(Request $request, string $runId)
    {
        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to process VideoHogg queue.', 403);
        }

        $validated = $request->validate([
            'worker_id' => ['nullable', 'string', 'max:120'],
            'failure_code' => ['nullable', 'string', 'max:80'],
            'failure_message' => ['required', 'string', 'max:5000'],
            'extra' => ['nullable', 'array'],
        ]);

        /** @var VideoHoggRun|null $run */
        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        if (! $run) {
            return $this->fail('not_found', 'Run not found.', 404);
        }

        $workerId = trim((string) ($validated['worker_id'] ?? ''));
        if ($workerId !== '' && ! is_null($run->claimed_by) && $run->claimed_by !== $workerId) {
            return $this->fail('claim_mismatch', 'Run is claimed by a different worker.', 409);
        }

        $run->status = 'failed';
        $run->failed_at = now();
        $run->claimed_by = null;
        $run->claimed_at = null;
        $run->claim_expires_at = null;
        $run->last_heartbeat_at = null;
        $run->failure_code = trim((string) ($validated['failure_code'] ?? '')) ?: 'worker_failed';
        $run->failure_message = trim((string) $validated['failure_message']);
        $run->extra = is_array($validated['extra'] ?? null)
            ? array_merge((array) $run->extra, $validated['extra'])
            : $run->extra;
        $run->save();

        return $this->ok([
            'run' => $this->serializeRun($run),
        ]);
    }

    private function serializeRun(VideoHoggRun $run, bool $withManifest = false): array
    {
        $payload = [
            'run_id' => $run->run_id,
            'status' => $run->status,
            'user_id' => (string) $run->user_id,
            'storage_disk' => $run->storage_disk,
            'base_path' => $run->base_path,
            'manifest_path' => $run->manifest_path,
            'manifest_url' => $run->manifest_url,
            'notes_path' => $run->notes_path,
            'uploaded_count' => $run->uploaded_count,
            'noted_count' => $run->noted_count,
            'total_bytes' => $run->total_bytes,
            'claimed_by' => $run->claimed_by,
            'claimed_at' => optional($run->claimed_at)?->toIso8601String(),
            'claim_expires_at' => optional($run->claim_expires_at)?->toIso8601String(),
            'last_heartbeat_at' => optional($run->last_heartbeat_at)?->toIso8601String(),
            'started_at' => optional($run->started_at)?->toIso8601String(),
            'completed_at' => optional($run->completed_at)?->toIso8601String(),
            'failed_at' => optional($run->failed_at)?->toIso8601String(),
            'output_path' => $run->output_path,
            'output_url' => $run->output_url,
            'failure_code' => $run->failure_code,
            'failure_message' => $run->failure_message,
            'extra' => $run->extra,
            'created_at' => optional($run->created_at)?->toIso8601String(),
            'updated_at' => optional($run->updated_at)?->toIso8601String(),
        ];

        if ($withManifest) {
            $payload['manifest'] = $this->loadManifest($run);
        }

        return $payload;
    }

    private function loadManifest(VideoHoggRun $run): ?array
    {
        try {
            if (! Storage::disk($run->storage_disk)->exists($run->manifest_path)) {
                return null;
            }

            $raw = Storage::disk($run->storage_disk)->get($run->manifest_path);
            if (! is_string($raw) || trim($raw) === '') {
                return null;
            }

            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : null;
        } catch (Throwable) {
            return null;
        }
    }

    private function isAllowedEmail(string $email): bool
    {
        $allowedEmails = collect(explode(',', (string) env('VIDEOHOGG_ALLOWED_EMAILS', 'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com,chris.stitchscreen@gmail.com')))
            ->map(static fn (string $value): string => Str::lower(trim($value)))
            ->filter(static fn (string $value): bool => $value !== '')
            ->values();

        if ($allowedEmails->isEmpty()) {
            return false;
        }

        return $allowedEmails->contains(Str::lower(trim($email)));
    }
}
