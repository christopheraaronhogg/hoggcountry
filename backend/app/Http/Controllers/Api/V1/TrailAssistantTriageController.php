<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantTriageController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const SOURCES = ['web_form', 'email', 'chat'];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:24'],
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'search' => ['nullable', 'string', 'max:160'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 25);

        $query = $this->applyFilters(
            TrailAssistantIntake::query()->with('user:id,name,email'),
            $validated
        )
            ->orderByDesc('received_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage)->appends($request->query());

        $summaryQuery = $this->applyFilters(TrailAssistantIntake::query(), $validated);

        return $this->ok([
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
            ],
            'filters' => [
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
            'status' => ['nullable', 'string', 'max:24'],
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'search' => ['nullable', 'string', 'max:160'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:10000'],
        ]);

        $limit = (int) ($validated['limit'] ?? 2000);

        $rows = $this->applyFilters(
            TrailAssistantIntake::query()->with('user:id,name,email'),
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
            ]);

            foreach ($rows as $intake) {
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
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * @param array{status?:string,route_label?:string,source?:string,search?:string} $filters
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
