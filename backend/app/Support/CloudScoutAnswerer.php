<?php

namespace App\Support;

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
    public function __construct(private readonly OpenAIChatClient $openAI)
    {
    }

    /**
     * @param  array<string,mixed>  $payload  The Scout context pack (hiker, frame, weather, toolInvocations, conversationHistory).
     * @return array{answer:string,confidence:string,contextUsed:array<int,string>}
     */
    public function answer(string $prompt, array $payload): array
    {
        $key = trim((string) config('services.openai.key'));
        if ($key === '') {
            throw new RuntimeException('Cloud Scout is not configured (missing OPENAI_API_KEY).');
        }

        $model = (string) config('services.openai.scout_model', 'gpt-5.5');
        $contextUsed = $this->contextSections($payload);
        $conversationMessages = $this->conversationMessages($payload['conversationHistory'] ?? null);
        $contextPayload = $payload;
        unset($contextPayload['conversationHistory']);

        $answer = $this->openAI->complete([
            ['role' => 'system', 'content' => $this->instructionPrompt($conversationMessages !== [])],
            ['role' => 'system', 'content' => $this->contextPrompt($contextPayload)],
            ...$conversationMessages,
            ['role' => 'user', 'content' => $prompt],
        ], $model, 700, 30);

        return [
            'answer' => $answer,
            'confidence' => 'medium',
            'contextUsed' => $contextUsed,
        ];
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function instructionPrompt(bool $hasConversationHistory): string
    {
        $conversationRule = $hasConversationHistory
            ? '- Prior user/assistant turns are supplied as message history before the current user prompt. Use them for follow-ups like "last question", "that", "the message before", or "what did I just ask". The current user prompt is the final user message.'
            : '- If no prior user/assistant turns are supplied, do not claim to remember earlier chat turns. Answer from the current prompt and context only.';

        return <<<PROMPT
        You are Scout, a calm, expert Appalachian Trail field assistant for a 2026 NOBO thru-hiker. You answer in the second person, concise and field-useful — a hiker reads you on a phone, often tired, sometimes in bad weather.

        Hard rules:
        - Ground every trail fact (mileages, shelters, water sources, towns, resupply) in the CONTEXT system message. If the context does not contain a fact, say you do not have it rather than guessing. Never invent trail data — stale or fabricated facts are dangerous on trail.
        {$conversationRule}
        - Be honest about uncertainty. It is better to say "I don't have that here" than to sound confident and be wrong.
        - Safety first. For weather, hazards, injury, or hypothermia risk, lead with the safe action.
        - Keep it short: a few sentences or tight bullets. No filler, no preamble.
        PROMPT;
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function contextPrompt(array $payload): string
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
        CONTEXT (JSON; may be partial):
        {$context}
        PROMPT;
    }

    /**
     * @return array<int,array{role:string,content:string}>
     */
    private function conversationMessages(mixed $history): array
    {
        if (! is_array($history)) {
            return [];
        }

        $messages = [];
        foreach (array_slice($history, -12) as $item) {
            if (! is_array($item)) {
                continue;
            }

            $role = $item['role'] ?? null;
            $content = trim((string) ($item['content'] ?? ''));
            if (! in_array($role, ['user', 'assistant'], true) || $content === '') {
                continue;
            }

            if (mb_strlen($content) > 1200) {
                $content = rtrim(mb_substr($content, 0, 1197)).'...';
            }

            $messages[] = ['role' => $role, 'content' => $content];
        }

        return $messages;
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
        foreach (['hiker', 'frame', 'weather', 'toolInvocations', 'conversationHistory'] as $section) {
            $value = $payload[$section] ?? null;
            $present = is_array($value) ? $value !== [] : ($value !== null && $value !== '');
            if ($present) {
                $sections[] = $section;
            }
        }

        return $sections;
    }
}
