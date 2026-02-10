<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VideoFeedApiTest extends TestCase
{
    public function test_latest_videos_endpoint_returns_parsed_feed_items(): void
    {
        putenv('YOUTUBE_CHANNEL_ID=UCtestchannel123');
        $_ENV['YOUTUBE_CHANNEL_ID'] = 'UCtestchannel123';
        $_SERVER['YOUTUBE_CHANNEL_ID'] = 'UCtestchannel123';

        $xml = <<<'XML'
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <id>yt:video:abc123xyz89</id>
    <yt:videoId>abc123xyz89</yt:videoId>
    <title>A.T. Day 5 - Pushing Through</title>
    <published>2026-02-10T13:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123xyz89" />
    <media:group>
      <media:description>Day 5 trail recap.</media:description>
      <media:thumbnail url="https://i.ytimg.com/vi/abc123xyz89/hqdefault.jpg" />
    </media:group>
  </entry>
  <entry>
    <id>yt:video:def456uvw12</id>
    <yt:videoId>def456uvw12</yt:videoId>
    <title>A.T. Day 4 - Rain and Ridge</title>
    <published>2026-02-09T13:00:00+00:00</published>
    <link rel="alternate" href="https://www.youtube.com/watch?v=def456uvw12" />
    <media:group>
      <media:description>Day 4 trail recap.</media:description>
      <media:thumbnail url="https://i.ytimg.com/vi/def456uvw12/hqdefault.jpg" />
    </media:group>
  </entry>
</feed>
XML;

        Http::fake([
            'https://www.youtube.com/feeds/videos.xml*' => Http::response($xml, 200, [
                'Content-Type' => 'application/atom+xml',
            ]),
        ]);

        $response = $this->getJson('/api/v1/videos/latest?limit=2&source=channel');

        $response->assertOk();
        $response->assertJsonPath('data.items.0.id', 'abc123xyz89');
        $response->assertJsonPath('data.items.0.title', 'A.T. Day 5 - Pushing Through');
        $response->assertJsonPath('data.items.1.id', 'def456uvw12');
        $response->assertJsonPath('data.source', 'channel');

        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('no-cache', $cacheControl);
    }

    public function test_latest_videos_endpoint_returns_service_unavailable_when_feed_fails(): void
    {
        putenv('YOUTUBE_CHANNEL_ID=UCtestchannel123');
        $_ENV['YOUTUBE_CHANNEL_ID'] = 'UCtestchannel123';
        $_SERVER['YOUTUBE_CHANNEL_ID'] = 'UCtestchannel123';

        Http::fake([
            'https://www.youtube.com/feeds/videos.xml*' => Http::response('down', 503),
        ]);

        $response = $this->getJson('/api/v1/videos/latest?limit=3&source=channel');

        $response->assertStatus(503);
        $response->assertJsonPath('error.code', 'video_feed_unavailable');
    }
}
