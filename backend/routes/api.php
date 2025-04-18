<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SupplyController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CropController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Authentication routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// Public Supply routes
Route::get('supplies', [SupplyController::class, 'index']);
Route::get('supplies/categories', [SupplyController::class, 'getCategories']);
Route::get('supplies/{supply}', [SupplyController::class, 'show']);

// Supply routes
Route::apiResource('supplies', SupplyController::class)->only(['index', 'show']);
Route::get('supplies/categories', [SupplyController::class, 'getCategories']);

// Crop routes
Route::prefix('crops')->group(function () {
    Route::get('/', [CropController::class, 'index']);
    Route::get('/farm/{farmId}', [CropController::class, 'getByFarmId']);
    Route::get('/{crop}', [CropController::class, 'show']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User related routes
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
    Route::post('user/profile', [AuthController::class, 'updateProfile']);
    Route::put('user/password', [AuthController::class, 'changePassword']);

    // Farm routes
    Route::get('farms/user', [FarmController::class, 'getUserFarms']);
    Route::apiResource('farms', FarmController::class);

    // Product routes
    Route::apiResource('products', ProductController::class);
    Route::get('farms/{farmId}/products', [ProductController::class, 'getAllByFarmId']);

    // Dashboard routes
    Route::get('dashboard/statistics', [DashboardController::class, 'getStatistics']);

    // Cart routes
    Route::get('cart', [CartController::class, 'getCart']);
    Route::post('cart/add', [CartController::class, 'addItem']);
    Route::put('cart/update/{id}', [CartController::class, 'updateItem']);
    Route::delete('cart/remove/{id}', [CartController::class, 'removeItem']);
    Route::delete('cart/clear', [CartController::class, 'clearCart']);

    // Order routes
    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/{id}', [OrderController::class, 'show']);
    Route::post('orders/{id}/reorder', [OrderController::class, 'reorder']);
    Route::put('orders/{id}/cancel', [OrderController::class, 'cancel']);

    // Protected crop routes
    Route::get('crops/user', [CropController::class, 'getUserCrops']);
    Route::post('crops', [CropController::class, 'store']);
    Route::put('crops/{crop}', [CropController::class, 'update']);
    Route::delete('crops/{crop}', [CropController::class, 'destroy']);
});

// Debug route - remove in production
Route::get('debug/auth', function (Request $request) {
    try {
        $user = Auth::user();
        $token = $request->bearerToken();

        \Log::info('Debug auth endpoint accessed', [
            'user_id' => $user ? $user->id : null,
            'authenticated' => Auth::check(),
            'token' => $token ? substr($token, 0, 10) . '...' : null,
            'headers' => $request->headers->all(),
        ]);

        if (!$user) {
            return response()->json([
                'error' => 'Not authenticated',
                'token_present' => !empty($token),
                'tip' => 'Make sure you\'re logged in and sending the correct token.',
            ], 401);
        }

        // Get user farms
        $farms = \App\Models\Farm::where('user_id', $user->id)->get();

        // Get user crops through farms
        $farmIds = $farms->pluck('id')->toArray();
        $crops = empty($farmIds) ? [] : \App\Models\Crop::whereIn('farm_id', $farmIds)->with('farm')->get();

        return response()->json([
            'user' => $user,
            'authenticated' => true,
            'check_result' => Auth::check(),
            'farms' => [
                'count' => $farms->count(),
                'ids' => $farmIds,
                'data' => $farms,
            ],
            'crops' => [
                'count' => count($crops),
                'data' => $crops,
            ]
        ]);
    } catch (\Exception $e) {
        \Log::error('Error in debug auth endpoint: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'error' => 'Exception occured',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ], 500);
    }
});

// Debug route to fix farm-user association - REMOVE IN PRODUCTION
Route::get('debug/fix-farm-association/{farmId}', function (Request $request, $farmId) {
    try {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'error' => 'Not authenticated',
                'tip' => 'You must be logged in to use this endpoint.'
            ], 401);
        }

        // Find the farm
        $farm = \App\Models\Farm::find($farmId);

        if (!$farm) {
            return response()->json([
                'error' => 'Farm not found',
                'farm_id' => $farmId
            ], 404);
        }

        // Log before update
        \Log::info('Updating farm user association', [
            'farm_id' => $farm->id,
            'farm_name' => $farm->name,
            'old_user_id' => $farm->user_id,
            'new_user_id' => $user->id
        ]);

        // Update the farm's user_id
        $farm->user_id = $user->id;
        $farm->save();

        // Get all crops for this farm
        $crops = \App\Models\Crop::where('farm_id', $farm->id)->get();

        return response()->json([
            'success' => true,
            'message' => 'Farm successfully associated with current user',
            'farm' => $farm,
            'user' => $user,
            'crops_count' => $crops->count(),
            'crops' => $crops
        ]);
    } catch (\Exception $e) {
        \Log::error('Error fixing farm association: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'error' => 'Exception occurred',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Debug route to list all farms in system
Route::get('debug/all-farms', function (Request $request) {
    $farms = \App\Models\Farm::with('user')->get();
    return response()->json($farms);
});
