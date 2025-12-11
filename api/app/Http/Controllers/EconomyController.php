<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use App\Http\Resources\UserBalanceResource;
use App\Http\Resources\ErrorResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EconomyController extends Controller
{

    public function createCoinPurchase(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'euros'             => 'required|numeric|min:0.01',
            'payment_type'      => 'required|in:MBWAY,IBAN,MB,VISA,PAYPAL',
            'payment_reference' => 'required|string',
            'coins'             => 'required|integer|min:1|max:10000',
        ]);

        try {
            // 1. Call Payment Gateway
            $gatewayResponse = Http::withoutVerifying()->post(
                'https://dad-payments-api.vercel.app/api/debit',
                [
                    'type'      => $validated['payment_type'],
                    'reference' => $validated['payment_reference'],
                    'value'     => $validated['euros'],
                ]
            );

            if (!$gatewayResponse->successful()) {
                return response()->json([
                    'error'   => 'Payment gateway error',
                    'details' => $gatewayResponse->json(),
                ], 400);
            }

            $user = $request->user();

            $purchase = DB::transaction(function () use ($user, $validated) {
                // Coin purchase (C)
                $type = CoinTransactionType::where('name', 'Coin purchase')
                    ->where('type', 'C')
                    ->firstOrFail();

                $coinTransaction = CoinTransaction::create([
                    'user_id'                  => $user->id,
                    'match_id'                 => null,
                    'game_id'                  => null,
                    'coin_transaction_type_id' => $type->id, // ou 2
                    'coins'                    => $validated['coins'],
                    'transaction_datetime'     => now(),
                ]);

                $purchase = CoinPurchase::create([
                    'user_id'             => $user->id,
                    'coin_transaction_id' => $coinTransaction->id,
                    'euros'               => $validated['euros'],
                    'payment_type'        => $validated['payment_type'],
                    'payment_reference'   => $validated['payment_reference'],
                    'purchase_datetime'   => now(),
                ]);

                $user->increment('coins_balance', $validated['coins']);

                Log::debug('Compra feita ' . $purchase->id);

                return $purchase;
            });

            return response()->json([
                'message'     => 'Purchase successful',
                'purchase'    => $purchase,
                'new_balance' => $user->fresh()->coins_balance,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Payment failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

}
