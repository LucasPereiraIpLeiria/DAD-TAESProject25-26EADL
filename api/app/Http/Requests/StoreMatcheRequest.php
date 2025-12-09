<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatcheRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
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
            // na criação ainda não sabemos o fim
            'ended_at'=> 'nullable|date|after:began_at',

            'player1_points' => 'nullable|numeric',
            'player2_points' => 'nullable|numeric',
            'player1_marks'  => 'nullable|numeric',
            'player2_marks'  => 'nullable|numeric',

            'total_time' => 'nullable|integer',

            // sem match_id nem is_draw aqui: isso é conceito de GAME, não de MATCH
        ];
    }
}
