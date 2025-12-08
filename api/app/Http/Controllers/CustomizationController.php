<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\ErrorResource;

class CustomizationController extends Controller
{
    // só para centralizar a “lista oficial” de itens / preços
    private array $availableAvatars = [
        'default' => 0,
        'mage'    => 20,
        'robot'   => 30,
    ];

    private array $availableDecks = [
        'default'   => 0,
        'wood'      => 10,
        'arcane'    => 25,
        'dark_skull'=> 40,
    ];

    // GET /customizations (opcional, se quiseres um endpoint dedicado)
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'custom'        => $user->custom,          // já vem com defaults
            'coins_balance' => $user->coins_balance,
        ]);
    }

    // POST /customizations/purchase
    public function purchase(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'type' => 'required|string|in:avatar,deck',
            'item' => 'required|string',
        ]);

        $type = $data['type'];
        $item = $data['item'];

        if ($type === 'avatar') {
            $catalog = $this->availableAvatars;
            $pathOwned = ['avatars', 'owned'];
            $pathSelected = ['avatars', 'selected'];
        } else {
            $catalog = $this->availableDecks;
            $pathOwned = ['decks', 'owned'];
            $pathSelected = ['decks', 'selected'];
        }

        if (!array_key_exists($item, $catalog)) {
            return (new ErrorResource([
                'reason'  => 'invalid_item',
                'message' => 'Item does not exist.',
            ]))->response()->setStatusCode(400);
        }

        $price = $catalog[$item];

        $custom = $user->custom; // já vem com defaults graças ao accessor

        // helperzinho para trabalhar no array nested
        $getOwned = function (&$custom) use ($pathOwned) {
            $ref =& $custom;
            foreach ($pathOwned as $segment) {
                $ref =& $ref[$segment];
            }
            return $ref;
        };

        $getSelected = function (&$custom) use ($pathSelected) {
            $ref =& $custom;
            foreach ($pathSelected as $segment) {
                $ref =& $ref[$segment];
            }
            return $ref;
        };

        $owned   =& $getOwned($custom);
        $selected =& $getSelected($custom);

        // Se já está owned, não voltamos a cobrar – só selecionamos
        if (in_array($item, $owned, true)) {
            $selected = $item;
            $user->custom = $custom;
            $user->save();

            return response()->json([
                'message' => 'Item already owned, selected successfully.',
                'user'    => $user->fresh(),
            ]);
        }

        // Se o item é pago, verificar saldo
        if ($price > 0) {
            if ($user->coins_balance < $price) {
                return (new ErrorResource([
                    'reason'  => 'insufficient_funds',
                    'message' => 'Not enough coins to buy this item.',
                ]))->response()->setStatusCode(400);
            }

            $user->coins_balance -= $price;
        }

        $owned[] = $item;
        $selected = $item;

        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Item purchased and selected successfully.',
            'user'    => $user->fresh(), // inclui coins_balance + custom
        ]);
    }

    // PATCH /customizations/select
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

        if ($type === 'avatar') {
            $owned    = $custom['avatars']['owned'] ?? ['default'];
            $selected =& $custom['avatars']['selected'];
        } else {
            $owned    = $custom['decks']['owned'] ?? ['default'];
            $selected =& $custom['decks']['selected'];
        }

        if (!in_array($item, $owned, true)) {
            return (new ErrorResource([
                'reason'  => 'not_owned',
                'message' => 'You do not own this item.',
            ]))->response()->setStatusCode(400);
        }

        $selected = $item;
        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Item selected successfully.',
            'user'    => $user->fresh(),
        ]);
    }
}
