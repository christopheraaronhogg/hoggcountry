<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use SimpleXMLElement;
use Throwable;

class VideoFeedController extends ApiController
{
    public function latest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
            'source' => ['nullable', 'string', 'in:channel,playlist,auto'],
        ]);

        $limit = (int) ($validated['limit'] ?? 8);
        $requestedSource = Str::lower(trim((string) ($validated['source'] ?? 'channel')));

        [$primarySource, $primaryUrl] = $this->resolveFeed($requestedSource);
        if (! $primaryUrl) {
            return $this->fail(
                'video_feed_not_configured',
                'YouTube video feed is not configured. Set YOUTUBE_CHANNEL_ID and/or YOUTUBE_PLAYLIST_ID.',
                503
            );
        }

        $attempts = [[$primarySource, $primaryUrl]];
        [$alternateSource, $alternateUrl] = $this->resolveAlternateFeed($primarySource);
        if ($alternateUrl && $alternateUrl !== $primaryUrl) {
            $attempts[] = [$alternateSource, $alternateUrl];
        }

        $lastError = '';

        foreach ($attempts as [$source, $feedUrl]) {
            try {
                $xml = $this->downloadFeed($feedUrl);
                $items = $this->parseFeedItems($xml, $limit);

                if ($items === []) {
                    $lastError = 'Feed returned no entries.';
                    continue;
                }

                return $this->withLiveHeaders($this->ok([
                    'items' => $items,
                    'source' => $source,
                    'requested_source' => $requestedSource,
                    'feed_url' => $feedUrl,
                    'fetched_at' => now()->toIso8601String(),
                ]));
            } catch (Throwable $e) {
                $lastError = $e->getMessage();
                continue;
            }
        }

        return $this->fail(
            'video_feed_unavailable',
            'Unable to fetch latest YouTube videos right now.',
            503,
            $lastError !== '' ? ['last_error' => Str::limit($lastError, 200)] : null,
        );
    }

    private function withLiveHeaders(JsonResponse $response): JsonResponse
    {
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        return $response;
    }

    /**
     * @return array{0:string,1:?string}
     */
    private function resolveFeed(string $source): array
    {
        $channelId = trim((string) env('YOUTUBE_CHANNEL_ID', 'UCtlUsN3UpR-Vmb-XbgAuNHg'));
        $playlistId = trim((string) env('YOUTUBE_PLAYLIST_ID', 'PLfcu9P1xhBSXb6ZtDe4fmSlfQliywdGoD'));

        $channelUrl = $channelId !== ''
            ? sprintf('https://www.youtube.com/feeds/videos.xml?channel_id=%s', rawurlencode($channelId))
            : null;
        $playlistUrl = $playlistId !== ''
            ? sprintf('https://www.youtube.com/feeds/videos.xml?playlist_id=%s', rawurlencode($playlistId))
            : null;

        if ($source === 'playlist') {
            return ['playlist', $playlistUrl];
        }

        if ($source === 'auto') {
            if ($channelUrl) {
                return ['channel', $channelUrl];
            }

            return ['playlist', $playlistUrl];
        }

        if ($channelUrl) {
            return ['channel', $channelUrl];
        }

        return ['playlist', $playlistUrl];
    }

    /**
     * @return array{0:string,1:?string}
     */
    private function resolveAlternateFeed(string $primarySource): array
    {
        $channelId = trim((string) env('YOUTUBE_CHANNEL_ID', 'UCtlUsN3UpR-Vmb-XbgAuNHg'));
        $playlistId = trim((string) env('YOUTUBE_PLAYLIST_ID', 'PLfcu9P1xhBSXb6ZtDe4fmSlfQliywdGoD'));

        $channelUrl = $channelId !== ''
            ? sprintf('https://www.youtube.com/feeds/videos.xml?channel_id=%s', rawurlencode($channelId))
            : null;
        $playlistUrl = $playlistId !== ''
            ? sprintf('https://www.youtube.com/feeds/videos.xml?playlist_id=%s', rawurlencode($playlistId))
            : null;

        if ($primarySource === 'channel') {
            return ['playlist', $playlistUrl];
        }

        return ['channel', $channelUrl];
    }

    private function downloadFeed(string $feedUrl): string
    {
        $response = Http::accept('application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8')
            ->withUserAgent('HoggCountry-VideoFeed/1.0')
            ->timeout(10)
            ->retry(2, 200)
            ->get($feedUrl);

        if (! $response->ok()) {
            throw new \RuntimeException(sprintf('Feed request failed with status %d.', $response->status()));
        }

        $body = trim((string) $response->body());
        if ($body === '') {
            throw new \RuntimeException('Feed response body was empty.');
        }

        return $body;
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function parseFeedItems(string $xml, int $limit): array
    {
        $xml = trim($xml);
        if ($xml === '') {
            return [];
        }

        $previous = libxml_use_internal_errors(true);
        $feed = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $feed instanceof SimpleXMLElement) {
            throw new \RuntimeException('Unable to parse feed XML.');
        }

        $items = [];

        foreach ($feed->entry as $entry) {
            $videoId = trim((string) ($entry->children('http://www.youtube.com/xml/schemas/2015')->videoId ?? ''));
            $link = $this->extractEntryLink($entry);

            if ($videoId === '' && $link !== '') {
                $videoId = $this->extractVideoIdFromUrl($link);
            }

            if ($videoId === '') {
                continue;
            }

            $mediaGroup = $entry->children('http://search.yahoo.com/mrss/')->group;
            $description = trim((string) ($mediaGroup->description ?? ''));
            if ($description === '') {
                $description = trim((string) ($entry->content ?? ''));
            }

            $thumbnail = '';
            if ($mediaGroup && isset($mediaGroup->thumbnail)) {
                $thumbnailAttrs = $mediaGroup->thumbnail->attributes();
                if ($thumbnailAttrs) {
                    $thumbnail = trim((string) ($thumbnailAttrs['url'] ?? ''));
                }
            }

            if ($thumbnail === '') {
                $thumbnail = sprintf('https://i.ytimg.com/vi/%s/hqdefault.jpg', $videoId);
            }

            if ($link === '') {
                $link = sprintf('https://www.youtube.com/watch?v=%s', $videoId);
            }

            $items[] = [
                'id' => $videoId,
                'title' => trim((string) ($entry->title ?? 'Untitled')),
                'description' => $description,
                'published' => trim((string) ($entry->published ?? '')),
                'link' => $link,
                'thumbnail' => $thumbnail,
            ];

            if (count($items) >= $limit) {
                break;
            }
        }

        return $items;
    }

    private function extractEntryLink(SimpleXMLElement $entry): string
    {
        foreach ($entry->link as $linkNode) {
            $attrs = $linkNode->attributes();
            $href = trim((string) ($attrs['href'] ?? ''));
            if ($href === '') {
                continue;
            }

            $rel = trim((string) ($attrs['rel'] ?? ''));
            if ($rel === '' || $rel === 'alternate') {
                return $href;
            }
        }

        return '';
    }

    private function extractVideoIdFromUrl(string $url): string
    {
        $parts = @parse_url($url);
        if (! is_array($parts)) {
            return '';
        }

        $host = Str::lower((string) ($parts['host'] ?? ''));
        $path = trim((string) ($parts['path'] ?? ''), '/');

        if ($host === 'youtu.be') {
            return preg_match('/^[A-Za-z0-9_-]{11}$/', $path) === 1 ? $path : '';
        }

        if (! str_contains($host, 'youtube.com')) {
            return '';
        }

        parse_str((string) ($parts['query'] ?? ''), $query);
        $candidate = trim((string) ($query['v'] ?? ''));

        return preg_match('/^[A-Za-z0-9_-]{11}$/', $candidate) === 1 ? $candidate : '';
    }
}
