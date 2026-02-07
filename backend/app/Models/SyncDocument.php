<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SyncDocument extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'doc_type',
        'doc_id',
        'schema_version',
        'content',
        'etag',
        'client_updated_at',
        'server_updated_at',
        'last_device_id',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'client_updated_at' => 'datetime',
            'server_updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SyncDocument $document): void {
            if (empty($document->id)) {
                $document->id = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
