<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\OpenAIChatClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Web PWA Scripture Ask proxy.
 *
 * The iOS app answers on-device with Gemma; the browser PWA has no local model,
 * so it posts the question + the exact PCE verses it already retrieved here, and
 * we ask OpenAI (Chris's key, server-side only) for a short grounded answer.
 * (Cross-origin access from app.hoggcountry.com is handled by the framework's
 * global CORS, same as the rest of the /api/v1 surface.)
 *
 * Hardening: we build the scripture persona ourselves — clients may NOT supply a
 * system prompt, so the key can't be turned into a general-purpose open proxy.
 * The verse text is echoed back to the model purely as grounding; the client
 * re-sources every quote from its own PCE index regardless of what comes back.
 */
class ScriptureAnswerController extends ApiController
{
    public function answer(Request $request, OpenAIChatClient $openAI): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'min:2', 'max:500'],
            'verses' => ['required', 'array', 'min:1', 'max:12'],
            'verses.*.reference' => ['required', 'string', 'max:40'],
            'verses.*.text' => ['required', 'string', 'max:1200'],
        ]);

        $apiKey = (string) config('services.openai.key');
        if ($apiKey === '') {
            // No key configured — the PWA falls back to verses-only. Not an error
            // the user did anything wrong, so it's a soft 503.
            return $this->fail('scripture_model_unavailable', 'Scripture answers are not configured right now.', 503);
        }

        $question = trim($validated['question']);
        $verseList = collect($validated['verses'])
            ->map(fn (array $verse): string => sprintf('%s — "%s"', trim($verse['reference']), trim($verse['text'])))
            ->implode("\n");

        try {
            $answer = $openAI->complete([
                ['role' => 'system', 'content' => $this->personaPrompt($verseList)],
                ['role' => 'user', 'content' => $question],
            ], (string) config('services.openai.scripture_model'), 400, 20);
        } catch (\Throwable) {
            return $this->fail('scripture_model_error', 'Could not reach the scripture model.', 502);
        }

        return $this->ok(['answer' => $answer]);
    }

    private function personaPrompt(string $verseList): string
    {
        return implode("\n", [
            'You are a plain-spoken scripture companion. You help someone understand what the King James Bible says about their question.',
            'Ground your answer ONLY in the verses listed below. Do not bring in other verses, outside doctrine, or facts that are not here. If these verses do not address the question, say so honestly rather than inventing support.',
            'Speak warmly and simply, like a thoughtful friend — not a preacher, scholar, or chatbot. Keep it short: two to four short paragraphs.',
            'When you cite a verse, write its reference, an em dash, and the verse in double quotes exactly as shown below — for example: James 1:3 — "the trying of your faith worketh patience." Quote at most two verses; refer to any others by reference only.',
            'Never reword, modernize, or paraphrase the text inside quotation marks. Never cite a reference that is not in the list.',
            'Use plain text only — no markdown headings, bold, or bullet lists.',
            '',
            'Verses you may use:',
            $verseList,
        ]);
    }
}
