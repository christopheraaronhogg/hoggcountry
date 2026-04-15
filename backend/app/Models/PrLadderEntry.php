<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrLadderEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'athlete',
        'lift',
        'weight',
        'achieved_at',
    ];

    protected $casts = [
        'achieved_at' => 'datetime',
    ];
}
