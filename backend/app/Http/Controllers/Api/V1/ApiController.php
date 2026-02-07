<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ApiController extends Controller
{
    protected function ok(mixed $data = [], int $status = 200, array $meta = []): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'error' => null,
            'meta' => array_merge([
                'request_id' => request()->header('x-request-id', (string) Str::uuid()),
            ], $meta),
        ], $status);
    }

    protected function fail(string $code, string $message, int $status, ?array $details = null): JsonResponse
    {
        return response()->json([
            'data' => null,
            'error' => array_filter([
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ], static fn (mixed $value): bool => $value !== null),
            'meta' => [
                'request_id' => request()->header('x-request-id', (string) Str::uuid()),
            ],
        ], $status);
    }
}
