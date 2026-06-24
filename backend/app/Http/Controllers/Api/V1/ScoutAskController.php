<?php

namespace App\Http\Controllers\Api\V1;

use App\Support\CloudScoutAnswerer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

/**
 * Cloud Scout answer lane for the PWA. The on-device Gemma engine cannot run in
 * a browser, so app.hoggcountry.com routes Scout prompts here. Mounted behind
 * auth:sanctum, so only invited accounts (Dad) can spend against the API key.
 */
class ScoutAskController extends ApiController
{
    public function ask(Request $request, CloudScoutAnswerer $answerer): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:4000'],
            'payload' => ['nullable', 'array'],
        ]);

        if (trim((string) config('services.openai.key')) === '') {
            return $this->fail(
                'scout_cloud_unconfigured',
                "Scout's cloud brain isn't configured yet.",
                503
            );
        }

        try {
            $result = $answerer->answer($validated['prompt'], $validated['payload'] ?? []);
        } catch (Throwable $e) {
            report($e);

            return $this->fail(
                'scout_cloud_error',
                'Scout could not reach its cloud brain just now — try again in a moment.',
                502
            );
        }

        return $this->ok($result);
    }
}
