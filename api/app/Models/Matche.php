<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Matche extends Model
{
    public $timestamps = false;

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

    public function games(): HasMany
    {
        return $this->hasMany(Game::class, 'match_id');
    }

    public function scopeMultiplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->from('matches')
            ->select(
                'matches.winner_user_id as user_id',
                DB::raw('COUNT(DISTINCT matches.id) as total_wins'),
                DB::raw("
                    SUM(
                        CASE
                            WHEN g.winner_user_id = matches.winner_user_id
                             AND (
                                CASE
                                    WHEN g.winner_user_id = g.player1_user_id THEN g.player1_points
                                    ELSE g.player2_points
                                END
                             ) BETWEEN 91 AND 119
                            THEN 1 ELSE 0
                        END
                    ) as total_capotes
                "),
                DB::raw("
                    SUM(
                        CASE
                            WHEN g.winner_user_id = matches.winner_user_id
                             AND (
                                CASE
                                    WHEN g.winner_user_id = g.player1_user_id THEN g.player1_points
                                    ELSE g.player2_points
                                END
                             ) = 120
                            THEN 1 ELSE 0
                        END
                    ) as total_bandeiras
                "),
                DB::raw('MIN(matches.ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename'),
                'users.custom'
            )
            ->where('matches.type', $type)
            ->whereNotNull('matches.winner_user_id')
            // EXCLUDE bot matches
            ->where('matches.player1_user_id', '!=', $botId)
            ->where('matches.player2_user_id', '!=', $botId)
            ->leftJoin('games as g', 'g.match_id', '=', 'matches.id')
            ->join('users', 'users.id', '=', 'matches.winner_user_id')
            ->groupBy(
                'matches.winner_user_id',
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

    public function scopeSingleplayerLeaderboard($query, $type)
    {
        $botId = config('bots.bot_ids.default');

        return $query
            ->from('matches')
            ->select(
                'matches.winner_user_id as user_id',
                DB::raw('COUNT(DISTINCT matches.id) as total_wins'),
                DB::raw("
                    SUM(
                        CASE
                            WHEN g.winner_user_id = matches.winner_user_id
                             AND (
                                CASE
                                    WHEN g.winner_user_id = g.player1_user_id THEN g.player1_points
                                    ELSE g.player2_points
                                END
                             ) BETWEEN 91 AND 119
                            THEN 1 ELSE 0
                        END
                    ) as total_capotes
                "),
                DB::raw("
                    SUM(
                        CASE
                            WHEN g.winner_user_id = matches.winner_user_id
                             AND (
                                CASE
                                    WHEN g.winner_user_id = g.player1_user_id THEN g.player1_points
                                    ELSE g.player2_points
                                END
                             ) = 120
                            THEN 1 ELSE 0
                        END
                    ) as total_bandeiras
                "),
                DB::raw('MIN(matches.ended_at) as first_win_at'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                DB::raw('users.photo_avatar_filename as avatar_filename'),
                'users.custom'
            )
            ->where('matches.type', $type)
            ->whereNotNull('matches.winner_user_id')
            // ONLY matches vs bot
            ->where(function ($q) use ($botId) {
                $q->where('matches.player1_user_id', $botId)
                  ->orWhere('matches.player2_user_id', $botId);
            })
            ->where('matches.winner_user_id', '!=', $botId)
            ->leftJoin('games as g', 'g.match_id', '=', 'matches.id')
            ->join('users', 'users.id', '=', 'matches.winner_user_id')
            ->groupBy(
                'matches.winner_user_id',
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
