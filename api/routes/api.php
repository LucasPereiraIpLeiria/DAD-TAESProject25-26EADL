<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EconomyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('/economy/deduct-entry-fee', [
        EconomyController::class,
        'deductEntryFee'
    ]);
    Route::post('/coin-purchases', [EconomyController::class, 'createCoinPurchase']);
});


