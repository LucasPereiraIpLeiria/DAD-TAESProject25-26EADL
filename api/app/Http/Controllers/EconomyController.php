<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use App\Http\Resources\UserBalanceResource;
use App\Http\Resources\ErrorResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EconomyController extends Controller
{
    public function deductEntryFee(Request $request): \Illuminate\Http\JsonResponse|UserBalanceResource
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

    public function createCoinPurchase(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'euros' => 'required|numeric|min:0.01',
            'payment_type' => 'required|in:MBWAY,IBAN,MB,VISA,PAYPAL',
            'payment_reference' => 'required|string',
            'coins' => 'required|integer|min:1|max:10000',
        ]);

        try {
            // 1. Call Payment Gateway
            $gatewayResponse = Http::withoutVerifying()->post('https://dad-payments-api.vercel.app/api/debit', [
                'type' => $validated['payment_type'],
                'reference' => $validated['payment_reference'],
                'value' => $validated['euros'] // Assuming value is in euros
            ]);

            if (!$gatewayResponse->successful()) {
                return response()->json([
                    'error' => 'Payment gateway error',
                    'details' => $gatewayResponse->json()
                ], 400);
            }

            $user = $request->user();

            $purchase = DB::transaction(function () use ($user, $validated) {
                $coinTransaction = CoinTransaction::create([
                    'user_id' => $user->id,
                    'match_id' => null,
                    'game_id' => null,
                    'coin_transaction_type_id' => 2,
                    'coins' => $validated['coins'],
                    'transaction_datetime' => now(),
                ]);

                $purchase = CoinPurchase::create([
                    'user_id' => $user->id,
                    'coin_transaction_id' => $coinTransaction->id,
                    'euros' => $validated['euros'],
                    'payment_type' => $validated['payment_type'],
                    'payment_reference' => $validated['payment_reference'],
                    'purchase_datetime' => now(),
                ]);

                $user->increment('coins_balance', $validated['coins']);
                Log::debug('Compra feita'.$purchase);
                return $purchase;
            });

            return response()->json([
                'message' => 'Purchase successful',
                'purchase' => $purchase,
                'new_balance' => $user->fresh()->coins_balance
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Payment failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function awardMatchReward(Request $request): \Illuminate\Http\JsonResponse|UserBalanceResource
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
