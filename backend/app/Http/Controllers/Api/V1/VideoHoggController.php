<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoHoggController extends ApiController
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:20000'],
            'files' => ['required', 'array', 'min:1', 'max:120'],
            'files.*' => ['required', 'file', 'max:512000'], // 500MB each (subject to php.ini limits)
        ]);

        $user = $request->user();
        if (! $user) {
            return $this->fail('unauthenticated', 'Authentication required.', 401);
        }

        $allowedEmails = collect(explode(',', (string) env('VIDEOHOGG_ALLOWED_EMAILS', 'hoggj@gmail.com,jhogg@gmail.com')))
            ->map(static fn (string $email): string => Str::lower(trim($email)))
            ->filter(static fn (string $email): bool => $email !== '')
            ->values();

        if ($allowedEmails->isEmpty()) {
            return $this->fail(
                'videohogg_not_configured',
                'VideoHogg allowlist is not configured. Set VIDEOHOGG_ALLOWED_EMAILS in backend environment.',
                503
            );
        }

        $userEmail = Str::lower((string) $user->email);
        if (! $allowedEmails->contains($userEmail)) {
            return $this->fail('forbidden', 'This account is not allowed to use VideoHogg intake.', 403);
        }

        $runId = 'vh_'.Str::lower(Str::random(12));
        $createdAt = now()->toIso8601String();
        $basePath = "videohogg/{$user->id}/{$runId}";

        $uploaded = [];
        $totalBytes = 0;

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
            $storedPath = Storage::disk('public')->putFileAs($basePath, $file, $storedName);

            if (! is_string($storedPath) || $storedPath === '') {
                return $this->fail('upload_failed', 'Failed to store one or more uploaded files.', 500);
            }

            $sizeBytes = (int) ($file->getSize() ?? 0);
            $totalBytes += $sizeBytes;

            $uploaded[] = [
                'original_name' => $originalName,
                'stored_name' => $storedName,
                'path' => $storedPath,
                'url' => Storage::disk('public')->url($storedPath),
                'size_bytes' => $sizeBytes,
                'mime_type' => $file->getClientMimeType() ?: null,
            ];
        }

        $notes = $validated['notes'] ?? '';

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
            'total_bytes' => $totalBytes,
            'files' => $uploaded,
        ];

        Storage::disk('public')->put(
            "{$basePath}/manifest.json",
            (string) json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        if ($notes !== '') {
            Storage::disk('public')->put("{$basePath}/notes.txt", $notes);
        }

        return $this->ok([
            'run_id' => $runId,
            'created_at' => $createdAt,
            'uploaded_count' => count($uploaded),
            'total_bytes' => $totalBytes,
            'manifest_path' => "{$basePath}/manifest.json",
            'manifest_url' => Storage::disk('public')->url("{$basePath}/manifest.json"),
            'files' => $uploaded,
        ], 201);
    }
}
