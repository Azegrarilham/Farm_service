<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Crop;
use App\Models\Farm;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('check:crops', function () {
    $this->info('Checking crops table...');

    // Check if table exists
    $tableExists = Schema::hasTable('crops');
    $this->info('Crops table exists: ' . ($tableExists ? 'Yes' : 'No'));

    if (!$tableExists) {
        $this->error('The crops table does not exist. You need to create it first.');
        return;
    }

    // Count crops
    $count = Crop::count();
    $this->info("Total crops in database: {$count}");

    if ($count > 0) {
        // Show few records
        $this->info('Recent crops:');
        $crops = Crop::latest()->take(5)->get();

        foreach ($crops as $crop) {
            $this->line("ID: {$crop->id}, Name: {$crop->name}, Farm: {$crop->farm_id}, Created: {$crop->created_at}");
        }
    } else {
        $this->warn('No crops found in the database.');
    }

    // Check farms
    $farmCount = Farm::count();
    $this->info("Total farms in database: {$farmCount}");

    if ($farmCount > 0) {
        $this->info('Recent farms:');
        $farms = Farm::latest()->take(5)->get();

        foreach ($farms as $farm) {
            $this->line("ID: {$farm->id}, Name: {$farm->name}, User: {$farm->user_id}, Created: {$farm->created_at}");
        }
    } else {
        $this->warn('No farms found in the database.');
    }

})->purpose('Check crops table and data');

Artisan::command('check:user {user_id?}', function ($user_id = null) {
    $this->info('Checking user...');

    if ($user_id) {
        $user = \App\Models\User::find($user_id);

        if (!$user) {
            $this->error("User with ID {$user_id} not found.");
            return;
        }

        $this->info("User details for ID {$user_id}:");
        $this->line("Name: {$user->name}");
        $this->line("Email: {$user->email}");
        $this->line("Created: {$user->created_at}");

        // Get farms owned by this user
        $farms = Farm::where('user_id', $user_id)->get();
        $this->info("Farms owned by this user: {$farms->count()}");

        foreach ($farms as $farm) {
            $this->line("Farm ID: {$farm->id}, Name: {$farm->name}");

            // Get crops for this farm
            $crops = Crop::where('farm_id', $farm->id)->get();
            $this->info("  Crops for this farm: {$crops->count()}");

            foreach ($crops as $crop) {
                $this->line("  Crop ID: {$crop->id}, Name: {$crop->name}, Price: \${$crop->price}");
            }
        }
    } else {
        // List all users
        $this->info('All users:');
        $users = \App\Models\User::all();

        foreach ($users as $user) {
            $this->line("ID: {$user->id}, Name: {$user->name}, Email: {$user->email}");
        }
    }
})->purpose('Check user details and their farms/crops');
