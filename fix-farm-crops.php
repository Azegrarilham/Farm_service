<?php
/**
 * Farm-Crop Association Diagnostic and Repair Tool
 *
 * This script helps diagnose and fix issues with farm and crop associations in the database.
 * To use:
 * 1. Place this file in your Laravel project root directory
 * 2. Run from command line: php fix-farm-crops.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Farm;
use App\Models\Crop;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "==== Farm-Crop Association Diagnostic Tool ====\n\n";

// 1. Check for users
$users = User::all();
echo "Found {$users->count()} users in the system.\n";

foreach ($users as $user) {
    echo "\nUser #{$user->id}: {$user->name} ({$user->email})\n";

    // 2. Check farms for this user
    $farms = Farm::where('user_id', $user->id)->get();
    echo "  - Has {$farms->count()} farms\n";

    if ($farms->count() > 0) {
        $farmIds = $farms->pluck('id')->toArray();
        echo "  - Farm IDs: " . implode(', ', $farmIds) . "\n";

        // 3. Check crops for these farms
        $crops = Crop::whereIn('farm_id', $farmIds)->get();
        echo "  - Has {$crops->count()} crops across all farms\n";

        if ($crops->count() === 0) {
            echo "  - WARNING: User has farms but no crops. This might be a data association issue.\n";

            // 4. Check each farm individually
            foreach ($farms as $farm) {
                echo "    * Farm #{$farm->id}: {$farm->name}\n";
                $farmCrops = Crop::where('farm_id', $farm->id)->get();
                echo "      Has {$farmCrops->count()} crops\n";

                // 5. Verify farm_id in the database directly
                $dbCrops = DB::table('crops')->where('farm_id', $farm->id)->get();
                echo "      Direct DB query found {$dbCrops->count()} crops\n";
            }

            // Ask if user wants to create a test crop
            echo "\n  Do you want to create a test crop for the first farm? (y/n): ";
            $handle = fopen("php://stdin", "r");
            $line = trim(fgets($handle));
            if ($line === 'y') {
                $firstFarm = $farms->first();
                $testCrop = new Crop([
                    'name' => 'Test Crop ' . date('Y-m-d H:i:s'),
                    'description' => 'This is a test crop created by the diagnostic tool',
                    'quantity' => 10,
                    'unit' => 'kg',
                    'price' => 5.99,
                    'farm_id' => $firstFarm->id,
                    'is_organic' => true,
                    'available_from' => now(),
                    'available_until' => now()->addDays(30),
                ]);
                $testCrop->save();
                echo "  -> Test crop created with ID: {$testCrop->id}\n";
            }
        } else {
            echo "  - Crops per farm:\n";
            foreach ($farms as $farm) {
                $farmCrops = $crops->where('farm_id', $farm->id)->all();
                echo "    * Farm #{$farm->id}: " . count($farmCrops) . " crops\n";
            }
        }
    } else {
        echo "  - User has no farms. Please create a farm first.\n";
    }
}

echo "\n==== Diagnostic Complete ====\n";

// Check for orphaned crops (crops with farm_id that doesn't exist)
$orphanedCrops = Crop::whereNotIn('farm_id', Farm::pluck('id')->toArray())->get();
if ($orphanedCrops->count() > 0) {
    echo "\nWARNING: Found {$orphanedCrops->count()} orphaned crops (crops with invalid farm_id).\n";

    foreach ($orphanedCrops as $crop) {
        echo "  - Crop #{$crop->id}: {$crop->name} (farm_id: {$crop->farm_id})\n";
    }

    echo "\nDo you want to delete these orphaned crops? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = trim(fgets($handle));
    if ($line === 'y') {
        foreach ($orphanedCrops as $crop) {
            $crop->delete();
        }
        echo "  -> Orphaned crops deleted.\n";
    }
}

echo "\nDone. To fix issues, make sure:\n";
echo "1. Each user has at least one farm\n";
echo "2. Each farm has the correct user_id\n";
echo "3. Each crop has a valid farm_id that belongs to the user\n";
