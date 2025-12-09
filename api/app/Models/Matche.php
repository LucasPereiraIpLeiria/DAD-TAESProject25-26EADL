<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Matche extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'id',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'type',
        'status',
        'stake',
        'ended_at',
        'total_time',
        'began_at',
        'ended_at',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'total_time',
        //'custom'
    ];


    public function player1(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player1_user_id');
    }
    
    public function player2(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player2_user_id');
    }


    public function scopeMultiplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->select(
                'winner_user_id as user_id',
                DB::raw('COUNT(*) as total_wins'),
                DB::raw('SUM(CASE WHEN player1_marks = 2 OR player2_marks = 2 THEN 1 ELSE 0 END) as total_capotes'),
                DB::raw('SUM(CASE WHEN player1_marks = 3 OR player2_marks = 3 THEN 1 ELSE 0 END) as total_bandeiras'),
                DB::raw('MIN(ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename')
            )
            ->where('matches.type', $type)
            ->whereNotNull('winner_user_id')

            //EXCLUDE bot matches
            ->where('player1_user_id', '!=', $botId)
            ->where('player2_user_id', '!=', $botId)

            ->join('users', 'users.id', '=', 'winner_user_id')

            ->groupBy(
                'winner_user_id',
                'users.nickname',
                'users.name',
                'users.photo_avatar_filename'
            )

            ->orderByDesc('total_wins')
            ->orderByDesc('total_capotes')
            ->orderByDesc('total_bandeiras')
            ->orderBy('first_win_at', 'asc');
    }



    public function scopeSingleplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->select(
                'winner_user_id',
                DB::raw('COUNT(*) as total_wins'),
                DB::raw('SUM(CASE WHEN player1_marks = 2 OR player2_marks = 2 THEN 1 ELSE 0 END) as total_capotes'),
                DB::raw('SUM(CASE WHEN player1_marks = 3 OR player2_marks = 3 THEN 1 ELSE 0 END) as total_bandeiras'),
                DB::raw('MIN(ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename')
            )

            ->where('matches.type', $type)
            ->whereNotNull('winner_user_id')

            //ONLY matches against the BOT
            ->where(function ($q) use ($botId) {
                $q->where('player1_user_id', $botId)
                ->orWhere('player2_user_id', $botId);
            })

            ->join('users', 'users.id', '=', 'winner_user_id')

            ->groupBy(
                'winner_user_id',
                'users.nickname',
                'users.name',
                'users.photo_avatar_filename'
            )

            ->orderByDesc('total_wins')
            ->orderByDesc('total_capotes')
            ->orderByDesc('total_bandeiras')
            ->orderBy('first_win_at', 'asc');
    }



    //this comment exists to try and merge this branch with main
    //still trying


}
