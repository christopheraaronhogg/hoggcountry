<?php

namespace App\Support;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class OpenAIChatClient
{
    /**
     * @param  array<int,array{role:string,content:string}>  $messages
     */
    public function complete(array $messages, string $model, int $maxCompletionTokens, int $timeout = 30): string
    {
        $key = trim((string) config('services.openai.key'));
        if ($key === '') {
            throw new RuntimeException('OpenAI is not configured (missing OPENAI_API_KEY).');
        }

        $lastResponse = null;
        foreach ($this->modelCandidates($model) as $candidate) {
            $response = $this->send($key, $candidate, $messages, $maxCompletionTokens, $timeout);
            if ($response->successful()) {
                $answer = trim((string) data_get($response->json(), 'choices.0.message.content', ''));
                if ($answer !== '') {
                    return $answer;
                }

                throw new RuntimeException('OpenAI returned an empty answer.');
            }

            $lastResponse = $response;
            if (! $this->shouldTryFallback($response)) {
                break;
            }
        }

        throw new RuntimeException('OpenAI request failed: '.$this->describeFailure($lastResponse));
    }

    /**
     * @param  array<int,array{role:string,content:string}>  $messages
     */
    private function send(string $key, string $model, array $messages, int $maxCompletionTokens, int $timeout): Response
    {
        $baseUrl = (string) config('services.openai.base_url', 'https://api.openai.com/v1');

        return Http::withToken($key)
            ->acceptJson()
            ->asJson()
            ->timeout($timeout)
            ->connectTimeout(5)
            ->post($baseUrl.'/chat/completions', [
                'model' => $model,
                'max_completion_tokens' => $maxCompletionTokens,
                'messages' => $messages,
            ]);
    }

    /**
     * @return array<int,string>
     */
    private function modelCandidates(string $model): array
    {
        $primary = trim($model);
        $fallback = trim((string) config('services.openai.fallback_model', 'gpt-5.4'));

        return array_values(array_unique(array_filter([$primary, $fallback])));
    }

    private function shouldTryFallback(Response $response): bool
    {
        if (! in_array($response->status(), [400, 404], true)) {
            return false;
        }

        $code = strtolower((string) data_get($response->json(), 'error.code', ''));
        $message = strtolower((string) data_get($response->json(), 'error.message', ''));
        $haystack = $code.' '.$message;

        return str_contains($haystack, 'model')
            || str_contains($haystack, 'unsupported')
            || str_contains($haystack, 'invalid');
    }

    private function describeFailure(?Response $response): string
    {
        if (! $response) {
            return 'no response';
        }

        $code = (string) data_get($response->json(), 'error.code', 'http_error');
        $message = (string) data_get($response->json(), 'error.message', '');

        return trim('HTTP '.$response->status().' '.$code.' '.$message);
    }
}
