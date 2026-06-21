<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_endpoint_returns_google_authorize_redirect(): void
    {
        Socialite::shouldReceive('driver->stateless->redirect')
            ->once()
            ->andReturn(new RedirectResponse('https://accounts.google.com/o/oauth2/auth'));

        $response = $this->get('/api/v1/auth/google/redirect');

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
    }

    public function test_google_redirect_stores_callback_url_via_state_cache(): void
    {
        config()->set('app.frontend_auth_allowed_hosts', ['frontend.example.com']);

        $capturedState = null;
        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->once()->andReturnSelf();
        $driver->shouldReceive('with')
            ->once()
            ->withArgs(function (array $params) use (&$capturedState): bool {
                $capturedState = $params['state'] ?? null;

                return is_string($capturedState) && $capturedState !== '';
            })
            ->andReturnSelf();
        $driver->shouldReceive('redirect')
            ->once()
            ->andReturn(new RedirectResponse('https://accounts.google.com/o/oauth2/auth'));

        Socialite::shouldReceive('driver')
            ->once()
            ->with('google')
            ->andReturn($driver);

        $response = $this->get('/api/v1/auth/google/redirect?callback=https://frontend.example.com/login');

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
        $this->assertIsString($capturedState);
        $this->assertNotSame('', $capturedState);
        $this->assertSame(
            'https://frontend.example.com/login',
            Cache::get("oauth_google_state:{$capturedState}")
        );
    }

    public function test_google_callback_creates_user_social_link_and_api_token(): void
    {
        config()->set('app.public_registration_enabled', true);

        $socialUser = $this->fakeGoogleUser(
            id: 'google-123',
            email: 'walker@example.com',
            name: 'AT Walker'
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->getJson('/api/v1/auth/google/callback');

        $response
            ->assertOk()
            ->assertJsonPath('data.provider', 'google')
            ->assertJsonPath('data.user.email', 'walker@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'walker@example.com',
            'name' => 'AT Walker',
        ]);

        $user = User::query()->where('email', 'walker@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseHas('profiles', [
            'user_id' => $user->id,
            'display_name' => 'AT Walker',
        ]);
        $this->assertDatabaseHas('social_accounts', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_user_id' => 'google-123',
            'email' => 'walker@example.com',
        ]);
        $this->assertGreaterThan(0, $user->tokens()->count());
    }

    public function test_google_callback_rejects_new_user_when_registration_is_closed(): void
    {
        $socialUser = $this->fakeGoogleUser(
            id: 'google-private-beta',
            email: 'private-beta@example.com',
            name: 'Private Beta'
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->getJson('/api/v1/auth/google/callback');

        $response
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'registration_closed')
            ->assertJsonPath('error.details.provider', 'google');

        $this->assertDatabaseMissing('users', [
            'email' => 'private-beta@example.com',
        ]);
    }

    public function test_google_callback_links_existing_user_by_email(): void
    {
        $user = User::factory()->create([
            'name' => 'Existing Hiker',
            'email' => 'existing@example.com',
            'email_verified_at' => null,
        ]);

        $socialUser = $this->fakeGoogleUser(
            id: 'google-999',
            email: 'existing@example.com',
            name: 'Google Name'
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->getJson('/api/v1/auth/google/callback');

        $response
            ->assertOk()
            ->assertJsonPath('data.user.email', 'existing@example.com');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('social_accounts', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_user_id' => 'google-999',
        ]);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_google_callback_redirects_browser_to_frontend_callback_url_when_configured(): void
    {
        config()->set('app.public_registration_enabled', true);
        config()->set('app.frontend_auth_callback_url', 'https://frontend.example.com/login');

        $socialUser = $this->fakeGoogleUser(
            id: 'google-777',
            email: 'frontend@example.com',
            name: 'Frontend User'
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->get('/api/v1/auth/google/callback');

        $response->assertStatus(302);
        $location = $response->headers->get('Location');
        $this->assertNotNull($location);
        $this->assertStringStartsWith('https://frontend.example.com/login?', $location);

        parse_str((string) parse_url($location, PHP_URL_QUERY), $queryParams);

        $this->assertSame('google', $queryParams['provider'] ?? null);
        $this->assertIsString($queryParams['handoff'] ?? null);
        $this->assertNotSame('', (string) ($queryParams['handoff'] ?? ''));
        $this->assertArrayNotHasKey('token', $queryParams);

        $handoff = $this->postJson('/api/v1/auth/google/handoff', [
            'code' => $queryParams['handoff'],
        ]);

        $handoff
            ->assertOk()
            ->assertJsonPath('data.provider', 'google')
            ->assertJsonPath('data.user.email', 'frontend@example.com');
        $this->assertNotEmpty($handoff->json('data.token'));

        $this->postJson('/api/v1/auth/google/handoff', [
            'code' => $queryParams['handoff'],
        ])->assertStatus(422)
            ->assertJsonPath('error.code', 'google_handoff_invalid');
    }

    public function test_google_callback_uses_state_mapped_callback_url_when_present(): void
    {
        config()->set('app.public_registration_enabled', true);
        config()->set('app.frontend_auth_allowed_hosts', ['localhost', 'state.example.com']);
        Cache::put('oauth_google_state:test-state', 'https://state.example.com/login', now()->addMinutes(10));

        $socialUser = $this->fakeGoogleUser(
            id: 'google-333',
            email: 'state@example.com',
            name: 'State User'
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->get('/api/v1/auth/google/callback?state=test-state');

        $response->assertStatus(302);
        $location = $response->headers->get('Location');
        $this->assertNotNull($location);
        $this->assertStringStartsWith('https://state.example.com/login?', $location);
        parse_str((string) parse_url($location, PHP_URL_QUERY), $queryParams);
        $this->assertIsString($queryParams['handoff'] ?? null);
        $this->assertNull(Cache::get('oauth_google_state:test-state'));
    }

    public function test_google_callback_rejects_unverified_google_email(): void
    {
        $socialUser = $this->fakeGoogleUser(
            id: 'google-unverified',
            email: 'unverified@example.com',
            name: 'Unverified User',
            emailVerified: false
        );

        Socialite::shouldReceive('driver->stateless->user')
            ->once()
            ->andReturn($socialUser);

        $response = $this->getJson('/api/v1/auth/google/callback');

        $response
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'oauth_unverified_email');

        $this->assertDatabaseMissing('users', [
            'email' => 'unverified@example.com',
        ]);
    }

    private function fakeGoogleUser(string $id, string $email, string $name, bool $emailVerified = true): SocialiteUser
    {
        $user = new SocialiteUser;
        $user->id = $id;
        $user->name = $name;
        $user->email = $email;
        $user->avatar = 'https://example.com/avatar.png';
        $user->setRaw([
            'sub' => $id,
            'name' => $name,
            'email' => $email,
            'email_verified' => $emailVerified,
            'picture' => 'https://example.com/avatar.png',
        ]);

        return $user;
    }
}
