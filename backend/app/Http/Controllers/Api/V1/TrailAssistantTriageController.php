<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use App\Support\TrailAssistantModeratorGate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantTriageController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const SOURCES = ['web_form', 'email', 'chat'];

    private const SCOPES = ['mine', 'queue'];

    private const QUARANTINE_ACTIONS = ['quarantine', 'release'];

    private const QUARANTINE_REASON_CODES = [
        'command_execution_request',
        'credential_or_token_request',
        'cross_user_data_request',
        'payment_or_identity_bypass',
        'unknown_binary_or_link',
        'other',
    ];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'scope' => ['nullable', 'string', Rule::in(self::SCOPES)],
            'status' => ['nullable', 'string', 'max:24'],
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'search' => ['nullable', 'string', 'max:160'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $scope = (string) ($validated['scope'] ?? 'mine');
        if ($scope === 'queue' && ! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can access the full intake queue.', 403);
        }

        $perPage = (int) ($validated['per_page'] ?? 25);

        $query = $this->applyFilters(
            $this->applyScopeConstraint(TrailAssistantIntake::query()->with('user:id,name,email'), $request, $scope),
            $validated
        )
            ->orderByDesc('received_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage)->appends($request->query());

        $summaryQuery = $this->applyFilters(
            $this->applyScopeConstraint(TrailAssistantIntake::query(), $request, $scope),
            $validated
        );

        return $this->ok([
            'scope' => $scope,
            'items' => collect($paginator->items())
                ->map(fn (TrailAssistantIntake $intake): array => $this->intakePayload($intake))
                ->all(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
            'summary' => [
                'total_filtered' => (clone $summaryQuery)->count(),
                'new_filtered' => (clone $summaryQuery)->where('status', 'new')->count(),
                'quarantined_filtered' => (clone $summaryQuery)->where('status', 'quarantined')->count(),
            ],
            'filters' => [
                'scope' => $scope,
                'status' => $validated['status'] ?? null,
                'route_label' => $validated['route_label'] ?? null,
                'source' => $validated['source'] ?? null,
                'search' => $validated['search'] ?? null,
            ],
        ]);
    }

    public function exportCsv(Request $request)
    {
        $validated = $request->validate([
            'scope' => ['nullable', 'string', Rule::in(self::SCOPES)],
            'status' => ['nullable', 'string', 'max:24'],
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'search' => ['nullable', 'string', 'max:160'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:10000'],
        ]);

        $scope = (string) ($validated['scope'] ?? 'mine');
        if ($scope === 'queue' && ! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can export the full intake queue.', 403);
        }

        $limit = (int) ($validated['limit'] ?? 2000);

        $rows = $this->applyFilters(
            $this->applyScopeConstraint(TrailAssistantIntake::query()->with('user:id,name,email'), $request, $scope),
            $validated
        )
            ->orderByDesc('received_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        $filename = sprintf('trail-assistant-intakes-%s.csv', now()->format('Ymd-His'));

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            if (! is_resource($out)) {
                return;
            }

            fputcsv($out, [
                'intake_id',
                'status',
                'route_label',
                'source',
                'name',
                'email',
                'subject',
                'message',
                'received_at',
                'created_at',
                'user_id',
                'user_email',
                'security_is_quarantined',
                'security_incident_status',
                'security_reason_code',
                'security_reason_note',
            ]);

            foreach ($rows as $intake) {
                $metadata = is_array($intake->metadata) ? $intake->metadata : [];
                $security = is_array($metadata['security'] ?? null) ? $metadata['security'] : [];

                fputcsv($out, [
                    $intake->intake_id,
                    $intake->status,
                    $intake->route_label,
                    $intake->source,
                    $intake->name,
                    $intake->email,
                    $intake->subject,
                    Str::limit(str_replace(["\r\n", "\r"], "\n", (string) $intake->message), 12000, ''),
                    $intake->received_at?->toISOString(),
                    $intake->created_at?->toISOString(),
                    $intake->user_id,
                    $intake->user?->email,
                    (bool) ($security['is_quarantined'] ?? false) ? 'true' : 'false',
                    $security['incident_status'] ?? '',
                    $security['reason_code'] ?? '',
                    $security['reason_note'] ?? '',
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    public function quarantine(Request $request, string $intakeId)
    {
        if (! $this->isModerator($request)) {
            return $this->fail('forbidden', 'Only moderators can quarantine or release suspicious requests.', 403);
        }

        $validated = $request->validate([
            'action' => ['required', 'string', Rule::in(self::QUARANTINE_ACTIONS)],
            'reason_code' => [
                'nullable',
                'string',
                Rule::in(self::QUARANTINE_REASON_CODES),
                'required_if:action,quarantine',
            ],
            'note' => ['nullable', 'string', 'max:280'],
        ]);

        $action = (string) $validated['action'];
        $reasonCode = isset($validated['reason_code']) ? (string) $validated['reason_code'] : null;
        $note = isset($validated['note'])
            ? $this->normalizeText((string) $validated['note'], 280)
            : null;

        $intake = TrailAssistantIntake::query()->where('intake_id', $intakeId)->firstOrFail();

        if ($action === 'quarantine' && $intake->status === 'quarantined') {
            $metadata = is_array($intake->metadata) ? $intake->metadata : [];
            $security = is_array($metadata['security'] ?? null) ? $metadata['security'] : [];

            return $this->ok([
                'intake' => $this->intakePayload($intake),
                'quarantine' => $this->quarantinePayload($security),
                'already_in_state' => true,
            ]);
        }

        if ($action === 'release' && $intake->status !== 'quarantined') {
            return $this->fail('intake_not_quarantined', 'Intake is not currently quarantined.', 422);
        }

        $metadata = is_array($intake->metadata) ? $intake->metadata : [];
        $security = is_array($metadata['security'] ?? null) ? $metadata['security'] : [];

        $history = is_array($security['history'] ?? null) ? $security['history'] : [];
        $history[] = array_filter([
            'action' => $action === 'quarantine' ? 'quarantined' : 'released',
            'at' => now()->toISOString(),
            'reason_code' => $reasonCode,
            'note' => $note,
            'actor' => [
                'id' => (string) $request->user()->id,
                'email' => $request->user()->email,
            ],
            'request_id' => request()->header('x-request-id'),
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
        $history = array_slice(array_values($history), -30);

        if ($action === 'quarantine') {
            $security = array_merge($security, [
                'is_quarantined' => true,
                'requires_security_review' => true,
                'incident_status' => 'pending_review',
                'reason_code' => $reasonCode,
                'reason_note' => $note,
                'prior_status' => $this->normalizeStatus($intake->status) ?? 'new',
                'quarantined_at' => now()->toISOString(),
                'quarantined_by' => [
                    'id' => (string) $request->user()->id,
                    'email' => $request->user()->email,
                ],
            ]);

            $intake->status = 'quarantined';
        } else {
            $security = array_merge($security, [
                'is_quarantined' => false,
                'incident_status' => 'cleared',
                'released_at' => now()->toISOString(),
                'released_by' => [
                    'id' => (string) $request->user()->id,
                    'email' => $request->user()->email,
                ],
            ]);

            if ($note !== null) {
                $security['release_note'] = $note;
            }

            $intake->status = $this->statusForRelease($security['prior_status'] ?? null);
        }

        $security['history'] = $history;
        $metadata['security'] = $security;

        $intake->metadata = $metadata;
        $intake->save();

        return $this->ok([
            'intake' => $this->intakePayload($intake),
            'quarantine' => $this->quarantinePayload($security),
            'already_in_state' => false,
        ]);
    }

    /**
     * @param  array{status?:string,route_label?:string,source?:string,search?:string}  $filters
     */
    private function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                isset($filters['status']) && trim((string) $filters['status']) !== '',
                fn (Builder $builder): Builder => $builder->where('status', trim((string) $filters['status']))
            )
            ->when(
                isset($filters['route_label']) && trim((string) $filters['route_label']) !== '',
                fn (Builder $builder): Builder => $builder->where('route_label', trim((string) $filters['route_label']))
            )
            ->when(
                isset($filters['source']) && trim((string) $filters['source']) !== '',
                fn (Builder $builder): Builder => $builder->where('source', trim((string) $filters['source']))
            )
            ->when(
                isset($filters['search']) && trim((string) $filters['search']) !== '',
                function (Builder $builder) use ($filters): Builder {
                    $needle = trim((string) $filters['search']);

                    return $builder->where(function (Builder $where) use ($needle): void {
                        $where->where('intake_id', 'like', "%{$needle}%")
                            ->orWhere('name', 'like', "%{$needle}%")
                            ->orWhere('email', 'like', "%{$needle}%")
                            ->orWhere('subject', 'like', "%{$needle}%")
                            ->orWhere('message', 'like', "%{$needle}%");
                    });
                }
            );
    }

    private function applyScopeConstraint(Builder $query, Request $request, string $scope): Builder
    {
        if ($scope === 'mine') {
            return $query->where('user_id', $request->user()->id);
        }

        return $query;
    }

    private function isModerator(Request $request): bool
    {
        return TrailAssistantModeratorGate::canModerate($request->user());
    }

    private function statusForRelease(mixed $candidate): string
    {
        if (! is_string($candidate)) {
            return 'new';
        }

        $normalized = $this->normalizeStatus($candidate);
        if ($normalized === null || $normalized === 'quarantined') {
            return 'new';
        }

        return $normalized;
    }

    private function normalizeStatus(string $status): ?string
    {
        $normalized = Str::of($status)
            ->trim()
            ->limit(24, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeText(string $value, int $max): string
    {
        return Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($max, '')
            ->toString();
    }

    /**
     * @param  array<string, mixed>  $security
     */
    private function quarantinePayload(array $security): array
    {
        $history = is_array($security['history'] ?? null) ? $security['history'] : [];

        return [
            'is_quarantined' => (bool) ($security['is_quarantined'] ?? false),
            'requires_security_review' => (bool) ($security['requires_security_review'] ?? false),
            'incident_status' => $security['incident_status'] ?? null,
            'reason_code' => $security['reason_code'] ?? null,
            'reason_note' => $security['reason_note'] ?? null,
            'quarantined_at' => $security['quarantined_at'] ?? null,
            'released_at' => $security['released_at'] ?? null,
            'history' => array_slice(array_values($history), -10),
        ];
    }

    private function intakePayload(TrailAssistantIntake $intake): array
    {
        return [
            'intake_id' => $intake->intake_id,
            'status' => $intake->status,
            'route_label' => $intake->route_label,
            'source' => $intake->source,
            'name' => $intake->name,
            'email' => $intake->email,
            'subject' => $intake->subject,
            'message_excerpt' => Str::limit($intake->message, 280),
            'received_at' => $intake->received_at?->toISOString(),
            'created_at' => $intake->created_at?->toISOString(),
            'user' => $intake->user ? [
                'id' => (string) $intake->user->id,
                'name' => $intake->user->name,
                'email' => $intake->user->email,
            ] : null,
        ];
    }
}
