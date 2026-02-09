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
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'extra' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
