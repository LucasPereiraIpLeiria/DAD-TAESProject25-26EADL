<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Requests\StoreMatcheRequest;
use App\Http\Requests\UpdateMatcheRequest;
use App\Models\Matche;
use App\Models\User;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;

class MatcheController extends Controller
{
    public function store(StoreMatcheRequest $request)
    {
        $user = $request->user(); // user autenticado (Sanctum)
        $data = $request->validated();

        // taxa de entrada em coins (podes manter a mesma que usavas no EconomyController)
        $entryCost = config('economy.match_entry_fee', 5);

        try {
            $matche = DB::transaction(function () use ($user, $data, $entryCost) {

                // 1) Interromper matches "Playing" onde o user participe
                if ($user) {
                    Matche::where(function ($q) use ($user) {
                            $q->where('player1_user_id', $user->id)
                              ->orWhere('player2_user_id', $user->id);
                        })
                        ->where('status', 'Playing')
                        ->update([
                            'status'   => 'Interrupted',
                            'ended_at' => now(),
                        ]);
                }

                // 2) Verificar saldo do user (fresh)
                $freshUser = User::findOrFail($user->id);

                if ($freshUser->coins_balance < $entryCost) {
                    // lançar exceção para provocar rollback
                    throw new \RuntimeException('insufficient_funds');
                }

                // 3) Criar o novo match já com status "Playing"
                $payload = $data;
                $payload['status'] = 'Playing';

                if (empty($payload['began_at'])) {
                    $payload['began_at'] = now();
                }

                $match = Matche::create($payload);



                // 4) Criar o registo em coin_transactions (com match_id)
                CoinTransaction::create([
                    'user_id'                  => $freshUser->id,
                    'match_id'                 => $match->id,
                    'game_id'                  => null,
                    'coin_transaction_type_id' => 3,
                    'coins'                    => -$entryCost, // débito
                    'transaction_datetime'     => now(),
                ]);

                // 5) Atualizar saldo do user
                $freshUser->decrement('coins_balance', $entryCost);

                return $match;
            });

            return response()->json($matche, 201);

        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'insufficient_funds') {
                return response()->json([
                    'reason'  => 'insufficient_funds',
                    'message' => 'Not enough coins to start this match.',
                ], 400);
            }

            throw $e; // outras exceções sobem
        }
    }

    public function show(Matche $matche)
    {
        return $matche;
    }

    public function update(UpdateMatcheRequest $request, Matche $matche)
    {
        $user = $request->user();
        $data = $request->validated();

        $coinsAwarded = 0;

        $matche = DB::transaction(function () use ($matche, $data, $user, &$coinsAwarded) {
            // Guardar status antigo para não premiar duas vezes
            $oldStatus = $matche->status;

            // Preenche o modelo com os dados novos
            $matche->fill($data);

            // Recalcular total_time se tivermos began_at e ended_at
            $began = $matche->began_at;
            $ended = $matche->ended_at;

            if (!empty($began) && !empty($ended)) {
                $start = strtotime($began);
                $end   = strtotime($ended);

                if ($start !== false && $end !== false && $end >= $start) {
                    $matche->total_time = $end - $start;
                }
            }

            $matche->save();

            // Só tratamos de coins quando o status passa para 'Ended' pela primeira vez
            if ($matche->status !== 'Ended' || $oldStatus === 'Ended') {
                return $matche;
            }

            // Sem user autenticado, nada a fazer
            if (!$user) {
                return $matche;
            }

            // Se o utilizador autenticado não é o winner deste match, não há recompensa
            if ($matche->winner_user_id !== $user->id) {
                return $matche;
            }

            // Lógica de recompensa: base + bónus (opcional) tipo EconomyController::awardMatchReward
            $base  = config('economy.match_base_win_reward', 10);
            $bonus = 0;

            // Opcional: tenta encontrar o último game deste match para avaliar bandeira/capote
            $lastGame = $matche->games()->orderByDesc('ended_at')->first();

            if ($lastGame) {
                $winnerPoints = null;

                if ($lastGame->winner_user_id === $user->id) {
                    if ($lastGame->player1_user_id === $user->id) {
                        $winnerPoints = $lastGame->player1_points;
                    } elseif ($lastGame->player2_user_id === $user->id) {
                        $winnerPoints = $lastGame->player2_points;
                    }
                }

                if ($winnerPoints !== null) {
                    if ($winnerPoints === 120) {
                        $bonus += config('economy.match_bandeira_bonus', 20);
                    } elseif ($winnerPoints >= 91) {
                        $bonus += config('economy.match_capote_bonus', 10);
                    }
                }
            }

            $totalReward = $base + $bonus;

            if ($totalReward <= 0) {
                return $matche;
            }


            // Criar coin_transaction ligada ao match
            CoinTransaction::create([
                'user_id'                  => $user->id,
                'match_id'                 => $matche->id,
                'game_id'                  => null,
                'coin_transaction_type_id' => 6,
                'coins'                    => $totalReward, // crédito
                'transaction_datetime'     => now(),
            ]);

            // Atualizar saldo
            $user->increment('coins_balance', $totalReward);

            // devolve para o controller saber o valor
            $coinsAwarded = $totalReward;

            return $matche;
        });

        return response()->json([
            'matche'        => $matche,
            'coins_awarded' => $coinsAwarded,
        ]);
    }

    public function getUserMatches(User $user)
    {
        return $user->matches();
    }
}
