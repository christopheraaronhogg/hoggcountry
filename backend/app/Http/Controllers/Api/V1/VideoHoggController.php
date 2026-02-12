<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\VideoHoggRun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class VideoHoggController extends ApiController
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:20000'],
            'file_notes_json' => ['nullable', 'string', 'max:300000'],
            'editor_brief_json' => ['nullable', 'string', 'max:250000'],
            'remotion_edits_json' => ['nullable', 'string', 'max:500000'],
            'channel_profile_json' => ['nullable', 'string', 'max:250000'],
            'job_overrides_json' => ['nullable', 'string', 'max:250000'],
            'thumbnail_refs_json' => ['nullable', 'string', 'max:250000'],
            'thumbnail_refs' => ['nullable', 'array', 'max:24'],
            'thumbnail_refs.*' => ['nullable', 'file', 'max:20480', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif'],
            'files' => ['required', 'array', 'min:1', 'max:120'],
            'files.*' => ['required', 'file', 'max:512000'], // 500MB each (subject to php.ini limits)
        ]);

        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to use VideoHogg intake.', 403);
        }

        $diskName = trim((string) env('VIDEOHOGG_STORAGE_DISK', 'public')) ?: 'public';

        try {
            $disk = Storage::disk($diskName);
        } catch (Throwable) {
            return $this->fail(
                'storage_not_configured',
                sprintf('Storage disk "%s" is not configured for VideoHogg.', $diskName),
                503
            );
        }

        $runId = 'vh_'.Str::lower(Str::random(12));
        $createdAt = now()->toIso8601String();
        $basePath = "videohogg/{$user->id}/{$runId}";

        $notes = $this->normalizeText((string) ($validated['notes'] ?? ''), 20000);

        $editorBrief = [];
        $editorBriefRaw = trim((string) ($validated['editor_brief_json'] ?? ''));
        if ($editorBriefRaw !== '') {
            try {
                $decodedBrief = json_decode($editorBriefRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_editor_brief', 'editor_brief_json must be a valid JSON object.', 422);
            }

            if (! is_array($decodedBrief) || array_is_list($decodedBrief)) {
                return $this->fail('invalid_editor_brief', 'editor_brief_json must be a valid JSON object.', 422);
            }

            $editorBrief = $this->normalizeEditorBrief($decodedBrief);
        }

        $fileNotesByIndex = [];
        $fileNotesRaw = trim((string) ($validated['file_notes_json'] ?? ''));
        if ($fileNotesRaw !== '') {
            try {
                $decoded = json_decode($fileNotesRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_file_notes', 'file_notes_json must be a valid JSON array.', 422);
            }

            if (! is_array($decoded)) {
                return $this->fail('invalid_file_notes', 'file_notes_json must be a valid JSON array.', 422);
            }

            foreach ($decoded as $position => $entry) {
                if (is_array($entry)) {
                    $index = isset($entry['index']) ? max(0, (int) $entry['index']) : (int) $position;
                    $noteValue = $this->normalizeText((string) ($entry['note'] ?? ''), 4000);
                } else {
                    $index = (int) $position;
                    $noteValue = $this->normalizeText((string) $entry, 4000);
                }

                if ($noteValue === '') {
                    continue;
                }

                $fileNotesByIndex[$index] = $noteValue;
            }
        }

        $remotionEdits = [];
        $remotionEditsRaw = trim((string) ($validated['remotion_edits_json'] ?? ''));
        if ($remotionEditsRaw !== '') {
            try {
                $decoded = json_decode($remotionEditsRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_remotion_edits', 'remotion_edits_json must be a valid JSON array.', 422);
            }

            if (! is_array($decoded)) {
                return $this->fail('invalid_remotion_edits', 'remotion_edits_json must be a valid JSON array.', 422);
            }

            foreach ($decoded as $position => $entry) {
                if (! is_array($entry)) {
                    continue;
                }

                $sourceDuration = (float) ($entry['source_duration_seconds'] ?? 0);
                if (! is_finite($sourceDuration) || $sourceDuration <= 0) {
                    $sourceDuration = 6.0;
                }

                $trimStart = (float) ($entry['trim_start_seconds'] ?? 0);
                $trimEnd = (float) ($entry['trim_end_seconds'] ?? $sourceDuration);

                if (! is_finite($trimStart) || $trimStart < 0) {
                    $trimStart = 0.0;
                }

                if (! is_finite($trimEnd) || $trimEnd <= 0) {
                    $trimEnd = $sourceDuration;
                }

                $trimStart = max(0.0, min($trimStart, max(0.0, $sourceDuration - 0.05)));
                $trimEnd = min($sourceDuration, max($trimStart + 0.05, $trimEnd));

                $include = filter_var($entry['include'] ?? true, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
                if (! is_bool($include)) {
                    $include = true;
                }

                $clipId = trim((string) ($entry['id'] ?? $entry['clip_id'] ?? ''));
                if ($clipId === '') {
                    $clipId = 'clip_'.str_pad((string) ((int) $position + 1), 3, '0', STR_PAD_LEFT);
                }

                $remotionEdits[] = [
                    'id' => Str::of($clipId)->limit(120, '')->toString(),
                    'name' => $this->normalizeText((string) ($entry['name'] ?? ''), 220),
                    'include' => $include,
                    'trim_start_seconds' => round($trimStart, 3),
                    'trim_end_seconds' => round($trimEnd, 3),
                    'source_duration_seconds' => round($sourceDuration, 3),
                    'order' => isset($entry['order']) ? (int) $entry['order'] : (int) $position,
                ];
            }

            usort($remotionEdits, static fn (array $a, array $b): int => ($a['order'] <=> $b['order']));
        }

        $remotionSummary = [
            'clip_count' => count($remotionEdits),
            'included_count' => count(array_filter($remotionEdits, static fn (array $entry): bool => ($entry['include'] ?? true) === true)),
            'excluded_count' => count(array_filter($remotionEdits, static fn (array $entry): bool => ($entry['include'] ?? true) === false)),
            'trimmed_count' => count(array_filter(
                $remotionEdits,
                static fn (array $entry): bool => ($entry['trim_start_seconds'] ?? 0) > 0 || ($entry['trim_end_seconds'] ?? 0) < ($entry['source_duration_seconds'] ?? 0)
            )),
        ];

        $channelProfile = [
            'id' => 'system-defaults',
            'name' => 'System Defaults',
            'defaults' => [],
        ];

        $channelProfileRaw = trim((string) ($validated['channel_profile_json'] ?? ''));
        if ($channelProfileRaw !== '') {
            try {
                $decoded = json_decode($channelProfileRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_channel_profile', 'channel_profile_json must be a valid JSON object.', 422);
            }

            if (! is_array($decoded) || array_is_list($decoded)) {
                return $this->fail('invalid_channel_profile', 'channel_profile_json must be a valid JSON object.', 422);
            }

            $channelProfileDefaults = [];
            if (is_array($decoded['defaults'] ?? null)) {
                $normalizedDefaults = $this->normalizeSettingValue($decoded['defaults']);
                if (is_array($normalizedDefaults) && ! array_is_list($normalizedDefaults)) {
                    $channelProfileDefaults = $normalizedDefaults;
                }
            }

            $channelId = Str::of((string) ($decoded['id'] ?? ''))
                ->ascii()
                ->lower()
                ->replaceMatches('/[^a-z0-9\-_]+/', '-')
                ->trim('-_')
                ->limit(80, '')
                ->toString();

            $channelName = $this->normalizeText((string) ($decoded['name'] ?? ''), 120);

            $channelProfile = [
                'id' => $channelId !== '' ? $channelId : 'custom-profile',
                'name' => $channelName !== '' ? $channelName : 'Custom Profile',
                'defaults' => $channelProfileDefaults,
            ];
        }

        $jobOverrides = [];
        $jobOverridesRaw = trim((string) ($validated['job_overrides_json'] ?? ''));
        if ($jobOverridesRaw !== '') {
            try {
                $decoded = json_decode($jobOverridesRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_job_overrides', 'job_overrides_json must be a valid JSON object.', 422);
            }

            if (! is_array($decoded) || array_is_list($decoded)) {
                return $this->fail('invalid_job_overrides', 'job_overrides_json must be a valid JSON object.', 422);
            }

            $normalizedOverrides = $this->normalizeSettingValue($decoded);
            if (is_array($normalizedOverrides) && ! array_is_list($normalizedOverrides)) {
                $jobOverrides = $normalizedOverrides;
            }
        }

        $systemDefaults = $this->systemDefaults();
        $channelDefaults = is_array($channelProfile['defaults'] ?? null) ? $channelProfile['defaults'] : [];

        $resolvedSettings = $this->sortRecursive(
            $this->deepMerge(
                $this->deepMerge($systemDefaults, $channelDefaults),
                $jobOverrides
            )
        );

        $settingsResolution = [
            'precedence' => ['job_overrides', 'channel_defaults', 'system_defaults'],
            'resolved' => $resolvedSettings,
            'sources' => $this->buildSettingsSourceMap($resolvedSettings, $jobOverrides, $channelDefaults, $systemDefaults),
        ];

        $thumbnailMetaByIndex = [];
        $thumbnailRefsMetaRaw = trim((string) ($validated['thumbnail_refs_json'] ?? ''));
        if ($thumbnailRefsMetaRaw !== '') {
            try {
                $decoded = json_decode($thumbnailRefsMetaRaw, true, 512, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                return $this->fail('invalid_thumbnail_refs', 'thumbnail_refs_json must be a valid JSON array.', 422);
            }

            if (! is_array($decoded)) {
                return $this->fail('invalid_thumbnail_refs', 'thumbnail_refs_json must be a valid JSON array.', 422);
            }

            foreach ($decoded as $position => $entry) {
                if (! is_array($entry)) {
                    continue;
                }

                $index = isset($entry['index']) ? max(0, (int) $entry['index']) : (int) $position;
                $thumbnailMetaByIndex[$index] = [
                    'name' => $this->normalizeText((string) ($entry['name'] ?? ''), 180),
                    'note' => $this->normalizeText((string) ($entry['note'] ?? ''), 3000),
                ];
            }
        }

        $uploaded = [];
        $totalBytes = 0;
        $notedCount = 0;

        foreach ($request->file('files', []) as $index => $file) {
            if (! $file) {
                continue;
            }

            $originalName = $file->getClientOriginalName() ?: 'clip-'.($index + 1);
            $extension = strtolower($file->getClientOriginalExtension() ?: ($file->extension() ?: 'bin'));
            $stem = pathinfo($originalName, PATHINFO_FILENAME);

            $safeStem = Str::of($stem)
                ->ascii()
                ->replaceMatches('/[^A-Za-z0-9\-_]+/', '-')
                ->trim('-_')
                ->limit(60, '')
                ->value();

            if ($safeStem === '') {
                $safeStem = 'clip-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
            }

            $storedName = sprintf('%03d-%s.%s', $index + 1, $safeStem, $extension);
            $storedPath = $disk->putFileAs($basePath, $file, $storedName);

            if (! is_string($storedPath) || $storedPath === '') {
                return $this->fail('upload_failed', 'Failed to store one or more uploaded files.', 500);
            }

            $sizeBytes = (int) ($file->getSize() ?? 0);
            $totalBytes += $sizeBytes;

            $clipNote = $fileNotesByIndex[$index] ?? '';
            if ($clipNote !== '') {
                $notedCount += 1;
                $disk->put("{$basePath}/notes/{$storedName}.txt", $clipNote);
            }

            $uploaded[] = [
                'index' => $index,
                'original_name' => $originalName,
                'stored_name' => $storedName,
                'path' => $storedPath,
                'url' => $this->resolveUrl($diskName, $storedPath),
                'size_bytes' => $sizeBytes,
                'mime_type' => $file->getClientMimeType() ?: null,
                'note' => $clipNote !== '' ? $clipNote : null,
            ];
        }

        $thumbnailReferences = [];
        $thumbnailNotedCount = 0;

        foreach ($request->file('thumbnail_refs', []) as $index => $file) {
            if (! $file) {
                continue;
            }

            $originalName = $file->getClientOriginalName() ?: 'thumbnail-ref-'.($index + 1);
            $extension = strtolower($file->getClientOriginalExtension() ?: ($file->extension() ?: 'bin'));
            $stem = pathinfo($originalName, PATHINFO_FILENAME);

            $safeStem = Str::of($stem)
                ->ascii()
                ->replaceMatches('/[^A-Za-z0-9\-_]+/', '-')
                ->trim('-_')
                ->limit(60, '')
                ->value();

            if ($safeStem === '') {
                $safeStem = 'thumbnail-ref-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
            }

            $storedName = sprintf('%03d-%s.%s', $index + 1, $safeStem, $extension);
            $storedPath = $disk->putFileAs("{$basePath}/thumbnail-refs", $file, $storedName);

            if (! is_string($storedPath) || $storedPath === '') {
                return $this->fail('thumbnail_ref_upload_failed', 'Failed to store one or more thumbnail references.', 500);
            }

            $meta = $thumbnailMetaByIndex[$index] ?? [];
            $refNote = $this->normalizeText((string) ($meta['note'] ?? ''), 3000);
            if ($refNote !== '') {
                $thumbnailNotedCount += 1;
                $disk->put("{$basePath}/thumbnail-refs/notes/{$storedName}.txt", $refNote);
            }

            $thumbnailReferences[] = [
                'index' => $index,
                'original_name' => $originalName,
                'stored_name' => $storedName,
                'path' => $storedPath,
                'url' => $this->resolveUrl($diskName, $storedPath),
                'size_bytes' => (int) ($file->getSize() ?? 0),
                'mime_type' => $file->getClientMimeType() ?: null,
                'name_hint' => $meta['name'] ?? null,
                'note' => $refNote !== '' ? $refNote : null,
            ];
        }

        $remotionEditsPath = null;
        if ($remotionEdits !== []) {
            $remotionEditsPath = "{$basePath}/remotion-edits.json";
            $disk->put(
                $remotionEditsPath,
                (string) json_encode($remotionEdits, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        $manifest = [
            'intake_contract_version' => 2,
            'run_id' => $runId,
            'created_at' => $createdAt,
            'owner' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
            'notes' => $notes,
            'editor_brief' => $editorBrief,
            'uploaded_count' => count($uploaded),
            'noted_count' => $notedCount,
            'total_bytes' => $totalBytes,
            'files' => $uploaded,
            'channel_profile' => $channelProfile,
            'job_overrides' => $jobOverrides,
            'settings_resolution' => $settingsResolution,
            'remotion_edits_path' => $remotionEditsPath,
            'remotion_edits_summary' => $remotionSummary,
            'thumbnail_ref_count' => count($thumbnailReferences),
            'thumbnail_ref_noted_count' => $thumbnailNotedCount,
            'thumbnail_references' => $thumbnailReferences,
        ];

        $manifestPath = "{$basePath}/manifest.json";
        $disk->put(
            $manifestPath,
            (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $notesPath = null;
        if ($notes !== '') {
            $notesPath = "{$basePath}/notes.txt";
            $disk->put($notesPath, $notes);
        }

        $manifestUrl = $this->resolveUrl($diskName, $manifestPath);

        VideoHoggRun::query()->updateOrCreate(
            ['run_id' => $runId],
            [
                'user_id' => $user->id,
                'status' => 'queued',
                'service_status' => 'submitted',
                'service_status_changed_at' => now(),
                'service_status_note' => 'Request received and queued.',
                'storage_disk' => $diskName,
                'base_path' => $basePath,
                'manifest_path' => $manifestPath,
                'manifest_url' => $manifestUrl,
                'notes_path' => $notesPath,
                'uploaded_count' => count($uploaded),
                'noted_count' => $notedCount,
                'total_bytes' => $totalBytes,
                'claimed_by' => null,
                'claimed_at' => null,
                'claim_expires_at' => null,
                'started_at' => null,
                'completed_at' => null,
                'failed_at' => null,
                'in_hands_at' => null,
                'in_progress_at' => null,
                'packaging_at' => null,
                'delivered_at' => null,
                'revision_requested_at' => null,
                'service_completed_at' => null,
                'blocked_at' => null,
                'failure_code' => null,
                'failure_message' => null,
                'extra' => [
                    'owner_email' => $user->email,
                    'owner_name' => $user->name,
                    'editor_brief' => $editorBrief,
                    'channel_profile_id' => $channelProfile['id'] ?? null,
                    'settings_resolution' => $settingsResolution,
                    'remotion_edits_count' => $remotionSummary['clip_count'],
                    'remotion_trimmed_count' => $remotionSummary['trimmed_count'],
                    'remotion_excluded_count' => $remotionSummary['excluded_count'],
                    'remotion_edits_path' => $remotionEditsPath,
                    'thumbnail_ref_count' => count($thumbnailReferences),
                    'thumbnail_ref_noted_count' => $thumbnailNotedCount,
                ],
            ]
        );

        return $this->ok([
            'run_id' => $runId,
            'created_at' => $createdAt,
            'status' => 'queued',
            'service_status' => 'submitted',
            'uploaded_count' => count($uploaded),
            'noted_count' => $notedCount,
            'total_bytes' => $totalBytes,
            'manifest_path' => $manifestPath,
            'manifest_url' => $manifestUrl,
            'editor_brief' => $editorBrief,
            'files' => $uploaded,
            'channel_profile' => [
                'id' => $channelProfile['id'] ?? null,
                'name' => $channelProfile['name'] ?? null,
            ],
            'settings_resolution' => $settingsResolution,
            'remotion_edits_count' => $remotionSummary['clip_count'],
            'remotion_trimmed_count' => $remotionSummary['trimmed_count'],
            'remotion_excluded_count' => $remotionSummary['excluded_count'],
            'thumbnail_ref_count' => count($thumbnailReferences),
            'thumbnail_ref_noted_count' => $thumbnailNotedCount,
        ], 201);
    }

    public function storeYouTubeIdeas(Request $request)
    {
        $validated = $request->validate([
            'youtube_url' => ['required', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'title_options' => ['nullable', 'integer', 'min:1', 'max:5'],
            'description_options' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        if (! $this->isAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to use VideoHogg intake.', 403);
        }

        if (! $this->isYouTubeIdeasAllowedEmail((string) $user->email)) {
            return $this->fail('forbidden', 'This account is not allowed to use YouTube ideas generation.', 403);
        }

        $normalizedUrl = $this->normalizeYouTubeUrl((string) $validated['youtube_url']);
        if (! $normalizedUrl) {
            return $this->fail('invalid_youtube_url', 'Please provide a valid YouTube video URL.', 422);
        }

        $diskName = trim((string) env('VIDEOHOGG_STORAGE_DISK', 'public')) ?: 'public';

        try {
            $disk = Storage::disk($diskName);
        } catch (Throwable) {
            return $this->fail(
                'storage_not_configured',
                sprintf('Storage disk "%s" is not configured for VideoHogg.', $diskName),
                503
            );
        }

        $runId = 'vh_'.Str::lower(Str::random(12));
        $createdAt = now()->toIso8601String();
        $basePath = "videohogg/{$user->id}/{$runId}";

        $notes = $this->normalizeText((string) ($validated['notes'] ?? ''), 4000);
        $titleOptions = max(1, min(5, (int) ($validated['title_options'] ?? 3)));
        $descriptionOptions = max(1, min(5, (int) ($validated['description_options'] ?? 3)));

        $manifest = [
            'intake_contract_version' => 2,
            'request_type' => 'youtube_ideas',
            'run_id' => $runId,
            'created_at' => $createdAt,
            'owner' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
            'notes' => $notes,
            'uploaded_count' => 0,
            'noted_count' => 0,
            'total_bytes' => 0,
            'files' => [],
            'youtube_request' => [
                'url' => $normalizedUrl,
                'title_options' => $titleOptions,
                'description_options' => $descriptionOptions,
            ],
            'settings_resolution' => [
                'precedence' => ['job_overrides', 'channel_defaults', 'system_defaults'],
                'resolved' => [
                    'output' => [
                        'deliverables' => [
                            'title_options' => $titleOptions,
                            'description_options' => $descriptionOptions,
                        ],
                    ],
                ],
                'sources' => [
                    'output.deliverables.title_options' => 'job_overrides',
                    'output.deliverables.description_options' => 'job_overrides',
                ],
            ],
        ];

        $manifestPath = "{$basePath}/manifest.json";
        $disk->put(
            $manifestPath,
            (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $notesPath = null;
        if ($notes !== '') {
            $notesPath = "{$basePath}/notes.txt";
            $disk->put($notesPath, $notes);
        }

        $manifestUrl = $this->resolveUrl($diskName, $manifestPath);

        VideoHoggRun::query()->updateOrCreate(
            ['run_id' => $runId],
            [
                'user_id' => $user->id,
                'status' => 'queued',
                'service_status' => 'submitted',
                'service_status_changed_at' => now(),
                'service_status_note' => 'Request received and queued.',
                'storage_disk' => $diskName,
                'base_path' => $basePath,
                'manifest_path' => $manifestPath,
                'manifest_url' => $manifestUrl,
                'notes_path' => $notesPath,
                'uploaded_count' => 0,
                'noted_count' => 0,
                'total_bytes' => 0,
                'claimed_by' => null,
                'claimed_at' => null,
                'claim_expires_at' => null,
                'started_at' => null,
                'completed_at' => null,
                'failed_at' => null,
                'in_hands_at' => null,
                'in_progress_at' => null,
                'packaging_at' => null,
                'delivered_at' => null,
                'revision_requested_at' => null,
                'service_completed_at' => null,
                'blocked_at' => null,
                'failure_code' => null,
                'failure_message' => null,
                'extra' => [
                    'request_type' => 'youtube_ideas',
                    'owner_email' => $user->email,
                    'owner_name' => $user->name,
                    'youtube_url' => $normalizedUrl,
                    'title_options_requested' => $titleOptions,
                    'description_options_requested' => $descriptionOptions,
                ],
            ]
        );

        return $this->ok([
            'run_id' => $runId,
            'created_at' => $createdAt,
            'status' => 'queued',
            'service_status' => 'submitted',
            'request_type' => 'youtube_ideas',
            'manifest_path' => $manifestPath,
            'manifest_url' => $manifestUrl,
            'youtube_url' => $normalizedUrl,
            'title_options_requested' => $titleOptions,
            'description_options_requested' => $descriptionOptions,
        ], 201);
    }

    private function resolveUrl(string $diskName, string $path): ?string
    {
        try {
            return Storage::disk($diskName)->url($path);
        } catch (Throwable) {
            return null;
        }
    }

    private function normalizeEditorBrief(array $payload): array
    {
        $clean = ['version' => 1];
        $allowedFields = ['tone', 'intent', 'must_keep', 'avoid', 'cta'];
        $hasValue = false;

        foreach ($allowedFields as $field) {
            $value = $payload[$field] ?? null;
            if (! is_string($value)) {
                if (! is_null($value) && $value !== '') {
                    $value = (string) $value;
                } else {
                    $value = '';
                }
            }

            $value = $this->normalizeText((string) $value, 2000);
            if ($value === '') {
                continue;
            }

            $clean[$field] = $value;
            $hasValue = true;
        }

        if (! $hasValue) {
            return [];
        }

        return $clean;
    }

    private function normalizeText(string $value, int $limit = 4000): string
    {
        return Str::of($value)
            ->replace("\r\n", "\n")
            ->replace("\r", "\n")
            ->trim()
            ->limit($limit, '')
            ->toString();
    }

    private function normalizeSettingValue(mixed $value, int $depth = 0): mixed
    {
        if ($depth >= 6) {
            if (is_array($value)) {
                return [];
            }

            return $this->normalizeSettingScalar($value);
        }

        if (is_array($value)) {
            if (array_is_list($value)) {
                $normalizedList = [];
                foreach ($value as $item) {
                    $normalizedList[] = $this->normalizeSettingValue($item, $depth + 1);
                    if (count($normalizedList) >= 25) {
                        break;
                    }
                }

                return $normalizedList;
            }

            $normalizedObject = [];
            foreach ($value as $key => $entry) {
                $normalizedKey = Str::of((string) $key)
                    ->ascii()
                    ->replaceMatches('/[^A-Za-z0-9_\-.]+/', '_')
                    ->trim('_')
                    ->limit(80, '')
                    ->toString();

                if ($normalizedKey === '') {
                    continue;
                }

                $normalizedObject[$normalizedKey] = $this->normalizeSettingValue($entry, $depth + 1);
            }

            ksort($normalizedObject);

            return $normalizedObject;
        }

        return $this->normalizeSettingScalar($value);
    }

    private function normalizeSettingScalar(mixed $value): mixed
    {
        if (is_null($value) || is_bool($value) || is_int($value)) {
            return $value;
        }

        if (is_float($value)) {
            return round($value, 4);
        }

        if (is_string($value)) {
            return $this->normalizeText($value, 500);
        }

        if (is_numeric($value)) {
            return round((float) $value, 4);
        }

        return $this->normalizeText((string) $value, 500);
    }

    private function deepMerge(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (
                array_key_exists($key, $base)
                && is_array($base[$key])
                && is_array($value)
                && ! array_is_list($base[$key])
                && ! array_is_list($value)
            ) {
                $base[$key] = $this->deepMerge($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }

    private function sortRecursive(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn (mixed $entry): mixed => $this->sortRecursive($entry), $value);
        }

        foreach ($value as $key => $entry) {
            $value[$key] = $this->sortRecursive($entry);
        }

        ksort($value);

        return $value;
    }

    private function buildSettingsSourceMap(
        array $resolved,
        array $jobOverrides,
        array $channelDefaults,
        array $systemDefaults,
        string $prefix = ''
    ): array {
        $map = [];

        foreach ($resolved as $key => $value) {
            $path = $prefix === '' ? (string) $key : "{$prefix}.{$key}";

            $jobHas = array_key_exists($key, $jobOverrides);
            $channelHas = array_key_exists($key, $channelDefaults);
            $systemHas = array_key_exists($key, $systemDefaults);

            $jobValue = $jobHas ? $jobOverrides[$key] : null;
            $channelValue = $channelHas ? $channelDefaults[$key] : null;
            $systemValue = $systemHas ? $systemDefaults[$key] : null;

            if (is_array($value) && ! array_is_list($value)) {
                $map = array_merge(
                    $map,
                    $this->buildSettingsSourceMap(
                        $value,
                        ($jobHas && is_array($jobValue) && ! array_is_list($jobValue)) ? $jobValue : [],
                        ($channelHas && is_array($channelValue) && ! array_is_list($channelValue)) ? $channelValue : [],
                        ($systemHas && is_array($systemValue) && ! array_is_list($systemValue)) ? $systemValue : [],
                        $path,
                    )
                );

                continue;
            }

            if ($jobHas) {
                $map[$path] = 'job_overrides';
            } elseif ($channelHas) {
                $map[$path] = 'channel_defaults';
            } elseif ($systemHas) {
                $map[$path] = 'system_defaults';
            } else {
                $map[$path] = 'derived';
            }
        }

        ksort($map);

        return $map;
    }

    private function systemDefaults(): array
    {
        return [
            'handoff' => [
                'mode' => 'self-edit-then-batch',
                'return_package' => [
                    'description_options' => 3,
                    'final_video' => true,
                    'title_options' => 3,
                    'transcript' => true,
                ],
            ],
            'output' => [
                'aspect_ratio' => '16:9',
                'deliverables' => [
                    'chapter_timestamps' => true,
                    'description_options' => 3,
                    'final_video' => true,
                    'social_short_clip' => true,
                    'title_options' => 3,
                    'transcript' => true,
                ],
                'duration_target_minutes' => 9,
                'target_platform' => 'youtube',
            ],
            'thumbnail' => [
                'reference_strategy' => 'follow_uploaded_refs_first',
                'safe_title_area' => true,
            ],
        ];
    }

    private function normalizeYouTubeUrl(string $value): ?string
    {
        $videoId = $this->extractYouTubeVideoId($value);
        if (! $videoId) {
            return null;
        }

        return "https://www.youtube.com/watch?v={$videoId}";
    }

    private function extractYouTubeVideoId(string $value): ?string
    {
        $raw = trim($value);
        if ($raw === '') {
            return null;
        }

        $videoIdPattern = '/^[A-Za-z0-9_-]{11}$/';
        if (preg_match($videoIdPattern, $raw) === 1) {
            return $raw;
        }

        $parts = @parse_url($raw);
        if (! is_array($parts)) {
            return null;
        }

        $host = Str::lower((string) ($parts['host'] ?? ''));
        $path = (string) ($parts['path'] ?? '');
        $query = [];

        if (! empty($parts['query'])) {
            parse_str((string) $parts['query'], $query);
        }

        $candidate = null;

        if ($host === 'youtu.be' || $host === 'www.youtu.be') {
            $candidate = trim($path, '/');
        } elseif (str_contains($host, 'youtube.com')) {
            if (str_starts_with($path, '/watch')) {
                $candidate = (string) ($query['v'] ?? '');
            } elseif (str_starts_with($path, '/shorts/')) {
                $candidate = explode('/', trim(substr($path, strlen('/shorts/')), '/'))[0] ?? '';
            } elseif (str_starts_with($path, '/embed/')) {
                $candidate = explode('/', trim(substr($path, strlen('/embed/')), '/'))[0] ?? '';
            } elseif (str_starts_with($path, '/live/')) {
                $candidate = explode('/', trim(substr($path, strlen('/live/')), '/'))[0] ?? '';
            }
        }

        $candidate = trim((string) $candidate);
        if ($candidate === '' || preg_match($videoIdPattern, $candidate) !== 1) {
            return null;
        }

        return $candidate;
    }

    private function isYouTubeIdeasAllowedEmail(string $email): bool
    {
        $allowedEmails = collect(explode(',', (string) env('VIDEOHOGG_YOUTUBE_IDEA_EMAILS', 'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com,chris.stitchscreen@gmail.com')))
            ->map(static fn (string $value): string => Str::lower(trim($value)))
            ->filter(static fn (string $value): bool => $value !== '')
            ->values();

        if ($allowedEmails->isEmpty()) {
            return false;
        }

        return $allowedEmails->contains(Str::lower(trim($email)));
    }

    private function isAllowedEmail(string $email): bool
    {
        $allowedEmails = collect(explode(',', (string) env('VIDEOHOGG_ALLOWED_EMAILS', 'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com,chris.stitchscreen@gmail.com')))
            ->map(static fn (string $value): string => Str::lower(trim($value)))
            ->filter(static fn (string $value): bool => $value !== '')
            ->values();

        if ($allowedEmails->isEmpty()) {
            return false;
        }

        return $allowedEmails->contains(Str::lower(trim($email)));
    }
}
