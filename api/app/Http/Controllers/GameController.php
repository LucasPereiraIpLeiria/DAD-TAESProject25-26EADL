<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGameRequest;
use App\Models\Game;
use Illuminate\Http\Request;
use App\Http\Requests\StoreMatcheRequest;
use App\Models\Matche;
use App\Models\User;

class GameController extends Controller
{
    //public function index()

    public function store(StoreGameRequest $request)
    {
        $data = $request->validated();

        if (!empty($data['began_at']) && !empty($data['ended_at'])) {
            $start = strtotime($data['began_at']);
            $end   = strtotime($data['ended_at']);

            if ($start !== false && $end !== false && $end >= $start) {
                $data['total_time'] = $end - $start;
            }
        }

        $game = Game::create($data);

        return response()->json($game, 201);
    }

    public function show(Game $game)
    {
        return $game;
    }

    public function update(StoreGameRequest $request, Game $game)
    {
        $game->update($request->validated());

        return response()->json($game);
    }

    public function getUserGames(User $user)
    {
        return response()->json($user->games()->get());
    }
}
