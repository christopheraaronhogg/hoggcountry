<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantMapReport extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_map_reports';

    protected $fillable = [
        'report_id',
        'user_id',
        'idempotency_key',
        'dedupe_fingerprint',
        'lat',
        'lon',
        'mile_marker',
        'kind',
        'severity',
        'message',
        'source',
        'verification',
        'status',
        'occurred_at',
        'expires_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lon' => 'float',
            'mile_marker' => 'float',
            'occurred_at' => 'datetime',
            'expires_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
