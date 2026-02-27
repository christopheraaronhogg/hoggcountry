<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrailAssistantIntake extends Model
{
    use HasFactory;

    protected $table = 'trail_assistant_intakes';

    protected $fillable = [
        'intake_id',
        'route_label',
        'source',
        'name',
        'email',
        'subject',
        'message',
        'metadata',
        'status',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'received_at' => 'datetime',
        ];
    }
}
