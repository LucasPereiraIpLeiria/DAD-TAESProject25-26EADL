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
    public function update(Request $request){
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nickname' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'nickname')->ignore($user->id),
            ],
            'currentPassword' => 'nullable|string',
            'newPassword' => 'nullable|string|min:6|confirmed',
            'newPassword_confirmation' => 'nullable|string',
            'photo' => 'nullable|string', // Accept base64 string
        ]);

        // Update basic info
        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'nickname' => $validated['nickname'],
        ]);

        // Handle password change
        if (!empty($validated['newPassword'])) {
            if (!Hash::check($validated['currentPassword'], $user->password)) {
                return response()->json(['error' => 'Current password is incorrect'], 422);
            }
            $user->update(['password' => Hash::make($validated['newPassword'])]);
        }

        // Handle base64 photo
        if (!empty($validated['photo']) && strpos($validated['photo'], 'data:image') === 0) {
            // Delete old photo
            if ($user->photo_avatar_filename) {
                Storage::disk('public')->delete('photos_avatars/' . $user->photo_avatar_filename);
            }

            // Decode base64 and save
            $imageData = base64_decode(explode(',', $validated['photo'])[1]);
            $filename = uniqid() . '_' . time() . '.png';
            Storage::disk('public')->put('photos_avatars/' . $filename, $imageData);

            $user->update(['photo_avatar_filename' => $filename]);
        }

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        // Prepare response FIRST
        $response = response()->json([
            'message' => 'Account deleted successfully.',
        ], 200);

        // THEN perform the destructive operations
        $user->currentAccessToken()->delete();
        $user->delete();

        return $response;
    }
}
