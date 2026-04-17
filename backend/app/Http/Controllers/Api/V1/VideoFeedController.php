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

        if ($requestedSource !== 'playlist') {
            try {
                $pageUrl = $this->resolveChannelVideosPageUrl();
                if ($pageUrl) {
                    $items = $this->parseChannelPageItems(
                        $this->downloadChannelVideosPage($pageUrl),
                        $limit,
                    );

                    if ($items !== []) {
                        return $this->withLiveHeaders($this->ok([
                            'items' => $items,
                            'source' => 'channel_page',
                            'requested_source' => $requestedSource,
                            'feed_url' => $pageUrl,
                            'fetched_at' => now()->toIso8601String(),
                        ]));
                    }

                    $lastError = 'Channel page returned no videos.';
                }
            } catch (Throwable $e) {
                $lastError = $e->getMessage();
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

    private function resolveChannelVideosPageUrl(): ?string
    {
        $channelId = trim((string) env('YOUTUBE_CHANNEL_ID', 'UCtlUsN3UpR-Vmb-XbgAuNHg'));

        if ($channelId === '') {
            return null;
        }

        return sprintf('https://www.youtube.com/channel/%s/videos', rawurlencode($channelId));
    }

    private function downloadChannelVideosPage(string $pageUrl): string
    {
        $response = Http::accept('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
            ->withHeaders([
                'Accept-Language' => 'en-US,en;q=0.9',
            ])
            ->withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36')
            ->timeout(10)
            ->retry(1, 200)
            ->get($pageUrl);

        if (! $response->ok()) {
            throw new \RuntimeException(sprintf('Channel page request failed with status %d.', $response->status()));
        }

        $body = trim((string) $response->body());
        if ($body === '') {
            throw new \RuntimeException('Channel page response body was empty.');
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

    /**
     * @return array<int,array<string,mixed>>
     */
    private function parseChannelPageItems(string $html, int $limit): array
    {
        $payload = $this->extractInitialDataPayload($html);
        $renderers = $this->extractChannelVideoRenderers($payload);
        $items = [];

        foreach ($renderers as $renderer) {
            $videoId = trim((string) ($renderer['videoId'] ?? ''));
            if (preg_match('/^[A-Za-z0-9_-]{11}$/', $videoId) !== 1) {
                continue;
            }

            if (isset($items[$videoId])) {
                continue;
            }

            $title = $this->extractRendererText($renderer['title'] ?? null);
            $description = $this->extractRendererText($renderer['descriptionSnippet'] ?? null);
            if ($description === '') {
                $description = $this->extractRendererText(data_get($renderer, 'detailedMetadataSnippets.0.snippetText'));
            }

            $thumbnail = trim((string) data_get($renderer, 'thumbnail.thumbnails.0.url', ''));
            if ($thumbnail === '') {
                $thumbnail = sprintf('https://i.ytimg.com/vi/%s/hqdefault.jpg', $videoId);
            }

            $items[$videoId] = [
                'id' => $videoId,
                'title' => $title !== '' ? $title : 'Untitled',
                'description' => $description,
                'published' => '',
                'link' => sprintf('https://www.youtube.com/watch?v=%s', $videoId),
                'thumbnail' => $thumbnail,
            ];

            if (count($items) >= $limit) {
                break;
            }
        }

        return array_values($items);
    }

    /**
     * @return array<string,mixed>
     */
    private function extractInitialDataPayload(string $html): array
    {
        $marker = 'var ytInitialData = ';
        $start = strpos($html, $marker);
        if ($start === false) {
            throw new \RuntimeException('Unable to locate ytInitialData in channel page HTML.');
        }

        $start += strlen($marker);
        $end = strpos($html, ';</script>', $start);
        if ($end === false) {
            throw new \RuntimeException('Unable to locate the end of ytInitialData payload.');
        }

        $json = trim(substr($html, $start, $end - $start));
        if ($json === '') {
            throw new \RuntimeException('ytInitialData payload was empty.');
        }

        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            throw new \RuntimeException('Unable to decode ytInitialData payload.');
        }

        return $decoded;
    }

    /**
     * @param  array<string,mixed>  $payload
     * @return array<int,array<string,mixed>>
     */
    private function extractChannelVideoRenderers(array $payload): array
    {
        $tabs = data_get($payload, 'contents.twoColumnBrowseResultsRenderer.tabs', []);
        $renderers = [];

        if (is_array($tabs)) {
            foreach ($tabs as $tab) {
                $tabRenderer = is_array($tab) ? ($tab['tabRenderer'] ?? null) : null;
                if (! is_array($tabRenderer)) {
                    continue;
                }

                $isVideosTab = ($tabRenderer['selected'] ?? false) === true
                    || trim((string) ($tabRenderer['title'] ?? '')) === 'Videos';

                if (! $isVideosTab) {
                    continue;
                }

                $contents = data_get($tabRenderer, 'content.richGridRenderer.contents', []);
                if (! is_array($contents)) {
                    continue;
                }

                foreach ($contents as $entry) {
                    $videoRenderer = data_get($entry, 'richItemRenderer.content.videoRenderer');
                    if (is_array($videoRenderer)) {
                        $renderers[] = $videoRenderer;
                    }
                }

                if ($renderers !== []) {
                    return $renderers;
                }
            }
        }

        $this->collectVideoRenderers($payload, $renderers);

        return $renderers;
    }

    /**
     * @param  mixed  $node
     * @param  array<int,array<string,mixed>>  $renderers
     */
    private function collectVideoRenderers(mixed $node, array &$renderers): void
    {
        if (! is_array($node)) {
            return;
        }

        if (isset($node['videoRenderer']) && is_array($node['videoRenderer'])) {
            $renderers[] = $node['videoRenderer'];
        }

        foreach ($node as $value) {
            $this->collectVideoRenderers($value, $renderers);
        }
    }

    private function extractRendererText(mixed $node): string
    {
        if (is_string($node)) {
            return $this->cleanText($node);
        }

        if (! is_array($node)) {
            return '';
        }

        $simpleText = $node['simpleText'] ?? null;
        if (is_string($simpleText)) {
            return $this->cleanText($simpleText);
        }

        $runs = $node['runs'] ?? null;
        if (! is_array($runs)) {
            return '';
        }

        $parts = [];

        foreach ($runs as $run) {
            if (! is_array($run)) {
                continue;
            }

            $text = $run['text'] ?? null;
            if (is_string($text) && $text !== '') {
                $parts[] = $text;
            }
        }

        return $this->cleanText(implode('', $parts));
    }

    private function cleanText(string $value): string
    {
        $cleaned = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $value) ?? $value;

        return trim(preg_replace('/\s+/u', ' ', $cleaned) ?? $cleaned);
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
