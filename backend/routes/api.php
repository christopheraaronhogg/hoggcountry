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
use App\Http\Controllers\Api\V1\ScriptureAnswerController;
use App\Http\Controllers\Api\V1\TrailUpdateController;
use App\Http\Controllers\Api\V1\VideoFeedController;
use App\Http\Controllers\Api\V1\VideoHoggController;
use App\Http\Controllers\Api\V1\VideoHoggQueueController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

$buildMeta = static function (): array {
    $build = [
        'api_contract_version' => 2,
        'public_trail_assistant_routes' => true,
        'videohogg_queue_routes' => true,
        'native_shell_route' => true,
        'environment' => app()->environment(),
    ];

    foreach ([
        'sha' => env('APP_BUILD_SHA'),
        'branch' => env('APP_BUILD_BRANCH'),
        'deployed_at' => env('APP_BUILD_TIME'),
    ] as $key => $value) {
        if (filled($value)) {
            $build[$key] = $value;
        }
    }

    return $build;
};

Route::prefix('v1')->group(function () use ($buildMeta): void {
    Route::get('/health', function () use ($buildMeta) {
        return response()->json([
            'data' => [
                'status' => 'ok',
                'service' => 'hoggcountry-api',
            ],
            'error' => null,
            'meta' => [
                'request_id' => request()->header('x-request-id', (string) Str::uuid()),
                'build' => $buildMeta(),
            ],
        ]);
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/google/redirect', [AuthController::class, 'googleRedirect']);
        Route::get('/google/callback', [AuthController::class, 'googleCallback']);
        Route::post('/google/handoff', [AuthController::class, 'googleHandoff']);
        Route::post('/openai/exchange', [AuthController::class, 'openaiExchange'])->middleware('throttle:10,1');
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

    // Web PWA Scripture Ask — proxies to OpenAI (server-side key). The iOS app
    // answers on-device with Gemma and never calls this. Throttled hard because
    // it spends real money per request.
    Route::post('/scripture/answer', [ScriptureAnswerController::class, 'answer'])->middleware('throttle:20,1');

    Route::prefix('trail-updates')->group(function (): void {
        Route::options('/{any?}', [TrailUpdateController::class, 'options'])->where('any', '.*');
        Route::get('/', [TrailUpdateController::class, 'index']);
        Route::post('/', [TrailUpdateController::class, 'store'])->middleware('throttle:30,1');
        Route::patch('/{id}', [TrailUpdateController::class, 'update'])->middleware('throttle:60,1');
        Route::delete('/{id}', [TrailUpdateController::class, 'destroy'])->middleware('throttle:60,1');
        Route::get('/{id}/media', [TrailUpdateController::class, 'media']);
        Route::get('/{id}/media/{variant}', [TrailUpdateController::class, 'mediaVariant'])->where('variant', 'thumbnail|preview');
        Route::match(['GET', 'POST'], '/admin/session', [TrailUpdateController::class, 'session'])->middleware('throttle:20,1');
        Route::post('/media-uploads', [TrailUpdateController::class, 'startMediaUpload'])->middleware('throttle:30,1');
        Route::put('/media-uploads/{uploadId}/chunks/{chunkIndex}', [TrailUpdateController::class, 'storeMediaChunk'])->whereNumber('chunkIndex')->middleware('throttle:300,1');
        Route::post('/media-uploads/{uploadId}/complete', [TrailUpdateController::class, 'completeMediaUpload'])->middleware('throttle:30,1');
    });

    Route::prefix('trail-assistant')->group(function (): void {
        Route::get('/plans', [TrailAssistantPlanController::class, 'index']);
        Route::get('/byos/providers', [TrailAssistantByosController::class, 'providers']);
        Route::get('/byos/decision', [TrailAssistantByosController::class, 'decision']);
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
