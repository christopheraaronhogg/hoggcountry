<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommunityTrackerController;
use App\Http\Controllers\Api\V1\DeviceController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\TrackerLiveController;
use App\Http\Controllers\Api\V1\TrailAssistantByosController;
use App\Http\Controllers\Api\V1\TrailAssistantChatController;
use App\Http\Controllers\Api\V1\TrailAssistantCheckinController;
use App\Http\Controllers\Api\V1\TrailAssistantGovernanceController;
use App\Http\Controllers\Api\V1\TrailAssistantIntakeController;
use App\Http\Controllers\Api\V1\TrailAssistantMapReportController;
use App\Http\Controllers\Api\V1\TrailAssistantMapVisibilityController;
use App\Http\Controllers\Api\V1\TrailAssistantPlanController;
use App\Http\Controllers\Api\V1\TrailAssistantSosController;
use App\Http\Controllers\Api\V1\TrailAssistantTriageController;
use App\Http\Controllers\Api\V1\VideoFeedController;
use App\Http\Controllers\Api\V1\VideoHoggController;
use App\Http\Controllers\Api\V1\VideoHoggQueueController;
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

    Route::prefix('trackers/public')->group(function (): void {
        Route::get('/live', [TrackerLiveController::class, 'publicLive']);
        Route::get('/history', [TrackerLiveController::class, 'publicHistory']);
    });

    Route::prefix('videos')->group(function (): void {
        Route::get('/latest', [VideoFeedController::class, 'latest']);
    });

    Route::prefix('trail-assistant')->group(function (): void {
        Route::get('/plans', [TrailAssistantPlanController::class, 'index']);
        Route::get('/byos/providers', [TrailAssistantByosController::class, 'providers']);
        Route::post('/byos/entitlement-preview', [TrailAssistantByosController::class, 'entitlementPreview']);
        Route::post('/intake', [TrailAssistantIntakeController::class, 'store']);
        Route::get('/map-reports/public', [TrailAssistantMapReportController::class, 'publicFeed']);
        Route::get('/map-sharing/public', [TrailAssistantMapVisibilityController::class, 'publicFeed']);
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

        Route::prefix('trail-assistant')->group(function (): void {
            Route::get('/intakes', [TrailAssistantTriageController::class, 'index']);
            Route::get('/intakes/export.csv', [TrailAssistantTriageController::class, 'exportCsv']);
            Route::post('/intakes/{intakeId}/quarantine', [TrailAssistantTriageController::class, 'quarantine']);

            Route::get('/governance/moderation', [TrailAssistantGovernanceController::class, 'showModeration']);
            Route::put('/governance/moderation', [TrailAssistantGovernanceController::class, 'updateModeration']);

            Route::post('/chat/messages', [TrailAssistantChatController::class, 'store']);
            Route::get('/chat/messages', [TrailAssistantChatController::class, 'index']);

            Route::post('/checkins', [TrailAssistantCheckinController::class, 'store']);
            Route::get('/checkins', [TrailAssistantCheckinController::class, 'history']);
            Route::get('/checkins/latest', [TrailAssistantCheckinController::class, 'latest']);
            Route::get('/checkins/history', [TrailAssistantCheckinController::class, 'history']);
            Route::get('/progress', [TrailAssistantCheckinController::class, 'progress']);

            Route::get('/map-sharing/settings', [TrailAssistantMapVisibilityController::class, 'settings']);
            Route::put('/map-sharing/settings', [TrailAssistantMapVisibilityController::class, 'updateSettings']);
            Route::get('/map-sharing/feed', [TrailAssistantMapVisibilityController::class, 'authenticatedFeed']);

            Route::post('/map-reports', [TrailAssistantMapReportController::class, 'store'])->middleware('throttle:20,1');
            Route::get('/map-reports', [TrailAssistantMapReportController::class, 'index']);
            Route::post('/map-reports/{reportId}/verify', [TrailAssistantMapReportController::class, 'verify']);
            Route::get('/map-reports/{reportId}/audit', [TrailAssistantMapReportController::class, 'audit']);
            Route::post('/map-reports/{reportId}/resolve', [TrailAssistantMapReportController::class, 'resolve']);

            Route::post('/sos/escalate', [TrailAssistantSosController::class, 'store'])->middleware('throttle:4,10');
            Route::get('/sos/escalations', [TrailAssistantSosController::class, 'index']);
            Route::post('/sos/escalations/{escalationId}/status', [TrailAssistantSosController::class, 'updateStatus']);
        });

        Route::prefix('videohogg')->group(function (): void {
            Route::post('/runs', [VideoHoggController::class, 'store']);
            Route::post('/youtube-ideas', [VideoHoggController::class, 'storeYouTubeIdeas']);
            Route::get('/runs', [VideoHoggQueueController::class, 'index']);
            Route::get('/runs/{runId}', [VideoHoggQueueController::class, 'show']);
            Route::post('/runs/claim', [VideoHoggQueueController::class, 'claim']);
            Route::post('/runs/{runId}/heartbeat', [VideoHoggQueueController::class, 'heartbeat']);
            Route::post('/runs/{runId}/complete', [VideoHoggQueueController::class, 'complete']);
            Route::post('/runs/{runId}/fail', [VideoHoggQueueController::class, 'markFailed']);
            Route::post('/runs/{runId}/service-status', [VideoHoggQueueController::class, 'updateServiceStatus']);
        });
    });
});
