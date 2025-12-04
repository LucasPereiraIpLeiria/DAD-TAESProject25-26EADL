<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StoreMatcheRequest;
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
    public function update(StoreMatcheRequest $request, Matche $matche)
    {
        $matche->update($request->validated());
        return response()->json($matche);
    }

    public function getUserMatches(User $user){
        return $user -> matches();
    }
}
