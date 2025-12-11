<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Matche;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserStatsController extends Controller
{
    /**
     * HISTORY
     *
     * Devolve:
     *  - lista de MATCHES
     *  - lista de GAMES
     *
     * Ambos:
     *  - filtráveis por:
     *      - from / to (datas, usando ended_at)
     *      - result: win | loss | draw | interrupted
     *      - achievement: capote | bandeira
     *      - type: 3 | 9 (Bisca de 3 / Bisca de 9)
     *  - ordenados por ended_at (asc/desc, default desc)
     */
    public function history(Request $request)
    {
        $user   = $request->user();
        $userId = $user->id;

        $filters = $request->validate([
            'from'        => 'nullable|date',
            'to'          => 'nullable|date',
            'result'      => 'nullable|string|in:win,loss,draw,interrupted',
            'achievement' => 'nullable|string|in:capote,bandeira',
            'order'       => 'nullable|string|in:asc,desc',
            'type'        => 'nullable|in:3,9',
        ]);

        $orderDirection = $filters['order'] ?? 'desc';
        $typeFilter     = $filters['type'] ?? null;

        // ─────────────────────────────────────
        // MATCHES
        // ─────────────────────────────────────
        $matchesQuery = Matche::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->whereNotNull('ended_at'); // já exclui matches ainda em progresso

        if (!empty($filters['from'])) {
            $matchesQuery->where('ended_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $matchesQuery->where('ended_at', '<=', $filters['to']);
        }

        if (!empty($typeFilter)) {
            $matchesQuery->where('type', $typeFilter);
        }

        $matches = $matchesQuery
            ->with(['games' => function ($q) {
                $q->orderBy('began_at', 'asc');
            }])
            ->orderBy('ended_at', $orderDirection)
            ->get();

        $matchesHistory = [];

        foreach ($matches as $match) {
            $isUserPlayer1 = ($match->player1_user_id === $userId);

            // Resultado global do match para ESTE user
            if (!is_null($match->winner_user_id)) {
                $result = $match->winner_user_id === $userId ? 'win' : 'loss';
            } else {
                $result = 'interrupted';
            }

            // Duração (segundos)
            $duration = $match->total_time;
            if (is_null($duration) && $match->began_at && $match->ended_at) {
                $duration = strtotime($match->ended_at) - strtotime($match->began_at);
            }

            $gamesData   = [];
            $hasCapote   = false;
            $hasBandeira = false;

            foreach ($match->games as $index => $game) {
                $userPoints     = $isUserPlayer1 ? $game->player1_points : $game->player2_points;
                $opponentPoints = $isUserPlayer1 ? $game->player2_points : $game->player1_points;

                // Games podem ser draw (is_draw = true) ou interrompidos
                if (!is_null($game->winner_user_id)) {
                    $gameResult = $game->winner_user_id === $userId ? 'win' : 'loss';
                } elseif ($game->is_draw) {
                    $gameResult = 'draw';
                } else {
                    $gameResult = 'interrupted';
                }

                $bandeira = $game->winner_user_id === $userId && $userPoints === 120;
                $capote   = $game->winner_user_id === $userId && $userPoints >= 91 && $userPoints < 120;

                if ($bandeira) $hasBandeira = true;
                if ($capote)   $hasCapote   = true;

                // Duração do game individual
                $gameDuration = $game->total_time;
                if (is_null($gameDuration) && $game->began_at && $game->ended_at) {
                    $gameDuration = strtotime($game->ended_at) - strtotime($game->began_at);
                }

                $gamesData[] = [
                    'id'              => $game->id,
                    'match_id'        => $match->id,
                    'game_number'     => $index + 1,
                    'type'            => $game->type, // 3 ou 9
                    'began_at'        => $game->began_at,
                    'ended_at'        => $game->ended_at,
                    'duration'        => $gameDuration,
                    'user_points'     => $userPoints,
                    'opponent_points' => $opponentPoints,
                    'result'          => $gameResult,   // win | loss | draw | interrupted
                    'achievements'    => [
                        'capote'   => $capote,
                        'bandeira' => $bandeira,
                    ],
                    'tricks'          => [],
                ];
            }


            // Coins earned: ler diretamente da coin_transactions (Match payout)
            $coinsEarned = CoinTransaction::query()
                ->where('user_id', $userId)
                ->where('match_id', $match->id)
                ->where('coin_transaction_type_id', 6) // Match payout
                ->sum('coins');


            // filtros de resultado / achievements AO NÍVEL DO MATCH
            if (!empty($filters['result']) && $filters['result'] !== $result) {
                continue;
            }

            if (!empty($filters['achievement'])) {
                if ($filters['achievement'] === 'capote' && !$hasCapote) {
                    continue;
                }
                if ($filters['achievement'] === 'bandeira' && !$hasBandeira) {
                    continue;
                }
            }

            $matchesHistory[] = [
                'id'           => $match->id,
                'type'         => $match->type, // 3 ou 9
                'began_at'     => $match->began_at,
                'ended_at'     => $match->ended_at,
                'duration'     => $duration,
                'result'       => $result,      // win | loss | interrupted
                'coins_earned' => $coinsEarned,
                'achievements' => [
                    'capote'   => $hasCapote,
                    'bandeira' => $hasBandeira,
                ],
                'games'        => $gamesData,
            ];
        }

        // ─────────────────────────────────────
        // GAMES (lista plana – ainda devolvido, mas já não vais usar na vista)
        // ─────────────────────────────────────
        $gamesQuery = Game::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->whereNotNull('ended_at');

        if (!empty($filters['from'])) {
            $gamesQuery->where('ended_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $gamesQuery->where('ended_at', '<=', $filters['to']);
        }

        if (!empty($typeFilter)) {
            $gamesQuery->where('type', $typeFilter);
        }

        $games = $gamesQuery
            ->orderBy('ended_at', $orderDirection)
            ->get();

        $gamesHistory = [];

        foreach ($games as $game) {
            $isUserPlayer1 = ($game->player1_user_id === $userId);

            $userPoints     = $isUserPlayer1 ? $game->player1_points : $game->player2_points;
            $opponentPoints = $isUserPlayer1 ? $game->player2_points : $game->player1_points;

            // Games: win / loss / draw (is_draw) / interrupted (sem winner e sem is_draw)
            if (!is_null($game->winner_user_id)) {
                $result = $game->winner_user_id === $userId ? 'win' : 'loss';
            } elseif ($game->is_draw) {
                $result = 'draw';
            } else {
                $result = 'interrupted';
            }

            $bandeira = $game->winner_user_id === $userId && $userPoints === 120;
            $capote   = $game->winner_user_id === $userId && $userPoints >= 91 && $userPoints < 120;

            $coinsEarned = 0; // coins só a nível de match

            // filtros de resultado / achievements AO NÍVEL DO GAME
            if (!empty($filters['result']) && $filters['result'] !== $result) {
                continue;
            }

            if (!empty($filters['achievement'])) {
                if ($filters['achievement'] === 'capote' && !$capote) {
                    continue;
                }
                if ($filters['achievement'] === 'bandeira' && !$bandeira) {
                    continue;
                }
            }

            $duration = null;
            if ($game->began_at && $game->ended_at) {
                $duration = strtotime($game->ended_at) - strtotime($game->began_at);
            }

            $gamesHistory[] = [
                'id'              => $game->id,
                'match_id'        => $game->match_id,
                'type'            => $game->type,
                'began_at'        => $game->began_at,
                'ended_at'        => $game->ended_at,
                'duration'        => $duration,
                'user_points'     => $userPoints,
                'opponent_points' => $opponentPoints,
                'result'          => $result, // win | loss | draw | interrupted
                'coins_earned'    => $coinsEarned,
                'achievements'    => [
                    'capote'   => $capote,
                    'bandeira' => $bandeira,
                ],
                'tricks'          => [],
            ];
        }

        return response()->json([
            'matches' => $matchesHistory,
            'games'   => $gamesHistory,
        ]);
    }

    /**
     * SCOREBOARD PESSOAL (personal bests)
     *
     * - total_matches, wins, losses, draws, win_rate
     * - total_capotes, total_bandeiras
     * - coins_earned (10 + bonus por cada match ganho)
     *
     * Aceita opcionalmente:
     *  - type: 3 | 9 (filtra por tipo de bisca)
     */
    public function personalStats(Request $request)
    {
        $user   = $request->user();
        $userId = $user->id;

        $filters = $request->validate([
            'type' => 'nullable|in:3,9',
        ]);
        $typeFilter = $filters['type'] ?? null;

        // Matches do user que já terminaram (mas podem ter sido interrompidos)
        $baseMatches = Matche::query()
            ->where(function ($q) use ($userId) {
                $q->where('player1_user_id', $userId)
                    ->orWhere('player2_user_id', $userId);
            })
            ->whereNotNull('ended_at');

        if (!empty($typeFilter)) {
            $baseMatches->where('type', $typeFilter);
        }

        // Matches com winner (concluídos "normalmente")
        $completedMatches = (clone $baseMatches)->whereNotNull('winner_user_id');

        $totalMatches = $completedMatches->count(); // só os concluídos contam aqui

        $wins   = (clone $completedMatches)->where('winner_user_id', $userId)->count();
        $losses = $totalMatches - $wins;
        $draws  = 0; // matches, por regra, não têm draw

        $winRate = $totalMatches > 0 ? round($wins / $totalMatches * 100, 1) : 0.0;

        // capotes / bandeiras do user (contando games dos matches ganhos)
        $achievementsQuery = DB::table('matches')
            ->join('games as g', 'g.match_id', '=', 'matches.id')
            ->where('matches.winner_user_id', $userId);

        if (!empty($typeFilter)) {
            $achievementsQuery->where('matches.type', $typeFilter);
        }

        $achievements = $achievementsQuery
            ->selectRaw("
                SUM(
                    CASE
                        WHEN
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points BETWEEN 91 AND 119)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points BETWEEN 91 AND 119)
                        THEN 1 ELSE 0 END
                ) AS total_capotes,
                SUM(
                    CASE
                        WHEN
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points = 120)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points = 120)
                        THEN 1 ELSE 0 END
                ) AS total_bandeiras
            ")
            ->first();

        $totalCapotes   = (int) ($achievements->total_capotes ?? 0);
        $totalBandeiras = (int) ($achievements->total_bandeiras ?? 0);

        // IDs dos matches concluídos deste user
        $matchIds = (clone $completedMatches)->pluck('id');

        // coins_earned: somar todos os Match payout (type 6) destes matches para este user
        $coinsEarned = 0;
        if ($matchIds->isNotEmpty()) {
            $coinsEarned = CoinTransaction::query()
                ->where('user_id', $userId)
                ->whereIn('match_id', $matchIds)
                ->where('coin_transaction_type_id', 6) // Match payout
                ->sum('coins');
        }


        return response()->json([
            'total_matches'   => $totalMatches,
            'wins'            => $wins,
            'losses'          => $losses,
            'draws'           => $draws,
            'win_rate'        => $winRate,
            'total_capotes'   => $totalCapotes,
            'total_bandeiras' => $totalBandeiras,
            'coins_earned'    => $coinsEarned,
        ]);
    }

    /**
     * GLOBAL SCOREBOARDS
     *
     * - top_matches: mais matches ganhos
     * - top_achievements: mais capotes+bandeiras
     * - top_coins: mais coins teóricas (10 + bonus por match ganho)
     *
     * Aceita opcionalmente:
     *  - type: 3 | 9
     */
    public function globalScoreboards(Request $request)
    {
        $filters = $request->validate([
            'type' => 'nullable|in:3,9',
        ]);
        $typeFilter = $filters['type'] ?? null;

        // TOP: most matches won
        $topMatchesQuery = Matche::query()
            ->from('matches')
            ->select(
                'winner_user_id as user_id',
                DB::raw('COUNT(DISTINCT matches.id) as total_wins'),
                DB::raw('COALESCE(users.nickname, users.name) as username'),
                'users.photo_avatar_filename as avatar_filename',
                'users.custom'
            )
            ->whereNotNull('winner_user_id')
            ->join('users', 'users.id', '=', 'matches.winner_user_id');

        if (!empty($typeFilter)) {
            $topMatchesQuery->where('matches.type', $typeFilter);
        }

        $topMatches = $topMatchesQuery
            ->groupBy('winner_user_id', 'users.nickname', 'users.name', 'users.photo_avatar_filename', 'users.custom')
            ->orderByDesc('total_wins')
            ->limit(10)
            ->get();

        // TOP: most achievements (capote + bandeira)
        $topAchievementsQuery = DB::table('matches')
            ->join('games as g', 'g.match_id', '=', 'matches.id')
            ->join('users', 'users.id', '=', 'matches.winner_user_id')
            ->whereNotNull('matches.winner_user_id');

        if (!empty($typeFilter)) {
            $topAchievementsQuery->where('matches.type', $typeFilter);
        }

        $topAchievements = $topAchievementsQuery
            ->groupBy('matches.winner_user_id', 'users.nickname', 'users.name', 'users.photo_avatar_filename', 'users.custom')
            ->selectRaw("
                matches.winner_user_id AS user_id,
                COALESCE(users.nickname, users.name) AS username,
                users.photo_avatar_filename AS avatar_filename,
                users.custom,
                SUM(
                    CASE
                        WHEN
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points BETWEEN 91 AND 119)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points BETWEEN 91 AND 119)
                        THEN 1 ELSE 0 END
                ) AS total_capotes,
                SUM(
                    CASE
                        WHEN
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points = 120)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points = 120)
                        THEN 1 ELSE 0 END
                ) AS total_bandeiras,
                SUM(
                    CASE
                        WHEN
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points BETWEEN 91 AND 119)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points BETWEEN 91 AND 119)
                            OR
                            (matches.winner_user_id = g.player1_user_id AND g.player1_points = 120)
                            OR
                            (matches.winner_user_id = g.player2_user_id AND g.player2_points = 120)
                        THEN 1 ELSE 0 END
                ) AS total_achievements
            ")
            ->orderByDesc('total_achievements')
            ->limit(10)
            ->get();

        // TOP: most coins earned from match payouts (type 6)
        $topCoinsQuery = DB::table('coin_transactions as ct')
            ->join('matches', 'matches.id', '=', 'ct.match_id')
            ->join('users', 'users.id', '=', 'ct.user_id')
            ->where('ct.coin_transaction_type_id', 6); // Match payout

        if (!empty($typeFilter)) {
            $topCoinsQuery->where('matches.type', $typeFilter);
        }

        $topCoinsCollection = $topCoinsQuery
            ->selectRaw('
        ct.user_id AS user_id,
        COALESCE(users.nickname, users.name) AS username,
        users.photo_avatar_filename AS avatar_filename,
        users.custom,
        SUM(ct.coins) AS total_coins')
            ->groupBy('ct.user_id', 'users.nickname', 'users.name', 'users.photo_avatar_filename', 'users.custom')
            ->orderByDesc('total_coins')
            ->limit(10)
            ->get();


        return response()->json([
            'top_matches'      => $topMatches,
            'top_achievements' => $topAchievements,
            'top_coins'        => $topCoinsCollection,
        ]);
    }
}
