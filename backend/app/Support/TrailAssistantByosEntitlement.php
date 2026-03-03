<?php

namespace App\Support;

final class TrailAssistantByosEntitlement
{
    /**
     * @param array<string, mixed> $details
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $status,
        public readonly string $reason,
        public readonly array $details = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'status' => $this->status,
            'reason' => $this->reason,
            'details' => $this->details,
        ];
    }
}
