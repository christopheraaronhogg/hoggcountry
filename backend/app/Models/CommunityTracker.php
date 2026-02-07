<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class CommunityTracker extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'label',
        'garmin_share_id',
        'color',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CommunityTracker $tracker): void {
            if (empty($tracker->id)) {
                $tracker->id = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fixes(): HasMany
    {
        return $this->hasMany(TrackerFix::class, 'tracker_id');
    }

    public function latestFix(): HasOne
    {
        return $this->hasOne(TrackerFix::class, 'tracker_id')->latestOfMany('observed_at');
    }
}
