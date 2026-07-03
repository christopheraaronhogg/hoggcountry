<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MobileDiagnostic extends Model
{
    use HasFactory;

    protected $table = 'mobile_diagnostics';

    protected $fillable = [
        'event_id',
        'install_id',
        'session_id',
        'category',
        'name',
        'severity',
        'occurred_at',
        'app_version',
        'app_build',
        'build_sha',
        'platform',
        'native',
        'user_agent',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'native' => 'boolean',
            'context' => 'array',
        ];
    }
}
