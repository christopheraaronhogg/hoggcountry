<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\TrailAssistantIntake;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TrailAssistantChatController extends ApiController
{
    private const ROUTE_LABELS = ['pre-trail', 'on-trail', 'post-finish'];

    private const URGENCY = ['normal', 'soon', 'urgent'];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'route_label' => ['nullable', 'string', Rule::in(self::ROUTE_LABELS)],
            'subject' => ['nullable', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:12000'],
            'urgency' => ['nullable', 'string', Rule::in(self::URGENCY)],
            'metadata' => ['nullable', 'array'],
        ]);

        $user = $request->user();
        $metadata = $this->normalizeMetadata($validated['metadata'] ?? []);
        $metadata['urgency'] = (string) ($validated['urgency'] ?? 'normal');

        $intake = TrailAssistantIntake::query()->create([
            'intake_id' => 'ta_'.Str::lower(Str::random(12)),
            'user_id' => $user->id,
            'route_label' => (string) ($validated['route_label'] ?? 'on-trail'),
            'source' => 'chat',
            'name' => $this->nullableText((string) $user->name, 120),
            'email' => $this->nullableEmail((string) $user->email),
            'subject' => $this->normalizeText((string) ($validated['subject'] ?? 'Trail chat request'), 160),
            'message' => $this->normalizeText((string) $validated['message'], 12000),
            'metadata' => $metadata,
            'status' => 'new',
            'received_at' => now(),
        ]);

        return $this->ok([
            'message_id' => $intake->intake_id,
            'route_label' => $intake->route_label,
            'source' => $intake->source,
            'status' => $intake->status,
            'received_at' => $intake->received_at?->toISOString(),
        ], 201);
    }

    public function index(Request $request)
    {
        $limit = max(1, min(100, (int) $request->query('limit', 20)));

        $rows = TrailAssistantIntake::query()
            ->where('user_id', $request->user()->id)
            ->where('source', 'chat')
            ->orderByDesc('received_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (TrailAssistantIntake $intake): array => [
                'message_id' => $intake->intake_id,
                'route_label' => $intake->route_label,
                'subject' => $intake->subject,
                'message' => $intake->message,
                'status' => $intake->status,
                'urgency' => $intake->metadata['urgency'] ?? null,
                'received_at' => $intake->received_at?->toISOString(),
            ])
            ->values()
            ->all();

        return $this->ok([
            'messages' => $rows,
        ]);
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
