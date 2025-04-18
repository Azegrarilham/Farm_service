<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Supply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Get orders for the current user.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Auth::user()->orders();

        // Filter by status
        if ($request->has('status') && in_array($request->status, Order::STATUSES)) {
            $query->where('status', $request->status);
        }

        // Sort orders
        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_dir', 'desc');
        $allowedSortFields = ['created_at', 'total', 'status'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $orders = $query->paginate(10);

        return response()->json($orders);
    }

    /**
     * Get a specific order with items.
     */
    public function show(int $id): JsonResponse
    {
        $order = Auth::user()->orders()->with('items.supply')->findOrFail($id);

        return response()->json($order);
    }

    /**
     * Create a new order from the cart.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string',
            'shipping_state' => 'required|string',
            'shipping_zip' => 'required|string',
            'shipping_country' => 'nullable|string',
            'shipping_phone' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $cart = $user->cart;

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        try {
            DB::beginTransaction();

            // Calculate order totals
            $subtotal = 0;
            $totalDiscount = 0;

            foreach ($cart->items as $item) {
                $supply = $item->supply;

                // Check stock availability
                if ($supply->stock_quantity < $item->quantity) {
                    throw new \Exception("Not enough stock for {$supply->name}");
                }

                // Calculate item price and discount
                $itemSubtotal = $supply->price * $item->quantity;
                $itemDiscount = 0;

                // Apply volume discounts
                if ($item->quantity >= 10) {
                    $itemDiscount = $itemSubtotal * 0.1; // 10% discount for 10+ items
                } elseif ($item->quantity >= 5) {
                    $itemDiscount = $itemSubtotal * 0.05; // 5% discount for 5+ items
                }

                $subtotal += ($itemSubtotal - $itemDiscount);
                $totalDiscount += $itemDiscount;
            }

            // Apply tax (example: 7% sales tax)
            $tax = $subtotal * 0.07;
            $total = $subtotal + $tax;

            // Create the order
            $order = new Order([
                'user_id' => $user->id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'discount' => $totalDiscount,
                'tax' => $tax,
                'total' => $total,
                'shipping_address' => $validated['shipping_address'],
                'shipping_city' => $validated['shipping_city'],
                'shipping_state' => $validated['shipping_state'],
                'shipping_zip' => $validated['shipping_zip'],
                'shipping_country' => $validated['shipping_country'] ?? 'USA',
                'shipping_phone' => $validated['shipping_phone'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $order->save();

            // Create order items and update inventory
            foreach ($cart->items as $item) {
                $supply = $item->supply;
                $itemSubtotal = $supply->price * $item->quantity;
                $itemDiscount = 0;

                // Apply volume discounts
                if ($item->quantity >= 10) {
                    $itemDiscount = $itemSubtotal * 0.1;
                } elseif ($item->quantity >= 5) {
                    $itemDiscount = $itemSubtotal * 0.05;
                }

                // Create order item
                $orderItem = new OrderItem([
                    'supply_id' => $supply->id,
                    'quantity' => $item->quantity,
                    'price' => $supply->price,
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal - $itemDiscount,
                ]);

                $order->items()->save($orderItem);

                // Update inventory
                $supply->stock_quantity -= $item->quantity;
                $supply->save();
            }

            // Clear cart
            $cart->items()->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load('items.supply'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create order: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reorder a previous order.
     */
    public function reorder(int $id): JsonResponse
    {
        $previousOrder = Auth::user()->orders()->with('items.supply')->findOrFail($id);
        $user = Auth::user();

        // Get or create user's cart
        $cart = $user->cart;
        if (!$cart) {
            $cart = Cart::create(['user_id' => $user->id]);
        }

        // Clear the current cart
        $cart->items()->delete();

        // Add items from the previous order
        $outOfStockItems = [];

        foreach ($previousOrder->items as $item) {
            $supply = $item->supply;

            // Check if supply still exists and has enough stock
            if (!$supply || $supply->stock_quantity < $item->quantity) {
                $outOfStockItems[] = $supply ? $supply->name : 'Unknown product';
                continue;
            }

            // Add to cart
            $cart->items()->create([
                'supply_id' => $item->supply_id,
                'quantity' => $item->quantity,
            ]);
        }

        // Load cart data
        $cartData = app(CartController::class)->getCart()->getData();

        return response()->json([
            'message' => 'Items added to cart',
            'cart' => $cartData,
            'out_of_stock' => $outOfStockItems,
        ]);
    }

    /**
     * Cancel an order.
     */
    public function cancel(int $id): JsonResponse
    {
        $order = Auth::user()->orders()->findOrFail($id);

        // Only pending or processing orders can be cancelled
        if (!in_array($order->status, ['pending', 'processing'])) {
            return response()->json([
                'message' => 'This order cannot be cancelled',
            ], 422);
        }

        // Update order status
        $order->status = 'cancelled';
        $order->save();

        // Return the items to inventory
        foreach ($order->items as $item) {
            $supply = $item->supply;
            if ($supply) {
                $supply->stock_quantity += $item->quantity;
                $supply->save();
            }
        }

        return response()->json([
            'message' => 'Order cancelled successfully',
            'order' => $order,
        ]);
    }
}
