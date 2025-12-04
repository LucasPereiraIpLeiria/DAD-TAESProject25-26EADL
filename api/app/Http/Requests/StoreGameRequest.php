<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGameRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'player1_user_id' => 'required|exists:users,id',
            'player2_user_id' => 'nullable',
            'winner_user_id' => 'nullable',
            'loser_user_id' => 'nullable',
            'type' => 'required|string|in:3,9',
            'status' => 'required|in:Pending,Playing,Ended,Interrupted',
            'began_at' => 'required|date',
            'ended_at' => 'required|date|after:began_at',
            'player1_points' => 'nullable|numeric',
            'player2_points' => 'nullable|numeric',
            'total_time' => 'nullable|integer',
            'match_id'   => 'nullable|exists:matches,id',
            'is_draw' => 'boolean',
        ];
    }
}



