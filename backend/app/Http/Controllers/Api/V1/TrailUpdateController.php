<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TrailUpdateController extends ApiController
{
    private const UPDATES_KEY = 'trail-updates/updates.json';

    private const UPLOADS_DIR = 'trail-updates/uploads';

    private const COMPLETED_DIR = 'trail-updates/completed';

    private const MEDIA_DIR = 'trail-updates/media';

    private const MEDIA_DERIVATIVES_DIR = 'trail-updates/media/derivatives';

    private const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

    private const UPLOAD_TTL_SECONDS = 60 * 60 * 24;

    private const DEFAULT_MAX_MEDIA_MB = 100;

    private const CHUNK_BYTES = 768 * 1024;

    private const MAX_DERIVATIVE_SOURCE_PIXELS = 60000000;

    /** @var array<string,array{maxWidth:int,quality:int}> */
    private const IMAGE_DERIVATIVES = [
        'thumbnail' => ['maxWidth' => 640, 'quality' => 78],
        'preview' => ['maxWidth' => 1400, 'quality' => 82],
    ];

    /** @var array<int,string> */
    private const ALLOWED_MEDIA_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
        'image/heif',
        'video/mp4',
        'video/quicktime',
        'video/webm',
    ];

    public function options(Request $request): JsonResponse
    {
        return $this->withCors(response()->json(null, 204), $request);
    }

    public function index(Request $request): JsonResponse
    {
        $includeDrafts = $request->boolean('admin') && $this->isAdminRequest($request);
        $limit = max(1, min(50, (int) $request->query('limit', 50)));

        $updates = collect($this->readUpdates())
            ->filter(fn (array $update): bool => $includeDrafts || ($update['status'] ?? 'published') === 'published')
            ->map(fn (array $update): array => $this->publicUpdate($update, $request))
            ->take($limit)
            ->values()
            ->all();

        return $this->withCors($this->ok([
            'updates' => $updates,
            'source' => 'laravel-storage',
            'max_media_mb' => $this->maxMediaMb(),
            'chunk_size' => self::CHUNK_BYTES,
        ]), $request)->withHeaders([
            'Cache-Control' => $includeDrafts ? 'no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
        ]);
    }

    public function session(Request $request): JsonResponse
    {
        if ($request->isMethod('GET')) {
            return $this->withCors($this->ok([
                'authenticated' => $this->isAdminRequest($request),
                'expires_at' => $this->adminTokenExpiresAt($request),
            ]), $request);
        }

        $passcode = trim((string) $request->input('passcode', ''));
        if (! $this->passcodeMatches($passcode)) {
            return $this->withCors($this->fail('trail_updates_wrong_passcode', 'Wrong passcode.', 401), $request);
        }

        [$token, $expiresAt] = $this->makeAdminToken();

        return $this->withCors($this->ok([
            'authenticated' => true,
            'token' => $token,
            'expires_at' => $expiresAt,
        ]), $request);
    }

    public function startMediaUpload(Request $request): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $validator = Validator::make($request->all(), [
            'filename' => ['required', 'string', 'max:160'],
            'contentType' => ['required', 'string', 'max:120'],
            'size' => ['required', 'integer', 'min:1', 'max:'.$this->maxMediaBytes()],
        ]);

        if ($validator->fails()) {
            return $this->withCors($this->fail('trail_updates_invalid_upload', 'Media upload details are invalid.', 422, $validator->errors()->toArray()), $request);
        }

        $contentType = $this->contentTypeForUpload((string) $request->input('contentType'), (string) $request->input('filename'));
        if (! in_array($contentType, self::ALLOWED_MEDIA_TYPES, true)) {
            return $this->withCors($this->fail('trail_updates_media_type', 'Use a JPG, PNG, WebP, GIF, HEIC, MP4, MOV, or WebM file.', 415), $request);
        }

        $size = (int) $request->input('size');
        $uploadId = 'tu_'.Str::lower(Str::random(24));
        $chunkCount = (int) ceil($size / self::CHUNK_BYTES);
        $now = now();

        $upload = [
            'uploadId' => $uploadId,
            'filename' => $this->sanitizeFilename((string) $request->input('filename')),
            'contentType' => $contentType,
            'size' => $size,
            'chunkSize' => self::CHUNK_BYTES,
            'chunkCount' => $chunkCount,
            'received' => [],
            'createdAt' => $now->toISOString(),
            'expiresAt' => $now->copy()->addSeconds(self::UPLOAD_TTL_SECONDS)->toISOString(),
        ];

        $this->writeUpload($uploadId, $upload);

        return $this->withCors($this->ok([
            'upload' => $upload,
            'max_media_mb' => $this->maxMediaMb(),
        ], 201), $request);
    }

    public function storeMediaChunk(Request $request, string $uploadId, int $chunkIndex): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $upload = $this->readUpload($uploadId);
        if (! $upload) {
            return $this->withCors($this->fail('trail_updates_upload_missing', 'Media upload session not found. Try the upload again.', 404), $request);
        }

        if ($this->uploadExpired($upload)) {
            $this->deleteUpload($uploadId);

            return $this->withCors($this->fail('trail_updates_upload_expired', 'Media upload session expired. Try the upload again.', 410), $request);
        }

        $chunkCount = (int) ($upload['chunkCount'] ?? 0);
        if ($chunkIndex < 0 || $chunkIndex >= $chunkCount) {
            return $this->withCors($this->fail('trail_updates_chunk_index', 'Chunk index is out of range.', 422), $request);
        }

        $body = $request->getContent();
        $bytes = strlen($body);
        if ($bytes < 1 || $bytes > self::CHUNK_BYTES) {
            return $this->withCors($this->fail('trail_updates_chunk_size', 'Upload chunk was the wrong size.', 422), $request);
        }

        Storage::disk('local')->put($this->chunkPath($uploadId, $chunkIndex), $body);

        $received = collect($upload['received'] ?? [])
            ->push($chunkIndex)
            ->unique()
            ->sort()
            ->values()
            ->all();
        $upload['received'] = $received;
        $this->writeUpload($uploadId, $upload);

        return $this->withCors($this->ok([
            'uploadId' => $uploadId,
            'chunkIndex' => $chunkIndex,
            'received' => count($received),
            'chunkCount' => $chunkCount,
        ]), $request);
    }

    public function completeMediaUpload(Request $request, string $uploadId): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $upload = $this->readUpload($uploadId);
        if (! $upload) {
            return $this->withCors($this->fail('trail_updates_upload_missing', 'Media upload session not found. Try the upload again.', 404), $request);
        }

        if ($this->uploadExpired($upload)) {
            $this->deleteUpload($uploadId);

            return $this->withCors($this->fail('trail_updates_upload_expired', 'Media upload session expired. Try the upload again.', 410), $request);
        }

        $chunkCount = (int) ($upload['chunkCount'] ?? 0);
        $missing = [];
        for ($index = 0; $index < $chunkCount; $index++) {
            if (! Storage::disk('local')->exists($this->chunkPath($uploadId, $index))) {
                $missing[] = $index;
            }
        }

        if ($missing !== []) {
            return $this->withCors($this->fail('trail_updates_chunks_missing', 'Some upload chunks are missing.', 422, ['missing' => $missing]), $request);
        }

        $mediaKey = $this->buildMediaKey($uploadId, (string) ($upload['filename'] ?? 'upload'));
        $mediaPath = self::MEDIA_DIR.'/'.$mediaKey;
        $absolutePath = Storage::disk('public')->path($mediaPath);
        $directory = dirname($absolutePath);
        if (! is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $out = fopen($absolutePath, 'wb');
        if ($out === false) {
            return $this->withCors($this->fail('trail_updates_media_write_failed', 'Could not save the uploaded media.', 500), $request);
        }

        try {
            for ($index = 0; $index < $chunkCount; $index++) {
                $chunk = Storage::disk('local')->get($this->chunkPath($uploadId, $index));
                fwrite($out, $chunk);
            }
        } finally {
            fclose($out);
        }

        $actualSize = filesize($absolutePath) ?: 0;
        if ($actualSize !== (int) ($upload['size'] ?? 0)) {
            Storage::disk('public')->delete($mediaPath);

            return $this->withCors($this->fail('trail_updates_media_size_mismatch', 'Uploaded media size did not match. Try again.', 422), $request);
        }

        $completed = [
            'uploadId' => $uploadId,
            'mediaKey' => $mediaKey,
            'mediaPath' => $mediaPath,
            'mediaName' => (string) ($upload['filename'] ?? 'upload'),
            'mediaType' => (string) ($upload['contentType'] ?? 'application/octet-stream'),
            'mediaSize' => $actualSize,
            'mediaDerivatives' => $this->makeImageDerivatives($mediaPath, (string) ($upload['contentType'] ?? ''), $mediaKey),
            'completedAt' => now()->toISOString(),
        ];
        Storage::disk('local')->put($this->completedPath($uploadId), json_encode($completed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        $this->deleteUpload($uploadId);

        return $this->withCors($this->ok([
            'media' => $completed,
        ]), $request);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['nullable', 'string', 'max:120'],
            'body' => ['nullable', 'string', 'max:4000'],
            'location' => ['nullable', 'string', 'max:120'],
            'trailMile' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'featured' => ['nullable'],
            'mediaUploadId' => ['nullable', 'string', 'max:80'],
            'media' => ['nullable', 'file', 'max:'.($this->maxMediaMb() * 1024)],
        ]);

        if ($validator->fails()) {
            return $this->withCors($this->fail('trail_updates_invalid_update', 'Trail update details are invalid.', 422, $validator->errors()->toArray()), $request);
        }

        $now = now()->toISOString();
        $id = $this->slugId();
        $status = $request->input('status') === 'draft' ? 'draft' : 'published';
        $media = $this->consumeCompletedMedia((string) $request->input('mediaUploadId', ''));

        if (! $media && $request->hasFile('media')) {
            try {
                $media = $this->storeDirectMedia($request->file('media'), $id);
            } catch (\InvalidArgumentException) {
                return $this->withCors($this->fail('trail_updates_media_type', 'Use a JPG, PNG, WebP, GIF, HEIC, MP4, MOV, or WebM file.', 415), $request);
            }
        }

        $update = [
            'id' => $id,
            'title' => $this->sanitizeText($request->input('title'), 120),
            'body' => $this->sanitizeText($request->input('body'), 4000),
            'location' => $this->sanitizeText($request->input('location'), 120),
            'trailMile' => $this->sanitizeText($request->input('trailMile'), 40),
            'status' => $status,
            'featured' => filter_var($request->input('featured', false), FILTER_VALIDATE_BOOL),
            'mediaKey' => $media['mediaKey'] ?? null,
            'mediaPath' => $media['mediaPath'] ?? null,
            'mediaName' => $media['mediaName'] ?? null,
            'mediaType' => $media['mediaType'] ?? null,
            'mediaSize' => $media['mediaSize'] ?? null,
            'mediaDerivatives' => $media['mediaDerivatives'] ?? [],
            'createdAt' => $now,
            'updatedAt' => $now,
            'publishedAt' => $status === 'published' ? $now : null,
        ];

        if ($update['body'] === '' && ! $update['mediaPath']) {
            return $this->withCors($this->fail('trail_updates_empty_update', 'Add a photo/video or a text update.', 400), $request);
        }

        $updates = $this->readUpdates();
        array_unshift($updates, $update);
        $this->writeUpdates($updates);

        return $this->withCors($this->ok([
            'update' => $this->publicUpdate($update, $request),
        ], 201), $request);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $payload = $request->json()->all();
        $updates = $this->readUpdates();
        $found = false;
        $updated = null;

        foreach ($updates as &$update) {
            if (($update['id'] ?? '') !== $id) {
                continue;
            }

            $found = true;
            $status = ($payload['status'] ?? $update['status'] ?? 'published') === 'draft' ? 'draft' : 'published';
            $update['title'] = $this->sanitizeText($payload['title'] ?? $update['title'] ?? '', 120);
            $update['body'] = $this->sanitizeText($payload['body'] ?? $update['body'] ?? '', 4000);
            $update['location'] = $this->sanitizeText($payload['location'] ?? $update['location'] ?? '', 120);
            $update['trailMile'] = $this->sanitizeText($payload['trailMile'] ?? $update['trailMile'] ?? '', 40);
            $update['status'] = $status;
            $update['featured'] = filter_var($payload['featured'] ?? $update['featured'] ?? false, FILTER_VALIDATE_BOOL);
            $update['updatedAt'] = now()->toISOString();
            $update['publishedAt'] = $status === 'published' ? ($update['publishedAt'] ?? now()->toISOString()) : null;
            $updated = $update;
            break;
        }
        unset($update);

        if (! $found || ! $updated) {
            return $this->withCors($this->fail('trail_updates_not_found', 'Trail update not found.', 404), $request);
        }

        $this->writeUpdates($updates);

        return $this->withCors($this->ok([
            'update' => $this->publicUpdate($updated, $request),
        ]), $request);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if (! $this->isAdminRequest($request)) {
            return $this->withCors($this->fail('trail_updates_auth_required', 'Admin passcode required.', 401), $request);
        }

        $updates = $this->readUpdates();
        $target = collect($updates)->first(fn (array $update): bool => ($update['id'] ?? '') === $id);
        $remaining = collect($updates)
            ->reject(fn (array $update): bool => ($update['id'] ?? '') === $id)
            ->values()
            ->all();

        $this->writeUpdates($remaining);

        if (is_array($target) && isset($target['mediaPath'])) {
            Storage::disk('public')->delete((string) $target['mediaPath']);
            foreach ($this->mediaDerivativePaths($target) as $path) {
                Storage::disk('public')->delete($path);
            }
        }

        return $this->withCors($this->ok(['ok' => true]), $request);
    }

    public function media(Request $request, string $id): JsonResponse|BinaryFileResponse
    {
        $update = $this->findUpdate($id);
        if (! $update || empty($update['mediaPath'])) {
            return $this->withCors($this->fail('trail_updates_media_missing', 'Media not found.', 404), $request);
        }

        return $this->servePublicMedia($request, (string) $update['mediaPath'], (string) ($update['mediaType'] ?? 'application/octet-stream'));
    }

    public function mediaVariant(Request $request, string $id, string $variant): JsonResponse|BinaryFileResponse
    {
        $variant = Str::lower($variant);
        if (! array_key_exists($variant, self::IMAGE_DERIVATIVES)) {
            return $this->withCors($this->fail('trail_updates_media_variant_missing', 'Media variant not found.', 404), $request);
        }

        $update = $this->findUpdate($id);
        $derivatives = is_array($update['mediaDerivatives'] ?? null) ? $update['mediaDerivatives'] : [];
        $derivative = is_array($derivatives[$variant] ?? null) ? $derivatives[$variant] : null;
        $path = (string) ($derivative['path'] ?? '');
        if ($path === '') {
            return $this->withCors($this->fail('trail_updates_media_variant_missing', 'Media variant not found.', 404), $request);
        }

        return $this->servePublicMedia($request, $path, (string) ($derivative['type'] ?? 'image/webp'));
    }

    private function servePublicMedia(Request $request, string $path, string $contentType): JsonResponse|BinaryFileResponse
    {
        if (! Storage::disk('public')->exists($path)) {
            return $this->withCors($this->fail('trail_updates_media_missing', 'Media not found.', 404), $request);
        }

        $response = response()->file(Storage::disk('public')->path($path), [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
            'Accept-Ranges' => 'bytes',
        ]);

        return $this->withCors($response, $request);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function readUpdates(): array
    {
        $raw = Storage::disk('local')->exists(self::UPDATES_KEY)
            ? Storage::disk('local')->get(self::UPDATES_KEY)
            : '';

        $decoded = json_decode($raw, true);
        $updates = is_array($decoded['updates'] ?? null) ? $decoded['updates'] : [];

        return collect($updates)
            ->filter(fn (mixed $item): bool => is_array($item) && is_string($item['id'] ?? null))
            ->sortByDesc(fn (array $item): string => (string) ($item['publishedAt'] ?? $item['createdAt'] ?? ''))
            ->values()
            ->all();
    }

    /**
     * @param array<int,array<string,mixed>> $updates
     */
    private function writeUpdates(array $updates): void
    {
        Storage::disk('local')->put(self::UPDATES_KEY, json_encode([
            'updates' => array_values($updates),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * @param array<string,mixed> $update
     * @return array<string,mixed>
     */
    private function publicUpdate(array $update, Request $request): array
    {
        $mediaVariants = $this->publicMediaVariants($update, $request);

        return [
            'id' => (string) ($update['id'] ?? ''),
            'title' => (string) ($update['title'] ?? ''),
            'body' => (string) ($update['body'] ?? ''),
            'location' => (string) ($update['location'] ?? ''),
            'trailMile' => (string) ($update['trailMile'] ?? ''),
            'status' => ($update['status'] ?? 'published') === 'draft' ? 'draft' : 'published',
            'featured' => (bool) ($update['featured'] ?? false),
            'mediaKey' => $update['mediaKey'] ?? null,
            'mediaName' => $update['mediaName'] ?? null,
            'mediaType' => $update['mediaType'] ?? null,
            'mediaSize' => $update['mediaSize'] ?? null,
            'mediaUrl' => ! empty($update['mediaPath']) ? $this->absoluteUrl($request, '/api/v1/trail-updates/'.rawurlencode((string) $update['id']).'/media') : null,
            'thumbnailUrl' => $mediaVariants['thumbnail']['url'] ?? null,
            'previewUrl' => $mediaVariants['preview']['url'] ?? null,
            'mediaVariants' => $mediaVariants,
            'createdAt' => (string) ($update['createdAt'] ?? ''),
            'updatedAt' => (string) ($update['updatedAt'] ?? ''),
            'publishedAt' => $update['publishedAt'] ?? null,
        ];
    }

    private function storeDirectMedia(?UploadedFile $file, string $id): ?array
    {
        if (! $file || ! $file->isValid()) {
            return null;
        }

        $contentType = $this->contentTypeForUpload($file->getMimeType() ?: $file->getClientMimeType() ?: '', $file->getClientOriginalName());
        if (! in_array($contentType, self::ALLOWED_MEDIA_TYPES, true)) {
            throw new \InvalidArgumentException('Unsupported media type.');
        }

        $mediaKey = $this->buildMediaKey($id, $file->getClientOriginalName());
        $mediaPath = $file->storeAs(self::MEDIA_DIR, $mediaKey, 'public');

        return [
            'mediaKey' => $mediaKey,
            'mediaPath' => $mediaPath,
            'mediaName' => $this->sanitizeFilename($file->getClientOriginalName()),
            'mediaType' => $contentType,
            'mediaSize' => $file->getSize(),
            'mediaDerivatives' => $this->makeImageDerivatives($mediaPath, $contentType, $mediaKey),
        ];
    }

    private function findUpdate(string $id): ?array
    {
        return collect($this->readUpdates())->first(fn (array $item): bool => ($item['id'] ?? '') === $id);
    }

    /**
     * @param array<string,mixed> $update
     * @return array<string,array<string,mixed>>
     */
    private function publicMediaVariants(array $update, Request $request): array
    {
        $derivatives = is_array($update['mediaDerivatives'] ?? null) ? $update['mediaDerivatives'] : [];
        $variants = [];

        foreach (array_keys(self::IMAGE_DERIVATIVES) as $variant) {
            $info = is_array($derivatives[$variant] ?? null) ? $derivatives[$variant] : null;
            if (! $info || empty($info['path'])) {
                continue;
            }

            $variants[$variant] = [
                'url' => $this->absoluteUrl($request, '/api/v1/trail-updates/'.rawurlencode((string) ($update['id'] ?? '')).'/media/'.$variant),
                'type' => (string) ($info['type'] ?? 'image/webp'),
                'width' => (int) ($info['width'] ?? 0),
                'height' => (int) ($info['height'] ?? 0),
                'size' => (int) ($info['size'] ?? 0),
            ];
        }

        return $variants;
    }

    /**
     * @param array<string,mixed> $update
     * @return array<int,string>
     */
    private function mediaDerivativePaths(array $update): array
    {
        $derivatives = is_array($update['mediaDerivatives'] ?? null) ? $update['mediaDerivatives'] : [];

        return collect($derivatives)
            ->filter(fn (mixed $item): bool => is_array($item) && is_string($item['path'] ?? null))
            ->map(fn (array $item): string => (string) $item['path'])
            ->values()
            ->all();
    }

    /**
     * @return array<string,array<string,mixed>>
     */
    private function makeImageDerivatives(string $mediaPath, string $contentType, string $mediaKey): array
    {
        if (! $this->supportsImageDerivatives($contentType)) {
            return [];
        }

        $sourcePath = Storage::disk('public')->path($mediaPath);
        $imageSize = @getimagesize($sourcePath);
        $sourceWidth = (int) ($imageSize[0] ?? 0);
        $sourceHeight = (int) ($imageSize[1] ?? 0);
        if ($sourceWidth < 1 || $sourceHeight < 1 || ($sourceWidth * $sourceHeight) > self::MAX_DERIVATIVE_SOURCE_PIXELS) {
            return [];
        }

        $source = $this->loadGdImage($sourcePath, $contentType);
        if (! $source) {
            return [];
        }

        $source = $this->applyJpegOrientation($source, $sourcePath, $contentType);
        $width = imagesx($source);
        $height = imagesy($source);
        $base = pathinfo($mediaKey, PATHINFO_FILENAME) ?: $this->sanitizeId($mediaKey);
        $derivatives = [];

        foreach (self::IMAGE_DERIVATIVES as $variant => $config) {
            $scale = min(1, $config['maxWidth'] / max(1, $width));
            $targetWidth = max(1, (int) round($width * $scale));
            $targetHeight = max(1, (int) round($height * $scale));
            $target = imagecreatetruecolor($targetWidth, $targetHeight);
            if (! $target) {
                continue;
            }

            imagealphablending($target, false);
            imagesavealpha($target, true);
            imagefill($target, 0, 0, imagecolorallocatealpha($target, 0, 0, 0, 127));
            imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

            $variantPath = self::MEDIA_DERIVATIVES_DIR.'/'.$base.'-'.$variant.'.webp';
            $absoluteVariantPath = Storage::disk('public')->path($variantPath);
            $directory = dirname($absoluteVariantPath);
            if (! is_dir($directory)) {
                mkdir($directory, 0775, true);
            }

            if (imagewebp($target, $absoluteVariantPath, $config['quality'])) {
                $derivatives[$variant] = [
                    'path' => $variantPath,
                    'type' => 'image/webp',
                    'width' => $targetWidth,
                    'height' => $targetHeight,
                    'size' => filesize($absoluteVariantPath) ?: 0,
                ];
            }

            imagedestroy($target);
        }

        imagedestroy($source);

        return $derivatives;
    }

    private function supportsImageDerivatives(string $contentType): bool
    {
        return extension_loaded('gd')
            && function_exists('imagewebp')
            && in_array($contentType, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true);
    }

    private function loadGdImage(string $sourcePath, string $contentType): ?\GdImage
    {
        $image = match ($contentType) {
            'image/jpeg' => function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($sourcePath) : false,
            'image/png' => function_exists('imagecreatefrompng') ? @imagecreatefrompng($sourcePath) : false,
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false,
            'image/gif' => function_exists('imagecreatefromgif') ? @imagecreatefromgif($sourcePath) : false,
            default => false,
        };

        return $image instanceof \GdImage ? $image : null;
    }

    private function applyJpegOrientation(\GdImage $image, string $sourcePath, string $contentType): \GdImage
    {
        if ($contentType !== 'image/jpeg' || ! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($sourcePath);
        $orientation = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;
        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => $image,
        };

        if ($rotated instanceof \GdImage && $rotated !== $image) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }

    private function consumeCompletedMedia(string $uploadId): ?array
    {
        $uploadId = $this->sanitizeId($uploadId);
        if ($uploadId === '') {
            return null;
        }

        $path = $this->completedPath($uploadId);
        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        $decoded = json_decode(Storage::disk('local')->get($path), true);
        Storage::disk('local')->delete($path);

        return is_array($decoded) ? $decoded : null;
    }

    private function readUpload(string $uploadId): ?array
    {
        $uploadId = $this->sanitizeId($uploadId);
        if ($uploadId === '') {
            return null;
        }

        $path = $this->uploadPath($uploadId);
        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        $decoded = json_decode(Storage::disk('local')->get($path), true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param array<string,mixed> $upload
     */
    private function writeUpload(string $uploadId, array $upload): void
    {
        Storage::disk('local')->put($this->uploadPath($uploadId), json_encode($upload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    private function deleteUpload(string $uploadId): void
    {
        $uploadId = $this->sanitizeId($uploadId);
        if ($uploadId === '') {
            return;
        }

        Storage::disk('local')->delete($this->uploadPath($uploadId));
        Storage::disk('local')->deleteDirectory(self::UPLOADS_DIR.'/'.$uploadId.'/chunks');
    }

    /**
     * @param array<string,mixed> $upload
     */
    private function uploadExpired(array $upload): bool
    {
        return now()->greaterThan((string) ($upload['expiresAt'] ?? '1970-01-01T00:00:00Z'));
    }

    private function uploadPath(string $uploadId): string
    {
        return self::UPLOADS_DIR.'/'.$this->sanitizeId($uploadId).'.json';
    }

    private function completedPath(string $uploadId): string
    {
        return self::COMPLETED_DIR.'/'.$this->sanitizeId($uploadId).'.json';
    }

    private function chunkPath(string $uploadId, int $chunkIndex): string
    {
        return self::UPLOADS_DIR.'/'.$this->sanitizeId($uploadId).'/chunks/'.$chunkIndex.'.part';
    }

    private function buildMediaKey(string $prefix, string $filename): string
    {
        $name = $this->sanitizeFilename($filename);
        $extension = pathinfo($name, PATHINFO_EXTENSION) ?: 'bin';

        return $this->sanitizeId($prefix).'.'.Str::lower($extension);
    }

    private function sanitizeId(string $value): string
    {
        return Str::of($value)
            ->replaceMatches('/[^A-Za-z0-9_\-.]+/', '-')
            ->trim('-')
            ->limit(100, '')
            ->toString();
    }

    private function sanitizeFilename(string $value): string
    {
        return Str::of($value)
            ->replaceMatches('/[^A-Za-z0-9._-]+/', '-')
            ->trim('-')
            ->limit(160, '')
            ->toString() ?: 'upload.bin';
    }

    private function sanitizeText(mixed $value, int $max): string
    {
        return Str::of((string) ($value ?? ''))
            ->replace("\0", '')
            ->trim()
            ->limit($max, '')
            ->toString();
    }

    private function slugId(): string
    {
        return now()->format('YmdHis').'-'.Str::lower(Str::random(6));
    }

    private function contentTypeForUpload(string $contentType, string $filename): string
    {
        $normalized = $this->normalizeContentType($contentType);
        if (in_array($normalized, self::ALLOWED_MEDIA_TYPES, true)) {
            return $normalized;
        }

        $extension = Str::lower(pathinfo($this->sanitizeFilename($filename), PATHINFO_EXTENSION) ?: '');

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'heic' => 'image/heic',
            'heif' => 'image/heif',
            'mp4' => 'video/mp4',
            'mov', 'qt' => 'video/quicktime',
            'webm' => 'video/webm',
            default => $normalized,
        };
    }

    private function normalizeContentType(string $value): string
    {
        $contentType = Str::lower(trim(explode(';', $value)[0] ?? ''));

        return match ($contentType) {
            'image/jpg' => 'image/jpeg',
            'image/x-heic', 'image/heic-sequence' => 'image/heic',
            'image/x-heif', 'image/heif-sequence' => 'image/heif',
            'video/mov', 'video/x-m4v' => 'video/quicktime',
            default => $contentType,
        };
    }

    private function maxMediaMb(): int
    {
        return max(1, min(2048, (int) env('TRAIL_UPDATES_MAX_MEDIA_MB', self::DEFAULT_MAX_MEDIA_MB)));
    }

    private function maxMediaBytes(): int
    {
        return $this->maxMediaMb() * 1024 * 1024;
    }

    private function isAdminRequest(Request $request): bool
    {
        $token = $request->bearerToken();
        if (! is_string($token) || $token === '') {
            return false;
        }

        return $this->verifyAdminToken($token) !== null;
    }

    private function adminTokenExpiresAt(Request $request): ?string
    {
        $token = $request->bearerToken();
        if (! is_string($token) || $token === '') {
            return null;
        }

        return $this->verifyAdminToken($token)['exp_iso'] ?? null;
    }

    /**
     * @return array{token:string,exp_iso:string}|null
     */
    private function verifyAdminToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }

        [$payload, $signature] = $parts;
        if (! hash_equals($this->sign($payload), $signature)) {
            return null;
        }

        $decoded = json_decode(base64_decode(strtr($payload, '-_', '+/')) ?: '', true);
        if (! is_array($decoded) || ($decoded['v'] ?? null) !== 1) {
            return null;
        }

        $exp = (int) ($decoded['exp'] ?? 0);
        if ($exp < time()) {
            return null;
        }

        return [
            'token' => $token,
            'exp_iso' => now()->createFromTimestamp($exp)->toISOString(),
        ];
    }

    /**
     * @return array{0:string,1:string}
     */
    private function makeAdminToken(): array
    {
        $exp = time() + self::SESSION_TTL_SECONDS;
        $payload = rtrim(strtr(base64_encode(json_encode([
            'v' => 1,
            'iat' => time(),
            'exp' => $exp,
        ], JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

        return [$payload.'.'.$this->sign($payload), now()->createFromTimestamp($exp)->toISOString()];
    }

    private function sign(string $payload): string
    {
        return hash_hmac('sha256', $payload, $this->sessionSecret());
    }

    private function passcodeMatches(string $input): bool
    {
        $expected = $this->adminPasscode();

        return $expected !== '' && hash_equals($expected, trim($input));
    }

    private function adminPasscode(): string
    {
        return trim((string) (env('HOGG_ADMIN_PASSCODE') ?: env('TRAIL_UPDATES_PASSCODE') ?: '0721'));
    }

    private function sessionSecret(): string
    {
        return (string) (env('TRAIL_UPDATES_SESSION_SECRET') ?: env('AUTH_SESSION_SECRET') ?: config('app.key') ?: $this->adminPasscode());
    }

    private function withCors(JsonResponse|BinaryFileResponse $response, Request $request): JsonResponse|BinaryFileResponse
    {
        $origin = $this->allowedOrigin($request);
        if ($origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Max-Age', '86400');
            $response->headers->set('Vary', trim($response->headers->get('Vary').' Origin'));
        }

        return $response;
    }

    private function allowedOrigin(Request $request): ?string
    {
        $origin = trim((string) $request->headers->get('Origin', ''));
        if ($origin === '') {
            return null;
        }

        $allowed = collect(explode(',', (string) env('TRAIL_UPDATES_ALLOWED_ORIGINS', 'https://hoggcountry.com,https://www.hoggcountry.com,https://hoggcountry.netlify.app,http://localhost:4321,http://127.0.0.1:4321,http://localhost:8888,http://127.0.0.1:8888')))
            ->map(fn (string $value): string => trim($value))
            ->filter()
            ->values()
            ->all();

        if (in_array('*', $allowed, true)) {
            return $origin;
        }

        return in_array($origin, $allowed, true) ? $origin : null;
    }

    private function absoluteUrl(Request $request, string $path): string
    {
        $origin = rtrim((string) env('TRAIL_UPDATES_PUBLIC_ORIGIN', ''), '/');
        if ($origin === '') {
            $origin = $request->getSchemeAndHttpHost();
        }

        return $origin.$path;
    }
}
