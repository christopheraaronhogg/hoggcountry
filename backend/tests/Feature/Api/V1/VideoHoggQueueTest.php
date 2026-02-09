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
            ->assertJsonPath('data.run.status', 'processing');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/videohogg/runs/{$runId}/complete", [
                'worker_id' => 'test-worker-01',
                'output_path' => '/Users/chrishogg/Downloads/VideoHogg/Exports/2026-02-09/vh-test/final.mp4',
                'extra' => [
                    'processor' => 'queue-test',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.run.status', 'done')
            ->assertJsonPath('data.run.output_path', '/Users/chrishogg/Downloads/VideoHogg/Exports/2026-02-09/vh-test/final.mp4');

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('done', $run->status);
        $this->assertNotNull($run->completed_at);
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
            ->assertJsonPath('data.run.failure_code', 'ffmpeg_failed');

        $run = VideoHoggRun::query()->where('run_id', $runId)->first();
        $this->assertNotNull($run);
        $this->assertSame('failed', $run->status);
        $this->assertSame('ffmpeg_failed', $run->failure_code);
        $this->assertNotNull($run->failed_at);
        $this->assertNull($run->claimed_by);
    }
}
