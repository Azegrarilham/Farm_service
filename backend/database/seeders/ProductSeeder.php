<?php

namespace Database\Seeders;

use App\Models\Farm;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all farms
        $farms = Farm::all();

        if ($farms->isEmpty()) {
            $this->command->error('No farms found. Please run FarmSeeder first.');
            return;
        }

        // Products for Green Valley Farm
        $greenValleyFarm = $farms->where('name', 'Green Valley Farm')->first();
        if ($greenValleyFarm) {
            Product::create([
                'name' => 'Organic Tomatoes',
                'description' => 'Vine-ripened organic tomatoes grown without pesticides',
                'quantity' => 500,
                'price' => 3.99,
                'category' => 'Vegetables',
                'farm_id' => $greenValleyFarm->id,
            ]);

            Product::create([
                'name' => 'Fresh Lettuce',
                'description' => 'Crisp green lettuce harvested daily',
                'quantity' => 300,
                'price' => 2.49,
                'category' => 'Vegetables',
                'farm_id' => $greenValleyFarm->id,
            ]);

            Product::create([
                'name' => 'Sweet Corn',
                'description' => 'Sweet and juicy corn, perfect for grilling',
                'quantity' => 1000,
                'price' => 0.99,
                'category' => 'Vegetables',
                'farm_id' => $greenValleyFarm->id,
            ]);
        }

        // Products for Golden Harvest Estate
        $goldenHarvestFarm = $farms->where('name', 'Golden Harvest Estate')->first();
        if ($goldenHarvestFarm) {
            Product::create([
                'name' => 'Red Apples',
                'description' => 'Sweet and crisp red apples',
                'quantity' => 800,
                'price' => 1.99,
                'category' => 'Fruits',
                'farm_id' => $goldenHarvestFarm->id,
            ]);

            Product::create([
                'name' => 'Peaches',
                'description' => 'Juicy peaches perfect for pies and cobblers',
                'quantity' => 600,
                'price' => 2.99,
                'category' => 'Fruits',
                'farm_id' => $goldenHarvestFarm->id,
            ]);

            Product::create([
                'name' => 'Almonds',
                'description' => 'Fresh California almonds',
                'quantity' => 450,
                'price' => 7.99,
                'category' => 'Nuts',
                'farm_id' => $goldenHarvestFarm->id,
            ]);
        }

        // Products for Sunrise Meadows
        $sunriseMeadowsFarm = $farms->where('name', 'Sunrise Meadows')->first();
        if ($sunriseMeadowsFarm) {
            Product::create([
                'name' => 'Free-Range Eggs',
                'description' => 'Fresh eggs from free-range chickens',
                'quantity' => 240,
                'price' => 4.99,
                'category' => 'Dairy',
                'farm_id' => $sunriseMeadowsFarm->id,
            ]);

            Product::create([
                'name' => 'Organic Milk',
                'description' => 'Creamy organic milk from grass-fed cows',
                'quantity' => 150,
                'price' => 5.49,
                'category' => 'Dairy',
                'farm_id' => $sunriseMeadowsFarm->id,
            ]);

            Product::create([
                'name' => 'Artisan Cheese',
                'description' => 'Hand-crafted artisan cheese',
                'quantity' => 100,
                'price' => 9.99,
                'category' => 'Dairy',
                'farm_id' => $sunriseMeadowsFarm->id,
            ]);
        }
    }
}
