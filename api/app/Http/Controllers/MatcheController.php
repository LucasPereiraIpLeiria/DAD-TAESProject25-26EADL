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
    //
    //public function index()


    public function store(StoreMatcheRequest $request)
    {
        $user = $request->user(); // user autenticado (Sanctum)

        $data = $request->validated();

        $matche = DB::transaction(function () use ($user, $data) {
            // 1) Se houver user autenticado, marcar todos os matches "Playing"
            //    onde ele participa como "interrupted"
            if ($user) {
                Matche::where(function ($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                        ->orWhere('player2_user_id', $user->id);
                })
                    ->where('status', 'Playing')
                    ->update([
                        'status'   => 'Interrupted', // <-- o valor que disseste que a BD aceita
                        'ended_at' => now(),
                    ]);
            }

            // 2) Criar o novo match já com status "Playing" (ou o que vier no payload,
            //    mas aqui estamos a forçar "Playing" para consistência)
            $payload = $data;

            // Garante que o status fica "Playing" ao criar
            $payload['status'] = 'Playing';

            // Se não vier began_at do frontend, mete agora
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

        if (!empty($data['began_at']) && !empty($data['ended_at'])) {
            $start = strtotime($data['began_at']);
            $end   = strtotime($data['ended_at']);

            if ($start !== false && $end !== false && $end >= $start) {
                $data['total_time'] = $end - $start;
            }
        }
        $matche->update($request->validated());
        return response()->json($matche);
    }

    public function getUserMatches(User $user)
    {
        return $user->matches();
    }
}
