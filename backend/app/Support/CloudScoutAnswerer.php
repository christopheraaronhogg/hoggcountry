<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cloud Scout answer lane for the PWA (app.hoggcountry.com).
 *
 * On iOS, Scout answers entirely on-device through Gemma. In a browser there is
 * no native plugin, so the PWA routes the same context pack to a server-side LLM
 * (OpenAI). The API key never leaves the server; the calling endpoint is
 * auth:sanctum gated so only invited accounts (Dad) can reach it.
 *
 * Grounding matters: Scout must answer from the supplied context and stay honest
 * about uncertainty rather than inventing trail facts (mileages, shelters, water)
 * — stale or fabricated trail data is unsafe for a hiker.
 */
class CloudScoutAnswerer
{
    /**
     * @param  array<string,mixed>  $payload  The Scout context pack (hiker, frame, weather, toolInvocations).
     * @return array{answer:string,confidence:string,contextUsed:array<int,string>}
     */
    public function answer(string $prompt, array $payload): array
    {
        $key = trim((string) config('services.openai.key'));
        if ($key === '') {
            throw new RuntimeException('Cloud Scout is not configured (missing OPENAI_API_KEY).');
        }

        $baseUrl = (string) config('services.openai.base_url', 'https://api.openai.com/v1');
        $model = (string) config('services.openai.scout_model', 'gpt-5.5');
        $contextUsed = $this->contextSections($payload);

        $response = Http::withToken($key)
            ->acceptJson()
            ->asJson()
            ->timeout(30)
            ->post($baseUrl.'/chat/completions', [
                'model' => $model,
                'temperature' => 0.3,
                'max_tokens' => 700,
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt($payload)],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('OpenAI request failed: HTTP '.$response->status());
        }

        $answer = trim((string) data_get($response->json(), 'choices.0.message.content', ''));
        if ($answer === '') {
            throw new RuntimeException('OpenAI returned an empty answer.');
        }

        return [
            'answer' => $answer,
            'confidence' => 'medium',
            'contextUsed' => $contextUsed,
        ];
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function systemPrompt(array $payload): string
    {
        $context = json_encode(
            $payload,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        ) ?: '{}';

        // Defense-in-depth against input-token cost blowup: the controller already
        // rejects oversized payloads, but never splice an unbounded string into the
        // prompt even if that guard is ever bypassed.
        if (mb_strlen($context) > 18000) {
            $context = mb_substr($context, 0, 18000)."\n…(context truncated)";
        }

        return <<<PROMPT
        You are Scout, a calm, expert Appalachian Trail field assistant for a 2026 NOBO thru-hiker. You answer in the second person, concise and field-useful — a hiker reads you on a phone, often tired, sometimes in bad weather.

        Hard rules:
        - Ground every trail fact (mileages, shelters, water sources, towns, resupply) in the CONTEXT below. If the context does not contain a fact, say you do not have it rather than guessing. Never invent trail data — stale or fabricated facts are dangerous on trail.
        - Be honest about uncertainty. It is better to say "I don't have that here" than to sound confident and be wrong.
        - Safety first. For weather, hazards, injury, or hypothermia risk, lead with the safe action.
        - Keep it short: a few sentences or tight bullets. No filler, no preamble.

        CONTEXT (JSON; may be partial):
        {$context}
        PROMPT;
    }

    /**
     * Which context sections were actually present, echoed back so the client can
     * show honest "based on" provenance chips.
     *
     * @param  array<string,mixed>  $payload
     * @return array<int,string>
     */
    private function contextSections(array $payload): array
    {
        $sections = [];
        foreach (['hiker', 'frame', 'weather', 'toolInvocations'] as $section) {
            $value = $payload[$section] ?? null;
            $present = is_array($value) ? $value !== [] : ($value !== null && $value !== '');
            if ($present) {
                $sections[] = $section;
            }
        }

        return $sections;
    }
}
