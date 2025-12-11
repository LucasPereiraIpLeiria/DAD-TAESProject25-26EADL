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
    // criar compra de coins: validar pagamento externo, registar transação e atualizar saldo
    public function createCoinPurchase(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'euros'             => 'required|numeric|min:0.01',
            'payment_type'      => 'required|in:MBWAY,IBAN,MB,VISA,PAYPAL',
            'payment_reference' => 'required|string',
            'coins'             => 'required|integer|min:1|max:10000',
        ]);

        try {
            // chamar payment gateway externo para debitar o valor em euros
            $gatewayResponse = Http::withoutVerifying()->post(
                'https://dad-payments-api.vercel.app/api/debit',
                [
                    'type'      => $validated['payment_type'],
                    'reference' => $validated['payment_reference'],
                    'value'     => $validated['euros'],
                ]
            );

            // abortar compra se o gateway responder com erro
            if (!$gatewayResponse->successful()) {
                return response()->json([
                    'error'   => 'Payment gateway error',
                    'details' => $gatewayResponse->json(),
                ], 400);
            }

            $user = $request->user();

            // criar registos da transação e da compra numa transação de BD
            $purchase = DB::transaction(function () use ($user, $validated) {
                // obter tipo de transação correspondente a “Coin purchase” (crédito)
                $type = CoinTransactionType::where('name', 'Coin purchase')
                    ->where('type', 'C')
                    ->firstOrFail();

                // registar transação de coins (histórico interno)
                $coinTransaction = CoinTransaction::create([
                    'user_id'                  => $user->id,
                    'match_id'                 => null,
                    'game_id'                  => null,
                    'coin_transaction_type_id' => $type->id,
                    'coins'                    => $validated['coins'],
                    'transaction_datetime'     => now(),
                ]);

                // registar compra ligada à transação de coins
                $purchase = CoinPurchase::create([
                    'user_id'             => $user->id,
                    'coin_transaction_id' => $coinTransaction->id,
                    'euros'               => $validated['euros'],
                    'payment_type'        => $validated['payment_type'],
                    'payment_reference'   => $validated['payment_reference'],
                    'purchase_datetime'   => now(),
                ]);

                // atualizar saldo de coins do user
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
