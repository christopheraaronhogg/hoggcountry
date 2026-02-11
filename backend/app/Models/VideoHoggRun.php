<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoHoggRun extends Model
{
    use HasFactory;

    protected $table = 'videohogg_runs';

    protected $fillable = [
        'run_id',
        'user_id',
        'status',
        'service_status',
        'service_status_changed_at',
        'service_status_note',
        'storage_disk',
        'base_path',
        'manifest_path',
        'manifest_url',
        'notes_path',
        'uploaded_count',
        'noted_count',
        'total_bytes',
        'claimed_by',
        'claimed_at',
        'claim_expires_at',
        'last_heartbeat_at',
        'started_at',
        'completed_at',
        'failed_at',
        'in_hands_at',
        'in_progress_at',
        'packaging_at',
        'delivered_at',
        'revision_requested_at',
        'service_completed_at',
        'blocked_at',
        'output_path',
        'output_url',
        'failure_code',
        'failure_message',
        'extra',
    ];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'claim_expires_at' => 'datetime',
            'last_heartbeat_at' => 'datetime',
            'service_status_changed_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'in_hands_at' => 'datetime',
            'in_progress_at' => 'datetime',
            'packaging_at' => 'datetime',
            'delivered_at' => 'datetime',
            'revision_requested_at' => 'datetime',
            'service_completed_at' => 'datetime',
            'blocked_at' => 'datetime',
            'extra' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
