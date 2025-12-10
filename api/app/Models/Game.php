<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Game extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'type',
        'status',
        'began_at',
        'ended_at',
        'player1_points',
        'player2_points',
        'total_time',
        'match_id',
        'is_draw'
    ];



    public function player1(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player1_user_id');
    }
    public function player2(): HasOne
    {
        return $this->hasOne(User::class, 'id', 'player2_user_id');
    }

    public function scopeSingleplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->select(
                'winner_user_id',
                DB::raw('COUNT(*) AS total_wins'),

                // CAPOTE = winner gets 91–119 points
                DB::raw('SUM(CASE WHEN 
                    (winner_user_id = player1_user_id AND player1_points BETWEEN 91 AND 119) OR
                    (winner_user_id = player2_user_id AND player2_points BETWEEN 91 AND 119)
                THEN 1 ELSE 0 END) AS total_capotes'),

                // BANDEIRA = winner gets exactly 120 points
                DB::raw('SUM(CASE WHEN 
                    (winner_user_id = player1_user_id AND player1_points = 120) OR
                    (winner_user_id = player2_user_id AND player2_points = 120)
                THEN 1 ELSE 0 END) AS total_bandeiras'),

                DB::raw('MIN(ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename'),
                'users.custom'
            )

            ->where('games.type', $type)
            ->whereNotNull('winner_user_id')
            ->whereNull('match_id')


            // ONLY games vs bot
            ->where(function ($q) use ($botId) {
                $q->where('player1_user_id', $botId)
                ->orWhere('player2_user_id', $botId);
            })

            ->join('users', 'users.id', '=', 'winner_user_id')

            ->groupBy(
                'winner_user_id',
                'users.nickname',
                'users.name',
                'users.photo_avatar_filename',
                'users.custom'
            )

            ->orderByDesc('total_wins')
            ->orderByDesc('total_capotes')
            ->orderByDesc('total_bandeiras')
            ->orderBy('first_win_at', 'asc');
    }



    public function scopeMultiplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->select(
                'winner_user_id',
                DB::raw('COUNT(*) AS total_wins'),

                // CAPOTE = winner gets 91–119 points
                DB::raw('SUM(CASE WHEN 
                    (winner_user_id = player1_user_id AND player1_points BETWEEN 91 AND 119) OR
                    (winner_user_id = player2_user_id AND player2_points BETWEEN 91 AND 119)
                THEN 1 ELSE 0 END) AS total_capotes'),

                // BANDEIRA = winner gets exactly 120
                DB::raw('SUM(CASE WHEN 
                    (winner_user_id = player1_user_id AND player1_points = 120) OR
                    (winner_user_id = player2_user_id AND player2_points = 120)
                THEN 1 ELSE 0 END) AS total_bandeiras'),

                DB::raw('MIN(ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename'),
                'users.custom'
            )

            ->where('games.type', $type)
            ->whereNotNull('winner_user_id')
            ->whereNull('match_id')


            // EXCLUDE bot games
            ->where('player1_user_id', '!=', $botId)
            ->where('player2_user_id', '!=', $botId)

            ->join('users', 'users.id', '=', 'winner_user_id')

            ->groupBy(
                'winner_user_id',
                'users.nickname',
                'users.name',
                'users.photo_avatar_filename',
                'users.custom'
            )

            ->orderByDesc('total_wins')
            ->orderByDesc('total_capotes')
            ->orderByDesc('total_bandeiras')
            ->orderBy('first_win_at', 'asc');
    }





}

