<?php

namespace Tests\Feature\Api\V1;

use App\Models\SocialAccount;
use App\Models\User;
use App\Support\OpenAIIdToken;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class OpenAIAuthTest extends TestCase
{
    use RefreshDatabase;

    private const KID = 'test-key-1';

    /** @var resource|\OpenSSLAsymmetricKey */
    private $privateKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->privateKey = openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        $details = openssl_pkey_get_details($this->privateKey);

        Cache::put('openai:idtoken:jwks', [
            'keys' => [[
                'kty' => 'RSA',
                'use' => 'sig',
                'alg' => 'RS256',
                'kid' => self::KID,
                'n' => $this->base64Url($details['rsa']['n']),
                'e' => $this->base64Url($details['rsa']['e']),
            ]],
        ], now()->addHour());
    }

    public function test_chatgpt_login_creates_user_and_social_account(): void
    {
        config()->set('app.public_registration_enabled', true);

        $response = $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken([
                'email' => 'hiker@example.com',
                'name' => 'Trail Hiker',
            ]),
            'device_name' => 'Scout web (ChatGPT login)',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.provider', 'openai')
            ->assertJsonPath('data.user.email', 'hiker@example.com')
            ->assertJsonStructure([
                'data' => ['token', 'user' => ['id', 'email', 'name', 'profile']],
            ]);

        $user = User::query()->where('email', 'hiker@example.com')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->profile);

        $social = SocialAccount::query()
            ->where('provider', 'openai')
            ->where('provider_user_id', 'openai-user-1')
            ->first();
        $this->assertNotNull($social);
        $this->assertTrue($social->user->is($user));
    }

    public function test_chatgpt_login_rejects_new_user_when_registration_is_closed(): void
    {
        $response = $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken([
                'email' => 'private-beta@example.com',
                'name' => 'Private Beta',
            ]),
        ]);

        $response
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'registration_closed')
            ->assertJsonPath('error.details.provider', 'openai');

        $this->assertSame(0, User::query()->where('email', 'private-beta@example.com')->count());
        $this->assertSame(0, SocialAccount::query()->where('provider', 'openai')->count());
    }

    public function test_repeat_chatgpt_login_reuses_existing_user(): void
    {
        config()->set('app.public_registration_enabled', true);

        $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken(['email' => 'hiker@example.com']),
        ])->assertOk();

        $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken(['email' => 'hiker@example.com']),
        ])->assertOk();

        $this->assertSame(1, User::query()->where('email', 'hiker@example.com')->count());
        $this->assertSame(1, SocialAccount::query()->where('provider', 'openai')->count());
    }

    public function test_token_for_a_different_audience_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken([
                'email' => 'hiker@example.com',
                'aud' => 'some-other-client',
            ]),
        ]);

        $response->assertStatus(422)->assertJsonPath('error.code', 'openai_token_invalid');
        $this->assertSame(0, User::query()->where('email', 'hiker@example.com')->count());
    }

    public function test_garbage_token_is_rejected(): void
    {
        $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => 'not-a-jwt',
        ])->assertStatus(422)->assertJsonPath('error.code', 'openai_token_invalid');
    }

    public function test_unverified_email_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/auth/openai/exchange', [
            'id_token' => $this->signedIdToken([
                'email' => 'hiker@example.com',
                'email_verified' => false,
            ]),
        ]);

        $response->assertStatus(422)->assertJsonPath('error.code', 'openai_email_unverified');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function signedIdToken(array $overrides = []): string
    {
        $claims = array_merge([
            'iss' => 'https://auth.openai.com',
            'aud' => OpenAIIdToken::CLIENT_ID,
            'sub' => 'openai-user-1',
            'exp' => time() + 600,
            'iat' => time(),
            'email' => 'hiker@example.com',
            'email_verified' => true,
        ], $overrides);

        return JWT::encode($claims, $this->privateKey, 'RS256', self::KID);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
