<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantMapReportAudit extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_map_report_audits';

    protected $fillable = [
        'map_report_id',
        'report_id',
        'actor_user_id',
        'action',
        'from_verification',
        'to_verification',
        'note',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(TrailAssistantMapReport::class, 'map_report_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
