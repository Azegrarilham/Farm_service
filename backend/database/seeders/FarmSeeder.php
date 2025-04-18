<?php

namespace Database\Seeders;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Database\Seeder;

class FarmSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the farmer user
        $farmer = User::where('email', 'farmer@example.com')->first();

        if (!$farmer) {
            $this->command->error('Farmer user not found. Please run UserSeeder first.');
            return;
        }

        // Create a few farms for the farmer
        Farm::create([
            'name' => 'Green Valley Farm',
            'location' => 'Green Valley, CA',
            'size' => 250.5,
            'established_date' => '2015-04-10',
            'user_id' => $farmer->id,
            'description' => 'A beautiful farm in Green Valley specializing in organic produce.',
            'coordinates' => json_encode([
                'latitude' => 38.2493,
                'longitude' => -122.1432
            ]),
        ]);

        Farm::create([
            'name' => 'Golden Harvest Estate',
            'location' => 'Fresno, CA',
            'size' => 500.0,
            'established_date' => '2010-06-22',
            'user_id' => $farmer->id,
            'description' => 'Family-owned farm growing high-quality fruits and vegetables.',
            'coordinates' => json_encode([
                'latitude' => 36.7468,
                'longitude' => -119.7726
            ]),
        ]);

        Farm::create([
            'name' => 'Sunrise Meadows',
            'location' => 'Sacramento, CA',
            'size' => 180.5,
            'established_date' => '2018-03-15',
            'user_id' => $farmer->id,
            'description' => 'Small farm specializing in free-range livestock and dairy products.',
            'coordinates' => json_encode([
                'latitude' => 38.5816,
                'longitude' => -121.4944
            ]),
        ]);
    }
}
