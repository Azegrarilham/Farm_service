<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Farm;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Get statistics for the dashboard.
     */
    public function getStatistics(): JsonResponse
    {
        // Get current user ID
        $userId = Auth::id();

        // Get farms owned by the current user
        $userFarms = Farm::where('user_id', $userId)->get();
        $userFarmIds = $userFarms->pluck('id')->toArray();

        // Count of user's farms
        $totalFarms = count($userFarms);

        // Count of products from user's farms
        $totalProducts = Product::whereIn('farm_id', $userFarmIds)->count();

        // Get recent activities only for the current user
        $recentActivities = Activity::where('user_id', $userId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($activity) {
                // Format for frontend consumption
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'entityType' => $activity->entity_type,
                    'entityId' => $activity->entity_id,
                    'entityName' => $activity->entity_name,
                    'timestamp' => $activity->created_at->toIso8601String(),
                    'userId' => $activity->user_id,
                    'userName' => $activity->user ? $activity->user->name : 'Unknown User'
                ];
            });

        $statistics = [
            'totalFarms' => $totalFarms,
            'totalProducts' => $totalProducts,
            'recentActivities' => $recentActivities,
        ];

        return response()->json($statistics);
    }
}
