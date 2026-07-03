<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\MobileDiagnostic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MobileDiagnosticController extends ApiController
{
    private const MAX_CONTEXT_BYTES = 8000;

    private const MAX_CONTEXT_DEPTH = 4;

    private const MAX_CONTEXT_ITEMS = 50;

    /** @var array<int,string> */
    private const PRIVATE_CONTEXT_KEYS = [
        'answer',
        'authorization',
        'content',
        'conversationhistory',
        'coords',
        'email',
        'lat',
        'latitude',
        'location',
        'lon',
        'longitude',
        'message',
        'password',
        'phone',
        'position',
        'prompt',
        'secret',
        'token',
        'trailname',
    ];

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'event_id' => ['nullable', 'string', 'max:80', 'regex:/\A[A-Za-z0-9_.:-]+\z/'],
            'install_id' => ['required', 'string', 'max:80', 'regex:/\A[A-Za-z0-9_.:-]+\z/'],
            'session_id' => ['nullable', 'string', 'max:80', 'regex:/\A[A-Za-z0-9_.:-]+\z/'],
            'category' => ['required', 'string', 'max:40', 'regex:/\A[A-Za-z0-9_.:-]+\z/'],
            'name' => ['required', 'string', 'max:80', 'regex:/\A[A-Za-z0-9_.:-]+\z/'],
            'severity' => ['required', 'string', 'in:debug,info,warn,error'],
            'occurred_at' => ['nullable', 'date'],
            'app_version' => ['nullable', 'string', 'max:40'],
            'app_build' => ['nullable', 'string', 'max:40'],
            'build_sha' => ['nullable', 'string', 'max:80'],
            'platform' => ['nullable', 'string', 'max:40'],
            'native' => ['nullable', 'boolean'],
            'user_agent' => ['nullable', 'string', 'max:255'],
            'context' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return $this->fail(
                'mobile_diagnostics_invalid',
                'Diagnostic event is invalid.',
                422,
                $validator->errors()->toArray()
            );
        }

        $data = $validator->validated();
        $eventId = $data['event_id'] ?? null;
        if (is_string($eventId) && $eventId !== '') {
            $existing = MobileDiagnostic::query()->where('event_id', $eventId)->first();
            if ($existing) {
                return $this->ok([
                    'ok' => true,
                    'duplicate' => true,
                    'id' => $existing->id,
                ]);
            }
        }

        $context = $this->boundedContext($data['context'] ?? []);

        $diagnostic = MobileDiagnostic::query()->create([
            'event_id' => $eventId,
            'install_id' => $data['install_id'],
            'session_id' => $data['session_id'] ?? null,
            'category' => $data['category'],
            'name' => $data['name'],
            'severity' => $data['severity'],
            'occurred_at' => $data['occurred_at'] ?? now(),
            'app_version' => $this->stringOrNull($data['app_version'] ?? null, 40),
            'app_build' => $this->stringOrNull($data['app_build'] ?? null, 40),
            'build_sha' => $this->stringOrNull($data['build_sha'] ?? null, 80),
            'platform' => $this->stringOrNull($data['platform'] ?? null, 40),
            'native' => $data['native'] ?? null,
            'user_agent' => $this->stringOrNull($data['user_agent'] ?? $request->userAgent(), 255),
            'context' => $context,
        ]);

        return $this->ok([
            'ok' => true,
            'id' => $diagnostic->id,
        ], 201);
    }

    /**
     * @return array<string,mixed>|array<int,mixed>
     */
    private function boundedContext(mixed $context): array
    {
        $sanitized = $this->sanitizeValue(is_array($context) ? $context : [], 0);
        if (! is_array($sanitized)) {
            return [];
        }

        $encoded = json_encode($sanitized);
        if (is_string($encoded) && strlen($encoded) <= self::MAX_CONTEXT_BYTES) {
            return $sanitized;
        }

        return [
            '_truncated' => true,
            '_bytes' => is_string($encoded) ? strlen($encoded) : null,
            'keys' => array_slice(array_keys($sanitized), 0, 20),
        ];
    }

    private function sanitizeValue(mixed $value, int $depth): mixed
    {
        if ($depth >= self::MAX_CONTEXT_DEPTH) {
            return '[truncated]';
        }

        if (is_array($value)) {
            $result = [];
            $count = 0;
            foreach ($value as $key => $item) {
                if ($count >= self::MAX_CONTEXT_ITEMS) {
                    $result['_truncated_items'] = true;
                    break;
                }
                $safeKey = is_int($key) ? $key : $this->safeContextKey((string) $key);
                if (is_string($safeKey) && $this->isPrivateContextKey($safeKey)) {
                    $result[$safeKey] = '[redacted]';
                } else {
                    $result[$safeKey] = $this->sanitizeValue($item, $depth + 1);
                }
                $count += 1;
            }

            return $result;
        }

        if (is_string($value)) {
            return Str::limit(preg_replace('/[^\P{C}\t\n\r]/u', '', $value) ?? '', 600, '');
        }

        if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
            return $value;
        }

        return (string) $value;
    }

    private function safeContextKey(string $key): string
    {
        $safe = preg_replace('/[^A-Za-z0-9_.:-]/', '_', $key) ?? 'key';

        return Str::limit($safe, 80, '');
    }

    private function isPrivateContextKey(string $key): bool
    {
        return in_array(Str::lower(str_replace(['-', '_', '.'], '', $key)), self::PRIVATE_CONTEXT_KEYS, true);
    }

    private function stringOrNull(mixed $value, int $max): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return Str::limit($value, $max, '');
    }
}
