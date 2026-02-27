<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantCheckin extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_checkins';

    protected $fillable = [
        'checkin_id',
        'user_id',
        'lat',
        'lon',
        'mile_marker',
        'battery_percent',
        'status_note',
        'source',
        'observed_at',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lon' => 'float',
            'mile_marker' => 'float',
            'battery_percent' => 'integer',
            'observed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
