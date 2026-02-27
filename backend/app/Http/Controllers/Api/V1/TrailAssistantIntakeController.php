<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantIntakeController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const SOURCES = ['web_form', 'email', 'chat'];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_label' => ['required', 'string', Rule::in(self::ROUTE_LABELS)],
            'source' => ['nullable', 'string', Rule::in(self::SOURCES)],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:12000'],
            'metadata' => ['nullable', 'array'],
        ]);

        $intake = TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_'.Str::lower(Str::random(12)),
            'route_label' => $validated['route_label'],
            'source' => (string) ($validated['source'] ?? 'web_form'),
            'name' => $this->nullableText((string) ($validated['name'] ?? ''), 120),
            'email' => $this->nullableEmail((string) ($validated['email'] ?? '')),
            'subject' => $this->normalizeText((string) $validated['subject'], 160),
            'message' => $this->normalizeText((string) $validated['message'], 12000),
            'metadata' => $this->normalizeMetadata($validated['metadata'] ?? []),
            'status' => 'new',
            'received_at' => now(),
        ]);

        return $this->ok([
            'intake_id' => $intake->intake_id,
            'route_label' => $intake->route_label,
            'source' => $intake->source,
            'status' => $intake->status,
            'received_at' => $intake->received_at?->toISOString(),
            'routing_labels' => self::ROUTE_LABELS,
        ], 201);
    }

    private function normalizeText(string $value, int $limit = 4000): string
    {
        return Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($limit, '')
            ->toString();
    }

    private function nullableText(string $value, int $limit): ?string
    {
        $normalized = $this->normalizeText($value, $limit);

        return $normalized === '' ? null : $normalized;
    }

    private function nullableEmail(string $value): ?string
    {
        $normalized = Str::of($value)
            ->trim()
            ->lower()
            ->limit(190, '')
            ->toString();

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeMetadata(mixed $value, int $depth = 0): mixed
    {
        if ($depth >= 4) {
            return [];
        }

        if (! is_array($value)) {
            if (is_bool($value) || is_int($value) || is_float($value) || is_null($value)) {
                return $value;
            }

            return $this->normalizeText((string) $value, 300);
        }

        if (array_is_list($value)) {
            $normalized = [];
            foreach ($value as $entry) {
                $normalized[] = $this->normalizeMetadata($entry, $depth + 1);
                if (count($normalized) >= 20) {
                    break;
                }
            }

            return $normalized;
        }

        $normalized = [];
        foreach ($value as $key => $entry) {
            $normalizedKey = Str::of((string) $key)
                ->ascii()
                ->replaceMatches('/[^A-Za-z0-9_\-.]+/', '_')
                ->trim('_')
                ->limit(60, '')
                ->toString();

            if ($normalizedKey === '') {
                continue;
            }

            $normalized[$normalizedKey] = $this->normalizeMetadata($entry, $depth + 1);
            if (count($normalized) >= 40) {
                break;
            }
        }

        ksort($normalized);

        return $normalized;
    }
}
