<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatcheController;
Route::post('/login', [AuthController::class, 'login']);

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
});


