<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Supply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * Get the current user's cart with items.
     */
    public function getCart(): JsonResponse
    {
        $user = Auth::user();
        $cart = $user->cart;

        if (!$cart) {
            $cart = Cart::create(['user_id' => $user->id]);
        }

        $cart->load('items.supply');

        // Calculate totals
        $subtotal = 0;
        $totalItems = 0;
        $items = [];

        foreach ($cart->items as $item) {
            $supply = $item->supply;
            $itemSubtotal = $supply->price * $item->quantity;

            // Apply volume discounts
            $discount = 0;
            if ($item->quantity >= 10) {
                $discount = $itemSubtotal * 0.1; // 10% discount for 10+ items
            } elseif ($item->quantity >= 5) {
                $discount = $itemSubtotal * 0.05; // 5% discount for 5+ items
            }

            $itemTotal = $itemSubtotal - $discount;

            $items[] = [
                'id' => $item->id,
                'supply_id' => $supply->id,
                'name' => $supply->name,
                'price' => $supply->price,
                'quantity' => $item->quantity,
                'subtotal' => $itemSubtotal,
                'discount' => $discount,
                'total' => $itemTotal,
                'image' => $supply->images[0] ?? null,
                'unit' => $supply->unit,
            ];

            $subtotal += $itemTotal;
            $totalItems += $item->quantity;
        }

        $cartData = [
            'id' => $cart->id,
            'items' => $items,
            'subtotal' => $subtotal,
            'total_items' => $totalItems,
        ];

        return response()->json($cartData);
    }

    /**
     * Add an item to the cart.
     */
    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supply_id' => 'required|exists:supplies,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        $cart = $user->cart;

        if (!$cart) {
            $cart = Cart::create(['user_id' => $user->id]);
        }

        // Check if supply exists and has enough stock
        $supply = Supply::findOrFail($validated['supply_id']);
        if ($supply->stock_quantity < $validated['quantity']) {
            return response()->json([
                'message' => 'Not enough stock available.',
            ], 422);
        }

        // Check if item already exists in cart
        $cartItem = $cart->items()->where('supply_id', $validated['supply_id'])->first();

        if ($cartItem) {
            // Update quantity
            $cartItem->quantity += $validated['quantity'];
            $cartItem->save();
        } else {
            // Create new cart item
            $cartItem = new CartItem([
                'supply_id' => $validated['supply_id'],
                'quantity' => $validated['quantity'],
            ]);
            $cart->items()->save($cartItem);
        }

        return $this->getCart();
    }

    /**
     * Update a cart item.
     */
    public function updateItem(Request $request, int $itemId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $user = Auth::user();
        $cart = $user->cart;

        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        $cartItem = $cart->items()->findOrFail($itemId);

        // Check if supply has enough stock
        $supply = Supply::findOrFail($cartItem->supply_id);
        if ($supply->stock_quantity < $validated['quantity']) {
            return response()->json([
                'message' => 'Not enough stock available.',
            ], 422);
        }

        $cartItem->quantity = $validated['quantity'];
        $cartItem->save();

        return $this->getCart();
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(int $itemId): JsonResponse
    {
        $user = Auth::user();
        $cart = $user->cart;

        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        $cartItem = $cart->items()->findOrFail($itemId);
        $cartItem->delete();

        return $this->getCart();
    }

    /**
     * Clear the cart.
     */
    public function clearCart(): JsonResponse
    {
        $user = Auth::user();
        $cart = $user->cart;

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['message' => 'Cart cleared successfully']);
    }
}
