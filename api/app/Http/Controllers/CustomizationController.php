<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\ErrorResource;

class CustomizationController extends Controller
{
    private array $availableAvatars = [
        'default' => 0,
        'mage'    => 20,
        'robot'   => 30,
        'dragon'  => 40,
    ];

    private array $availableDecks = [
        'default'   => 0,
        'wood'      => 10,
        'arcane'    => 25,
        'dark_skull' => 40,
    ];

    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'custom'        => $user->custom,
            'coins_balance' => $user->coins_balance,
        ]);
    }

    public function purchase(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'type' => 'required|string|in:avatar,deck',
            'item' => 'required|string',
        ]);

        $type = $data['type'];
        $item = $data['item'];

        $catalog = $type === 'avatar' ? $this->availableAvatars : $this->availableDecks;

        if (!array_key_exists($item, $catalog)) {
            return (new ErrorResource([
                'reason'  => 'invalid_item',
                'message' => 'Item does not exist.',
            ]))->response()->setStatusCode(400);
        }

        $price  = $catalog[$item];
        $custom = $user->custom; // accessor garante defaults

        // Carregamos arrays locais (sem referências)
        $owned    = $custom[$type . 's']['owned'];
        $selected = $custom[$type . 's']['selected'];

        // Se já é owned → só selecionar
        if (in_array($item, $owned, true)) {
            $custom[$type . 's']['selected'] = $item;
            $user->custom = $custom;
            $user->save();

            return response()->json([
                'message' => 'Item already owned, selected successfully.',
                'user'    => $user->fresh(),
            ]);
        }

        // Verificar funds
        if ($price > 0) {
            if ($user->coins_balance < $price) {
                return (new ErrorResource([
                    'reason'  => 'insufficient_funds',
                    'message' => 'Not enough coins to buy this item.',
                ]))->response()->setStatusCode(400);
            }

            $user->coins_balance -= $price;
        }

        // Comprar e selecionar
        $owned[] = $item;
        $custom[$type . 's']['owned']    = $owned;

        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Item purchased and selected successfully.',
            'user'    => $user->fresh(),
        ]);
    }

    public function select(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'type' => 'required|string|in:avatar,deck',
            'item' => 'required|string',
        ]);

        $type = $data['type'];
        $item = $data['item'];

        $custom = $user->custom;

        $owned = $custom[$type . 's']['owned'];

        if (!in_array($item, $owned, true)) {
            return (new ErrorResource([
                'reason'  => 'not_owned',
                'message' => 'You do not own this item.',
            ]))->response()->setStatusCode(400);
        }

        $custom[$type . 's']['selected'] = $item;

        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Item selected successfully.',
            'user'    => $user->fresh(),
        ]);
    }

    public function debugReset(Request $request)
    {
        $user = $request->user();

        $user->custom = [
            'avatars' => [
                'owned' => ['default'],
                'selected' => 'default',
            ],
            'decks' => [
                'owned' => ['default'],
                'selected' => 'default',
            ],
        ];

        $user->save();

        return response()->json([
            'message' => 'Customizations reset to default.',
            'user' => $user->fresh(),
        ]);
    }
}
