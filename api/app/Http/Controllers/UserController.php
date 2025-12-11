<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    // atualizar dados básicos do utilizador, password e avatar (base64)
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                      => 'required|string|max:255',
            'email'                     => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nickname'                  => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'nickname')->ignore($user->id),
            ],
            'currentPassword'           => 'nullable|string',
            'newPassword'               => 'nullable|string|min:6|confirmed',
            'newPassword_confirmation'  => 'nullable|string',
            'photo'                     => 'nullable|string', // aceitar string base64
        ]);

        // atualizar nome, email e nickname
        $user->update([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'nickname' => $validated['nickname'],
        ]);

        // validar password atual e atualizar para nova password, se fornecida
        if (!empty($validated['newPassword'])) {
            if (!Hash::check($validated['currentPassword'], $user->password)) {
                return response()->json(['error' => 'Current password is incorrect'], 422);
            }

            $user->update(['password' => Hash::make($validated['newPassword'])]);
        }

        // tratar foto em base64 (atualizar avatar)
        if (!empty($validated['photo']) && strpos($validated['photo'], 'data:image') === 0) {
            // apagar foto antiga, se existir
            if ($user->photo_avatar_filename) {
                Storage::disk('public')->delete('photos_avatars/' . $user->photo_avatar_filename);
            }

            // decodificar base64 e guardar novo ficheiro
            $imageData = base64_decode(explode(',', $validated['photo'])[1]);
            $filename  = uniqid() . '_' . time() . '.png';

            Storage::disk('public')->put('photos_avatars/' . $filename, $imageData);

            $user->update(['photo_avatar_filename' => $filename]);
        }

        return response()->json(['user' => $user]);
    }

    // eliminar conta do utilizador autenticado (com confirmação de password)
    public function destroy(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        // validar password antes de proceder à eliminação
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        // preparar resposta antes de executar operações destrutivas
        $response = response()->json([
            'message' => 'Account deleted successfully.',
        ], 200);

        // revogar token atual e marcar utilizador como eliminado (soft delete)
        $user->currentAccessToken()->delete();
        $user->delete();

        return $response;
    }
}
