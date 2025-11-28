<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ErrorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'status' => 'error',
            'reason' => $this->resource['reason'],
            'message' => $this->resource['message'],
        ];
    }
}
