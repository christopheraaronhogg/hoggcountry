<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OpenClawWebProxyController extends Controller
{
    public function root(Request $request): Response
    {
        if (! $this->proxyEnabled()) {
            return response()->json([
                'data' => [
                    'status' => 'ok',
                    'service' => 'hoggcountry-api',
                    'health' => '/api/v1/health',
                ],
                'error' => null,
                'meta' => [
                    'request_id' => $request->header('x-request-id', (string) Str::uuid()),
                    'build' => $this->buildMeta(),
                ],
            ]);
        }

        return $this->proxy($request, '');
    }

    public function show(Request $request, string $path): Response
    {
        if (! $this->proxyEnabled()) {
            abort(404);
        }

        return $this->proxy($request, $path);
    }

    private function proxyEnabled(): bool
    {
        return (bool) config('services.openclaw_web.enabled', false);
    }

    private function proxy(Request $request, string $path): Response
    {
        $origin = (string) config('services.openclaw_web.origin', 'http://127.0.0.1:3000');
        $target = $origin.'/'.ltrim($path, '/');

        if ($request->getQueryString()) {
            $target .= '?'.$request->getQueryString();
        }

        $multipart = $this->shouldProxyAsMultipart($request);
        $headers = $this->forwardHeaders($request);

        if ($multipart) {
            unset($headers['content-type']);
        }

        try {
            $pending = Http::withHeaders($headers)
                ->withOptions([
                    'allow_redirects' => false,
                    'http_errors' => false,
                ])
                ->timeout(20);

            if ($multipart) {
                $pending = $this->attachMultipartPayload($pending->asMultipart(), $request);
                $upstream = $this->sendMultipart($pending, $request->method(), $target);
            } else {
                $options = [];
                if (! in_array($request->method(), ['GET', 'HEAD'], true)) {
                    $options['body'] = $request->getContent();
                }

                $upstream = $pending->send($request->method(), $target, $options);
            }
        } catch (\Throwable $e) {
            throw new HttpException(503, 'OpenClaw web frontend is unavailable.', $e);
        }

        $response = response($upstream->body(), $upstream->status());

        foreach ($upstream->headers() as $header => $values) {
            $lowerHeader = Str::lower($header);

            if (in_array($lowerHeader, ['connection', 'content-encoding', 'content-length', 'date', 'server', 'transfer-encoding'], true)) {
                continue;
            }

            foreach ($values as $value) {
                $response->headers->set($header, $value, false);
            }
        }

        return $response;
    }

    private function shouldProxyAsMultipart(Request $request): bool
    {
        return str_starts_with(Str::lower((string) $request->header('content-type', '')), 'multipart/form-data');
    }

    private function attachMultipartPayload(PendingRequest $pending, Request $request): PendingRequest
    {
        foreach ($request->request->all() as $name => $value) {
            $pending = $this->attachScalarPart($pending, (string) $name, $value);
        }

        foreach ($request->allFiles() as $name => $value) {
            $pending = $this->attachFilePart($pending, (string) $name, $value);
        }

        return $pending;
    }

    private function attachScalarPart(PendingRequest $pending, string $name, mixed $value): PendingRequest
    {
        if (is_array($value)) {
            foreach ($value as $entry) {
                $pending = $this->attachScalarPart($pending, $name, $entry);
            }

            return $pending;
        }

        return $pending->attach($name, $value === null ? '' : (string) $value);
    }

    private function sendMultipart(PendingRequest $pending, string $method, string $target)
    {
        return match (Str::upper($method)) {
            'POST' => $pending->post($target),
            'PUT' => $pending->put($target),
            'PATCH' => $pending->patch($target),
            default => $pending->send($method, $target),
        };
    }

    private function attachFilePart(PendingRequest $pending, string $name, UploadedFile|array $value): PendingRequest
    {
        foreach (Arr::wrap($value) as $entry) {
            if (is_array($entry)) {
                $pending = $this->attachFilePart($pending, $name, $entry);
                continue;
            }

            if (! $entry instanceof UploadedFile) {
                continue;
            }

            $stream = fopen($entry->getRealPath(), 'r');

            if ($stream === false) {
                throw new HttpException(500, 'Unable to read uploaded file for proxying.');
            }

            $headers = [];
            if (filled($entry->getMimeType())) {
                $headers['Content-Type'] = (string) $entry->getMimeType();
            }

            $pending = $pending->attach($name, $stream, $entry->getClientOriginalName(), $headers);
        }

        return $pending;
    }

    /**
     * @return array<string, string>
     */
    private function forwardHeaders(Request $request): array
    {
        $headers = [];

        foreach (['accept', 'accept-language', 'cache-control', 'content-type', 'cookie', 'if-none-match', 'if-modified-since', 'origin', 'range', 'referer', 'user-agent'] as $header) {
            $value = $request->header($header);

            if (is_string($value) && $value !== '') {
                $headers[$header] = $value;
            }
        }

        $host = trim((string) $request->header('x-forwarded-host', $request->header('host', $request->getHost())));
        $proto = trim((string) $request->header('x-forwarded-proto', $request->getScheme()));
        $port = trim((string) $request->header('x-forwarded-port', (string) $request->getPort()));
        $forwardedFor = trim((string) $request->header('x-forwarded-for', (string) $request->ip()));

        $headers['host'] = $host;
        $headers['x-forwarded-host'] = $host;
        $headers['x-forwarded-proto'] = $proto;
        $headers['x-forwarded-port'] = $port;
        $headers['x-forwarded-for'] = $forwardedFor;

        return $headers;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMeta(): array
    {
        $build = [
            'api_contract_version' => 2,
            'public_trail_assistant_routes' => true,
            'videohogg_queue_routes' => true,
            'native_shell_route' => true,
            'environment' => app()->environment(),
        ];

        foreach ([
            'sha' => env('APP_BUILD_SHA'),
            'branch' => env('APP_BUILD_BRANCH'),
            'deployed_at' => env('APP_BUILD_TIME'),
        ] as $key => $value) {
            if (filled($value)) {
                $build[$key] = $value;
            }
        }

        return $build;
    }
}
