<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\EconomyController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatcheController;
use App\Http\Controllers\CustomizationController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::patch('/users/edit', [UserController::class, 'update']);
    Route::delete('/users/delete', [UserController::class, 'destroy']); // Add this line
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('users/matches', function (Request $request) {
        return $request->user()->matches;
    });

    // Create a new match
    Route::post('matches', [MatcheController::class, 'store']);
    Route::patch('matches/{matche}', [MatcheController::class, 'update']);
    Route::post('standalone', [GameController::class, 'store']);
    Route::post('games', [GameController::class, 'store']);

    Route::post('/economy/award-match-reward', [EconomyController::class, 'awardMatchReward']);
    Route::post('/economy/deduct-entry-fee', [EconomyController::class, 'deductEntryFee']);
    Route::post('/coin-purchases', [EconomyController::class, 'createCoinPurchase']);

    Route::get('/customizations', [CustomizationController::class, 'show']);
    Route::post('/customizations/purchase', [CustomizationController::class, 'purchase']);
    Route::patch('/customizations/select', [CustomizationController::class, 'select']);
    Route::post('/customizations/debug/reset', [CustomizationController::class, 'debugReset']);

});
