<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable =  [
        'name',
        'email',
        'password',
        'nickname',
        'photo_avatar_filename', // Optional field
        'coins_balance',
        'custom',
    ];

    protected $dates = ['deleted_at'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'custom' => 'array',
    ];



    /*
     * Get the attributes that should be cast.
     *
     * @return array<string, string>

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    */

     public function getCustomAttribute($value)
    {
        $decoded = json_decode($value, true);

        if (!is_array($decoded)) {
            $decoded = [];
        }

        return [
            'avatars' => [
                'owned'    => $decoded['avatars']['owned'] ?? ['default'],
                'selected' => $decoded['avatars']['selected'] ?? 'default',
            ],
            'decks' => [
                'owned'    => $decoded['decks']['owned'] ?? ['default'],
                'selected' => $decoded['decks']['selected'] ?? 'default',
            ],
        ];
    }

    public function setCustomAttribute($value)
    {
        $this->attributes['custom'] = json_encode($value);
    }




    public function matchesAsPlayer1()
    {
        return $this->hasMany(Matche::class, 'player1_user_id');
    }

    public function matchesAsPlayer2()
    {
        return $this->hasMany(Matche::class, 'player2_user_id');
    }

    /**
     * Combined matches (accessor)
     */
    public function getMatchesAttribute()
    {
        return $this->matchesAsPlayer1()->get()
            ->merge($this->matchesAsPlayer2()->get());
    }
}
