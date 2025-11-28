<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\UserBalanceResource;
use App\Http\Resources\ErrorResource;

class EconomyController extends Controller
{
    public function deductEntryFee(Request $request)
    {
        $user = $request->user();
        $entryCost = 1; // TODO: pôr isto em config

        if ($user->coins_balance < $entryCost) {
            return (new ErrorResource([
                'reason' => 'insufficient_funds',
                'message' => 'Not enough coins to start a match.'
            ]))->response()->setStatusCode(400);
        }

        $user->coins_balance -= $entryCost;
        $user->save();

        return new UserBalanceResource($user);
    }
}
