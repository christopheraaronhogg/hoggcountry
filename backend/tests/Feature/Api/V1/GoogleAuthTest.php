<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
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

    public function test_google_callback_creates_user_social_link_and_api_token(): void
    {
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

    private function fakeGoogleUser(string $id, string $email, string $name): SocialiteUser
    {
        $user = new SocialiteUser;
        $user->id = $id;
        $user->name = $name;
        $user->email = $email;
        $user->avatar = 'https://example.com/avatar.png';

        return $user;
    }
}
