<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\VideoHoggRun;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoHoggQueueTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        putenv('VIDEOHOGG_STORAGE_DISK=public');
        $_ENV['VIDEOHOGG_STORAGE_DISK'] = 'public';
        $_SERVER['VIDEOHOGG_STORAGE_DISK'] = 'public';

        Storage::fake('public');
    }

    public function test_upload_creates_queued_run_record_and_manifest(): void
    {
        $user = User::factory()->create(['email' => 'queue@example.com']);
        $token = $user->createToken('queue-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=queue@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'queue@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'queue@example.com';

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'notes' => 'Run-level notes here',
                'file_notes_json' => json_encode([
                    ['index' => 0, 'note' => 'First clip note'],
                    ['index' => 1, 'note' => 'Second clip note'],
                ], JSON_THROW_ON_ERROR),
                'files' => [
                    UploadedFile::fake()->create('clip-one.mp4', 1024, 'video/mp4'),
                    UploadedFile::fake()->create('clip-two.mov', 2048, 'video/quicktime'),
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.service_status', 'submitted')
            ->assertJsonPath('data.uploaded_count', 2)
            ->assertJsonPath('data.noted_count', 2)
            ->assertJsonStructure([
                'data' => [
                    'run_id',
                    'status',
                    'manifest_path',
                    'files',
                ],
                'error',
                'meta' => ['request_id'],
            ]);

        $runId = (string) $response->json('data.run_id');
        $this->assertNotSame('', $runId);

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('queued', $run->status);
        $this->assertSame('submitted', $run->service_status);
        $this->assertSame(2, $run->uploaded_count);
        $this->assertSame(2, $run->noted_count);

        Storage::disk('public')->assertExists($run->manifest_path);
        Storage::disk('public')->assertExists("{$run->base_path}/notes.txt");

        $manifest = json_decode(Storage::disk('public')->get($run->manifest_path), true);
        $this->assertIsArray($manifest);
        $this->assertSame($runId, $manifest['run_id'] ?? null);
        $this->assertSame(2, $manifest['uploaded_count'] ?? null);
        $this->assertSame(2, $manifest['noted_count'] ?? null);
    }

    public function test_upload_stores_editor_brief_payload_in_manifest_and_run_extra(): void
    {
        $user = User::factory()->create(['email' => 'brief@example.com']);
        $token = $user->createToken('brief-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=brief@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'brief@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'brief@example.com';

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'notes' => 'Brief-focused run',
                'editor_brief_json' => json_encode([
                    'tone' => 'dad-on-the-at',
                    'intent' => 'Energetic opening, steady middle, quiet ending.',
                    'must_keep' => 'First ascent sequence, final sunset.',
                    'avoid' => 'Repetitive uphill sections.',
                    'cta' => 'Tell people to follow for the next section.',
                ], JSON_THROW_ON_ERROR),
                'file_notes_json' => json_encode([
                    ['index' => 0, 'note' => 'Use this shot for opening'],
                ], JSON_THROW_ON_ERROR),
                'files' => [
                    UploadedFile::fake()->create('brief-clip.mp4', 1024, 'video/mp4'),
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', 'queued')
            ->assertJsonPath('data.editor_brief.tone', 'dad-on-the-at')
            ->assertJsonStructure([
                'data' => [
                    'run_id',
                    'status',
                    'manifest_path',
                    'editor_brief',
                ],
            ]);

        $runId = (string) $response->json('data.run_id');
        $run = VideoHoggRun::query()->where('run_id', $runId)->first();

        $this->assertNotNull($run);
        $this->assertSame('dad-on-the-at', (string) data_get($run->extra, 'editor_brief.tone'));
        $this->assertSame('Tell people to follow for the next section.', (string) data_get($run->extra, 'editor_brief.cta'));
        $this->assertSame('dad-on-the-at', $run->extra['editor_brief']['tone']);

        Storage::disk('public')->assertExists($run->manifest_path);
        $manifest = json_decode(Storage::disk('public')->get((string) $run->manifest_path), true);
        $this->assertSame('dad-on-the-at', (string) ($manifest['editor_brief']['tone'] ?? ''));
        $this->assertSame('Energetic opening, steady middle, quiet ending.', (string) ($manifest['editor_brief']['intent'] ?? ''));
    }

    public function test_worker_can_claim_heartbeat_and_complete_a_run(): void
    {
        $user = User::factory()->create(['email' => 'worker@example.com']);
        $token = $user->createToken('worker-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=worker@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'worker@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'worker@example.com';

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'file_notes_json' => json_encode([
                    ['index' => 0, 'note' => 'Queue test note'],
                ], JSON_THROW_ON_ERROR),
                'files' => [
                    UploadedFile::fake()->create('worker-test.mp4', 1024, 'video/mp4'),
                ],
            ])
            ->assertCreated();

        $runId = (string) $create->json('data.run_id');

        $claim = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs/claim', [
                'worker_id' => 'test-worker-01',
                'claim_ttl_seconds' => 600,
            ]);

        $claim
            ->assertOk()
            ->assertJsonPath('data.claimed', true)
            ->assertJsonPath('data.run.run_id', $runId)
            ->assertJsonPath('data.run.status', 'processing')
            ->assertJsonPath('data.run.service_status', 'in_hands')
            ->assertJsonStructure([
                'data' => [
                    'worker_id',
                    'claimed',
                    'run' => [
                        'run_id',
                        'status',
                        'manifest',
                    ],
                ],
            ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/heartbeat", [
                'worker_id' => 'test-worker-01',
                'claim_ttl_seconds' => 600,
            ])
            ->assertOk()
            ->assertJsonPath('data.run.status', 'processing')
            ->assertJsonPath('data.run.service_status', 'in_progress');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/complete", [
                'worker_id' => 'test-worker-01',
                'output_path' => '/Users/chrishogg/Downloads/VideoHogg/Exports/2026-02-09/vh-test/final.mp4',
                'extra' => [
                    'processor' => 'queue-test',
                    'output_package' => [
                        'final_video_url' => 'https://example.com/final.mp4',
                        'title_options' => ['Title One', 'Title Two', 'Title Three'],
                        'description_options' => ['Description One', 'Description Two', 'Description Three'],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.run.status', 'done')
            ->assertJsonPath('data.run.service_status', 'delivered')
            ->assertJsonPath('data.run.output_path', '/Users/chrishogg/Downloads/VideoHogg/Exports/2026-02-09/vh-test/final.mp4');

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('done', $run->status);
        $this->assertSame('delivered', $run->service_status);
        $this->assertNotNull($run->completed_at);
        $this->assertNotNull($run->delivered_at);
        $this->assertNull($run->claimed_by);
    }

    public function test_fail_endpoint_marks_run_failed(): void
    {
        $user = User::factory()->create(['email' => 'fail@example.com']);
        $token = $user->createToken('fail-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=fail@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'fail@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'fail@example.com';

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'files' => [
                    UploadedFile::fake()->create('broken-input.mp4', 512, 'video/mp4'),
                ],
            ])
            ->assertCreated();

        $runId = (string) $create->json('data.run_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs/claim', [
                'worker_id' => 'fail-worker-01',
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/fail", [
                'worker_id' => 'fail-worker-01',
                'failure_code' => 'ffmpeg_failed',
                'failure_message' => 'ffmpeg exited with code 1',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.status', 'failed')
            ->assertJsonPath('data.run.service_status', 'blocked')
            ->assertJsonPath('data.run.failure_code', 'ffmpeg_failed');

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('failed', $run->status);
        $this->assertSame('blocked', $run->service_status);
        $this->assertSame('ffmpeg_failed', $run->failure_code);
        $this->assertNotNull($run->failed_at);
        $this->assertNotNull($run->blocked_at);
        $this->assertNull($run->claimed_by);
    }

    public function test_service_status_endpoint_requires_delivery_package_for_delivered(): void
    {
        $user = User::factory()->create(['email' => 'service-status@example.com']);
        $token = $user->createToken('service-status-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=service-status@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'service-status@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'service-status@example.com';

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'files' => [
                    UploadedFile::fake()->create('service-status.mp4', 512, 'video/mp4'),
                ],
            ])
            ->assertCreated();

        $runId = (string) $create->json('data.run_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'in_hands',
                'note' => 'Accepted',
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'in_progress',
                'note' => 'Editing started',
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'packaging',
                'note' => 'Preparing package',
            ])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'delivered',
                'note' => 'Attempted delivery without package',
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'missing_delivery_package');
    }

    public function test_service_status_endpoint_can_mark_completed_after_delivery(): void
    {
        $user = User::factory()->create(['email' => 'service-complete@example.com']);
        $token = $user->createToken('service-complete-token')->plainTextToken;

        putenv('VIDEOHOGG_ALLOWED_EMAILS=service-complete@example.com');
        $_ENV['VIDEOHOGG_ALLOWED_EMAILS'] = 'service-complete@example.com';
        $_SERVER['VIDEOHOGG_ALLOWED_EMAILS'] = 'service-complete@example.com';

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/videohogg/runs', [
                'files' => [
                    UploadedFile::fake()->create('service-complete.mp4', 512, 'video/mp4'),
                ],
            ])
            ->assertCreated();

        $runId = (string) $create->json('data.run_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'in_hands',
                'note' => 'Accepted',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.service_status', 'in_hands');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'in_progress',
                'note' => 'Editing started',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.service_status', 'in_progress');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'packaging',
                'note' => 'Preparing package',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.service_status', 'packaging');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'delivered',
                'output_package' => [
                    'title_options' => ['Title 1', 'Title 2', 'Title 3'],
                    'description_options' => ['Description 1', 'Description 2', 'Description 3'],
                    'final_video_url' => 'https://example.com/final.mp4',
                ],
                'note' => 'Delivery sent',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.service_status', 'delivered');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/service-status", [
                'service_status' => 'completed',
                'note' => 'Client approved.',
            ])
            ->assertOk()
            ->assertJsonPath('data.run.service_status', 'completed')
            ->assertJsonPath('data.run.status', 'done');

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('completed', $run->service_status);
        $this->assertSame('done', $run->status);
        $this->assertNotNull($run->service_completed_at);
    }
}
