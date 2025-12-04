<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoinPurchase extends Model
{
    protected $table = 'coin_purchases';

    public $timestamps = false;

    protected $fillable =
    [
        'user_id',
        'euros',
        'payment_type',
        'payment_reference',
        'purchase_datetime',
        'coin_transaction_id'
    ];
}
