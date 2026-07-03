<?php

namespace App\Console\Commands;

use App\Models\MobileDiagnostic;
use Illuminate\Console\Command;

class MobileDiagnosticsCommand extends Command
{
    protected $signature = 'mobile:diagnostics
        {--install= : Restrict to one install id}
        {--name= : Restrict to one event name}
        {--severity= : Restrict to one severity}
        {--limit=25 : Max events to show}
        {--json : Emit raw JSON instead of a table}';

    protected $description = 'Show recent mobile diagnostics for Scout troubleshooting';

    public function handle(): int
    {
        $limit = max(1, min(200, (int) ($this->option('limit') ?? 25)));

        $query = MobileDiagnostic::query()->latest('created_at')->limit($limit);

        foreach (['install' => 'install_id', 'name' => 'name', 'severity' => 'severity'] as $option => $column) {
            $value = trim((string) ($this->option($option) ?? ''));
            if ($value !== '') {
                $query->where($column, $value);
            }
        }

        $events = $query->get();
        if ($events->isEmpty()) {
            $this->info('No mobile diagnostics found.');

            return self::SUCCESS;
        }

        $rows = $events->map(fn (MobileDiagnostic $event): array => [
            'created_at' => $event->created_at?->toIso8601String() ?? '',
            'severity' => $event->severity,
            'name' => $event->name,
            'install_id' => $event->install_id,
            'session_id' => $event->session_id,
            'platform' => $event->platform,
            'native' => $event->native,
            'context' => $event->context ?? [],
            'context_summary' => $this->contextSummary($event->context ?? []),
        ])->values();

        if ((bool) $this->option('json')) {
            $this->line((string) json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return self::SUCCESS;
        }

        $this->table(
            ['created_at', 'severity', 'name', 'install', 'platform', 'native', 'context'],
            $rows->map(fn (array $event): array => [
                $event['created_at'],
                $event['severity'],
                $event['name'],
                $event['install_id'],
                $event['platform'] ?? '',
                $event['native'] === null ? '' : ($event['native'] ? 'yes' : 'no'),
                $event['context_summary'],
            ])->all()
        );

        return self::SUCCESS;
    }

    /**
     * @param  array<string,mixed>  $context
     */
    private function contextSummary(array $context): string
    {
        $keys = [
            'phase',
            'provider',
            'mode',
            'reason',
            'error_name',
            'error_summary',
            'model_state',
            'model_id',
            'auto_start',
            'online_status',
            'signed_in',
        ];

        $summary = [];
        foreach ($keys as $key) {
            if (array_key_exists($key, $context)) {
                $summary[$key] = $context[$key];
            }
        }

        return (string) json_encode($summary, JSON_UNESCAPED_SLASHES);
    }
}
