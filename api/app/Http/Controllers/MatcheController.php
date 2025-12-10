<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Requests\StoreMatcheRequest;
use App\Http\Requests\UpdateMatcheRequest;
use App\Models\Matche;
use App\Models\User;

class MatcheController extends Controller
{
    //public function index()

    public function store(StoreMatcheRequest $request)
    {
        $user = $request->user(); // user autenticado (Sanctum)
        $data = $request->validated();

        $matche = DB::transaction(function () use ($user, $data) {
            // 1) Se houver user autenticado, marcar todos os matches "Playing"
            // onde ele participa como "interrupted"
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

            // 2) Criar o novo match já com status "Playing"
            $payload = $data;

            $payload['status'] = 'Playing';

            if (empty($payload['began_at'])) {
                $payload['began_at'] = now();
            }

            return Matche::create($payload);
        });

        return response()->json($matche, 201);
    }

    public function show(Matche $matche)
    {
        return $matche;
    }

public function update(UpdateMatcheRequest $request, Matche $matche)
{
    $data = $request->validated();

    // Primeiro preenche o modelo com os dados novos
    $matche->fill($data);

    // Vamos usar SEMPRE os valores que o modelo tem depois do fill:
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

    return response()->json($matche);
}

    public function getUserMatches(User $user)
    {
        return $user->matches();
    }
}
