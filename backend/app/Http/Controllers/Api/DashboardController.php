<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Farm;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get statistics for the dashboard.
     */
    public function getStatistics(): JsonResponse
    {
        $totalFarms = Farm::count();
        $totalProducts = Product::count();

        // Get recent activities with user information
        $recentActivities = Activity::with('user')
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
                    'userName' => $activity->userName
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
