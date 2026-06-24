<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\PushSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPushNotification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array{title: string, body: string, url?: string|null}  $payload
     */
    public function __construct(
        public User $user,
        public array $payload
    ) {}

    public function handle(PushSender $pushSender): void
    {
        $pushSender->sendToUser($this->user, $this->payload);
    }
}
