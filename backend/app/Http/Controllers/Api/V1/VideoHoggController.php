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

        $notes = trim((string) ($validated['notes'] ?? ''));
        $fileNotesByIndex = [];

        $fileNotesRaw = trim((string) ($validated['file_notes_json'] ?? ''));
        if ($fileNotesRaw !== '') {
            $decoded = json_decode($fileNotesRaw, true);
            if (! is_array($decoded)) {
                return $this->fail('invalid_file_notes', 'file_notes_json must be a valid JSON array.', 422);
            }

            foreach ($decoded as $position => $entry) {
                if (is_array($entry)) {
                    $index = isset($entry['index']) ? (int) $entry['index'] : (int) $position;
                    $noteValue = trim((string) ($entry['note'] ?? ''));
                } else {
                    $index = (int) $position;
                    $noteValue = trim((string) $entry);
                }

                if ($noteValue === '') {
                    continue;
                }

                $fileNotesByIndex[$index] = Str::of($noteValue)
                    ->replace("\r\n", "\n")
                    ->replace("\r", "\n")
                    ->limit(4000, '')
                    ->toString();
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

        $manifest = [
            'run_id' => $runId,
            'created_at' => $createdAt,
            'owner' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
            'notes' => $notes,
            'uploaded_count' => count($uploaded),
            'noted_count' => $notedCount,
            'total_bytes' => $totalBytes,
            'files' => $uploaded,
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
                'failure_code' => null,
                'failure_message' => null,
                'extra' => [
                    'owner_email' => $user->email,
                    'owner_name' => $user->name,
                ],
            ]
        );

        return $this->ok([
            'run_id' => $runId,
            'created_at' => $createdAt,
            'status' => 'queued',
            'uploaded_count' => count($uploaded),
            'noted_count' => $notedCount,
            'total_bytes' => $totalBytes,
            'manifest_path' => $manifestPath,
            'manifest_url' => $manifestUrl,
            'files' => $uploaded,
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

    private function isAllowedEmail(string $email): bool
    {
        $allowedEmails = collect(explode(',', (string) env('VIDEOHOGG_ALLOWED_EMAILS', 'hoggj@gmail.com,jhogg@gmail.com,christopheraaronhogg@gmail.com')))
            ->map(static fn (string $value): string => Str::lower(trim($value)))
            ->filter(static fn (string $value): bool => $value !== '')
            ->values();

        if ($allowedEmails->isEmpty()) {
            return false;
        }

        return $allowedEmails->contains(Str::lower(trim($email)));
    }
}
