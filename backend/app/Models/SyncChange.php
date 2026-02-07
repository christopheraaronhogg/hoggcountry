<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncChange extends Model
{
    use HasFactory;

    protected $primaryKey = 'seq';

    public $incrementing = true;

    protected $fillable = [
        'user_id',
        'doc_type',
        'doc_id',
        'op',
        'schema_version',
        'server_updated_at',
        'payload',
        'etag',
    ];

    protected function casts(): array
    {
        return [
            'server_updated_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
