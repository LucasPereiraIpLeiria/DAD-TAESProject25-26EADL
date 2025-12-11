<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinTransactionType extends Model
{
    protected $table = 'coin_transaction_types';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'type',       // 'C' ou 'D'
        'deleted_at',
        'custom',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        'custom'     => 'array',
    ];
}
