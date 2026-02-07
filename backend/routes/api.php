<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommunityTrackerController;
use App\Http\Controllers\Api\V1\DeviceController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\TrackerLiveController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', function () {
        return response()->json([
            'data' => [
                'status' => 'ok',
                'service' => 'hoggcountry-api',
            ],
            'error' => null,
            'meta' => [
                'request_id' => request()->header('x-request-id', (string) Str::uuid()),
            ],
        ]);
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
        Route::get('/google/callback', [AuthController::class, 'googleCallback']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->middleware(['signed', 'throttle:6,1'])
            ->name('verification.verify');
    });

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::prefix('auth')->group(function (): void {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });

        Route::prefix('devices')->group(function (): void {
            Route::post('/register', [DeviceController::class, 'register']);
            Route::get('/', [DeviceController::class, 'index']);
            Route::delete('/{deviceId}', [DeviceController::class, 'destroy']);
        });

        Route::prefix('sync')->group(function (): void {
            Route::get('/bootstrap', [SyncController::class, 'bootstrap']);
            Route::post('/push', [SyncController::class, 'push']);
            Route::get('/pull', [SyncController::class, 'pull']);
        });

        Route::prefix('community/trackers')->group(function (): void {
            Route::get('/', [CommunityTrackerController::class, 'index']);
            Route::post('/', [CommunityTrackerController::class, 'store']);
            Route::patch('/{trackerId}', [CommunityTrackerController::class, 'update']);
            Route::delete('/{trackerId}', [CommunityTrackerController::class, 'destroy']);
        });

        Route::get('/trackers/live', [TrackerLiveController::class, 'index']);
    });
});
