<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Matche extends Model
{
    public $timestamps = false;

    //Not all were required to be fillable

        protected $fillable = [
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'type',
        'status',
        'stake',
        'began_at',
        'ended_at',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'total_time',
    ];



    public function player1(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player1_user_id');
    }
    public function player2(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player2_user_id');
    }
}
