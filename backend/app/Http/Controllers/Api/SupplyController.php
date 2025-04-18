<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SupplyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        \Log::info('SupplyController::index - Request received', ['params' => $request->all()]);

        $query = Supply::query();

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Search by name or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort
        $sortField = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_dir', 'asc');
        $allowedSortFields = ['name', 'price', 'category', 'created_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Get featured products or paginate
        if ($request->has('featured') && $request->featured) {
            $supplies = $query->where('featured', true)->get()->toArray();
        } else {
            $perPage = $request->input('per_page', 10);
            $paginator = $query->paginate($perPage);
            $supplies = $paginator->items(); // Get just the items array from paginator
        }

        \Log::info('SupplyController::index - Supplies retrieved', ['count' => count($supplies)]);

        return response()->json($supplies);
    }

    /**
     * Display the specified resource.
     */
    public function show(Supply $supply): JsonResponse
    {
        return response()->json($supply);
    }

    /**
     * Get all available categories.
     */
    public function getCategories(): JsonResponse
    {
        \Log::info('SupplyController::getCategories - Request received');

        $categories = Supply::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->toArray(); // Convert to array

        \Log::info('SupplyController::getCategories - Categories retrieved', ['categories' => $categories]);

        return response()->json($categories);
    }
}
