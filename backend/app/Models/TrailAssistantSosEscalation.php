<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantSosEscalation extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_sos_escalations';

    protected $fillable = [
        'escalation_id',
        'user_id',
        'idempotency_key',
        'dedupe_fingerprint',
        'lat',
        'lon',
        'mile_marker',
        'message',
        'contact_method',
        'status',
        'severity',
        'requires_manual_dispatch',
        'triggered_at',
        'cooldown_until',
        'acknowledged_at',
        'resolved_at',
        'abuse_flags',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lon' => 'float',
            'mile_marker' => 'float',
            'requires_manual_dispatch' => 'boolean',
            'triggered_at' => 'datetime',
            'cooldown_until' => 'datetime',
            'acknowledged_at' => 'datetime',
            'resolved_at' => 'datetime',
            'abuse_flags' => 'array',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
