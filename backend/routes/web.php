<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::get('/', function () {
    return response()->json([
        'data' => [
            'status' => 'ok',
            'service' => 'hoggcountry-api',
            'health' => '/api/v1/health',
        ],
        'error' => null,
        'meta' => [
            'request_id' => request()->header('x-request-id', (string) Str::uuid()),
        ],
    ]);
});
