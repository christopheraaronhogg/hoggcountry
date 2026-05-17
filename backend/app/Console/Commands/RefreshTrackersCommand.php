<?php

namespace App\Console\Commands;

use App\Models\CommunityTracker;
use App\Models\TrackerFix;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class RefreshTrackersCommand extends Command
{
    protected $signature = 'trackers:refresh
        {--tracker= : Restrict refresh to one tracker (UUID or Garmin share id)}
        {--limit=0 : Max trackers to process this run}';

    protected $description = 'Fetch latest Garmin MapShare fixes for trackers and persist fresh points';

    public function handle(): int
    {
        $trackerOption = trim((string) ($this->option('tracker') ?? ''));
        $this->ensureDefaultPublicTracker($trackerOption);

        $query = CommunityTracker::query()->orderBy('label');

        if ($trackerOption !== '') {
            $query->where(function ($inner) use ($trackerOption): void {
                $inner
                    ->where('id', $trackerOption)
                    ->orWhere('garmin_share_id', $trackerOption);
            });
        }

        $limit = max(0, (int) ($this->option('limit') ?? 0));
        if ($limit > 0) {
            $query->limit($limit);
        }

        $trackers = $query->get();
        if ($trackers->isEmpty()) {
            $this->info('No trackers found for refresh.');

            return self::SUCCESS;
        }

        $created = 0;
        $touched = 0;
        $unchanged = 0;
        $noFix = 0;
        $failed = 0;

        foreach ($trackers as $tracker) {
            try {
                $fix = $this->fetchLatestFixFromGarmin((string) $tracker->garmin_share_id);

                if (! $fix) {
                    $noFix++;
                    $this->line("[skip] {$tracker->label}: no live point available");
                    continue;
                }

                $result = $this->persistFix($tracker, $fix);

                if ($result === 'created') {
                    $created++;
                    $this->line("[new]  {$tracker->label}: {$fix['lat']}, {$fix['lon']} @ {$fix['observed_at']->toIso8601String()}");
                    continue;
                }

                if ($result === 'touched') {
                    $touched++;
                    $this->line("[touch] {$tracker->label}: refreshed timestamp @ {$fix['observed_at']->toIso8601String()}");
                    continue;
                }

                $unchanged++;
            } catch (Throwable $e) {
                $failed++;
                $this->warn("[fail] {$tracker->label}: {$e->getMessage()}");
                report($e);
            }
        }

        $this->info("trackers:refresh complete (created={$created}, touched={$touched}, unchanged={$unchanged}, no_fix={$noFix}, failed={$failed})");

        // Return success so scheduler keeps running even if a subset fails.
        return self::SUCCESS;
    }

    private function ensureDefaultPublicTracker(string $trackerOption): void
    {
        if ($trackerOption !== '') {
            return;
        }

        if (filter_var(env('HOGGCOUNTRY_DEFAULT_TRACKER_ENABLED', true), FILTER_VALIDATE_BOOLEAN) === false) {
            return;
        }

        $shareId = trim((string) (
            env('HOGGCOUNTRY_GARMIN_SHARE_ID')
            ?: env('HOGG_GARMIN_SHARE_ID')
            ?: env('GARMIN_SHARE_ID')
            ?: 'hoggcountry'
        ));

        if ($shareId === '') {
            return;
        }

        $label = trim((string) env('HOGGCOUNTRY_DEFAULT_TRACKER_LABEL', 'HoggCountry')) ?: 'HoggCountry';

        $tracker = CommunityTracker::query()
            ->where('garmin_share_id', $shareId)
            ->whereRaw('LOWER(label) = ?', [mb_strtolower($label)])
            ->first();

        if ($tracker instanceof CommunityTracker) {
            $tracker->forceFill([
                'is_public' => true,
                'color' => $tracker->color ?: '#dc2626',
            ])->save();

            return;
        }

        $ownerEmail = trim((string) env('HOGGCOUNTRY_TRACKER_OWNER_EMAIL', 'hoggcountry-tracker@hoggcountry.local'))
            ?: 'hoggcountry-tracker@hoggcountry.local';

        $owner = User::query()->firstOrCreate(
            ['email' => $ownerEmail],
            [
                'name' => 'Hogg Country Tracker',
                'password' => Hash::make(Str::random(40)),
            ]
        );

        if ($owner->email_verified_at === null) {
            $owner->forceFill(['email_verified_at' => CarbonImmutable::now('UTC')])->save();
        }

        CommunityTracker::query()->create([
            'user_id' => $owner->id,
            'label' => $label,
            'garmin_share_id' => $shareId,
            'color' => '#dc2626',
            'is_public' => true,
        ]);
    }

    /**
     * @return array{lat: float, lon: float, mile: float|null, observed_at: CarbonImmutable, raw: array<string, mixed>}|null
     */
    private function fetchLatestFixFromGarmin(string $shareId): ?array
    {
        $sourceUrl = sprintf('https://explore.garmin.com/Feed/Share/%s', rawurlencode($shareId));

        $response = Http::timeout(20)
            ->connectTimeout(8)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; HoggCountryTrackerRefresh/1.0)',
                'Accept' => 'application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
            ])
            ->get($sourceUrl);

        if (! $response->ok()) {
            throw new RuntimeException("Garmin upstream returned {$response->status()}");
        }

        $kml = (string) $response->body();
        $candidates = $this->extractPointCandidates($kml);
        if ($candidates === []) {
            return null;
        }

        usort($candidates, function (array $a, array $b): int {
            $aTs = $a['observed_at']?->getTimestamp();
            $bTs = $b['observed_at']?->getTimestamp();

            if ($aTs !== null && $bTs !== null && $aTs !== $bTs) {
                return $aTs <=> $bTs;
            }

            if ($aTs !== null && $bTs === null) {
                return 1;
            }

            if ($aTs === null && $bTs !== null) {
                return -1;
            }

            return ($a['idx'] ?? 0) <=> ($b['idx'] ?? 0);
        });

        /** @var array{lat: float, lon: float, mile: float|null, observed_at: CarbonImmutable|null, observed_raw: string|null} $latest */
        $latest = $candidates[array_key_last($candidates)];
        $observedAt = $latest['observed_at'] ?? CarbonImmutable::now('UTC');

        return [
            'lat' => round($latest['lat'], 7),
            'lon' => round($latest['lon'], 7),
            'mile' => $latest['mile'],
            'observed_at' => $observedAt,
            'raw' => [
                'source' => 'garmin_mapshare',
                'share_id' => $shareId,
                'source_url' => $sourceUrl,
                'fetched_at' => CarbonImmutable::now('UTC')->toIso8601String(),
                'observed_at_raw' => $latest['observed_raw'],
            ],
        ];
    }

    /**
     * @param array{lat: float, lon: float, mile: float|null, observed_at: CarbonImmutable, raw: array<string, mixed>} $fix
     */
    private function persistFix(CommunityTracker $tracker, array $fix): string
    {
        $latest = $tracker->latestFix()->first();

        if ($latest instanceof TrackerFix) {
            $sameCoords =
                round((float) $latest->lat, 7) === round((float) $fix['lat'], 7)
                && round((float) $latest->lon, 7) === round((float) $fix['lon'], 7);

            if ($sameCoords) {
                $latestObserved = $latest->observed_at ? CarbonImmutable::instance($latest->observed_at) : null;

                if ($latestObserved && $fix['observed_at']->greaterThan($latestObserved)) {
                    $latest->observed_at = $fix['observed_at'];
                    $latest->mile = $fix['mile'] ?? $latest->mile;
                    $latest->raw = $fix['raw'];
                    $latest->save();

                    return 'touched';
                }

                return 'unchanged';
            }
        }

        TrackerFix::query()->create([
            'tracker_id' => $tracker->id,
            'lat' => $fix['lat'],
            'lon' => $fix['lon'],
            'mile' => $fix['mile'],
            'observed_at' => $fix['observed_at'],
            'raw' => $fix['raw'],
        ]);

        return 'created';
    }

    /**
     * @return array<int, array{lat: float, lon: float, mile: float|null, observed_at: CarbonImmutable|null, observed_raw: string|null, idx: int}>
     */
    private function extractPointCandidates(string $kml): array
    {
        $placemarkBlocks = [];
        preg_match_all('/<Placemark[\\s\\S]*?<\\/Placemark>/i', $kml, $placemarkBlocks);

        $candidates = [];
        $position = 0;

        foreach (($placemarkBlocks[0] ?? []) as $placemark) {
            $description = $this->extractFirstTagContent($placemark, 'description');
            $mile = $this->extractMileHint($description);

            $pointBlock = $this->extractFirstTagContent($placemark, 'Point');
            if ($pointBlock !== null) {
                $coordsText = $this->extractFirstTagContent($pointBlock, 'coordinates');
                if ($coordsText !== null) {
                    $coords = $this->parseFirstCoordinate($coordsText);
                    if ($coords) {
                        $whenRaw = $this->extractFirstTagContent($placemark, 'when');

                        $candidates[] = [
                            'lat' => $coords['lat'],
                            'lon' => $coords['lon'],
                            'mile' => $mile,
                            'observed_at' => $this->parseObservedAt($whenRaw),
                            'observed_raw' => $whenRaw ? trim($whenRaw) : null,
                            'idx' => $position++,
                        ];
                    }
                }
            }

            $trackBlock = $this->extractFirstTagContent($placemark, 'gx:Track');
            if ($trackBlock !== null) {
                $whenValues = $this->extractAllTagContents($trackBlock, 'when');
                $coordValues = $this->extractAllTagContents($trackBlock, 'gx:coord');

                foreach ($coordValues as $trackIdx => $coordRaw) {
                    $coords = $this->parseGxCoordinate($coordRaw);
                    if (! $coords) {
                        continue;
                    }

                    $whenRaw = $whenValues[$trackIdx] ?? null;

                    $candidates[] = [
                        'lat' => $coords['lat'],
                        'lon' => $coords['lon'],
                        'mile' => $mile,
                        'observed_at' => $this->parseObservedAt($whenRaw),
                        'observed_raw' => $whenRaw ? trim($whenRaw) : null,
                        'idx' => $position++,
                    ];
                }
            }
        }

        return $candidates;
    }

    private function extractFirstTagContent(string $xml, string $tag): ?string
    {
        $pattern = sprintf('/<%s[^>]*>([\\s\\S]*?)<\\/%s>/i', preg_quote($tag, '/'), preg_quote($tag, '/'));

        if (! preg_match($pattern, $xml, $matches)) {
            return null;
        }

        return trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_XML1, 'UTF-8'));
    }

    /**
     * @return array<int, string>
     */
    private function extractAllTagContents(string $xml, string $tag): array
    {
        $pattern = sprintf('/<%s[^>]*>([\\s\\S]*?)<\\/%s>/i', preg_quote($tag, '/'), preg_quote($tag, '/'));

        $matched = preg_match_all($pattern, $xml, $matches);
        if (! $matched) {
            return [];
        }

        return array_map(
            static fn (string $value): string => trim(html_entity_decode($value, ENT_QUOTES | ENT_XML1, 'UTF-8')),
            $matches[1]
        );
    }

    /**
     * @return array{lat: float, lon: float}|null
     */
    private function parseFirstCoordinate(string $coordsText): ?array
    {
        $chunks = preg_split('/\s+/', trim($coordsText)) ?: [];

        foreach ($chunks as $chunk) {
            if ($chunk === '') {
                continue;
            }

            $parts = explode(',', $chunk);
            if (count($parts) < 2) {
                continue;
            }

            $lon = (float) $parts[0];
            $lat = (float) $parts[1];
            if (! is_finite($lat) || ! is_finite($lon)) {
                continue;
            }

            return [
                'lat' => $lat,
                'lon' => $lon,
            ];
        }

        return null;
    }

    /**
     * @return array{lat: float, lon: float}|null
     */
    private function parseGxCoordinate(string $coordsText): ?array
    {
        $parts = preg_split('/\s+/', trim($coordsText)) ?: [];
        if (count($parts) < 2) {
            return null;
        }

        $lon = (float) $parts[0];
        $lat = (float) $parts[1];
        if (! is_finite($lat) || ! is_finite($lon)) {
            return null;
        }

        return [
            'lat' => $lat,
            'lon' => $lon,
        ];
    }

    private function parseObservedAt(?string $value): ?CarbonImmutable
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->utc();
        } catch (Throwable) {
            return null;
        }
    }

    private function extractMileHint(?string $description): ?float
    {
        if (! is_string($description) || trim($description) === '') {
            return null;
        }

        $plain = strip_tags($description);
        if (! preg_match('/mile[^0-9]*([0-9]+(?:\.[0-9]+)?)/i', $plain, $matches)) {
            return null;
        }

        $mile = (float) $matches[1];

        return is_finite($mile) ? $mile : null;
    }
}
