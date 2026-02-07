<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrackerFix extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracker_id',
        'lat',
        'lon',
        'mile',
        'observed_at',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'observed_at' => 'datetime',
            'raw' => 'array',
            'lat' => 'float',
            'lon' => 'float',
            'mile' => 'float',
        ];
    }

    public function tracker(): BelongsTo
    {
        return $this->belongsTo(CommunityTracker::class, 'tracker_id');
    }
}
