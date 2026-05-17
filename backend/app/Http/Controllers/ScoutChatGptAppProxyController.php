<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ScoutChatGptAppProxyController extends Controller
{
    public function handle(Request $request): Response
    {
        if (! (bool) config('services.scout_chatgpt_app.enabled', true)) {
            abort(404);
        }

        return $this->proxy($request);
    }

    private function proxy(Request $request): Response
    {
        $origin = (string) config('services.scout_chatgpt_app.origin', 'http://127.0.0.1:8787');
        $target = $origin.'/mcp';

        if ($request->getQueryString()) {
            $target .= '?'.$request->getQueryString();
        }

        $headers = $this->forwardHeaders($request);
        unset($headers['content-length']);

        try {
            $client = new \GuzzleHttp\Client([
                'allow_redirects' => false,
                'http_errors' => false,
                'read_timeout' => 120,
                'timeout' => 960,
            ]);

            $options = [
                'headers' => $headers,
                'stream' => true,
            ];

            if (! in_array($request->method(), ['GET', 'HEAD'], true)) {
                $options['body'] = $request->getContent();
            }

            $upstream = $client->request($request->method(), $target, $options);
        } catch (\Throwable $e) {
            throw new HttpException(503, 'Scout ChatGPT MCP server is unavailable.');
        }

        $body = $upstream->getBody();
        $response = response()->stream(function () use ($body): void {
            while (! $body->eof()) {
                echo $body->read(1024);

                if (function_exists('ob_flush')) {
                    @ob_flush();
                }

                flush();
            }
        }, $upstream->getStatusCode());

        foreach ($upstream->getHeaders() as $header => $values) {
            $lowerHeader = Str::lower($header);

            if (in_array($lowerHeader, ['connection', 'content-encoding', 'content-length', 'date', 'server', 'transfer-encoding'], true)) {
                continue;
            }

            foreach ($values as $value) {
                $response->headers->set($header, $value, false);
            }
        }

        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Cache-Control', 'no-cache, no-transform');

        return $response;
    }

    /**
     * @return array<string, string>
     */
    private function forwardHeaders(Request $request): array
    {
        $headers = [];

        foreach (['accept', 'accept-language', 'cache-control', 'content-type', 'origin', 'referer', 'user-agent'] as $header) {
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
}
