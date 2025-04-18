<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Farm;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $farmId = $request->query('farm_id');

        if ($farmId) {
            $products = Product::where('farm_id', $farmId)->get();
        } else {
            $products = Product::all();
        }

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'farm_id' => 'required|exists:farms,id',
        ]);

        $product = Product::create($validated);

        // Check if the farm belongs to the user
        $farm = Farm::findOrFail($validated['farm_id']);

        // Record activity
        Activity::create([
            'type' => 'create',
            'entity_type' => 'product',
            'entity_id' => $product->id,
            'entity_name' => $product->name,
            'user_id' => Auth::id(),
        ]);

        return response()->json($product, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'farm_id' => 'required|exists:farms,id',
        ]);

        $product->update($validated);

        // Record activity
        Activity::create([
            'type' => 'update',
            'entity_type' => 'product',
            'entity_id' => $product->id,
            'entity_name' => $product->name,
            'user_id' => Auth::id(),
        ]);

        return response()->json($product);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        // Record activity before deletion
        Activity::create([
            'type' => 'delete',
            'entity_type' => 'product',
            'entity_id' => $product->id,
            'entity_name' => $product->name,
            'user_id' => Auth::id(),
        ]);

        $product->delete();

        return response()->json(null, 204);
    }

    /**
     * Get products by farm ID.
     */
    public function getAllByFarmId(int $farmId): JsonResponse
    {
        $products = Product::where('farm_id', $farmId)->get();
        return response()->json($products);
    }
}
