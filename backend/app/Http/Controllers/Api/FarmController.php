<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Farm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class FarmController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $farms = Farm::with('user')->get();
        return response()->json($farms);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'size' => 'nullable|numeric|min:0',
            'size_unit' => 'nullable|string|in:acres,hectares,square_meters',
            'description' => 'nullable|string',
            'primary_crops' => 'nullable|array',
            'primary_crops.*' => 'string|max:100',
            'farming_methods' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'established_date' => 'nullable|date',
        ]);

        // Process coordinates
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $validated['coordinates'] = [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude']
            ];

            unset($validated['latitude'], $validated['longitude']);
        }

        // Process photos
        if ($request->hasFile('photos')) {
            $photosPaths = [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('farm-photos', 'public');
                $photosPaths[] = $path;
            }
            $validated['photos'] = $photosPaths;
        }

        $validated['user_id'] = Auth::id();

        $farm = Farm::create($validated);

        // Record activity
        Activity::create([
            'type' => 'create',
            'entity_type' => 'farm',
            'entity_id' => $farm->id,
            'entity_name' => $farm->name,
            'user_id' => Auth::id(),
        ]);

        return response()->json($farm, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Farm $farm): JsonResponse
    {
        $farm->load('user');
        return response()->json($farm);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Farm $farm): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'size' => 'nullable|numeric|min:0',
            'size_unit' => 'nullable|string|in:acres,hectares,square_meters',
            'description' => 'nullable|string',
            'primary_crops' => 'nullable|array',
            'primary_crops.*' => 'string|max:100',
            'farming_methods' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'established_date' => 'nullable|date',
        ]);

        // Process coordinates
        if (isset($validated['latitude']) && isset($validated['longitude'])) {
            $validated['coordinates'] = [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude']
            ];

            unset($validated['latitude'], $validated['longitude']);
        }

        // Process photos
        if ($request->hasFile('photos')) {
            $photosPaths = $farm->photos ?? [];
            foreach ($request->file('photos') as $photo) {
                $path = $photo->store('farm-photos', 'public');
                $photosPaths[] = $path;
            }
            $validated['photos'] = $photosPaths;
        }

        $farm->update($validated);

        // Record activity
        Activity::create([
            'type' => 'update',
            'entity_type' => 'farm',
            'entity_id' => $farm->id,
            'entity_name' => $farm->name,
            'user_id' => Auth::id(),
        ]);

        return response()->json($farm);
    }

    /**
     * Display a listing of farms belonging to the current user.
     */
    public function getUserFarms(): JsonResponse
    {
        $userId = Auth::id();
        $farms = Farm::where('user_id', $userId)->get();
        return response()->json($farms);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Farm $farm): JsonResponse
    {
        // Delete farm photos
        if (!empty($farm->photos)) {
            foreach ($farm->photos as $photo) {
                Storage::disk('public')->delete($photo);
            }
        }

        // Record activity before deletion
        Activity::create([
            'type' => 'delete',
            'entity_type' => 'farm',
            'entity_id' => $farm->id,
            'entity_name' => $farm->name,
            'user_id' => Auth::id(),
        ]);

        $farm->delete();

        return response()->json(null, 204);
    }
}
