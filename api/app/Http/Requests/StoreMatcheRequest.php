<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatcheRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return true;
    }

    
    public function rules(): array
    {
        return [
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'nullable|exists:users,id',
            'winner_user_id'  => 'nullable|exists:users,id',
            'loser_user_id'   => 'nullable|exists:users,id',

            'type'   => 'required|string|in:3,9',
            'status' => 'required|in:Pending,Playing,Ended,Interrupted',

            'stake'   => 'nullable|numeric',
            'began_at'=> 'required|date',
            'ended_at'=> 'nullable|date|after_or_equal:began_at',

            'player1_points' => 'nullable|numeric',
            'player2_points' => 'nullable|numeric',
            'player1_marks'  => 'nullable|numeric',
            'player2_marks'  => 'nullable|numeric',

            'total_time' => 'nullable|integer',

            
        ];
    }
}
