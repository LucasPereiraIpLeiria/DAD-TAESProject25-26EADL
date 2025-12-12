<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Login: validar credenciais e gerar um token de acesso (Sanctum)
    public function login(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user  = Auth::user();
        $token = $user->createToken('access-token', ['*'], now()->addMinutes(0.5))->plainTextToken;

        return response()->json([
            'token' => $token,
        ]);
    }

    // Logout: invalidar o token atual do utilizador autenticado
    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    // Registo: criar um novo utilizador, opcionalmente com foto de avatar, e saldo inicial de coins
    public function register(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'nickname' => ['required', 'string', 'max:255', Rule::unique('users', 'nickname')],
            'photo'    => 'nullable|image|max:2048', // avatar é opcional, até 2MB
        ]);

        $photoFilename = null;

        // Se o utilizador enviar foto, guardar o ficheiro e armazenar só o nome na BD
        if ($request->hasFile('photo')) {
            $photo         = $request->file('photo');
            $photoFilename = basename($photo->store('photos_avatars', 'public'));
        }

        // Criar o utilizador com password encriptada e 10 coins de saldo inicial
        $user = User::create([
            'name'                => $validated['name'],
            'email'               => $validated['email'],
            'password'            => bcrypt($validated['password']),
            'nickname'            => $validated['nickname'],
            'photo_avatar_filename' => $photoFilename,
            'coins_balance'       => 10,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user'    => $user,
        ]);
    }
}
