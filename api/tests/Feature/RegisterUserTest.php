<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('a user can register without a photo', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'nickname' => 'Tester'
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'User created successfully',
        ]);

    expect(User::where('email', 'test@example.com')->exists())->toBeTrue();
});

test('a user can register with a photo', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $response = $this->postJson('/api/register', [
        'name' => 'Photo User',
        'email' => 'photo@example.com',
        'password' => 'password123',
        'nickname' => 'PhotoNick',
        'photo' => $file
    ]);

    $response->assertStatus(200);

    $user = User::where('email', 'photo@example.com')->first();
    Storage::disk('public')->assertExists($user->photo_avatar_filename);
});

test('registration validation errors', function () {
    $response = $this->postJson('/api/register', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password', 'nickname']);
});

