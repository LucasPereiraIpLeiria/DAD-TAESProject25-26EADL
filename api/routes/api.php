<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\EconomyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatcheController;
use App\Models\Game;
use App\Models\Matche;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('users/matches', function (Request $request) {
        return $request->user()->matches;
    });

    // Create a new match
    Route::post('matches', [MatcheController::class, 'store']);

    Route::post('standalone', [GameController::class, 'store']);
    Route::post('/economy/award-match-reward', [EconomyController::class, 'awardMatchReward']);
    Route::post('/economy/deduct-entry-fee', [
        EconomyController::class,
        'deductEntryFee'
    ]);
    Route::post('/coin-purchases', [EconomyController::class, 'createCoinPurchase']);
});

Route::post('/leaderboard', function (Request $request) {
    $validated = $request->validate([
        'type' => 'required|integer|in:3,9',
        'mode' => 'required|string|in:S,M', // S = singleplayer, M = multiplayer
        'is_match' => 'required|boolean',
    ]);

    $type = $validated['type'];
    $mode = $validated['mode'];
    $isMatch = $validated['is_match'];

    // MULTIPLAYER MODE
    if ($mode === 'M') {
        if ($isMatch) {
            // multiplayer matches
            return response()->json(
                Matche::multiplayerLeaderboard($type)->limit(10)->get()
            );
        } else {
            // multiplayer standalone games
            return response()->json(
                Game::multiplayerLeaderboard($type)->limit(10)->get()
            );
        }
    }

    // SINGLEPLAYER MODE
    if ($mode === 'S') {
        if ($isMatch) {
            // singleplayer matches (vs bot)
            return response()->json(
                Matche::singleplayerLeaderboard($type)->limit(10)->get()
            );
        } else {
            // singleplayer standalone games (vs bot)
            return response()->json(
                Game::singleplayerLeaderboard($type)->limit(10)->get()
            );
        }
    }
    return response()->json(['error' => 'Invalid mode'], 422);
});











