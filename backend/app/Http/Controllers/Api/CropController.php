<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Activity;
use App\Models\Farm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class CropController extends Controller
{
    /**
     * Find a crop by ID with better error handling
     */
    protected function findCropById($id): Crop
    {
        $crop = Crop::find($id);

        if (!$crop) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException("No query results for model [App\\Models\\Crop] {$id}");
        }

        // Check if the authenticated user has permission to access this crop
        $userId = Auth::id();
        $farm = $crop->farm;

        if (!$farm || $farm->user_id !== $userId) {
            \Log::warning("User #{$userId} attempted to access Crop #{$crop->id} which belongs to Farm #{$crop->farm_id} owned by User #{$farm->user_id}");
            throw new \Illuminate\Auth\Access\AuthorizationException('You do not have permission to access this crop');
        }

        return $crop;
    }

    /**
     * Display a listing of the crops.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Crop::with('farm');

        // Apply filters if provided
        if ($request->has('organic') && $request->organic) {
            $query->where('is_organic', true);
        }

        $crops = $query->get();

        return response()->json($crops);
    }

    /**
     * Store a newly created crop in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Log incoming request data for debugging
            \Log::info('Creating new crop with data:', $request->all());

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50',
                'price' => 'required|numeric|min:0',
                'farm_id' => 'required|exists:farms,id',
                'available_from' => 'nullable|date',
                'available_until' => 'nullable|date',
                'is_organic' => 'nullable|boolean',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            \Log::info('Validation passed:', $validated);

            // Process images
            if ($request->hasFile('images')) {
                $imagesPaths = [];
                foreach ($request->file('images') as $image) {
                    $path = $image->store('crop-images', 'public');
                    $imagesPaths[] = $path;
                }
                $validated['images'] = $imagesPaths;
                \Log::info('Processed images:', $imagesPaths);
            }

            // Check if user owns the farm
            $farm = Farm::findOrFail($validated['farm_id']);
            \Log::info('Farm found:', ['farm_id' => $farm->id, 'user_id' => $farm->user_id, 'auth_id' => Auth::id()]);

            if ($farm->user_id !== Auth::id()) {
                \Log::warning('Unauthorized farm access attempt:', [
                    'farm_id' => $farm->id,
                    'farm_user_id' => $farm->user_id,
                    'request_user_id' => Auth::id()
                ]);
                return response()->json(['error' => 'You do not own this farm'], 403);
            }

            $crop = Crop::create($validated);
            \Log::info('Crop created successfully:', ['crop_id' => $crop->id]);

            // Record activity
            Activity::create([
                'type' => 'create',
                'entity_type' => 'crop',
                'entity_id' => $crop->id,
                'entity_name' => $crop->name,
                'user_id' => Auth::id(),
            ]);
            \Log::info('Activity recorded for crop creation');

            return response()->json($crop, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed:', ['errors' => $e->errors()]);
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating crop:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to create crop: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified crop.
     */
    public function show($id): JsonResponse
    {
        try {
            $crop = $this->findCropById($id);
            $crop->load('farm');
            return response()->json($crop);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Crop not found'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['error' => $e->getMessage()], 403);
        } catch (\Exception $e) {
            \Log::error('Error showing crop: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to retrieve crop details'], 500);
        }
    }

    /**
     * Update the specified crop in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $crop = $this->findCropById($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'quantity' => 'required|numeric|min:0',
                'unit' => 'required|string|max:50',
                'price' => 'required|numeric|min:0',
                'farm_id' => 'required|exists:farms,id',
                'available_from' => 'nullable|date',
                'available_until' => 'nullable|date',
                'is_organic' => 'nullable|boolean',
                'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            // Check if user owns the crop's farm
            $farm = Farm::findOrFail($validated['farm_id']);
            if ($farm->user_id !== Auth::id()) {
                return response()->json(['error' => 'You do not own this farm'], 403);
            }

            // Process images
            if ($request->hasFile('images')) {
                $imagesPaths = $crop->images ?? [];
                foreach ($request->file('images') as $image) {
                    $path = $image->store('crop-images', 'public');
                    $imagesPaths[] = $path;
                }
                $validated['images'] = $imagesPaths;
            }

            $crop->update($validated);

            // Record activity
            Activity::create([
                'type' => 'update',
                'entity_type' => 'crop',
                'entity_id' => $crop->id,
                'entity_name' => $crop->name,
                'user_id' => Auth::id(),
            ]);

            return response()->json($crop);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Crop not found'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['error' => $e->getMessage()], 403);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating crop: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update crop'], 500);
        }
    }

    /**
     * Remove the specified crop from storage.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $crop = $this->findCropById($id);

            // Delete crop images
            if (!empty($crop->images)) {
                foreach ($crop->images as $image) {
                    Storage::disk('public')->delete($image);
                }
            }

            // Record activity
            Activity::create([
                'type' => 'delete',
                'entity_type' => 'crop',
                'entity_id' => $crop->id,
                'entity_name' => $crop->name,
                'user_id' => Auth::id(),
            ]);

            $crop->delete();

            return response()->json(null, 204);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Crop not found'], 404);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['error' => $e->getMessage()], 403);
        } catch (\Exception $e) {
            \Log::error('Error deleting crop: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete crop'], 500);
        }
    }

    /**
     * Get crops by farm ID.
     */
    public function getByFarmId(int $farmId): JsonResponse
    {
        $crops = Crop::where('farm_id', $farmId)->get();
        return response()->json($crops);
    }

    /**
     * Get crops owned by the authenticated user.
     */
    public function getUserCrops(Request $request): JsonResponse
    {
        try {
            // Get the authenticated user
            $userId = Auth::id();
            \Log::info('Fetching crops for user ID: ' . $userId);

            // Extra debugging for the issue
            $user = Auth::user();
            \Log::info('Authenticated user details:', [
                'id' => $user ? $user->id : null,
                'name' => $user ? $user->name : null,
                'email' => $user ? $user->email : null,
            ]);

            // Debug: Dump request info
            \Log::info('Request details:', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'headers' => $request->headers->all(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Get all farms owned by the user
            $farmIds = Farm::where('user_id', $userId)->pluck('id')->toArray();
            \Log::info('User farms: ', $farmIds);

            if (empty($farmIds)) {
                \Log::warning('User has no farms created yet, returning empty array');
                return response()->json([]);
            }

            // Get all crops from these farms
            \Log::info('Querying crops for farm IDs: ' . implode(', ', $farmIds));

            $crops = Crop::whereIn('farm_id', $farmIds)
                ->with('farm')
                ->get();

            \Log::info('Found ' . $crops->count() . ' crops owned by user');

            if ($crops->count() == 0) {
                \Log::warning('No crops found for user farms, double-checking farm-crop association');

                // Direct query to check if any crops exist for these farms
                $cropCount = DB::table('crops')
                    ->whereIn('farm_id', $farmIds)
                    ->count();

                \Log::info("Direct DB query found {$cropCount} crops for farms: " . implode(', ', $farmIds));

                // Check each farm specifically
                foreach ($farmIds as $farmId) {
                    $farmCropCount = DB::table('crops')
                        ->where('farm_id', $farmId)
                        ->count();
                    \Log::info("Farm #{$farmId} has {$farmCropCount} crops");
                }
            }

            // Debug the actual data being returned
            $cropData = $crops->toArray();
            \Log::info('Returning crop data: ' . json_encode($cropData));

            // Return direct JSON array for easier frontend consumption
            return response()->json($cropData);
        } catch (\Exception $e) {
            \Log::error('Error fetching user crops: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch your crops: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Debug endpoint for the crop troubleshooter
     */
    public function debug(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'error' => 'Not authenticated',
                    'tip' => 'You must be logged in to use this endpoint.'
                ], 401);
            }

            // Get all crops in the system
            $allCrops = Crop::with('farm')->get();

            // Get all farms
            $allFarms = Farm::all();

            // Get user's farms
            $userFarms = Farm::where('user_id', $user->id)->get();
            $userFarmIds = $userFarms->pluck('id')->toArray();

            // Get crops that should belong to the user
            $userCrops = Crop::whereIn('farm_id', $userFarmIds)->with('farm')->get();

            // Check for orphaned crops or data issues
            $orphanedCrops = Crop::whereNotIn('farm_id', $allFarms->pluck('id')->toArray())->get();

            return response()->json([
                'diagnostics' => [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'timestamp' => now()->toDateTimeString(),
                ],
                'counts' => [
                    'total_crops' => $allCrops->count(),
                    'total_farms' => $allFarms->count(),
                    'user_farms' => $userFarms->count(),
                    'user_crops' => $userCrops->count(),
                    'orphaned_crops' => $orphanedCrops->count(),
                ],
                'user_farms' => $userFarms,
                'user_crops' => $userCrops,
                'orphaned_crops' => $orphanedCrops,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in crops diagnostic endpoint: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Exception occurred',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
