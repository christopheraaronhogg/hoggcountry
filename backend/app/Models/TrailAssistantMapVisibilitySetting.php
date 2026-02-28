<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantMapVisibilitySetting extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_map_visibility_settings';

    protected $fillable = [
        'user_id',
        'share_scope',
        'location_mode',
        'visibility_delay_minutes',
    ];

    protected function casts(): array
    {
        return [
            'visibility_delay_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
