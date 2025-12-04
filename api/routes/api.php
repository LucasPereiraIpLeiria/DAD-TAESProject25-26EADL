<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatcheController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/me', function (Request $request) {
        return $request->user();
    });
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('/leaderboard/{gameMode}', function (Request $request, $gameMode) {
        // Validate gameMode
        $validGameModes = ['SCS3', 'SCM3', 'SCS9', 'SCM9', 'MS3', 'MM3', 'MS9', 'MM9'];
        if (!in_array($gameMode, $validGameModes)) {
            return response()->json(['error' => 'Invalid game mode'], 400);
        }

        switch ($gameMode) {
            case 'SCS3':
                //top 10 players for Singleplayer Competitive Standalone - Bisca of 3
                $topPlayers = Game::where('type', '3')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            
            case 'SCM3':
                //top 10 players for Singleplayer Competitive Match - Bisca of 3
                $topPlayers = Matche::where('type', '3')
                    ->select('*')
                    ->selectRaw('
                        CASE 
                            WHEN winner_user_id = player1_id THEN player1_marks
                            ELSE player2_marks
                        END AS winner_marks
                    ')
                    ->orderBy('total_time', 'asc')      // primary sort: lowest time
                    ->orderBy('winner_marks', 'desc')   // tiebreaker: highest winner marks
                    ->limit(10)
                    ->get();
                break;
            
            case 'SCS9':
                //top 10 players for Singleplayer Competitive Standalone - Bisca of 9
                //$topPlayers = [MatcheController::class]
                break;

            case 'SCM9':
                //top 10 players for Singleplayer Competitive Match - Bisca of 9
                $topPlayers = Matche::where('type', '9')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            
            case 'MS3':
                //top 10 players for Multiplayer Competitive Standalone - Bisca of 3
                $topPlayers = Game::where('type', '3')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            
            case 'MM3':
                //top 10 players for Multiplayer Competitive Match - Bisca of 3
                $topPlayers = Matche::where('type', '3')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            
            case 'MS9':
                //top 10 players for Multiplayer Competitive Standalone - Bisca of 9
                $topPlayers = Game::where('type', '9')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            
            case 'MM9':
                //top 10 players for Multiplayer Competitive Match - Bisca of 9
                $topPlayers = Matche::where('type', '9')
                    ->orderBy('total_time', 'asc')
                    ->get();
                break;
            default:
                # code...
                break;
        }

        return response()->json($topPlayers);
    });
});





