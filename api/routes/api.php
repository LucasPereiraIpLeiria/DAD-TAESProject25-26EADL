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

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id'                    => $user->id,
            'name'                  => $user->name,
            'email'                 => $user->email,
            'nickname'              => $user->nickname,
            'photo_avatar_filename' => $user->photo_avatar_filename,
            'coins_balance'         => $user->coins_balance ?? 0,
            'custom'                => $user->custom,
        ]);
    });

    Route::patch('/users/edit', [UserController::class, 'update']);
    Route::delete('/users/delete', [UserController::class, 'destroy']);
    Route::post('logout', [AuthController::class, 'logout']);

    // MATCHES
    Route::post('matches', [MatcheController::class, 'store']);
    Route::patch('matches/{matche}', [MatcheController::class, 'update']);

    // GAMES (usado para jogos de MATCH)
    Route::post('games', [GameController::class, 'store']);

    // Economy
    Route::post('/coin-purchases', [EconomyController::class, 'createCoinPurchase']);

    // Customizations
    Route::get('/customizations', [CustomizationController::class, 'show']);
    Route::post('/customizations/purchase', [CustomizationController::class, 'purchase']);
    Route::patch('/customizations/select', [CustomizationController::class, 'select']);
    Route::post('/customizations/debug/reset', [CustomizationController::class, 'debugReset']);

    // User history + personal stats
    Route::get('/users/history', [UserStatsController::class, 'history']);
    Route::get('/users/stats', [UserStatsController::class, 'personalStats']);
    Route::get('/users/stats/global', [UserStatsController::class, 'globalScoreboards']);
    // rota antiga, continua a funcionar para qualquer código legacy
    Route::get('/scoreboards/global', [UserStatsController::class, 'globalScoreboards']);
});



