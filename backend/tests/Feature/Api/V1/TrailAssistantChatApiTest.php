<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrailAssistantChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_submit_chat_message_into_assistant_queue(): void
    {
        $user = User::factory()->create([
            'name' => 'Trail Hiker',
            'email' => 'trail@example.com',
        ]);

        $token = $user->createToken('trail-chat-test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/chat/messages', [
                'route_label' => 'on-trail',
                'subject' => 'Need town stop advice before dark',
                'message' => 'I am at mile 236 and trying to choose between two towns before weather shifts.',
                'urgency' => 'soon',
                'metadata' => [
                    'weather' => 'rain incoming',
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.route_label', 'on-trail')
            ->assertJsonPath('data.source', 'chat')
            ->assertJsonPath('data.status', 'new');

        $this->assertDatabaseHas('trail_assistant_intakes', [
            'user_id' => $user->id,
            'source' => 'chat',
            'route_label' => 'on-trail',
            'status' => 'new',
            'email' => 'trail@example.com',
        ]);
    }

    public function test_authenticated_user_can_list_recent_chat_messages(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('trail-chat-list')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/chat/messages', [
                'message' => 'First update from trail.',
            ])
            ->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/trail-assistant/chat/messages', [
                'message' => 'Second update from trail.',
                'urgency' => 'urgent',
            ])
            ->assertCreated();

        $list = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/trail-assistant/chat/messages?limit=5');

        $list
            ->assertOk()
            ->assertJsonCount(2, 'data.messages')
            ->assertJsonPath('data.messages.0.urgency', 'urgent');
    }

    public function test_chat_endpoints_require_authentication(): void
    {
        $this->postJson('/api/v1/trail-assistant/chat/messages', [
            'message' => 'hello',
        ])->assertUnauthorized();

        $this->getJson('/api/v1/trail-assistant/chat/messages')->assertUnauthorized();
    }
}
