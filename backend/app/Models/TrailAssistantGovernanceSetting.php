<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrailAssistantGovernanceSetting extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_governance_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'setting_value' => 'array',
        ];
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
