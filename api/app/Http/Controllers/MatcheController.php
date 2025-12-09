<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StoreMatcheRequest;
use App\Http\Requests\UpdateMatcheRequest;
use App\Models\Matche;
use App\Models\User;


class MatcheController extends Controller
{
    //
    //public function index()


    public function store(StoreMatcheRequest $request)
    {
        $matche = Matche::create($request->validated());
        return response()->json($matche, 201);
    }
    public function show(Matche $matche)
    {
        return $matche;
    }
    public function update(UpdateMatcheRequest $request, Matche $matche)
    {
        $data = $request->validated();

        if (!empty($data['began_at']) && !empty($data['ended_at'])) {
            $start = strtotime($data['began_at']);
            $end   = strtotime($data['ended_at']);

            if ($start !== false && $end !== false && $end >= $start) {
                $data['total_time'] = $end - $start;
            }
        }
        $matche->update($request->validated());
        return response()->json($matche);
    }

    public function getUserMatches(User $user)
    {
        return $user->matches();
    }
}
