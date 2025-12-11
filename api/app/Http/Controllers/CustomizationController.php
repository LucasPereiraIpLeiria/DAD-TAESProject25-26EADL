<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\ErrorResource;

class CustomizationController extends Controller
{
    // Catálogo de avatares disponíveis e respetivo custo em coins
    private array $availableAvatars = [
        'default' => 0,
        'mage'    => 20,
        'robot'   => 30,
        'dragon'  => 40,
    ];

    // Catálogo de decks disponíveis e respetivo custo em coins
    private array $availableDecks = [
        'default'    => 0,
        'wood'       => 10,
        'arcane'     => 25,
        'dark_skull' => 40,
    ];

    // Devolve o estado atual das customizações do user + saldo de coins
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'custom'        => $user->custom,
            'coins_balance' => $user->coins_balance,
        ]);
    }

    // Compra de avatar/deck: valida item, verifica coins e marca como owned
    public function purchase(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'type' => 'required|string|in:avatar,deck',
            'item' => 'required|string',
        ]);

        $type = $data['type'];
        $item = $data['item'];

        // Escolhe o catálogo correto com base no tipo
        $catalog = $type === 'avatar' ? $this->availableAvatars : $this->availableDecks;

        // Item tem de existir no catálogo
        if (!array_key_exists($item, $catalog)) {
            return (new ErrorResource([
                'reason'  => 'invalid_item',
                'message' => 'Item does not exist.',
            ]))->response()->setStatusCode(400);
        }

        $price  = $catalog[$item];
        $custom = $user->custom; // accessor do User já garante estrutura default

        $owned = $custom[$type . 's']['owned'];

        // Já não vale a pena comprar algo que já está owned
        if (in_array($item, $owned, true)) {
            return (new ErrorResource([
                'reason'  => 'already_owned',
                'message' => 'You already own this item.',
            ]))->response()->setStatusCode(400);
        }

        // Se tiver custo, verificar se o user tem coins suficientes
        if ($price > 0) {
            if ($user->coins_balance < $price) {
                return (new ErrorResource([
                    'reason'  => 'insufficient_funds',
                    'message' => 'Not enough coins to buy this item.',
                ]))->response()->setStatusCode(400);
            }

            $user->coins_balance -= $price;
        }

        // Atualizar lista de owned e guardar no JSON de custom
        $owned[] = $item;
        $custom[$type . 's']['owned'] = $owned;

        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Item purchased and selected successfully.',
            'user'    => $user->fresh(),
        ]);
    }

    // Seleciona um avatar/deck que o user já possui como o ativo
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
        $owned  = $custom[$type . 's']['owned'];

        // Não deixa selecionar items que o user não tem
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

    // Endpoint de debug: repõe o JSON de custom para o estado default
    public function debugReset(Request $request)
    {
        $user = $request->user();

        $user->custom = [
            'avatars' => [
                'owned'    => ['default'],
                'selected' => 'default',
            ],
            'decks' => [
                'owned'    => ['default'],
                'selected' => 'default',
            ],
        ];

        $user->save();

        return response()->json([
            'message' => 'Customizations reset to default.',
            'user'    => $user->fresh(),
        ]);
    }
}
