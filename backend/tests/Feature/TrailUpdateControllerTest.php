<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TrailUpdateControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Storage::fake('public');
        config()->set('app.url', 'https://hoggcountry.test');
    }

    public function test_admin_session_issues_bearer_token_for_correct_passcode(): void
    {
        $response = $this->withHeader('Origin', 'https://hoggcountry.com')
            ->postJson('/api/v1/trail-updates/admin/session', [
                'passcode' => '0721',
            ]);

        $response->assertOk();
        $this->assertNotEmpty($response->headers->get('Access-Control-Allow-Origin'));
        $response->assertJsonPath('data.authenticated', true);
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_wrong_passcode_is_rejected(): void
    {
        $this->postJson('/api/v1/trail-updates/admin/session', [
            'passcode' => 'wrong',
        ])->assertUnauthorized()
            ->assertJsonPath('error.code', 'trail_updates_wrong_passcode');
    }

    public function test_text_update_can_be_created_and_deleted_by_admin(): void
    {
        $token = $this->adminToken();

        $create = $this->withToken($token)
            ->post('/api/v1/trail-updates', [
                'status' => 'draft',
                'title' => 'Rainy day',
                'body' => 'Stopped early to dry socks.',
                'location' => 'Trail shelter',
            ]);

        $create->assertCreated();
        $id = $create->json('data.update.id');
        $this->assertNotEmpty($id);

        $this->getJson('/api/v1/trail-updates?limit=50')
            ->assertOk()
            ->assertJsonCount(0, 'data.updates');

        $this->withToken($token)
            ->getJson('/api/v1/trail-updates?admin=1&limit=50')
            ->assertOk()
            ->assertJsonPath('data.max_media_mb', 100)
            ->assertJsonPath('data.updates.0.id', $id)
            ->assertJsonPath('data.updates.0.status', 'draft');

        $this->withToken($token)
            ->deleteJson('/api/v1/trail-updates/'.$id)
            ->assertOk()
            ->assertJsonPath('data.ok', true);

        $this->withToken($token)
            ->getJson('/api/v1/trail-updates?admin=1&limit=50')
            ->assertOk()
            ->assertJsonCount(0, 'data.updates');
    }

    public function test_direct_small_media_upload_is_stored_in_laravel_storage(): void
    {
        $token = $this->adminToken();

        $response = $this->withToken($token)
            ->post('/api/v1/trail-updates', [
                'status' => 'published',
                'body' => 'Photo from trail.',
                'media' => UploadedFile::fake()->image('trail.jpg', 800, 600)->size(512),
            ]);

        $response->assertCreated();
        $path = $response->json('data.update.mediaUrl');
        $thumbnailPath = $response->json('data.update.thumbnailUrl');
        $previewPath = $response->json('data.update.previewUrl');
        $this->assertStringContainsString('/api/v1/trail-updates/', $path);
        $this->assertStringContainsString('/media/thumbnail', $thumbnailPath);
        $this->assertStringContainsString('/media/preview', $previewPath);
        $response->assertJsonPath('data.update.mediaVariants.thumbnail.type', 'image/webp');
        $response->assertJsonPath('data.update.mediaVariants.preview.type', 'image/webp');
        Storage::disk('public')->assertExists('trail-updates/media/'.$response->json('data.update.mediaKey'));

        $media = $this->get($path);
        $media->assertOk();
        $media->assertHeader('Content-Type', 'image/jpeg');

        $thumbnail = $this->get($thumbnailPath);
        $thumbnail->assertOk();
        $thumbnail->assertHeader('Content-Type', 'image/webp');
    }

    public function test_chunked_media_upload_can_be_completed_and_attached_to_update(): void
    {
        $token = $this->adminToken();

        $start = $this->withToken($token)
            ->postJson('/api/v1/trail-updates/media-uploads', [
                'filename' => 'trail-video.mp4',
                'contentType' => 'video/mp4',
                'size' => 11,
            ]);

        $start->assertCreated();
        $uploadId = $start->json('data.upload.uploadId');

        $this->call('PUT', '/api/v1/trail-updates/media-uploads/'.$uploadId.'/chunks/0', [], [], [], [
                'CONTENT_TYPE' => 'application/octet-stream',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ], 'hello world')
            ->assertOk()
            ->assertJsonPath('data.received', 1);

        $this->withToken($token)
            ->postJson('/api/v1/trail-updates/media-uploads/'.$uploadId.'/complete')
            ->assertOk()
            ->assertJsonPath('data.media.mediaType', 'video/mp4')
            ->assertJsonPath('data.media.mediaSize', 11);

        $create = $this->withToken($token)
            ->post('/api/v1/trail-updates', [
                'status' => 'published',
                'body' => 'Short clip.',
                'mediaUploadId' => $uploadId,
            ]);

        $create->assertCreated();
        $create->assertJsonPath('data.update.mediaType', 'video/mp4');
        Storage::disk('public')->assertExists('trail-updates/media/'.$create->json('data.update.mediaKey'));
    }

    public function test_ios_photo_upload_types_are_accepted(): void
    {
        $token = $this->adminToken();

        $cases = [
            ['IMG_1001.HEIC', 'image/heic', 'image/heic'],
            ['IMG_1002.HEIC', 'image/x-heic', 'image/heic'],
            ['IMG_1003.HEIC', 'application/octet-stream', 'image/heic'],
            ['IMG_1004.HEIF', 'image/heif-sequence', 'image/heif'],
        ];

        foreach ($cases as [$filename, $contentType, $expected]) {
            $this->withToken($token)
                ->postJson('/api/v1/trail-updates/media-uploads', [
                    'filename' => $filename,
                    'contentType' => $contentType,
                    'size' => 12345,
                ])
                ->assertCreated()
                ->assertJsonPath('data.upload.contentType', $expected);
        }
    }

    public function test_cors_preflight_allows_admin_headers(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'https://hoggcountry.com',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'authorization,content-type',
        ])->options('/api/v1/trail-updates/media-uploads');

        $response->assertNoContent();
        $this->assertNotEmpty($response->headers->get('Access-Control-Allow-Origin'));
        $this->assertStringContainsString('POST', (string) $response->headers->get('Access-Control-Allow-Methods'));
    }

    private function adminToken(): string
    {
        $response = $this->postJson('/api/v1/trail-updates/admin/session', [
            'passcode' => '0721',
        ]);

        $response->assertOk();

        return (string) $response->json('data.token');
    }
}
