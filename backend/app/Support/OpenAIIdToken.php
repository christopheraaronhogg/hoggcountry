<?php

namespace App\Support;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Verifies OpenAI OIDC id_tokens issued to the Codex public client during
 * the "Continue with ChatGPT" login flow. Verification is self-contained
 * (public JWKS), so no shared secret with the frontend is required.
 */
class OpenAIIdToken
{
    public const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';

    private const JWKS_URL = 'https://auth.openai.com/.well-known/jwks.json';

    private const JWKS_CACHE_KEY = 'openai:idtoken:jwks';

    /**
     * The discovery document reports issuer auth0.openai.com while tokens
     * minted by the newer stack carry auth.openai.com; accept both.
     */
    private const ALLOWED_ISSUERS = [
        'https://auth.openai.com',
        'https://auth.openai.com/',
        'https://auth0.openai.com',
        'https://auth0.openai.com/',
    ];

    /**
     * Verify the id_token and return its claims.
     *
     * @return array<string, mixed>
     *
     * @throws RuntimeException when the token is invalid for any reason
     */
    public static function verify(string $idToken): array
    {
        JWT::$leeway = 60;

        try {
            $decoded = JWT::decode($idToken, JWK::parseKeySet(self::jwks(), 'RS256'));
        } catch (\Throwable $exception) {
            throw new RuntimeException('OpenAI id_token failed verification: '.$exception->getMessage(), 0, $exception);
        }

        $claims = json_decode(json_encode($decoded), true);

        if (! is_array($claims)) {
            throw new RuntimeException('OpenAI id_token produced unreadable claims.');
        }

        $issuer = rtrim((string) ($claims['iss'] ?? ''), '/');
        $allowed = array_map(static fn (string $value): string => rtrim($value, '/'), self::ALLOWED_ISSUERS);
        if (! in_array($issuer, $allowed, true)) {
            throw new RuntimeException('OpenAI id_token issuer is not recognized.');
        }

        $audience = $claims['aud'] ?? null;
        $audiences = is_array($audience) ? $audience : [$audience];
        if (! in_array(self::CLIENT_ID, $audiences, true)) {
            throw new RuntimeException('OpenAI id_token was not issued for the expected client.');
        }

        return $claims;
    }

    /**
     * @return array{keys: array<int, array<string, mixed>>}
     */
    private static function jwks(): array
    {
        return Cache::remember(self::JWKS_CACHE_KEY, now()->addHours(6), function (): array {
            $response = Http::timeout(10)->connectTimeout(5)->retry(2, 250)->get(self::JWKS_URL);
            $response->throw();

            $jwks = $response->json();
            if (! is_array($jwks) || empty($jwks['keys']) || ! is_array($jwks['keys'])) {
                throw new RuntimeException('OpenAI JWKS endpoint returned no keys.');
            }

            return $jwks;
        });
    }
}
