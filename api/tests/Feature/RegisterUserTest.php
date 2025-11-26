<?php

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// Use transactions for DB rollback after each test
uses(DatabaseTransactions::class);

test('a user can register without a photo', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'email' => 'test@exampl.com',
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
    // Fake storage so files are not written to disk
    Storage::fake('public');

    $file = UploadedFile::fake()->image('avatar.jpg');

    $response = $this->postJson('/api/register', [
        'name' => 'Photo User',
        'email' => 'photo@example.com',
        'password' => 'password123',
        'nickname' => 'PhotoNick',
        'photo' => $file
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'User created successfully',
        ]);

    // Retrieve the user
    $user = User::where('email', 'photo@example.com')->first();

    // Assert that the uploaded file exists in the fake storage
    Storage::disk('public')->assertExists($user->photo_avatar_filename);
});

test('registration validation errors', function () {
    $response = $this->postJson('/api/register', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password', 'nickname']);
});
