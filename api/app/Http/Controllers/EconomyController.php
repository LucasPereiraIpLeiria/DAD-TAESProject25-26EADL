<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\UserBalanceResource;
use App\Http\Resources\ErrorResource;

class EconomyController extends Controller
{
    public function deductEntryFee(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'gametype' => 'required|string|in:standalone,match',
        ]);

        if ($data['gametype'] === 'match') {
            $entryCost = config('economy.competitive_match_entry_fee', 5);
        } else {
            // standalone
            $entryCost = config('economy.competitive_standalone_entry_fee', 1);
        }

        if ($user->coins_balance < $entryCost) {
            return (new ErrorResource([
                'reason'  => 'insufficient_funds',
                'message' => 'Not enough coins to start this game.',
            ]))->response()->setStatusCode(400);
        }

        $user->coins_balance -= $entryCost;
        $user->save();

        return new UserBalanceResource($user);
    }


    public function awardMatchReward(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'result'        => 'required|string|in:win,loss',
            'mode'          => 'required|string|in:competitive,practice',
            'gametype'      => 'required|string|in:standalone,match',
            'variant'       => 'required|string|in:3,9',
            'player_marks'  => 'required|integer|min:0',
            'bot_marks'     => 'required|integer|min:0',
            'player_points' => 'required|integer|min:0',
            'bot_points'    => 'required|integer|min:0',
            'capote'        => 'required|boolean',
            'bandeira'      => 'required|boolean',
        ]);

        // Só premiamos vitórias em modo competitivo
        if ($data['mode'] !== 'competitive' || $data['result'] !== 'win') {
            return (new ErrorResource([
                'reason'  => 'no_reward',
                'message' => 'No coins awarded for this result.',
            ]))->response()->setStatusCode(400);
        }

        $totalReward = 0;

        if ($data['gametype'] === 'standalone') {
            // ✅ Regra nova: standalone competitivo vitória = 2 coins fixos
            $totalReward = config('economy.competitive_standalone_reward', 2);
        } else {
            // ✅ Match competitivo: base + bónus Capote/Bandeira
            $base  = config('economy.match_base_win_reward', 10);
            $bonus = 0;

            if ($data['bandeira']) {
                $bonus += config('economy.match_bandeira_bonus', 20);
            } elseif ($data['capote']) {
                $bonus += config('economy.match_capote_bonus', 10);
            }

            $totalReward = $base + $bonus;
        }

        if ($totalReward <= 0) {
            return (new ErrorResource([
                'reason'  => 'no_reward_config',
                'message' => 'Reward configuration resulted in zero coins.',
            ]))->response()->setStatusCode(400);
        }

        $user->coins_balance += $totalReward;
        $user->save();

        return (new UserBalanceResource($user))->additional([
            'meta' => [
                'coins_awarded' => $totalReward,
            ],
        ]);
    }
}
