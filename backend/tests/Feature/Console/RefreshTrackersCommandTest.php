<?php

namespace Tests\Feature\Console;

use App\Models\CommunityTracker;
use App\Models\TrackerFix;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RefreshTrackersCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_refresh_command_creates_fix_for_tracker(): void
    {
        $user = User::factory()->create();

        $tracker = CommunityTracker::query()->create([
            'user_id' => $user->id,
            'label' => 'HoggCountry',
            'garmin_share_id' => 'hoggcountry',
            'color' => '#0ea5e9',
            'is_public' => true,
        ]);

        Http::fake([
            'https://explore.garmin.com/Feed/Share/*' => Http::response($this->kmlPoint('2026-02-07T03:00:00Z', -84.002301, 34.678923), 200),
        ]);

        $this->artisan('trackers:refresh')->assertExitCode(0);

        $fix = TrackerFix::query()->where('tracker_id', $tracker->id)->first();

        $this->assertNotNull($fix);
        $this->assertEqualsWithDelta(34.678923, (float) $fix->lat, 0.000001);
        $this->assertEqualsWithDelta(-84.002301, (float) $fix->lon, 0.000001);
        $this->assertSame('2026-02-07T03:00:00+00:00', $fix->observed_at?->toIso8601String());
    }

    public function test_refresh_command_touches_existing_fix_for_same_coordinates(): void
    {
        $user = User::factory()->create();

        $tracker = CommunityTracker::query()->create([
            'user_id' => $user->id,
            'label' => 'HoggCountry',
            'garmin_share_id' => 'hoggcountry',
            'color' => '#0ea5e9',
            'is_public' => true,
        ]);

        Http::fakeSequence()
            ->push($this->kmlPoint('2026-02-07T03:00:00Z', -84.002301, 34.678923), 200)
            ->push($this->kmlPoint('2026-02-07T03:05:00Z', -84.002301, 34.678923), 200);

        $this->artisan('trackers:refresh')->assertExitCode(0);
        $this->artisan('trackers:refresh')->assertExitCode(0);

        $this->assertDatabaseCount('tracker_fixes', 1);

        $fix = TrackerFix::query()->where('tracker_id', $tracker->id)->first();

        $this->assertNotNull($fix);
        $this->assertSame('2026-02-07T03:05:00+00:00', $fix->observed_at?->toIso8601String());
    }

    public function test_refresh_command_reads_gx_track_format(): void
    {
        $user = User::factory()->create();

        $tracker = CommunityTracker::query()->create([
            'user_id' => $user->id,
            'label' => 'HoggCountry',
            'garmin_share_id' => 'hoggcountry',
            'color' => '#0ea5e9',
            'is_public' => true,
        ]);

        Http::fake([
            'https://explore.garmin.com/Feed/Share/*' => Http::response($this->kmlGxTrack(), 200),
        ]);

        $this->artisan('trackers:refresh')->assertExitCode(0);

        $fix = TrackerFix::query()->where('tracker_id', $tracker->id)->first();

        $this->assertNotNull($fix);
        $this->assertEqualsWithDelta(34.678923, (float) $fix->lat, 0.000001);
        $this->assertEqualsWithDelta(-84.002301, (float) $fix->lon, 0.000001);
        $this->assertSame('2026-02-07T03:10:00+00:00', $fix->observed_at?->toIso8601String());
    }

    public function test_refresh_command_seeds_default_public_hogg_tracker(): void
    {
        Http::fake([
            'https://explore.garmin.com/Feed/Share/*' => Http::response($this->kmlPoint('2026-02-07T03:00:00Z', -84.002301, 34.678923), 200),
        ]);

        $this->artisan('trackers:refresh')->assertExitCode(0);

        $tracker = CommunityTracker::query()->where('label', 'HoggCountry')->first();
        $this->assertNotNull($tracker);
        $this->assertTrue((bool) $tracker->is_public);
        $this->assertSame('hoggcountry', $tracker->garmin_share_id);
        $this->assertDatabaseCount('tracker_fixes', 1);
    }

    private function kmlPoint(string $when, float $lon, float $lat): string
    {
        return <<<KML
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>HoggCountry</name>
      <TimeStamp>
        <when>{$when}</when>
      </TimeStamp>
      <Point>
        <coordinates>{$lon},{$lat},0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>
KML;
    }

    private function kmlGxTrack(): string
    {
        return <<<KML
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <Placemark>
      <name>HoggCountry</name>
      <gx:Track>
        <when>2026-02-07T03:00:00Z</when>
        <when>2026-02-07T03:10:00Z</when>
        <gx:coord>-84.100000 34.500000 0</gx:coord>
        <gx:coord>-84.002301 34.678923 0</gx:coord>
      </gx:Track>
    </Placemark>
  </Document>
</kml>
KML;
    }
}
