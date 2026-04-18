<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
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

        try {
            $upstream = Http::withHeaders($this->forwardHeaders($request))
                ->withOptions([
                    'allow_redirects' => false,
                    'http_errors' => false,
                ])
                ->timeout(20)
                ->send($request->method(), $target, [
                    'body' => in_array($request->method(), ['GET', 'HEAD'], true) ? null : $request->getContent(),
                ]);
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

    /**
     * @return array<string, string>
     */
    private function forwardHeaders(Request $request): array
    {
        $headers = [];

        foreach (['accept', 'accept-language', 'cache-control', 'content-type', 'cookie', 'if-none-match', 'if-modified-since', 'range', 'user-agent'] as $header) {
            $value = $request->header($header);

            if (is_string($value) && $value !== '') {
                $headers[$header] = $value;
            }
        }

        $headers['host'] = (string) $request->getHost();
        $headers['x-forwarded-host'] = (string) $request->getHost();
        $headers['x-forwarded-proto'] = (string) $request->getScheme();
        $headers['x-forwarded-port'] = (string) $request->getPort();
        $headers['x-forwarded-for'] = (string) $request->ip();

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
