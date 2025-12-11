<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatcheRequest extends FormRequest
{
    
    public function authorize(): bool
    {
        return true;
    }

    
    public function rules(): array
    {
        return [
            'player1_user_id' => 'sometimes|exists:users,id',
            'player2_user_id' => 'sometimes|nullable|exists:users,id',
            'winner_user_id'  => 'sometimes|nullable|exists:users,id',
            'loser_user_id'   => 'sometimes|nullable|exists:users,id',

            'type'   => 'sometimes|string|in:3,9',
            'status' => 'sometimes|in:Pending,Playing,Ended,Interrupted',

            'stake'    => 'sometimes|nullable|numeric',
            'began_at' => 'sometimes|date',
            'ended_at' => 'sometimes|date',

            'player1_points' => 'sometimes|nullable|numeric',
            'player2_points' => 'sometimes|nullable|numeric',
            'player1_marks'  => 'sometimes|nullable|numeric',
            'player2_marks'  => 'sometimes|nullable|numeric',

            'total_time' => 'sometimes|nullable|integer',
        ];
    }
}
