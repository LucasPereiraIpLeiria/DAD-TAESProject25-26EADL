<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\EconomyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserStatsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatcheController;
use App\Http\Controllers\CustomizationController;
use App\Models\Matche;
use App\Models\Game;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'nickname'             => $user->nickname,
            'photo_avatar_filename'=> $user->photo_avatar_filename,
            'coins_balance'        => $user->coins_balance ?? 0,
            'custom'               => $user->custom,
        ]);
    });

    Route::patch('/users/edit', [UserController::class, 'update']);
    Route::delete('/users/delete', [UserController::class, 'destroy']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('users/matches', function (Request $request) {
        return $request->user()->matches;
    });

    // MATCHES
    Route::post('matches', [MatcheController::class, 'store']);
    Route::patch('matches/{matche}', [MatcheController::class, 'update']);

    // GAMES (usado para jogos de MATCH)
    Route::post('games', [GameController::class, 'store']);

    // Economy (apenas MATCH)
    Route::post('/economy/award-match-reward', [EconomyController::class, 'awardMatchReward']);
    Route::post('/economy/deduct-entry-fee', [EconomyController::class, 'deductEntryFee']);
    Route::post('/coin-purchases', [EconomyController::class, 'createCoinPurchase']);

    // Customizations
    Route::get('/customizations', [CustomizationController::class, 'show']);
    Route::post('/customizations/purchase', [CustomizationController::class, 'purchase']);
    Route::patch('/customizations/select', [CustomizationController::class, 'select']);
    Route::post('/customizations/debug/reset', [CustomizationController::class, 'debugReset']);

    Route::get('/users/history', [UserStatsController::class, 'history']);
    Route::get('/users/stats', [UserStatsController::class, 'personalStats']);

});
    Route::get('/scoreboards/global', [UserStatsController::class, 'globalScoreboards']);
Route::post('/leaderboard', function (Request $request) {
    $validated = $request->validate([
        'type'    => 'required|integer|in:3,9',
        'mode'    => 'required|string|in:S,M', // S = singleplayer, M = multiplayer
        'is_match'=> 'required|boolean',
    ]);

    $type   = $validated['type'];
    $mode   = $validated['mode'];
    $isMatch= $validated['is_match'];

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
